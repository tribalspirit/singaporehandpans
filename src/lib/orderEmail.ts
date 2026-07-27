/**
 * Shop-order owner notifications via the Resend REST API.
 *
 * Plain `fetch` (no SDK) so it runs on the Cloudflare Workers runtime.
 * Buyer receipts are sent by HitPay itself (`send_email: true` on the
 * payment request), so the site only notifies the shop owner. Orders are
 * deliberately not persisted — the inbox and the HitPay dashboard are the
 * order record.
 */

const RESEND_API_URL = 'https://api.resend.com/emails';

export interface OrderEmailConfig {
  apiKey: string;
  from: string;
  ownerEmail: string;
}

export interface OrderDetails {
  referenceNumber: string;
  paymentId: string;
  amount: string;
  currency: string;
  purpose: string;
  customerEmail?: string;
  customerName?: string;
}

type RuntimeEnv = Record<string, string | undefined>;

export function getOrderEmailConfig(env: RuntimeEnv): OrderEmailConfig | null {
  const apiKey = env.RESEND_API_KEY;
  const from = env.SHOP_EMAIL_FROM;
  const ownerEmail = env.SHOP_ORDER_EMAIL;

  if (!apiKey || !from || !ownerEmail) {
    return null;
  }

  return { apiKey, from, ownerEmail };
}

export function buildOwnerNotification(order: OrderDetails): {
  subject: string;
  text: string;
} {
  const lines = [
    'A shop order has been paid via HitPay.',
    '',
    `Item: ${order.purpose}`,
    `Amount: ${order.currency.toUpperCase()} ${order.amount}`,
    `Reference: ${order.referenceNumber}`,
    `HitPay payment ID: ${order.paymentId}`,
    ...(order.customerName ? [`Customer: ${order.customerName}`] : []),
    ...(order.customerEmail ? [`Customer email: ${order.customerEmail}`] : []),
    '',
    'Full details are in the HitPay dashboard.',
  ];

  return {
    subject: `New paid order ${order.referenceNumber} — ${order.purpose}`,
    text: lines.join('\n'),
  };
}

export async function sendOwnerNotification(
  config: OrderEmailConfig,
  order: OrderDetails
): Promise<void> {
  const { subject, text } = buildOwnerNotification(order);

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      from: config.from,
      to: [config.ownerEmail],
      ...(order.customerEmail && { reply_to: order.customerEmail }),
      subject,
      text,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Resend API error: ${response.status} ${body.slice(0, 500)}`
    );
  }
}
