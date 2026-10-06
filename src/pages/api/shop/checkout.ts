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
   * The decision follows the signed quote the page submitted, not the current
   * configuration, because product pages are edge-cached for five minutes and
   * the two disagree for that long either side of a config change.
   *
   *   Quote present and valid -> the page displayed the card lane at this
   *     total, so charge it and restrict HitPay to cards. Honoured even if
   *     PayNow has since been switched off: the page still disclosed the
   *     surcharge, and ignoring it would have the studio absorb the fee.
   *   No quote, PayNow available -> a stale page from before PayNow was
   *     enabled, quoting the list price against a combined checkout. Refused
   *     rather than charged either price; reloading mints a fresh quote.
   *   No quote, no PayNow -> the original single checkout. HitPay's hosted
   *     page still offers its own PayNow, so surcharging would overcharge
   *     whoever picks it, and restricting to cards would remove the cheapest
   *     method the studio has. Unchanged behaviour, list price.
   *
   * The quote has to be signed rather than a plain marker: a marker can
   * simply be deleted, and falling through to an unrestricted list-price
   * checkout lets the buyer pay by card while the studio absorbs the very fee
   * the surcharge exists to pass on.
   */
  const signingSecret = env.HITPAY_SALT ?? import.meta.env.HITPAY_SALT;
  const offersDirectPayNow =
    getPayNowConfig(env, getOrderEmailConfig(env) !== null) !== null &&
    Boolean(signingSecret);

  const quoted = applyCardSurcharge(product.priceMin.amount);
  const submittedQuote = form.get('quote');
  const quoteIsValid =
    typeof submittedQuote === 'string' &&
    Boolean(signingSecret) &&
    (await verifyPriceQuote(signingSecret ?? '', submittedQuote, {
      slug,
      reference: 'card',
      amountCents: Math.round(quoted.total * 100),
    }));

  if (!quoteIsValid && offersDirectPayNow) {
    console.error('[checkout] Card quote missing or stale; refusing');
    return redirect(productRedirect(slug, 'error'), 303);
  }

  const charge = quoteIsValid ? quoted : null;

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
