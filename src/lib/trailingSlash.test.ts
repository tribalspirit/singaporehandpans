import { describe, it, expect } from 'vitest';
import { needsTrailingSlash, toTrailingSlash } from './trailingSlash';

describe('needsTrailingSlash', () => {
  it('redirects unslashed page paths', () => {
    expect(needsTrailingSlash('/events')).toBe(true);
    expect(needsTrailingSlash('/shop')).toBe(true);
    expect(needsTrailingSlash('/shop/sirvan-handpan')).toBe(true);
    expect(needsTrailingSlash('/events/handpan-lessons-for-beginners')).toBe(
      true
    );
  });

  it('leaves already-slashed paths and the root alone', () => {
    expect(needsTrailingSlash('/')).toBe(false);
    expect(needsTrailingSlash('/events/')).toBe(false);
    expect(needsTrailingSlash('/shop/sirvan-handpan/')).toBe(false);
  });

  it('never redirects API routes', () => {
    expect(needsTrailingSlash('/api/contact')).toBe(false);
    expect(needsTrailingSlash('/api/booking')).toBe(false);
  });

  it('leaves real files (extensions) untouched', () => {
    expect(needsTrailingSlash('/sitemap.xml')).toBe(false);
    expect(needsTrailingSlash('/robots.txt')).toBe(false);
    expect(needsTrailingSlash('/images/logo.png')).toBe(false);
    expect(needsTrailingSlash('/favicon.svg')).toBe(false);
  });
});

describe('toTrailingSlash', () => {
  it('appends a slash', () => {
    expect(toTrailingSlash('/events')).toBe('/events/');
  });

  it('preserves the query string after the slash', () => {
    expect(toTrailingSlash('/shop', '?utm_source=ig')).toBe(
      '/shop/?utm_source=ig'
    );
  });
});
