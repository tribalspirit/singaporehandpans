import { describe, expect, test } from 'vitest';
import {
  applyCardSurcharge,
  CARD_SURCHARGE_FLAT,
  CARD_SURCHARGE_RATE,
  CARD_SURCHARGE_RATE_LABEL,
  formatSgd,
  providerFeeOn,
} from './cardSurcharge';

describe('applyCardSurcharge', () => {
  test('grosses up, so real catalogue prices come out whole', () => {
    // base, surcharge, total — solved from total - (total*rate + flat) = base.
    const cases: [number, number, number][] = [
      [3800, 109.98, 3909.98], // D Kurd 10
      [6500, 187.76, 6687.76], // D Aegean 18
      [58, 2.19, 60.19], // floor stand
    ];
    for (const [base, surcharge, total] of cases) {
      expect(applyCardSurcharge(base)).toEqual({ base, surcharge, total });
    }
  });

  test('the studio nets the list price, which is the whole point', () => {
    // The naive version — base + base*rate + flat — charged 3906.90 and netted
    // 3797.01, because HitPay takes its cut of the surcharged total, not of
    // the list price. Every card sale quietly under-recovered.
    for (const base of [58, 280, 1234.56, 1888, 3800, 6500]) {
      const { total } = applyCardSurcharge(base);
      const netted = Math.round((total - providerFeeOn(total)) * 100) / 100;
      expect(netted).toBeGreaterThanOrEqual(base);
      // Rounding up may overshoot, but never by more than a cent.
      expect(netted - base).toBeLessThanOrEqual(0.01);
    }
  });

  test('does not leak binary floating point into a price', () => {
    // 3800 * 0.028 is 106.39999999999999 in floats, which would render as
    // one figure in the disclaimer and another at the payment page.
    const { surcharge, total } = applyCardSurcharge(3800);
    expect(surcharge).toBe(109.98);
    expect(total).toBe(3909.98);
    expect(Number.isInteger(Math.round(total * 100))).toBe(true);
    expect(total.toFixed(2)).toBe('3909.98');
  });

  test('the surcharge shown is exactly total minus base, to the cent', () => {
    for (let base = 1; base <= 7000; base += 137) {
      const { surcharge, total } = applyCardSurcharge(base);
      expect(Math.round(total * 100) - Math.round(base * 100)).toBe(
        Math.round(surcharge * 100)
      );
    }
  });

  test('handles a price with cents', () => {
    const { surcharge, total } = applyCardSurcharge(1234.56);
    // ceil((123456 + 50) / 0.972) = 127064 cents.
    expect(total).toBe(1270.64);
    expect(surcharge).toBe(36.08);
  });

  test('always adds more than the flat fee', () => {
    expect(applyCardSurcharge(0.01).surcharge).toBeGreaterThan(
      CARD_SURCHARGE_FLAT
    );
  });

  test('refuses a non-positive or non-finite price', () => {
    for (const bad of [0, -100, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => applyCardSurcharge(bad)).toThrow();
    }
  });
});

describe('the rate label used in buyer-facing copy', () => {
  test('is derived from the rate, so prose cannot drift from maths', () => {
    expect(CARD_SURCHARGE_RATE_LABEL).toBe('2.8%');
    expect(CARD_SURCHARGE_RATE).toBe(0.028);
  });
});

describe('formatSgd', () => {
  test('matches the symbol the shop already renders, and always shows cents', () => {
    // The catalogue renders "$1,488" via en-SG, so a surcharge line must not
    // suddenly say "S$" next to it.
    expect(formatSgd(3906.9)).toBe('$3,906.90');
    expect(formatSgd(58)).toBe('$58.00');
  });
});
