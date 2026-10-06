import { describe, expect, test } from 'vitest';
import { renderQrSvg } from './qrSvg';
import { buildPayNowPayload } from './paynow';

const PAYLOAD = buildPayNowPayload({
  config: {
    proxyType: 'uen',
    proxyValue: '201912345K',
    merchantName: 'Singapore Handpan Studio',
  },
  amount: 3800,
  reference: 'SHP-ABC123',
});

describe('renderQrSvg', () => {
  const svg = renderQrSvg(PAYLOAD, { title: 'PayNow QR code' });

  test('produces a self-contained, well-formed svg', () => {
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg.endsWith('</svg>')).toBe(true);
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  test('paints a white ground so it scans on a dark page', () => {
    // Transparent light modules against a dark background do not scan.
    expect(svg).toContain('fill="#ffffff"');
    expect(svg).toContain('fill="#000000"');
  });

  test('carries an accessible name', () => {
    expect(svg).toContain('<title>PayNow QR code</title>');
    expect(svg).toContain('aria-label="PayNow QR code"');
  });

  test('escapes markup in the title rather than emitting it', () => {
    const nasty = renderQrSvg('x', { title: '<script>alert(1)</script>' });
    expect(nasty).not.toContain('<script>');
    expect(nasty).toContain('&lt;script&gt;');
  });

  test('includes the four-module quiet zone the spec requires', () => {
    const viewBox = /viewBox="0 0 (\d+) \1"/.exec(svg);
    expect(viewBox).not.toBeNull();
    // Smallest QR version is 21 modules; the payload is longer, so with a
    // quiet zone of 4 a side the viewBox must exceed 21 + 8.
    expect(Number(viewBox?.[1])).toBeGreaterThan(29);
  });

  test('places the finder pattern at the quiet-zone offset, dark side up', () => {
    // Every QR has a 7x7 finder square at the top-left. With a 4-module quiet
    // zone its corner module must be drawn at (4,4). If the modules were
    // inverted or the offset were wrong, this exact path segment would be
    // missing — which is the failure that produces a pretty, unscannable code.
    expect(svg).toContain('M4 4h1v1h-1z');
    // The finder is separated from the rest by one light module, so (11,4)
    // (immediately right of the 7-wide finder) must NOT be painted.
    expect(svg).not.toContain('M11 4h1v1h-1z');
  });

  test('refuses empty data instead of emitting an unscannable code', () => {
    expect(() => renderQrSvg('', { title: 't' })).toThrow();
  });
});
