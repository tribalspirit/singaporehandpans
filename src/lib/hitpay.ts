/**
 * HitPay payment gateway client (hosted checkout).
 *
 * Server-side only — the API key and webhook salt are Cloudflare secrets
 * read from `locals.runtime.env`, never `PUBLIC_` vars. Uses the v1
 * Payment Requests API: the checkout route creates a payment request and
 * redirects the buyer to HitPay's hosted page (PayNow QR + cards); HitPay
 * confirms payment via an HMAC-signed webhook.
 *
 * Docs: https://docs.hitpayapp.com
 */

export interface HitPayConfig {
  apiKey: string;
  salt: string;
  apiUrl: string;
}

export interface CreatePaymentParams {
  /** Amount in SGD dollars, e.g. 2400 or 2400.5 */
  amount: number;
  purpose: string;
  referenceNumber: string;
  redirectUrl: string;
  webhookUrl: string;
  email?: string;
  name?: string;
}

export interface HitPayPaymentRequest {
  id: string;
  url: string;
}

type RuntimeEnv = Record<string, string | undefined>;

export function getHitPayConfig(env: RuntimeEnv): HitPayConfig | null {
  const apiKey = env.HITPAY_API_KEY;
  const salt = env.HITPAY_SALT;
  const apiUrl = env.HITPAY_API_URL;

  if (!apiKey || !salt || !apiUrl) {
    return null;
  }

  return { apiKey, salt, apiUrl: apiUrl.replace(/\/$/, '') };
}

export function buildPaymentRequestBody(
  params: CreatePaymentParams
): Record<string, string | boolean> {
  return {
    amount: params.amount.toFixed(2),
    currency: 'SGD',
    purpose: params.purpose,
    reference_number: params.referenceNumber,
    redirect_url: params.redirectUrl,
    webhook: params.webhookUrl,
    // HitPay emails the buyer a receipt, so the site itself only needs to
    // notify the shop owner (see orderEmail.ts).
    send_email: true,
    ...(params.email && { email: params.email }),
    ...(params.name && { name: params.name }),
  };
}

export async function createPaymentRequest(
  config: HitPayConfig,
  params: CreatePaymentParams
): Promise<HitPayPaymentRequest> {
  const response = await fetch(`${config.apiUrl}/v1/payment-requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-BUSINESS-API-KEY': config.apiKey,
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: JSON.stringify(buildPaymentRequestBody(params)),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `HitPay payment request failed: ${response.status} ${body.slice(0, 500)}`
    );
  }

  const data = (await response.json()) as { id?: string; url?: string };
  if (!data.id || !data.url) {
    throw new Error('HitPay payment request returned no checkout URL');
  }

  return { id: data.id, url: data.url };
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(message)
  );
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * Compute the v1 webhook signature: HMAC-SHA256 over `{key}{value}` pairs
 * sorted alphabetically by key, excluding the `hmac` field itself.
 */
export async function computeWebhookSignature(
  salt: string,
  payload: Record<string, string>
): Promise<string> {
  const message = Object.keys(payload)
    .filter((key) => key !== 'hmac')
    .sort()
    .map((key) => `${key}${payload[key]}`)
    .join('');
  return hmacSha256Hex(salt, message);
}

export async function verifyWebhookSignature(
  salt: string,
  payload: Record<string, string>
): Promise<boolean> {
  const received = payload.hmac;
  if (!received) return false;
  const expected = await computeWebhookSignature(salt, payload);
  return constantTimeEqual(expected, received.toLowerCase());
}
