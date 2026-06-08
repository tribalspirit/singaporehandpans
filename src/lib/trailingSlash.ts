/**
 * Trailing-slash canonicalisation.
 *
 * Every canonical URL on the site ends in `/` (see the canonical builder in
 * `src/components/SEO.astro`). Astro's `trailingSlash: 'ignore'` plus a
 * canonical `<link>` alone are not enough: the unslashed form still returns a
 * 200, so Google discovers and crawls duplicate URLs and de-prioritises them
 * ("Discovered – currently not indexed"). The edge middleware 301s the
 * unslashed form to the slashed one so there is exactly one live URL per page.
 *
 * `_redirects` cannot express a generic "append a trailing slash" rule, so this
 * is the single source of truth for the policy. Kept pure (no Astro/runtime
 * imports) so it is unit-testable.
 */

// Real files served as-is: assets, sitemap.xml, robots.txt, etc.
const FILE_EXTENSION = /\.[a-z0-9]+$/i;

/** True when `pathname` should be 301-redirected to its trailing-slash form. */
export function needsTrailingSlash(pathname: string): boolean {
  if (pathname === '/' || pathname.endsWith('/')) return false;
  // API routes are dynamic and must not be redirected.
  if (pathname.startsWith('/api/')) return false;
  // Anything that looks like a file (has an extension) is left untouched.
  if (FILE_EXTENSION.test(pathname)) return false;
  return true;
}

/** Build the slashed redirect target, preserving the query string. */
export function toTrailingSlash(pathname: string, search = ''): string {
  return `${pathname}/${search}`;
}
