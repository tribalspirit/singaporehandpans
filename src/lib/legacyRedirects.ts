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

const LEGACY_REDIRECTS: { pattern: RegExp; target: string }[] = [
  { pattern: /^\/gallery(?:\/.*)?$/i, target: '/stories/' },
];

/** The redirect target for a legacy pathname, or `null` if none applies. */
export function legacyRedirectTarget(pathname: string): string | null {
  for (const rule of LEGACY_REDIRECTS) {
    if (rule.pattern.test(pathname)) return rule.target;
  }
  return null;
}
