/**
 * Render a QR code as an inline SVG string.
 *
 * Server-rendered rather than drawn in the browser: the PayNow code is the
 * whole point of the page it appears on, so it must be in the HTML the buyer
 * receives, not behind a hydration step that can fail on a phone with patchy
 * reception in a shop.
 *
 * `qrcode-generator` is pure JavaScript with no DOM or Node built-ins, so it
 * runs unchanged on the Cloudflare Workers runtime.
 */
import qrcode from 'qrcode-generator';

/**
 * Error correction level. `M` (~15% recoverable) is the usual choice for
 * payment QRs — `H` survives more damage but packs the modules tighter, which
 * hurts more than it helps on a screen being photographed by another phone.
 */
const ERROR_CORRECTION = 'M' as const;

/** Modules of clear space required around the code by the QR specification. */
const QUIET_ZONE = 4;

export interface QrSvgOptions {
  /** Accessible name; a QR code with no text alternative is unusable. */
  title: string;
}

export function renderQrSvg(data: string, options: QrSvgOptions): string {
  if (!data) throw new Error('Cannot render a QR code for empty data');

  // Type number 0 lets the library pick the smallest version that fits.
  const qr = qrcode(0, ERROR_CORRECTION);
  qr.addData(data);
  qr.make();

  const count = qr.getModuleCount();
  const size = count + QUIET_ZONE * 2;

  // One path for every dark module beats one <rect> each: roughly a third of
  // the bytes, and it renders as a single shape.
  let path = '';
  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      if (qr.isDark(row, col)) {
        path += `M${col + QUIET_ZONE} ${row + QUIET_ZONE}h1v1h-1z`;
      }
    }
  }

  const escapedTitle = options.title
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" ` +
    `role="img" aria-label="${escapedTitle}" class="paynow-qr__svg" ` +
    `shape-rendering="crispEdges">` +
    `<title>${escapedTitle}</title>` +
    // The light modules must be painted, not left transparent: a dark page
    // background would otherwise show through and the code would not scan.
    `<rect width="${size}" height="${size}" fill="#ffffff"/>` +
    `<path d="${path}" fill="#000000"/>` +
    `</svg>`
  );
}
