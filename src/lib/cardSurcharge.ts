/**
 * The card-payment surcharge.
 *
 * HitPay's published online rate for a Singapore-issued card is
 * 2.8% + S$0.50, against 0.65% + S$0.30 for PayNow through HitPay and nothing
 * at all for a PayNow transfer straight to the studio's bank. The surcharge
 * passes the card cost to the buyer who chooses to incur it, rather than
 * spreading it across every instrument's list price.
 *
 * The percentage is grossed up, not simply added. HitPay charges its fee on
 * the amount actually presented to it, so adding 2.8% of the list price and
 * charging the sum leaves the studio short: charge S$3,906.90 and HitPay takes
 * S$109.89 of it, netting S$3,797.01 against a S$3,800 list price. Solving
 * `total - (total * rate + flat) = base` instead makes the studio whole.
 *
 * Two things this deliberately does not do:
 *
 * - It does not vary by card origin. An internationally issued card costs
 *   3.65% + S$0.50, so the studio absorbs roughly 0.85% on those. The shop
 *   sells domestically, and the issuing country is not known until after the
 *   buyer has already been quoted a price, so a single domestic rate is the
 *   only figure that can honestly be shown up front.
 * - It does not apply to PayNow. That path costs the studio nothing.
 *
 * Money is computed in integer cents throughout. Doing it in floats gives
 * 3800 * 0.028 = 106.39999999999999, which then renders as a price.
 */

/** HitPay online domestic card rate, as a fraction. */
export const CARD_SURCHARGE_RATE = 0.028;

/** HitPay's flat per-transaction component, in SGD. */
export const CARD_SURCHARGE_FLAT = 0.5;

/** For copy: "2.8%". Derived so the prose cannot drift from the maths. */
export const CARD_SURCHARGE_RATE_LABEL = `${(CARD_SURCHARGE_RATE * 100)
  .toFixed(1)
  .replace(/\.0$/, '')}%`;

export interface CardTotal {
  /** The listed price, unchanged. */
  base: number;
  /** What the surcharge adds, in SGD. */
  surcharge: number;
  /** What the buyer actually pays on a card. */
  total: number;
}

function toCents(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Apply the surcharge to a listed price.
 *
 * `total = (base + flat) / (1 - rate)`, the amount whose own fee leaves the
 * list price behind. Rounded up, so the studio is never left a cent short by
 * the rounding itself — the buyer pays at most one cent more than the exact
 * solution.
 */
export function applyCardSurcharge(amount: number): CardTotal {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(`Cannot surcharge a non-positive amount: ${amount}`);
  }

  const baseCents = toCents(amount);
  const totalCents = Math.ceil(
    (baseCents + toCents(CARD_SURCHARGE_FLAT)) / (1 - CARD_SURCHARGE_RATE)
  );

  return {
    base: baseCents / 100,
    surcharge: (totalCents - baseCents) / 100,
    total: totalCents / 100,
  };
}

/**
 * What HitPay deducts from a given charge. Exists so tests can assert the
 * round trip — that what the studio nets is the list price — rather than
 * trusting the formula above.
 */
export function providerFeeOn(total: number): number {
  const cents =
    Math.round(toCents(total) * CARD_SURCHARGE_RATE) +
    toCents(CARD_SURCHARGE_FLAT);
  return cents / 100;
}

/**
 * `1234.5` -> `"$1,234.50"`.
 *
 * Matches the `en-SG` formatting the shop already uses for list prices, so a
 * surcharge line and the price above it read as the same currency. Unlike the
 * list-price formatter this always shows cents, because a surcharge total
 * almost always has them.
 */
export function formatSgd(amount: number): string {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
