import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  ACADEMY_TUNES,
  ACADEMY_TUNES_PATH,
  ACADEMY_TUNES_SLUG,
  EMBED_SANDBOX,
  academyTunesPaths,
  academyTunesSitemapPaths,
  embedSrc,
  frameTitle,
  getTabEditorOrigin,
  parseTabEditorOrigin,
  tuneHref,
} from './tabEditor';

// Placeholders only. The editor's real addresses never appear in tests.
const ORIGIN = 'https://tabs.example.com';
const PLACEHOLDER = 'https://handpan-tab-editor.example.workers.dev';

describe('parseTabEditorOrigin', () => {
  test('returns null when unset', () => {
    expect(parseTabEditorOrigin(undefined)).toBeNull();
  });

  test('returns null when empty', () => {
    expect(parseTabEditorOrigin('')).toBeNull();
  });

  test('returns null for a value that is not a string', () => {
    expect(parseTabEditorOrigin(null)).toBeNull();
    expect(parseTabEditorOrigin(42)).toBeNull();
    expect(parseTabEditorOrigin(true)).toBeNull();
  });

  test('rejects http', () => {
    expect(parseTabEditorOrigin('http://tabs.example.com')).toBeNull();
  });

  test('rejects schemes other than https', () => {
    expect(parseTabEditorOrigin('javascript:alert(1)')).toBeNull();
    expect(parseTabEditorOrigin('data:text/html,hi')).toBeNull();
    expect(parseTabEditorOrigin('ftp://tabs.example.com')).toBeNull();
  });

  test('rejects anything that is not a URL', () => {
    expect(parseTabEditorOrigin('tabs.example.com')).toBeNull();
    expect(parseTabEditorOrigin('not a url')).toBeNull();
  });

  test('rejects a path, including a bare trailing slash', () => {
    expect(parseTabEditorOrigin(`${ORIGIN}/embed/`)).toBeNull();
    expect(parseTabEditorOrigin(`${ORIGIN}/`)).toBeNull();
  });

  test('rejects a query or a fragment', () => {
    expect(parseTabEditorOrigin(`${ORIGIN}?x=1`)).toBeNull();
    expect(parseTabEditorOrigin(`${ORIGIN}#id=morning-walk`)).toBeNull();
  });

  test('rejects upper case, which a browser never writes in an origin', () => {
    expect(parseTabEditorOrigin('https://Tabs.Example.com')).toBeNull();
    expect(parseTabEditorOrigin('HTTPS://tabs.example.com')).toBeNull();
  });

  test('rejects credentials', () => {
    expect(
      parseTabEditorOrigin('https://user:pass@tabs.example.com')
    ).toBeNull();
  });

  test('rejects surrounding whitespace', () => {
    expect(parseTabEditorOrigin(` ${ORIGIN}`)).toBeNull();
    expect(parseTabEditorOrigin(`${ORIGIN}\n`)).toBeNull();
  });

  test('rejects the default port written out', () => {
    expect(parseTabEditorOrigin(`${ORIGIN}:443`)).toBeNull();
  });

  test('accepts a bare https origin', () => {
    expect(parseTabEditorOrigin(ORIGIN)).toBe(ORIGIN);
    expect(parseTabEditorOrigin(PLACEHOLDER)).toBe(PLACEHOLDER);
  });

  test('accepts a non-default port', () => {
    expect(parseTabEditorOrigin('https://localhost:8443')).toBe(
      'https://localhost:8443'
    );
  });
});

describe('getTabEditorOrigin', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test('is null when PUBLIC_TAB_EDITOR_ORIGIN is unset', () => {
    vi.stubEnv('PUBLIC_TAB_EDITOR_ORIGIN', undefined);
    expect(getTabEditorOrigin()).toBeNull();
  });

  test('is null when PUBLIC_TAB_EDITOR_ORIGIN is invalid', () => {
    vi.stubEnv('PUBLIC_TAB_EDITOR_ORIGIN', `${PLACEHOLDER}/`);
    expect(getTabEditorOrigin()).toBeNull();
  });

  test('is the origin when PUBLIC_TAB_EDITOR_ORIGIN is valid', () => {
    vi.stubEnv('PUBLIC_TAB_EDITOR_ORIGIN', PLACEHOLDER);
    expect(getTabEditorOrigin()).toBe(PLACEHOLDER);
  });
});

describe('the embed contract', () => {
  test('the tune and theme go after "#", in the editor\'s Copy embed code form', () => {
    expect(embedSrc(ORIGIN, 'morning-walk')).toBe(
      'https://tabs.example.com/embed/#id=morning-walk&theme=light'
    );
  });

  test('a tune id is encoded, so it cannot add parameters', () => {
    expect(embedSrc(ORIGIN, 'a&theme=dark')).toBe(
      'https://tabs.example.com/embed/#id=a%26theme%3Ddark&theme=light'
    );
  });

  test('the fallback link opens the tune in the editor', () => {
    expect(tuneHref(ORIGIN, 'morning-walk')).toBe(
      'https://tabs.example.com/tune/morning-walk'
    );
    expect(tuneHref(ORIGIN, '../admin')).toBe(
      'https://tabs.example.com/tune/..%2Fadmin'
    );
  });

  test("the sandbox is exactly the editor's", () => {
    expect(EMBED_SANDBOX).toBe(
      'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox'
    );
  });

  test('the sandbox never allows top navigation or forms', () => {
    const tokens = EMBED_SANDBOX.split(' ');
    expect(tokens.some((t) => t.startsWith('allow-top-navigation'))).toBe(
      false
    );
    expect(tokens).not.toContain('allow-forms');
  });

  test('the frame is titled after its tune', () => {
    expect(frameTitle({ title: 'Morning Walk' })).toBe(
      'Morning Walk, a handpan tune'
    );
  });
});

describe('the Academy tunes', () => {
  test('live at /academy/tunes/', () => {
    expect(ACADEMY_TUNES_SLUG).toBe('tunes');
    expect(ACADEMY_TUNES_PATH).toBe('/academy/tunes/');
  });

  test("are the owner's pick: Morning Walk", () => {
    expect(ACADEMY_TUNES.map((t) => t.id)).toEqual(['morning-walk']);
    expect(ACADEMY_TUNES[0]).toEqual({
      id: 'morning-walk',
      title: 'Morning Walk',
      level: 'Beginner',
      tuning: 'D Kurd 9',
    });
  });

  test('have unique, URL-safe ids', () => {
    const ids = ACADEMY_TUNES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  });
});

describe('switching the page on and off', () => {
  test('with no origin, getStaticPaths builds no page', () => {
    expect(academyTunesPaths(null)).toEqual([]);
  });

  test('with an origin, it builds /academy/tunes/ and hands the page the origin', () => {
    expect(academyTunesPaths(ORIGIN)).toEqual([
      { params: { slug: 'tunes' }, props: { origin: ORIGIN } },
    ]);
  });

  test('with no origin, the sitemap gains nothing', () => {
    expect(academyTunesSitemapPaths(null)).toEqual([]);
  });

  test('with an origin, the sitemap gains /academy/tunes/', () => {
    expect(academyTunesSitemapPaths(ORIGIN)).toEqual(['/academy/tunes/']);
  });
});
