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

export interface StoryblokSrcSetOptions extends StoryblokImageOptions {
  /** Multiples of the base size to offer. Defaults to 1×, 2× and 3×. */
  densities?: readonly number[];
}

/** Covers a 1× desktop well, a 2× display, and a 3× phone at full width. */
const DEFAULT_DENSITIES = [1, 2, 3] as const;

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
 * Candidates for one crop at several densities, described in **width units**,
 * or `null` when the asset cannot be transformed — callers should then omit
 * `srcset` rather than point it at an untransformed original.
 *
 * `w` rather than `x` descriptors, because `x` makes the browser ignore the
 * accompanying `sizes` and choose on device pixel ratio alone. With `x`, a
 * card whose well paints at 350 CSS px but whose base was written as 700
 * served 700px to a 1× display and 1400px to a 2× one — twice the linear
 * resolution, four times the pixels, on every card. Pass the **1× CSS size**
 * of the well as `width`/`height` and let `sizes` do the selecting.
 */
export function storyblokSrcSet(
  filename: string | undefined | null,
  width: number,
  height: number,
  options: StoryblokSrcSetOptions = {}
): string | null {
  const densities = options.densities ?? DEFAULT_DENSITIES;

  const candidates = densities
    .map((density) => {
      // Rounded: the image service rejects fractional dimensions.
      const w = Math.round(width * density);
      const h = Math.round(height * density);
      const url = storyblokImage(filename, w, h, options);
      return url && url !== filename ? `${url} ${w}w` : null;
    })
    .filter((candidate): candidate is string => candidate !== null);

  return candidates.length > 0 ? candidates.join(', ') : null;
}
