// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The widget paints only through its own `--shp-*` token layer.
 *
 * Every value falls back to the literal it currently resolves to, so the widget
 * renders identically with or without the site's global tokens — and a host
 * page that wants to restyle it has one documented surface to override instead
 * of needing the site's internal token names or hashed class names.
 *
 * Astro injects `src/styles/tokens.scss` into every SCSS file automatically, so
 * removing `@use` lines would prove nothing. Routing every value through the
 * layer is what actually breaks the dependency, and this test is what keeps it
 * broken: a single `var(--spacing-md)` slipping back in re-couples the widget.
 */

const STYLES_DIR = join(process.cwd(), 'src/widgets/academy-handpan/styles');

function moduleStylesheets(): string[] {
  return readdirSync(STYLES_DIR).filter((file) =>
    file.endsWith('.module.scss')
  );
}

describe('widget token layer', () => {
  it('references no custom property outside the --shp- namespace', () => {
    const offenders: string[] = [];

    for (const file of moduleStylesheets()) {
      const contents = readFileSync(join(STYLES_DIR, file), 'utf8');

      for (const [, name] of contents.matchAll(/var\((--[a-z0-9-]+)/g)) {
        if (!name.startsWith('--shp-')) {
          offenders.push(`${file}: ${name}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it('defines every --shp- token the stylesheets consume', () => {
    const layer = readFileSync(join(STYLES_DIR, '_widget-tokens.scss'), 'utf8');
    const defined = new Set(
      [...layer.matchAll(/^\s*(--shp-[a-z0-9-]+):/gm)].map(([, name]) => name)
    );

    const undefinedTokens = new Set<string>();
    for (const file of moduleStylesheets()) {
      const contents = readFileSync(join(STYLES_DIR, file), 'utf8');
      for (const [, name] of contents.matchAll(/var\((--shp-[a-z0-9-]+)/g)) {
        if (!defined.has(name)) undefinedTokens.add(`${file}: ${name}`);
      }
    }

    expect([...undefinedTokens]).toEqual([]);
  });

  it('gives every token a literal fallback, not just a site token', () => {
    // `--shp-x: var(--x)` alone would still break without the host's tokens.
    const layer = readFileSync(join(STYLES_DIR, '_widget-tokens.scss'), 'utf8');
    const withoutFallback: string[] = [];

    for (const [, name, value] of layer.matchAll(
      /^\s*(--shp-[a-z0-9-]+):\s*([^;]+);/gm
    )) {
      if (!/var\(--[a-z0-9-]+,\s*\S/.test(value)) {
        withoutFallback.push(`${name}: ${value.trim()}`);
      }
    }

    expect(withoutFallback).toEqual([]);
  });

  it('declares the layer on the widget root so it inherits everywhere', () => {
    const root = readFileSync(
      join(STYLES_DIR, 'HandpanWidget.module.scss'),
      'utf8'
    );

    expect(root).toContain('@include shp-tokens;');
  });
});
