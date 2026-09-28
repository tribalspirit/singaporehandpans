import { describe, expect, test } from 'vitest';
import {
  buildPayNowPayload,
  crc16,
  getPayNowConfig,
  isValidPayNowReference,
  type PayNowConfig,
} from './paynow';

const CONFIG: PayNowConfig = {
  proxyType: 'uen',
  proxyValue: '201912345K',
  merchantName: 'Singapore Handpan Studio',
};

/** Independent TLV reader, so the payload is checked by structure not substring. */
function parseTlv(payload: string): Record<string, string> {
  const out: Record<string, string> = {};
  let i = 0;
  while (i < payload.length) {
    const id = payload.slice(i, i + 2);
    const len = Number(payload.slice(i + 2, i + 4));
    out[id] = payload.slice(i + 4, i + 4 + len);
    i += 4 + len;
  }
  return out;
}

describe('crc16', () => {
  test('matches the CRC-16/CCITT-FALSE check value', () => {
    // The standard check value for this variant over "123456789".
    expect(crc16('123456789')).toBe('29B1');
  });

  test('is always four uppercase hex digits', () => {
    for (const s of ['', 'a', 'SG.PAYNOW', 'x'.repeat(200)]) {
      expect(crc16(s)).toMatch(/^[0-9A-F]{4}$/);
    }
  });
});

describe('buildPayNowPayload', () => {
  const payload = buildPayNowPayload({
    config: CONFIG,
    amount: 3800,
    reference: 'SHP-ABC123',
  });

  test('the trailing CRC verifies over everything before it', () => {
    const body = payload.slice(0, -4);
    expect(body.endsWith('6304')).toBe(true);
    expect(payload.slice(-4)).toBe(crc16(body));
  });

  test('carries the EMVCo envelope PayNow expects', () => {
    const f = parseTlv(payload.slice(0, -8));
    expect(f['00']).toBe('01'); // payload format indicator
    expect(f['01']).toBe('12'); // dynamic: single use
    expect(f['52']).toBe('0000'); // merchant category
    expect(f['53']).toBe('702'); // SGD
    expect(f['58']).toBe('SG');
    expect(f['59']).toBe('Singapore Handpan Studio');
  });

  test('addresses the UEN and locks the amount', () => {
    const merchant = parseTlv(parseTlv(payload.slice(0, -8))['26'] ?? '');
    expect(merchant['00']).toBe('SG.PAYNOW');
    expect(merchant['01']).toBe('2'); // 2 = UEN
    expect(merchant['02']).toBe('201912345K');
    // A payer who can edit the amount can underpay an order we then have to chase.
    expect(merchant['03']).toBe('0');
  });

  test('uses proxy type 0 for a mobile number', () => {
    const mobile = buildPayNowPayload({
      config: { ...CONFIG, proxyType: 'mobile', proxyValue: '+6591234567' },
      amount: 10,
      reference: 'SHP-1',
    });
    const merchant = parseTlv(parseTlv(mobile.slice(0, -8))['26'] ?? '');
    expect(merchant['01']).toBe('0');
    expect(merchant['02']).toBe('+6591234567');
  });

  test('writes the amount with two decimals', () => {
    const cases: [number, string][] = [
      [3800, '3800.00'],
      [3800.5, '3800.50'],
      [58, '58.00'],
    ];
    for (const [amount, expected] of cases) {
      const f = parseTlv(
        buildPayNowPayload({
          config: CONFIG,
          amount,
          reference: 'SHP-1',
        }).slice(0, -8)
      );
      expect(f['54']).toBe(expected);
    }
  });

  test('puts the order reference in the additional-data field', () => {
    const f = parseTlv(payload.slice(0, -8));
    expect(parseTlv(f['62'] ?? '')['01']).toBe('SHP-ABC123');
  });

  test('refuses an amount that cannot be collected', () => {
    for (const amount of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() =>
        buildPayNowPayload({ config: CONFIG, amount, reference: 'SHP-1' })
      ).toThrow(/amount/i);
    }
  });

  test('refuses a reference that would corrupt the payload', () => {
    // A reference containing separators or non-ASCII would desynchronise the
    // TLV lengths, producing a QR that scans to nonsense.
    for (const reference of ['', 'SHP 1', 'SHP/1', 'SHP–1', 'x'.repeat(26)]) {
      expect(() =>
        buildPayNowPayload({ config: CONFIG, amount: 10, reference })
      ).toThrow(/reference/i);
    }
  });

  test('truncates an over-long merchant name rather than emitting a bad QR', () => {
    const f = parseTlv(
      buildPayNowPayload({
        config: { ...CONFIG, merchantName: 'A'.repeat(60) },
        amount: 10,
        reference: 'SHP-1',
      }).slice(0, -8)
    );
    expect(f['59']).toHaveLength(25);
  });
});

describe('isValidPayNowReference', () => {
  test('accepts the references checkout generates', () => {
    expect(isValidPayNowReference('SHP-a1b2c3d4e5f6')).toBe(true);
  });

  test('rejects anything with a space or separator', () => {
    expect(isValidPayNowReference('SHP 1')).toBe(false);
    expect(isValidPayNowReference('')).toBe(false);
  });
});

describe('getPayNowConfig', () => {
  const env = {
    PAYNOW_PROXY_TYPE: 'uen',
    PAYNOW_PROXY_VALUE: '201912345K',
    PAYNOW_MERCHANT_NAME: 'Singapore Handpan Studio',
  };

  test('returns the config when everything is present', () => {
    expect(getPayNowConfig(env, true)).toEqual(CONFIG);
  });

  test('is null unless order email is configured', () => {
    // No webhook confirms a bank transfer, so without the owner notification
    // a PayNow order would exist nowhere at all.
    expect(getPayNowConfig(env, false)).toBeNull();
  });

  test('is null when any field is missing, so nothing half-configured ships', () => {
    for (const key of Object.keys(env)) {
      const partial = { ...env, [key]: undefined };
      expect(getPayNowConfig(partial, true)).toBeNull();
    }
  });

  test('is null on an unrecognised proxy type', () => {
    expect(
      getPayNowConfig({ ...env, PAYNOW_PROXY_TYPE: 'nric' }, true)
    ).toBeNull();
  });
});

describe('QR expiry', () => {
  const AT = Date.UTC(2026, 8, 28, 20, 0, 0); // 2026-09-29 04:00 SGT

  function merchantFields(payload: string) {
    const parse = (p: string) => {
      const out: Record<string, string> = {};
      let i = 0;
      while (i < p.length) {
        const id = p.slice(i, i + 2);
        const n = Number(p.slice(i + 2, i + 4));
        out[id] = p.slice(i + 4, i + 4 + n);
        i += 4 + n;
      }
      return out;
    };
    return parse(parse(payload.slice(0, -8))['26'] ?? '');
  }

  test('stamps the expiry as a Singapore-local YYYYMMDD', () => {
    // 20:00 UTC is already the next day in SGT; using UTC would date it a day early.
    const m = merchantFields(
      buildPayNowPayload({
        config: CONFIG,
        amount: 10,
        reference: 'SHP-1',
        expiresAt: AT,
      })
    );
    expect(m['04']).toBe('20260929');
  });

  test('omits the field entirely when no expiry is given', () => {
    const m = merchantFields(
      buildPayNowPayload({ config: CONFIG, amount: 10, reference: 'SHP-1' })
    );
    expect(m['04']).toBeUndefined();
  });

  test('an expiry changes the payload, so a saved QR is not reusable forever', () => {
    const withExpiry = buildPayNowPayload({
      config: CONFIG,
      amount: 10,
      reference: 'SHP-1',
      expiresAt: AT,
    });
    const without = buildPayNowPayload({
      config: CONFIG,
      amount: 10,
      reference: 'SHP-1',
    });
    expect(withExpiry).not.toBe(without);
    expect(withExpiry.slice(-4)).toBe(crc16(withExpiry.slice(0, -4)));
  });
});

describe('non-ASCII merchant names', () => {
  const CHINESE = { ...CONFIG, merchantName: '新加坡手碟工作室' };

  test('declares TLV lengths in bytes, as the QR is decoded', () => {
    const payload = buildPayNowPayload({
      config: CHINESE,
      amount: 10,
      reference: 'SHP-1',
    });
    // Eight CJK characters encode to 24 UTF-8 bytes; a character count would
    // declare 08 and desynchronise every field after it.
    expect(payload).toContain(`5924${CHINESE.merchantName}`);
  });

  test('the CRC covers the encoded bytes', () => {
    const payload = buildPayNowPayload({
      config: CHINESE,
      amount: 10,
      reference: 'SHP-1',
    });
    expect(payload.slice(-4)).toBe(crc16(payload.slice(0, -4)));
  });

  test('truncates on a byte budget without splitting a character', () => {
    const payload = buildPayNowPayload({
      config: { ...CONFIG, merchantName: '新'.repeat(20) },
      amount: 10,
      reference: 'SHP-1',
    });
    // 25 bytes / 3 per character = 8 whole characters, never a half one.
    expect(payload).toContain(`5924${'新'.repeat(8)}`);
    expect(payload).not.toContain('�');
  });
});
