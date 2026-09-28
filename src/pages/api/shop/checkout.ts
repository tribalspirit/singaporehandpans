import type { APIRoute } from 'astro';
import { isSameOriginSubmission } from '../../../lib/sameOrigin';
import {
  fetchProductBySlug,
  isShopEnabled,
  isHitpayShop,
} from '../../../lib/shop';
import { createPaymentRequest, getHitPayConfig } from '../../../lib/hitpay';
import { applyCardSurcharge } from '../../../lib/cardSurcharge';
import { getPayNowConfig } from '../../../lib/paynow';
import { verifyPriceQuote } from '../../../lib/orderToken';
import { getOrderEmailConfig } from '../../../lib/orderEmail';

export const prerender = false;

const MAX_SLUG_LENGTH = 120;
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 200;
// Deliberately loose — real validation happens at HitPay; this only rejects
// obvious garbage before an API call is spent on it.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function productRedirect(slug: string, reason: string): string {
  return `/shop/product/${encodeURIComponent(slug)}/?checkout=${reason}`;
}

function readField(
  form: FormData,
  key: string,
  maxLength: number
): string | null {
  const value = form.get(key);
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > maxLength) return null;
  return trimmed;
}

export const POST: APIRoute = async ({ request, locals, url, redirect }) => {
  if (!isShopEnabled() || !isHitpayShop()) {
    return new Response('Not found', { status: 404 });
  }

  // Only accept submissions that look like they came from our own pages;
  // see sameOrigin.ts for why Referer is accepted when Origin is absent.
  if (!isSameOriginSubmission(request, url.origin)) {
    return new Response('Forbidden', { status: 403 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return new Response('Bad request', { status: 400 });
  }

  // Honeypot: humans never see this field; bots that fill it get a bland OK.
  const honeypot = form.get('website');
  if (typeof honeypot === 'string' && honeypot.trim() !== '') {
    return redirect('/shop/', 303);
  }

  const slug = readField(form, 'slug', MAX_SLUG_LENGTH);
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    return redirect('/shop/', 303);
  }

  const buyerName = readField(form, 'name', MAX_NAME_LENGTH) ?? undefined;
  const buyerEmail = readField(form, 'email', MAX_EMAIL_LENGTH);
  if (!buyerEmail || !EMAIL_PATTERN.test(buyerEmail)) {
    return redirect(productRedirect(slug, 'error'), 303);
  }

  const env = (locals.runtime?.env ?? {}) as Record<string, string | undefined>;
  const storyblokToken = env.STORYBLOK_TOKEN ?? import.meta.env.STORYBLOK_TOKEN;

  // Price and availability always come from published CMS content —
  // client-submitted values are never trusted.
  const product = await fetchProductBySlug(slug, storyblokToken);
  if (!product || !product.availableForSale || product.priceMin.amount <= 0) {
    return redirect(productRedirect(slug, 'unavailable'), 303);
  }

  const hitpay = getHitPayConfig(env);
  if (!hitpay) {
    console.error('[checkout] HitPay configuration missing');
    return redirect(productRedirect(slug, 'error'), 303);
  }

  const referenceNumber = `SHP-${crypto.randomUUID().slice(0, 13)}`;

  /*
   * The card surcharge applies only when the buyer had a free alternative.
   *
   * Without direct PayNow, HitPay's hosted page is the only checkout and still
   * offers its own PayNow, so surcharging here would either overcharge whoever
   * picks PayNow there, or — if we restricted to cards to prevent that —
   * remove the cheapest method the studio has. Behaviour stays as it was.
   *
   * With direct PayNow, this endpoint is the card lane and must prove the page
   * said so. The proof is a signed quote, not a form field: a plain marker can
   * simply be deleted, and falling back to an unrestricted list-price checkout
   * would let the buyer pay by card while the studio absorbs the very fee the
   * surcharge exists to pass on. It also can't be decided from configuration
   * alone, because product pages are edge-cached — just after PayNow is turned
   * on, a cached page still quotes the list price, and surcharging that
   * submission would charge more than it displayed.
   *
   * So when PayNow is available the quote is required, and a stale page is
   * refused rather than silently charged either price. Reloading mints a fresh
   * one.
   */
  const signingSecret = env.HITPAY_SALT ?? import.meta.env.HITPAY_SALT;
  const offersDirectPayNow =
    getPayNowConfig(env, getOrderEmailConfig(env) !== null) !== null &&
    Boolean(signingSecret);

  let charge = null;
  if (offersDirectPayNow) {
    const quoted = applyCardSurcharge(product.priceMin.amount);
    const submitted = form.get('quote');
    const valid =
      typeof submitted === 'string' &&
      (await verifyPriceQuote(signingSecret ?? '', submitted, {
        slug,
        reference: 'card',
        amountCents: Math.round(quoted.total * 100),
      }));

    if (!valid) {
      console.error('[checkout] Card quote missing or stale; refusing');
      return redirect(productRedirect(slug, 'error'), 303);
    }
    charge = quoted;
  }

  try {
    const payment = await createPaymentRequest(hitpay, {
      amount: charge ? charge.total : product.priceMin.amount,
      purpose: charge
        ? `${product.title} (${product.handle}) incl. card fee`
        : `${product.title} (${product.handle})`,
      referenceNumber,
      redirectUrl: `${url.origin}/shop/thank-you/`,
      webhookUrl: `${url.origin}/api/shop/hitpay-webhook`,
      email: buyerEmail,
      name: buyerName,
      ...(charge && { paymentMethods: ['card'] }),
    });

    return redirect(payment.url, 303);
  } catch (error) {
    console.error('[checkout] Failed to create HitPay payment:', error);
    return redirect(productRedirect(slug, 'error'), 303);
  }
};
