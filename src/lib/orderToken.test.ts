import { describe, expect, test } from 'vitest';
import {
  mintOrderToken,
  verifyOrderToken,
  ORDER_TOKEN_TTL_MS,
  type OrderTokenFields,
} from './orderToken';

const SECRET = 'test-salt-abc';
const FIELDS: OrderTokenFields = {
  slug: 'handpan-d-kurd-10-notes-by-mag-instruments',
  reference: 'SHP-ABC1234567',
  amountCents: 380000,
};
const NOW = 1_700_000_000_000;

describe('order tokens', () => {
  test('a freshly minted token verifies', async () => {
    const token = await mintOrderToken(SECRET, FIELDS, NOW);
    expect(await verifyOrderToken(SECRET, token, FIELDS, NOW + 1000)).toBe(
      true
    );
  });

  test('rejects a token for a different product', async () => {
    // The attack this exists for: order a stand, then edit the slug to a
    // handpan and be shown a QR the reference was never raised against.
    const token = await mintOrderToken(SECRET, FIELDS, NOW);
    expect(
      await verifyOrderToken(
        SECRET,
        token,
        { ...FIELDS, slug: 'handpan-d-aegean-18-by-mag-instruments' },
        NOW
      )
    ).toBe(false);
  });

  test('rejects a token for a different reference or amount', async () => {
    const token = await mintOrderToken(SECRET, FIELDS, NOW);
    expect(
      await verifyOrderToken(
        SECRET,
        token,
        { ...FIELDS, reference: 'SHP-OTHER' },
        NOW
      )
    ).toBe(false);
    expect(
      await verifyOrderToken(
        SECRET,
        token,
        { ...FIELDS, amountCents: 100 },
        NOW
      )
    ).toBe(false);
  });

  test('rejects a token minted with another secret', async () => {
    const token = await mintOrderToken('someone-elses-salt', FIELDS, NOW);
    expect(await verifyOrderToken(SECRET, token, FIELDS, NOW)).toBe(false);
  });

  test('expires', async () => {
    const token = await mintOrderToken(SECRET, FIELDS, NOW);
    expect(
      await verifyOrderToken(
        SECRET,
        token,
        FIELDS,
        NOW + ORDER_TOKEN_TTL_MS - 1
      )
    ).toBe(true);
    expect(
      await verifyOrderToken(
        SECRET,
        token,
        FIELDS,
        NOW + ORDER_TOKEN_TTL_MS + 1
      )
    ).toBe(false);
  });

  test('an extended expiry does not validate against the original signature', async () => {
    const token = await mintOrderToken(SECRET, FIELDS, NOW);
    const signature = token.slice(token.indexOf('.') + 1);
    const forged = `${NOW + ORDER_TOKEN_TTL_MS * 10}.${signature}`;
    // The expiry is inside the signed message, so moving it invalidates it.
    expect(await verifyOrderToken(SECRET, forged, FIELDS, NOW)).toBe(false);
  });

  test('field boundaries cannot be shifted between slug and reference', async () => {
    // Length-prefixing stops "ab" + "c" signing the same message as "a" + "bc".
    const a = await mintOrderToken(
      SECRET,
      { slug: 'ab', reference: 'c', amountCents: 1 },
      NOW
    );
    expect(
      await verifyOrderToken(
        SECRET,
        a,
        { slug: 'a', reference: 'bc', amountCents: 1 },
        NOW
      )
    ).toBe(false);
  });

  test('returns false rather than throwing on malformed input', async () => {
    for (const bad of [
      '',
      '.',
      'abc',
      'notanumber.deadbeef',
      `${NOW + 1000}.xyz`,
    ]) {
      expect(await verifyOrderToken(SECRET, bad, FIELDS, NOW)).toBe(false);
    }
  });

  test('refuses to verify when no secret is configured', async () => {
    const token = await mintOrderToken(SECRET, FIELDS, NOW);
    expect(await verifyOrderToken('', token, FIELDS, NOW)).toBe(false);
  });

  test('refuses to mint without a secret', async () => {
    await expect(mintOrderToken('', FIELDS, NOW)).rejects.toThrow(/secret/i);
  });
});
