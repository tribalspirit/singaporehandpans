import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  getTabEditorOrigin,
  parseTabEditorOrigin,
  tabEditorLibraryHref,
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

describe('the Library link', () => {
  test("is the editor's root, where its Library lives", () => {
    expect(tabEditorLibraryHref(ORIGIN)).toBe('https://tabs.example.com/');
    expect(tabEditorLibraryHref(PLACEHOLDER)).toBe(
      'https://handpan-tab-editor.example.workers.dev/'
    );
  });

  test('is built only from an origin the parse accepted', () => {
    const origin = parseTabEditorOrigin(PLACEHOLDER);
    expect(origin).not.toBeNull();
    expect(tabEditorLibraryHref(origin as string)).toBe(`${PLACEHOLDER}/`);
  });
});
