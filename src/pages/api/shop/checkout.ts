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
   * With direct PayNow configured, this endpoint is the card lane: the product
   * page quoted price + surcharge, so HitPay is restricted to cards and the
   * surcharged total is charged. Without it, HitPay's hosted page is the only
   * checkout and still offers its own PayNow, so surcharging here would either
   * overcharge whoever picks PayNow on that page, or — if we restricted to
   * cards to prevent that — remove the cheapest method the studio has. So the
   * behaviour stays exactly as it was until PayNow is configured.
   *
   * Runtime configuration alone is not enough to decide, because product pages
   * are edge-cached for five minutes. In the window after PayNow is switched
   * on, a cached page still shows the single combined checkout at the list
   * price; surcharging that submission would send the buyer to HitPay for more
   * than the page disclosed. So the surcharge also requires the page to say it
   * quoted one — only the two-option form's card button submits `method=card`.
   *
   * Omitting the marker cannot be used to dodge the fee for gain: it yields
   * the list price, which is exactly what the PayNow button offers anyway.
   */
  const offersDirectPayNow =
    getPayNowConfig(env, getOrderEmailConfig(env) !== null) !== null;
  const pageQuotedCardPrice = form.get('method') === 'card';

  const charge =
    offersDirectPayNow && pageQuotedCardPrice
      ? applyCardSurcharge(product.priceMin.amount)
      : null;

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
