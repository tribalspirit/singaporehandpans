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
  it('pairs a 1x and a doubled 2x candidate', () => {
    expect(storyblokSrcSet(ASSET, 700, 400)).toBe(
      `${ASSET}/m/700x400/smart/ 1x, ${ASSET}/m/1400x800/smart/ 2x`
    );
  });

  it('returns null when the asset cannot be transformed', () => {
    expect(
      storyblokSrcSet('https://example.com/photo.jpg', 700, 400)
    ).toBeNull();
    expect(storyblokSrcSet(undefined, 700, 400)).toBeNull();
    expect(
      storyblokSrcSet('https://a.storyblok.com/f/1/logo.svg', 700, 400)
    ).toBeNull();
  });
});
