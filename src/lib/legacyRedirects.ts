/**
 * Legacy-path 301 redirects, enforced in `src/middleware.ts`.
 *
 * The gallery section was replaced by Stories. Every `/gallery` and
 * `/gallery/albums/*` URL is redirected to `/stories/` so existing inbound
 * links and search-engine equity are preserved. Kept pure (no Astro/runtime
 * imports) so it is unit-testable, mirroring `trailingSlash.ts`.
 *
 * The target is the slashed canonical form so the redirect resolves in one hop
 * (an unslashed target would trigger a second trailing-slash 301).
 */

/**
 * Event slugs corrected in Storyblok. These belong here rather than in
 * `_redirects` because `/events/[slug]` is `prerender = false`: the old URLs
 * are served by the worker and never reach the Pages asset server, so a
 * `_redirects` rule would never fire and the request would 404 against
 * Storyblok instead.
 *
 * Targets carry the trailing slash so the hop resolves in one step.
 */
const CORRECTED_EVENT_SLUGS: Record<string, string> = {
  'handpan-masterclass-with-takao-minemoto-for-singapore-handpan-communtiy':
    'handpan-masterclass-with-takao-minemoto-for-singapore-handpan-community',
  'advance-yoru-handpan-playing-skiils': 'advance-your-handpan-playing-skills',
  // Was the events folder's start page, so it took the folder's own slug and
  // resolved at /events/events/.
  events: 'handpan-essentials-with-peter-bognar',
};

const LEGACY_REDIRECTS: { pattern: RegExp; target: string }[] = [
  { pattern: /^\/gallery(?:\/.*)?$/i, target: '/stories/' },
  ...Object.entries(CORRECTED_EVENT_SLUGS).map(([from, to]) => ({
    pattern: new RegExp(`^/events/${from}/?$`, 'i'),
    target: `/events/${to}/`,
  })),
];

/** The redirect target for a legacy pathname, or `null` if none applies. */
export function legacyRedirectTarget(pathname: string): string | null {
  for (const rule of LEGACY_REDIRECTS) {
    if (rule.pattern.test(pathname)) return rule.target;
  }
  return null;
}
