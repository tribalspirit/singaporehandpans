/**
 * The Handpan Tab Editor's player on the Academy, at /academy/tunes/.
 *
 * The editor is a separate app (repo `tribalspirit/handpan-tab-editor`). This
 * site only frames its /embed/ page, the one address of the editor that may be
 * framed, in the form its "Copy embed code" gives (its docs/PUBLIC-API.md,
 * "Playing and embedding a library tune").
 *
 * The editor's origin comes only from configuration: PUBLIC_TAB_EDITOR_ORIGIN,
 * read at build time. With no valid value the tunes page, its Academy card and
 * its sitemap entry are all left out of the build. Turning the player on is
 * the owner's act: set the variable in Cloudflare Pages (Preview, Production
 * or both) and redeploy. Never commit a value.
 */

/** The tunes page's slug under /academy/, and its path. */
export const ACADEMY_TUNES_SLUG = 'tunes';
export const ACADEMY_TUNES_PATH = `/academy/${ACADEMY_TUNES_SLUG}/`;

/**
 * The frame's sandbox, exactly as the editor's embed code gives it. The frame
 * needs no `allow` attribute: the first press of Play inside it turns sound on
 * there. Never widen it; the editor's review rules treat `allow-top-navigation`
 * or `allow-forms` as P0.
 */
export const EMBED_SANDBOX =
  'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox';

export interface LibraryTune {
  /** The tune's id in the editor's library. */
  readonly id: string;
  readonly title: string;
  readonly level: string;
  readonly tuning: string;
}

/**
 * The library tunes the Academy shows, picked by hand (owner, 2026-11-24).
 * Ids stay as they are when the library grows; add a tune here to show it.
 */
export const ACADEMY_TUNES: readonly LibraryTune[] = [
  {
    id: 'morning-walk',
    title: 'Morning Walk',
    level: 'Beginner',
    tuning: 'D Kurd 9',
  },
];

/**
 * Accept only a bare https origin, written as a browser writes one: lower
 * case, no credentials, path, query or fragment, no trailing slash, no default
 * port. Anything else means "no editor", so a typo in the dashboard switches
 * the player off rather than framing the wrong address.
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

/** The configured editor origin, or null when the player is switched off. */
export function getTabEditorOrigin(): string | null {
  return parseTabEditorOrigin(import.meta.env.PUBLIC_TAB_EDITOR_ORIGIN);
}

/**
 * The frame's src. The tune and theme go after "#", which no server sees. The
 * Studio is a light site, so the theme is `light`.
 */
export function embedSrc(origin: string, tuneId: string): string {
  return `${origin}/embed/#id=${encodeURIComponent(tuneId)}&theme=light`;
}

/** The tune's own page in the editor, the fallback when a frame can't load. */
export function tuneHref(origin: string, tuneId: string): string {
  return `${origin}/tune/${encodeURIComponent(tuneId)}`;
}

/** The frame's accessible name. */
export function frameTitle(tune: Pick<LibraryTune, 'title'>): string {
  return `${tune.title}, a handpan tune`;
}
