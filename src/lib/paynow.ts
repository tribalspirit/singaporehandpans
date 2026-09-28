/**
 * PayNow QR payloads (EMVCo / SGQR), for taking a bank transfer directly
 * instead of routing the payment through HitPay.
 *
 * Why this exists: HitPay charges 0.65% + S$0.30 on a PayNow payment and
 * 2.8% + S$0.50 on a domestic card. A PayNow transfer straight to the studio's
 * own UEN costs nothing, which on a S$6,500 instrument is the difference
 * between S$0 and roughly S$42 of gateway fees.
 *
 * The trade-off is that nothing tells us the money arrived — there is no
 * webhook on a bank transfer. The buyer is shown a reference, the owner is
 * emailed, and the owner reconciles against their bank. So the PayNow option
 * is only offered when order notification email is configured too; otherwise
 * an order would leave no trace at all (see getPayNowConfig).
 *
 * Payload format: EMVCo merchant-presented QR, as profiled for PayNow.
 * Fields are `IDLLvalue` triples, and the CRC at the end covers everything
 * before it *including* its own "6304" tag.
 */

/** `0` addresses a mobile number, `2` a registered business UEN. */
export type PayNowProxyType = 'mobile' | 'uen';

export interface PayNowConfig {
  proxyType: PayNowProxyType;
  proxyValue: string;
  merchantName: string;
}

export interface PayNowPaymentParams {
  config: PayNowConfig;
  /** SGD dollars, e.g. 3800 or 3800.5 */
  amount: number;
  reference: string;
  /**
   * When the code stops being payable, as epoch milliseconds.
   *
   * Without it a screenshot of the QR stays payable forever, and none of the
   * checks on the page — the expiring URL token, the stock recheck — apply to
   * a saved image. For a one-off instrument that means someone could transfer
   * thousands for something sold weeks ago. Tied to the order's own lifetime,
   * a stale copy is refused by the banking app itself.
   */
  expiresAt?: number;
}

type RuntimeEnv = Record<string, string | undefined>;

const PROXY_TYPE_CODE: Record<PayNowProxyType, string> = {
  mobile: '0',
  uen: '2',
};

/**
 * EMVCo caps the merchant name at 25 characters and the city at 15. Exceeding
 * either produces a QR some banking apps reject outright, so both are trimmed
 * rather than passed through.
 */
const MAX_MERCHANT_NAME = 25;
const MAX_REFERENCE = 25;
const MERCHANT_CITY = 'Singapore';

const encoder = new TextEncoder();

/** Singapore keeps UTC+8 year round, so a fixed offset is exact. */
const SGT_OFFSET_MS = 8 * 60 * 60 * 1000;

/** PayNow's expiry field is a plain `YYYYMMDD` date in local time. */
function toExpiryDate(epochMs: number): string {
  const sgt = new Date(epochMs + SGT_OFFSET_MS);
  const year = sgt.getUTCFullYear();
  const month = String(sgt.getUTCMonth() + 1).padStart(2, '0');
  const day = String(sgt.getUTCDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * EMVCo lengths count bytes, and a QR carries UTF-8. `"café".length` is 4 but
 * encodes to 5 bytes, so measuring in JavaScript characters would declare a
 * short length and desynchronise every field after it. Only bites with a
 * non-ASCII merchant name, which is exactly the case nobody tests by hand.
 */
function utf8Length(value: string): number {
  return encoder.encode(value).length;
}

/** Truncate to at most `maxBytes` UTF-8 bytes without splitting a character. */
function truncateToBytes(value: string, maxBytes: number): string {
  if (utf8Length(value) <= maxBytes) return value;
  let out = '';
  for (const char of value) {
    if (utf8Length(out + char) > maxBytes) break;
    out += char;
  }
  return out;
}

/**
 * A reference has to survive a round trip through a bank statement, so it is
 * restricted to characters that banks reliably preserve.
 */
const REFERENCE_PATTERN = /^[A-Za-z0-9-]{1,25}$/;

function tlv(id: string, value: string): string {
  const bytes = utf8Length(value);
  if (bytes > 99) {
    throw new Error(`PayNow field ${id} is too long (${bytes} bytes)`);
  }
  return `${id}${bytes.toString().padStart(2, '0')}${value}`;
}

/**
 * CRC-16/CCITT-FALSE: polynomial 0x1021, initial value 0xFFFF, no reflection,
 * no final XOR. Returned as four uppercase hex digits, which is what tag 63
 * carries.
 */
export function crc16(input: string): string {
  // Over UTF-8 bytes, not characters: the banking app checksums the bytes it
  // decoded from the QR, and for anything non-ASCII those differ.
  const bytes = encoder.encode(input);
  let crc = 0xffff;
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i]! << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function isValidPayNowReference(reference: string): boolean {
  return REFERENCE_PATTERN.test(reference);
}

/**
 * Build the string a PayNow QR encodes.
 *
 * The amount is locked (`03` = `0`) and the QR marked single-use (`01` = `12`),
 * so the buyer cannot accidentally send the wrong sum and the same code is not
 * reused for another order.
 */
export function buildPayNowPayload(params: PayNowPaymentParams): string {
  const { config, amount, reference, expiresAt } = params;

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(`PayNow amount must be positive, got ${amount}`);
  }
  if (!isValidPayNowReference(reference)) {
    throw new Error(`PayNow reference is not safe to encode: ${reference}`);
  }
  if (!config.proxyValue) {
    throw new Error('PayNow proxy value is empty');
  }

  const merchantAccount = [
    tlv('00', 'SG.PAYNOW'),
    tlv('01', PROXY_TYPE_CODE[config.proxyType]),
    tlv('02', config.proxyValue),
    tlv('03', '0'),
    ...(expiresAt === undefined ? [] : [tlv('04', toExpiryDate(expiresAt))]),
  ].join('');

  const payload = [
    tlv('00', '01'),
    tlv('01', '12'),
    tlv('26', merchantAccount),
    tlv('52', '0000'),
    tlv('53', '702'),
    tlv('54', amount.toFixed(2)),
    tlv('58', 'SG'),
    tlv('59', truncateToBytes(config.merchantName, MAX_MERCHANT_NAME)),
    tlv('60', MERCHANT_CITY),
    tlv('62', tlv('01', reference.slice(0, MAX_REFERENCE))),
  ].join('');

  // The CRC covers the tag and length of field 63 as well as everything above.
  const withCrcTag = `${payload}6304`;
  return `${withCrcTag}${crc16(withCrcTag)}`;
}

/**
 * Read the PayNow configuration, or null when direct transfer is not offered.
 *
 * Deliberately returns null unless order email is configured too: a PayNow
 * transfer produces no webhook, so the owner's inbox is the only record that
 * an order exists. Offering the option without it would silently drop orders.
 */
export function getPayNowConfig(
  env: RuntimeEnv,
  hasOrderEmail: boolean
): PayNowConfig | null {
  const proxyValue = env.PAYNOW_PROXY_VALUE;
  const rawType = env.PAYNOW_PROXY_TYPE;
  const merchantName = env.PAYNOW_MERCHANT_NAME;

  if (!proxyValue || !rawType || !merchantName) return null;
  if (rawType !== 'mobile' && rawType !== 'uen') return null;
  if (!hasOrderEmail) return null;

  return { proxyType: rawType, proxyValue, merchantName };
}
