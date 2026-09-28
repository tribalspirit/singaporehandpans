import { describe, expect, test } from 'vitest';
import { isSameOriginSubmission } from './sameOrigin';

const ORIGIN = 'https://singaporehandpans.com';

function post(headers: Record<string, string>): Request {
  return new Request(`${ORIGIN}/api/shop/paynow`, { method: 'POST', headers });
}

describe('isSameOriginSubmission', () => {
  test('accepts a matching Origin', () => {
    expect(isSameOriginSubmission(post({ origin: ORIGIN }), ORIGIN)).toBe(true);
  });

  test('rejects a cross-site Origin', () => {
    expect(
      isSameOriginSubmission(post({ origin: 'https://evil.example' }), ORIGIN)
    ).toBe(false);
  });

  test('falls back to Referer when Origin is absent', () => {
    // Safari omitted Origin on same-origin form POSTs; 403ing those buyers
    // would be worse than the abuse this turns away.
    expect(
      isSameOriginSubmission(
        post({ referer: `${ORIGIN}/shop/product/handpan-d-kurd/` }),
        ORIGIN
      )
    ).toBe(true);
  });

  test('prefers Origin over Referer when both are present', () => {
    expect(
      isSameOriginSubmission(
        post({ origin: 'https://evil.example', referer: `${ORIGIN}/shop/` }),
        ORIGIN
      )
    ).toBe(false);
  });

  test('rejects a Referer that merely starts with our origin', () => {
    // A prefix check would accept https://singaporehandpans.com.evil.example
    expect(
      isSameOriginSubmission(
        post({ referer: 'https://singaporehandpans.com.evil.example/x' }),
        ORIGIN
      )
    ).toBe(false);
  });

  test('rejects a request with neither header, which is the scripted case', () => {
    expect(isSameOriginSubmission(post({}), ORIGIN)).toBe(false);
  });

  test('rejects an unparseable Referer instead of throwing', () => {
    expect(isSameOriginSubmission(post({ referer: 'not a url' }), ORIGIN)).toBe(
      false
    );
  });
});
