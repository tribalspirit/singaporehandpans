import type { APIRoute } from 'astro';
import { fetchProductBySlug, isShopEnabled } from '../../../lib/shopClient';
import { createPaymentRequest, getHitPayConfig } from '../../../lib/hitpay';

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
  if (!isShopEnabled()) {
    return new Response('Not found', { status: 404 });
  }

  // Same-origin guard: browsers send Origin on cross-site POSTs.
  const origin = request.headers.get('origin');
  if (origin && origin !== url.origin) {
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

  const env = locals.runtime?.env ?? {};
  const storyblokToken = env.STORYBLOK_TOKEN ?? import.meta.env.STORYBLOK_TOKEN;

  // Price and availability always come from published CMS content —
  // client-submitted values are never trusted.
  const product = await fetchProductBySlug(storyblokToken, slug);
  if (!product || !product.availableForSale || product.priceMin.amount <= 0) {
    return redirect(productRedirect(slug, 'unavailable'), 303);
  }

  const hitpay = getHitPayConfig(env);
  if (!hitpay) {
    console.error('[checkout] HitPay configuration missing');
    return redirect(productRedirect(slug, 'error'), 303);
  }

  const referenceNumber = `SHP-${crypto.randomUUID().slice(0, 13)}`;

  try {
    const payment = await createPaymentRequest(hitpay, {
      amount: product.priceMin.amount,
      purpose: `${product.title} (${product.handle})`,
      referenceNumber,
      redirectUrl: `${url.origin}/shop/thank-you/`,
      webhookUrl: `${url.origin}/api/shop/hitpay-webhook`,
      email: buyerEmail,
      name: buyerName,
    });

    return redirect(payment.url, 303);
  } catch (error) {
    console.error('[checkout] Failed to create HitPay payment:', error);
    return redirect(productRedirect(slug, 'error'), 303);
  }
};
