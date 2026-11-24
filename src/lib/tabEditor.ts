/**
 * The Handpan Tab Editor's Library, linked from the Academy.
 *
 * The editor is a separate app (repo `tribalspirit/handpan-tab-editor`). Its
 * Library, at the editor's root, lists every tune with search and filters, and
 * is where visitors sign in and add tunes of their own. The Academy's card
 * links straight to it (owner, 2026-11-24). It isn't framed: the editor refuses
 * to be framed anywhere but its single-tune player, and signing in inside a
 * frame on another site would fail.
 *
 * The editor's origin comes only from configuration: PUBLIC_TAB_EDITOR_ORIGIN,
 * read at build time. With no valid value the card is left out of the build.
 * Turning it on is the owner's act: set the variable in Cloudflare Pages
 * (Preview, Production or both) and redeploy. Never commit a value.
 */

/**
 * Accept only a bare https origin, written as a browser writes one: lower
 * case, no credentials, path, query or fragment, no trailing slash, no default
 * port. Anything else means "no editor", so a typo in the dashboard switches
 * the card off rather than linking to the wrong address.
 */
export function parseTabEditorOrigin(value: unknown): string | null {
  if (typeof value !== 'string' || value === '') return null;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  if (url.protocol !== 'https:') return null;
  // URL normalises case, ports and trailing parts; a value that survives
  // unchanged as its own origin is a bare origin, written the browser's way.
  return url.origin === value ? url.origin : null;
}

/** The configured editor origin, or null when the card is switched off. */
export function getTabEditorOrigin(): string | null {
  return parseTabEditorOrigin(import.meta.env.PUBLIC_TAB_EDITOR_ORIGIN);
}

/** The editor's Library: its root page (the editor's docs/PUBLIC-API.md). */
export function tabEditorLibraryHref(origin: string): string {
  return `${origin}/`;
}
