import { describe, expect, test } from 'vitest';
import {
  applyCardSurcharge,
  CARD_SURCHARGE_FLAT,
  CARD_SURCHARGE_RATE,
  CARD_SURCHARGE_RATE_LABEL,
  formatSgd,
} from './cardSurcharge';

describe('applyCardSurcharge', () => {
  test('matches HitPay 2.8% + S$0.50 on real catalogue prices', () => {
    // base, surcharge, total — worked by hand from the published rate.
    const cases: [number, number, number][] = [
      [3800, 106.9, 3906.9], // D Kurd 10
      [6500, 182.5, 6682.5], // D Aegean 18
      [58, 2.12, 60.12], // floor stand
    ];
    for (const [base, surcharge, total] of cases) {
      expect(applyCardSurcharge(base)).toEqual({ base, surcharge, total });
    }
  });

  test('does not leak binary floating point into a price', () => {
    // 3800 * 0.028 is 106.39999999999999 in floats, which would render as
    // S$106.40 in one place and S$3,906.8999999999996 in another.
    const { surcharge, total } = applyCardSurcharge(3800);
    expect(surcharge).toBe(106.9);
    expect(total).toBe(3906.9);
    expect(Number.isInteger(Math.round(total * 100))).toBe(true);
    expect(total.toFixed(2)).toBe('3906.90');
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
    // round(123456 * 0.028) = round(3456.768) = 3457 cents, + 50 flat.
    expect(surcharge).toBe(35.07);
    expect(total).toBe(1269.63);
  });

  test('always adds at least the flat fee', () => {
    expect(applyCardSurcharge(0.01).surcharge).toBe(CARD_SURCHARGE_FLAT);
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
