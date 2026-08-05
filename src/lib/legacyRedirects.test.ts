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

  /**
   * These slugs were corrected in Storyblok. `/events/[slug]` is
   * `prerender = false`, so the old URLs are served by the worker and never
   * reach the Pages asset server — a `_redirects` rule for them would never
   * fire, and the request would 404 against Storyblok instead.
   */
  test('redirects the corrected event slugs', () => {
    expect(
      legacyRedirectTarget(
        '/events/handpan-masterclass-with-takao-minemoto-for-singapore-handpan-communtiy/'
      )
    ).toBe(
      '/events/handpan-masterclass-with-takao-minemoto-for-singapore-handpan-community/'
    );
    expect(
      legacyRedirectTarget('/events/advance-yoru-handpan-playing-skiils/')
    ).toBe('/events/advance-your-handpan-playing-skills/');
    expect(legacyRedirectTarget('/events/events/')).toBe(
      '/events/handpan-essentials-with-peter-bognar/'
    );
  });

  test('matches the corrected slugs with or without a trailing slash', () => {
    expect(
      legacyRedirectTarget('/events/advance-yoru-handpan-playing-skiils')
    ).toBe('/events/advance-your-handpan-playing-skills/');
    expect(legacyRedirectTarget('/events/events')).toBe(
      '/events/handpan-essentials-with-peter-bognar/'
    );
  });

  test('does not touch the corrected slugs themselves', () => {
    // Guards against a rule that would bounce the target back to itself.
    expect(
      legacyRedirectTarget('/events/advance-your-handpan-playing-skills/')
    ).toBeNull();
    expect(
      legacyRedirectTarget('/events/handpan-essentials-with-peter-bognar/')
    ).toBeNull();
  });

  test('leaves other event slugs alone', () => {
    expect(
      legacyRedirectTarget('/events/handpan-first-touch-workshop/')
    ).toBeNull();
    expect(legacyRedirectTarget('/events/archive/')).toBeNull();
  });
});
