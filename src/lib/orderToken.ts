/**
 * Signed, expiring tokens that bind the PayNow instructions page to an order
 * the checkout endpoint actually raised.
 *
 * Without one, `/shop/paynow/?slug=…&reference=…` is just two query parameters:
 * anybody could construct a genuine, payable QR for any product under any
 * reference, and the owner would never have been told the order exists. Worse,
 * a buyer could edit the slug after ordering and be shown a QR for a different
 * instrument than the one their reference was raised against — money arrives
 * that cannot be matched to anything.
 *
 * So the POST signs the order's identity and the page refuses to render
 * without a matching signature. The amount is signed too, so a price change
 * between ordering and paying fails closed rather than quietly showing a
 * different sum than the buyer was emailed.
 *
 * No database is involved. The signature *is* the record that the POST
 * happened, which suits a shop that deliberately persists nothing.
 */

/**
 * Key material is derived from the secret rather than used directly, so a
 * token signature can never be confused with, or used to forge, anything else
 * signed with the same secret.
 */
const ORDER_CONTEXT = 'sghandpan:paynow-order-token:v1';

/**
 * Separate context for card price quotes, so a quote can never be replayed as
 * an order token or the reverse.
 */
const QUOTE_CONTEXT = 'sghandpan:card-quote-token:v1';

/**
 * A quote must outlive the five-minute edge cache on product pages and a
 * buyer who leaves the tab open over lunch, but not indefinitely.
 */
export const CARD_QUOTE_TTL_MS = 24 * 60 * 60 * 1000;

/** Long enough that a buyer can pay the next morning, short enough to bound. */
export const ORDER_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface OrderTokenFields {
  slug: string;
  reference: string;
  /** Integer cents, so the signed amount cannot drift with float formatting. */
  amountCents: number;
}

function bytes(value: string) {
  return new TextEncoder().encode(value);
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function importKey(raw: BufferSource): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    raw,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
}

async function derivedKey(secret: string, context: string): Promise<CryptoKey> {
  const base = await importKey(bytes(secret));
  const derived = await crypto.subtle.sign('HMAC', base, bytes(context));
  return importKey(new Uint8Array(derived));
}

/**
 * The signed message. Fields are length-prefixed so that no combination of
 * values can be rearranged into another valid message — without it, a slug
 * ending in a digit and a shifted reference could collide.
 */
function message(fields: OrderTokenFields, expiresAt: number): string {
  return [
    fields.slug,
    fields.reference,
    String(fields.amountCents),
    String(expiresAt),
  ]
    .map((part) => `${part.length}:${part}`)
    .join('|');
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

async function mint(
  secret: string,
  context: string,
  ttl: number,
  fields: OrderTokenFields,
  now: number
): Promise<string> {
  if (!secret) throw new Error('Cannot mint a token without a secret');

  const expiresAt = now + ttl;
  const key = await derivedKey(secret, context);
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    bytes(message(fields, expiresAt))
  );
  return `${expiresAt}.${toHex(signature)}`;
}

export function mintOrderToken(
  secret: string,
  fields: OrderTokenFields,
  now: number = Date.now()
): Promise<string> {
  return mint(secret, ORDER_CONTEXT, ORDER_TOKEN_TTL_MS, fields, now);
}

/**
 * True only for a token this site minted, for exactly these fields, that has
 * not expired. Every failure path returns false rather than throwing: the
 * token is attacker-controlled input and the caller's only sensible response
 * to any problem is the same redirect.
 */
async function verify(
  secret: string,
  context: string,
  token: string,
  fields: OrderTokenFields,
  now: number
): Promise<boolean> {
  if (!secret || !token) return false;

  const separator = token.indexOf('.');
  if (separator <= 0) return false;

  const expiresAt = Number(token.slice(0, separator));
  const received = token.slice(separator + 1);
  if (!Number.isSafeInteger(expiresAt) || !/^[0-9a-f]{64}$/.test(received)) {
    return false;
  }
  if (expiresAt <= now) return false;

  const key = await derivedKey(secret, context);
  const expected = toHex(
    await crypto.subtle.sign('HMAC', key, bytes(message(fields, expiresAt)))
  );
  return constantTimeEqual(expected, received);
}

export function verifyOrderToken(
  secret: string,
  token: string,
  fields: OrderTokenFields,
  now: number = Date.now()
): Promise<boolean> {
  return verify(secret, ORDER_CONTEXT, token, fields, now);
}

/**
 * A price quote: proof that a product page actually displayed this lane at
 * this amount before the buyer submitted it. `reference` names the lane —
 * `card` or `paynow` — so a quote for one cannot be spent on the other.
 *
 * Needed because the surcharge cannot be decided from runtime configuration
 * alone. Product pages are edge-cached, so just after PayNow is switched on a
 * cached page still shows the old combined checkout at the list price, and
 * surcharging that submission would charge more than it disclosed.
 *
 * It has to be signed rather than a plain form field. An unsigned marker can
 * simply be deleted, and the endpoint would then fall back to an unrestricted
 * checkout at the list price — where the buyer picks a card anyway and the
 * studio pays the fee it meant to pass on. Copying a genuine quote out of the
 * page HTML gains nothing, because a quote only ever authorises the
 * surcharged card lane for the product it names.
 */
export function mintPriceQuote(
  secret: string,
  fields: OrderTokenFields,
  now: number = Date.now()
): Promise<string> {
  return mint(secret, QUOTE_CONTEXT, CARD_QUOTE_TTL_MS, fields, now);
}

export function verifyPriceQuote(
  secret: string,
  token: string,
  fields: OrderTokenFields,
  now: number = Date.now()
): Promise<boolean> {
  return verify(secret, QUOTE_CONTEXT, token, fields, now);
}
