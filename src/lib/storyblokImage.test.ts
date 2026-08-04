import { describe, it, expect } from 'vitest';
import { storyblokImage, storyblokSrcSet } from './storyblokImage';

const ASSET = 'https://a.storyblok.com/f/289341187794474/8064x6048/abc/pic.jpg';

describe('storyblokImage', () => {
  it('appends a smart-cropped resize to a Storyblok asset', () => {
    expect(storyblokImage(ASSET, 700, 400)).toBe(`${ASSET}/m/700x400/smart/`);
  });

  it('omits the smart segment when face-aware cropping is turned off', () => {
    expect(storyblokImage(ASSET, 700, 400, { smart: false })).toBe(
      `${ASSET}/m/700x400/`
    );
  });

  it('leaves SVGs untouched — the image service cannot transform them', () => {
    const svg = 'https://a.storyblok.com/f/1/logo.svg';
    expect(storyblokImage(svg, 700, 400)).toBe(svg);
  });

  it('leaves non-Storyblok URLs untouched', () => {
    const external = 'https://example.com/photo.jpg';
    expect(storyblokImage(external, 700, 400)).toBe(external);
  });

  it('leaves a local asset path untouched', () => {
    expect(storyblokImage('/images/hero.jpg', 700, 400)).toBe(
      '/images/hero.jpg'
    );
  });

  it('does not double-transform an already-resized URL', () => {
    const already = `${ASSET}/m/700x400/smart/`;
    expect(storyblokImage(already, 160, 120)).toBe(already);
  });

  it('returns an empty string for missing input rather than a broken URL', () => {
    expect(storyblokImage(undefined, 700, 400)).toBe('');
    expect(storyblokImage('', 700, 400)).toBe('');
  });

  it('ignores non-positive dimensions instead of emitting /m/0x0/', () => {
    expect(storyblokImage(ASSET, 0, 400)).toBe(ASSET);
    expect(storyblokImage(ASSET, 700, -1)).toBe(ASSET);
  });
});

describe('storyblokSrcSet', () => {
  it('describes candidates in width units so `sizes` can select between them', () => {
    // `x` descriptors would make the browser ignore `sizes` and choose on
    // device pixel ratio alone, which over-fetches on every display.
    expect(storyblokSrcSet(ASSET, 350, 200)).toBe(
      [
        `${ASSET}/m/350x200/smart/ 350w`,
        `${ASSET}/m/700x400/smart/ 700w`,
        `${ASSET}/m/1050x600/smart/ 1050w`,
      ].join(', ')
    );
  });

  it('scales height with width so every candidate keeps the crop', () => {
    const set = storyblokSrcSet(ASSET, 160, 120)!;
    expect(set).toContain('/m/160x120/smart/ 160w');
    expect(set).toContain('/m/320x240/smart/ 320w');
    expect(set).toContain('/m/480x360/smart/ 480w');
  });

  it('honours an explicit density list', () => {
    expect(storyblokSrcSet(ASSET, 350, 200, { densities: [1, 2] })).toBe(
      `${ASSET}/m/350x200/smart/ 350w, ${ASSET}/m/700x400/smart/ 700w`
    );
  });

  it('rounds fractional dimensions the image service would reject', () => {
    const set = storyblokSrcSet(ASSET, 175, 101, { densities: [1.5] })!;
    expect(set).toBe(`${ASSET}/m/263x152/smart/ 263w`);
  });

  it('returns null when the asset cannot be transformed', () => {
    expect(
      storyblokSrcSet('https://example.com/photo.jpg', 350, 200)
    ).toBeNull();
    expect(storyblokSrcSet(undefined, 350, 200)).toBeNull();
    expect(
      storyblokSrcSet('https://a.storyblok.com/f/1/logo.svg', 350, 200)
    ).toBeNull();
  });
});
