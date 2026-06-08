import { describe, it, expect } from 'vitest';
import {
  needsTrailingSlash,
  toTrailingSlash,
  canonicalRedirectTarget,
} from './trailingSlash';

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

describe('canonicalRedirectTarget', () => {
  const at = (hostname: string, pathname: string, search = '') =>
    canonicalRedirectTarget({
      protocol: 'https:',
      hostname,
      port: '',
      pathname,
      search,
    });

  it('returns null when already canonical (apex + trailing slash)', () => {
    expect(at('singaporehandpans.com', '/')).toBeNull();
    expect(at('singaporehandpans.com', '/events/')).toBeNull();
    expect(at('singaporehandpans.com', '/sitemap.xml')).toBeNull();
  });

  it('adds a trailing slash on the apex host', () => {
    expect(at('singaporehandpans.com', '/events')).toBe(
      'https://singaporehandpans.com/events/'
    );
  });

  it('redirects www to the apex host', () => {
    expect(at('www.singaporehandpans.com', '/events/')).toBe(
      'https://singaporehandpans.com/events/'
    );
    expect(at('www.singaporehandpans.com', '/')).toBe(
      'https://singaporehandpans.com/'
    );
  });

  it('folds www + missing slash into a single redirect', () => {
    expect(at('www.singaporehandpans.com', '/shop/sew-handpan')).toBe(
      'https://singaporehandpans.com/shop/sew-handpan/'
    );
  });

  it('preserves the query string', () => {
    expect(at('www.singaporehandpans.com', '/shop', '?ref=fb')).toBe(
      'https://singaporehandpans.com/shop/?ref=fb'
    );
  });

  it('preserves the incoming scheme and port (e.g. local dev)', () => {
    expect(
      canonicalRedirectTarget({
        protocol: 'http:',
        hostname: 'localhost',
        port: '4321',
        pathname: '/events',
        search: '',
      })
    ).toBe('http://localhost:4321/events/');
  });
});
