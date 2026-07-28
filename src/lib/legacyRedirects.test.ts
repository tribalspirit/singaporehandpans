import { describe, expect, test } from 'vitest';
import { legacyRedirectTarget } from './legacyRedirects';

describe('legacyRedirectTarget', () => {
  test('redirects the gallery index and all gallery sub-paths to /stories/', () => {
    expect(legacyRedirectTarget('/gallery')).toBe('/stories/');
    expect(legacyRedirectTarget('/gallery/')).toBe('/stories/');
    expect(legacyRedirectTarget('/gallery/albums/workshop-moments/')).toBe(
      '/stories/'
    );
    expect(legacyRedirectTarget('/gallery/x/y/z')).toBe('/stories/');
  });

  test('leaves unrelated paths untouched', () => {
    expect(legacyRedirectTarget('/stories/')).toBeNull();
    expect(legacyRedirectTarget('/')).toBeNull();
    expect(legacyRedirectTarget('/events/')).toBeNull();
    // Must not match a path that merely starts with the word "gallery".
    expect(legacyRedirectTarget('/gallery-tips/')).toBeNull();
  });
});
