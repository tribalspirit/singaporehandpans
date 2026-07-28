import type { APIRoute } from 'astro';
import { verifyWebhookSignature } from '../../../lib/hitpay';
import {
  getOrderEmailConfig,
  sendOwnerNotification,
} from '../../../lib/orderEmail';

export const prerender = false;

/**
 * HitPay payment confirmation webhook (v1, form-encoded).
 *
 * The HMAC signature is verified before any side effect; only then is the
 * shop owner notified. Always answers 200 on verified payloads — email
 * failures are logged, never surfaced to HitPay (which would trigger
 * pointless retries of an already-confirmed payment).
 */
export const POST: APIRoute = async ({ request, locals }) => {
  // Deliberately NOT gated on the shop feature flags: the HMAC signature (below)
  // is the real authorization, and this endpoint must keep confirming in-flight
  // HitPay payments even if a deploy has since flipped PUBLIC_SHOP_IMPL away from
  // 'hitpay' or disabled the shop — otherwise a paid order loses its owner
  // notification. New checkouts are stopped at the checkout endpoint instead.
  // Naturally inert without HITPAY_SALT configured (returns 500 below).
  const env = (locals.runtime?.env ?? {}) as Record<string, string | undefined>;
  const salt = env.HITPAY_SALT ?? import.meta.env.HITPAY_SALT;

  if (!salt) {
    console.error('[hitpay-webhook] HITPAY_SALT not configured');
    return new Response('Server misconfigured', { status: 500 });
  }

  let payload: Record<string, string>;
  try {
    const form = await request.formData();
    payload = {};
    for (const [key, value] of form.entries()) {
      if (typeof value === 'string') payload[key] = value;
    }
  } catch {
    return new Response('Bad request', { status: 400 });
  }

  if (!(await verifyWebhookSignature(salt, payload))) {
    console.error('[hitpay-webhook] Invalid signature rejected');
    return new Response('Invalid signature', { status: 400 });
  }

  if (payload.status === 'completed') {
    const emailConfig = getOrderEmailConfig(env);

    if (!emailConfig) {
      console.error(
        '[hitpay-webhook] Order email not configured; payment',
        payload.payment_id,
        'confirmed without notification'
      );
    } else {
      const notify = sendOwnerNotification(emailConfig, {
        referenceNumber: payload.reference_number || 'unknown',
        paymentId: payload.payment_id || 'unknown',
        amount: payload.amount || '0',
        currency: payload.currency || 'sgd',
        purpose: payload.purpose || 'Shop order',
        customerEmail: payload.email || undefined,
        customerName: payload.name || undefined,
      }).catch((error) => {
        console.error('[hitpay-webhook] Owner notification failed:', error);
      });

      // Respond to HitPay immediately; the email finishes in the background.
      const waitUntil = locals.runtime?.ctx?.waitUntil;
      if (waitUntil) {
        waitUntil(notify);
      } else {
        await notify;
      }
    }
  }

  return new Response('OK', { status: 200 });
};
