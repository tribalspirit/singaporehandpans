import { MarkTypes, richTextResolver } from '@storyblok/js';
import type {
  StoryblokRichTextNode,
  StoryblokRichTextNodeResolver,
  StoryblokRichTextResolvers,
} from '@storyblok/js';

/**
 * Server-side Storyblok rich-text → HTML rendering, safe for the Cloudflare
 * Workers runtime.
 *
 * The modern `richTextResolver` from `@storyblok/richtext` (re-exported by
 * `@storyblok/js`) is a pure synchronous string transform — no network, DOM or
 * timers — so it runs on the Worker where the legacy `storyblok-js-client`
 * resolver hangs (see the note in `src/lib/storyblok.ts`).
 *
 * Trust boundary: the rich text is authored by studio editors in Storyblok, so
 * the resulting HTML is injected with `set:html`. As defense-in-depth the link
 * mark is overridden to (a) reject unsafe URL schemes (`javascript:`, `data:`)
 * and (b) mark external links `rel="noopener noreferrer"`. Inline images are a
 * separate `story_image` blok, so the resolver never emits `<img>` tags.
 */

const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);
const EXTERNAL_HTTP_REGEX = /^https?:\/\//i;

/**
 * Validate an href against a scheme allowlist. Relative and anchor links are
 * resolved against a dummy base so they count as internal (safe); absolute URLs
 * with a disallowed protocol (e.g. `javascript:`) are rejected.
 */
export function isSafeHref(href: string): boolean {
  const trimmed = href.trim();
  if (!trimmed) return false;
  try {
    const url = new URL(trimmed, 'https://internal.local');
    return SAFE_PROTOCOLS.has(url.protocol);
  } catch {
    return false;
  }
}

const linkResolver: StoryblokRichTextNodeResolver<string> = (node, context) => {
  const attrs = (node.attrs ?? {}) as Record<string, unknown>;
  const linktype = typeof attrs.linktype === 'string' ? attrs.linktype : 'url';
  const anchor = typeof attrs.anchor === 'string' ? attrs.anchor : '';
  const text = typeof node.text === 'string' ? node.text : '';

  let href = typeof attrs.href === 'string' ? attrs.href : '';
  if (linktype === 'email' && href && !href.startsWith('mailto:')) {
    href = `mailto:${href}`;
  }
  if (anchor) href = `${href}#${anchor}`;

  if (!href || !isSafeHref(href)) {
    // Drop the anchor entirely; keep the visible text.
    return context.render('span', {}, text);
  }

  const safeAttrs: Record<string, string> = { href };
  if (EXTERNAL_HTTP_REGEX.test(href)) {
    safeAttrs.target = '_blank';
    safeAttrs.rel = 'noopener noreferrer';
  }
  return context.render('a', safeAttrs, text);
};

const resolvers: StoryblokRichTextResolvers<string> = {
  [MarkTypes.LINK]: linkResolver,
};

/**
 * Render a Storyblok rich-text document to an HTML string. Returns `''` for
 * empty, missing or malformed input so callers can safely inject the result.
 */
export function renderRichText(doc: unknown): string {
  if (!doc || typeof doc !== 'object') return '';
  const content = (doc as { content?: unknown }).content;
  if (!Array.isArray(content) || content.length === 0) return '';
  try {
    const node = doc as StoryblokRichTextNode<string>;
    return richTextResolver<string>({ resolvers }).render(node) ?? '';
  } catch {
    return '';
  }
}
