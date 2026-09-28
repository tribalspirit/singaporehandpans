/**
 * Shop-order owner notifications via the Resend REST API.
 *
 * Plain `fetch` (no SDK) so it runs on the Cloudflare Workers runtime.
 * Orders are deliberately not persisted — the inbox and the HitPay dashboard
 * are the order record.
 *
 * Two flows send different mail:
 *
 * - HitPay. HitPay emails the buyer its own receipt (`send_email: true` on the
 *   payment request) and the webhook confirms the money arrived, so the site
 *   only tells the owner about a payment that already succeeded.
 * - Direct PayNow. Nothing confirms a bank transfer, and HitPay is not
 *   involved, so the site tells the owner, who reconciles against their bank.
 *   Without that mail the order exists nowhere, which is why
 *   `getPayNowConfig` refuses to offer PayNow unless email is configured.
 *
 * Mail is only ever sent to the studio's own address, never to one submitted
 * with the order. An endpoint that emails a buyer-supplied address is an
 * endpoint a script can point at anybody: the studio's verified domain would
 * be sending unsolicited mail to strangers, which costs quota and, far worse,
 * sender reputation. The buyer's details reach the owner inside the
 * notification instead, and the owner replies from there.
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

async function send(
  config: OrderEmailConfig,
  message: { to: string; subject: string; text: string; replyTo?: string }
): Promise<void> {
  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      from: config.from,
      to: [message.to],
      ...(message.replyTo && { reply_to: message.replyTo }),
      subject: message.subject,
      text: message.text,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Resend API error: ${response.status} ${body.slice(0, 500)}`
    );
  }
}

export async function sendOwnerNotification(
  config: OrderEmailConfig,
  order: OrderDetails
): Promise<void> {
  const { subject, text } = buildOwnerNotification(order);
  await send(config, {
    to: config.ownerEmail,
    subject,
    text,
    replyTo: order.customerEmail,
  });
}

export interface PayNowOrderDetails {
  referenceNumber: string;
  /** SGD, already formatted for display. */
  amount: string;
  purpose: string;
  customerEmail: string;
  customerName?: string;
  /**
   * Signed link back to the QR page, for the owner to forward if the buyer
   * loses it. The page cannot be reconstructed from the reference alone — it
   * needs the signature the order endpoint minted.
   */
  payUrl?: string;
}

/**
 * The owner's copy. Deliberately states that the money has NOT been confirmed:
 * this mail is triggered by someone pressing a button, not by a payment, and
 * an owner who reads it as "paid" could ship an instrument for nothing.
 */
export function buildPayNowOwnerNotification(order: PayNowOrderDetails): {
  subject: string;
  text: string;
} {
  const lines = [
    'A PayNow order has been placed. THE MONEY HAS NOT BEEN CONFIRMED.',
    '',
    'Check your bank for an incoming PayNow transfer quoting the reference',
    'below, then reply to the buyer to arrange collection or delivery.',
    '',
    `Item: ${order.purpose}`,
    `Amount to expect: ${order.amount}`,
    `Reference: ${order.referenceNumber}`,
    ...(order.customerName ? [`Customer: ${order.customerName}`] : []),
    `Customer email: ${order.customerEmail}`,
    ...(order.payUrl
      ? ['', 'Payment page, if the buyer needs it again:', order.payUrl]
      : []),
    '',
    'The buyer was NOT emailed — reply to them from here to confirm.',
    'Nothing else records this order: there is no webhook on a bank transfer.',
  ];

  return {
    subject: `PayNow order ${order.referenceNumber} — awaiting transfer — ${order.purpose}`,
    text: lines.join('\n'),
  };
}

/**
 * Tell the owner a PayNow order was placed.
 *
 * Throws on failure. This is the only record the order exists — there is no
 * webhook on a bank transfer — so the caller must not tell the buyer the
 * order was placed if this does not land.
 */
export async function sendPayNowNotification(
  config: OrderEmailConfig,
  order: PayNowOrderDetails
): Promise<void> {
  const owner = buildPayNowOwnerNotification(order);
  await send(config, {
    to: config.ownerEmail,
    subject: owner.subject,
    text: owner.text,
    replyTo: order.customerEmail,
  });
}
