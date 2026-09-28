import type { APIRoute } from 'astro';
import {
  fetchProductBySlug,
  isShopEnabled,
  isHitpayShop,
} from '../../../lib/shop';
import { getPayNowConfig, isValidPayNowReference } from '../../../lib/paynow';
import {
  getOrderEmailConfig,
  sendPayNowNotifications,
} from '../../../lib/orderEmail';
import { formatSgd } from '../../../lib/cardSurcharge';

export const prerender = false;

const MAX_SLUG_LENGTH = 120;
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 200;
// Deliberately loose — this only rejects obvious garbage before an order is
// raised against it. The buyer's own inbox is the real check.
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

/**
 * Place an order to be paid by a PayNow transfer straight to the studio.
 *
 * No money moves here and nothing external confirms that it ever will. All
 * this does is mint a reference, tell the owner to watch their bank for it,
 * and send the buyer to a page showing the QR. The owner reconciles by hand.
 *
 * Mirrors the validation in checkout.ts deliberately: price and stock are
 * re-read from published CMS content, never taken from the submitted form.
 */
export const POST: APIRoute = async ({ request, locals, url, redirect }) => {
  if (!isShopEnabled() || !isHitpayShop()) {
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

  const env = (locals.runtime?.env ?? {}) as Record<string, string | undefined>;
  const emailConfig = getOrderEmailConfig(env);
  const paynow = getPayNowConfig(env, emailConfig !== null);

  // Refuses rather than degrades. An order taken here with no way to tell the
  // owner is an order that silently does not exist.
  if (!paynow || !emailConfig) {
    console.error('[paynow] Direct PayNow is not configured; order refused');
    return redirect(productRedirect(slug, 'error'), 303);
  }

  const storyblokToken = env.STORYBLOK_TOKEN ?? import.meta.env.STORYBLOK_TOKEN;
  const product = await fetchProductBySlug(slug, storyblokToken);
  if (!product || !product.availableForSale || product.priceMin.amount <= 0) {
    return redirect(productRedirect(slug, 'unavailable'), 303);
  }

  // Hyphen-and-alphanumerics only, so it survives a bank's reference field
  // intact — see isValidPayNowReference.
  const referenceNumber = `SHP-${crypto.randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase()}`;
  if (!isValidPayNowReference(referenceNumber)) {
    console.error('[paynow] Generated an unusable reference:', referenceNumber);
    return redirect(productRedirect(slug, 'error'), 303);
  }

  try {
    await sendPayNowNotifications(emailConfig, {
      referenceNumber,
      amount: formatSgd(product.priceMin.amount),
      purpose: `${product.title} (${product.handle})`,
      customerEmail: buyerEmail,
      customerName: buyerName,
    });
  } catch (error) {
    // The owner was not told, so the order does not exist. Say so rather than
    // showing a QR for a payment nobody is expecting.
    console.error('[paynow] Owner notification failed; order refused:', error);
    return redirect(productRedirect(slug, 'error'), 303);
  }

  const params = new URLSearchParams({ slug, reference: referenceNumber });
  return redirect(`/shop/paynow/?${params.toString()}`, 303);
};
