/**
 * Storyblok image-service URLs.
 *
 * Event photography is uploaded at source resolution — 8064×6048 and larger —
 * and was previously rendered straight into a well that paints at roughly
 * 350×200. Every transform goes through here so the resize rules live in one
 * place and can be unit-tested; nothing else in the codebase builds `/m/` URLs.
 *
 * Pure and side-effect free, like `eventFormat.ts`.
 */

/** Only assets on Storyblok's CDN can be transformed. */
const STORYBLOK_ASSET_HOST = 'a.storyblok.com';

/** The image service cannot rasterise SVG; asking it to returns a 404. */
const SVG_EXTENSION_REGEX = /\.svg(?:[?#]|$)/i;

/** A URL that already carries a resize must not be given a second one. */
const TRANSFORM_SEGMENT = '/m/';

export interface StoryblokImageOptions {
  /**
   * Face-aware cropping. On by default: a portrait source in a landscape well
   * otherwise keeps the centre of the frame, which on these photos is a torso.
   */
  smart?: boolean;
}

function isTransformable(filename: string): boolean {
  if (!filename.includes(STORYBLOK_ASSET_HOST)) return false;
  if (SVG_EXTENSION_REGEX.test(filename)) return false;
  if (filename.includes(TRANSFORM_SEGMENT)) return false;
  return true;
}

/**
 * `…/pic.jpg/m/700x400/smart/`, or the input unchanged when it cannot be
 * transformed. Never returns a URL the image service would reject.
 */
export function storyblokImage(
  filename: string | undefined | null,
  width: number,
  height: number,
  options: StoryblokImageOptions = {}
): string {
  if (!filename) return '';
  if (!isTransformable(filename)) return filename;
  if (!(width > 0) || !(height > 0)) return filename;

  const smart = options.smart === false ? '' : 'smart/';
  return `${filename}${TRANSFORM_SEGMENT}${width}x${height}/${smart}`;
}

/**
 * A `1x, 2x` candidate pair for the same crop, or `null` when the asset cannot
 * be transformed — callers should then omit `srcset` entirely rather than emit
 * one pointing at an untransformed original twice.
 */
export function storyblokSrcSet(
  filename: string | undefined | null,
  width: number,
  height: number,
  options: StoryblokImageOptions = {}
): string | null {
  const single = storyblokImage(filename, width, height, options);
  if (!single || single === filename) return null;

  const double = storyblokImage(filename, width * 2, height * 2, options);
  return `${single} 1x, ${double} 2x`;
}
