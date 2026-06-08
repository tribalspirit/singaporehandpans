/**
 * Canonical-URL enforcement (host + trailing slash).
 *
 * Every canonical URL on the site is `https://singaporehandpans.com/...` and
 * ends in `/` (see the canonical builder in `src/components/SEO.astro`). Two
 * duplicate-URL leaks dilute crawl budget and cause "Discovered – currently not
 * indexed" / "Alternative page with proper canonical" in Search Console:
 *   1. Astro's `trailingSlash: 'ignore'` serves the unslashed form as 200.
 *   2. The `www.` host (inherited from the old WordPress setup) serves 200 with
 *      a canonical to the apex instead of redirecting.
 * The edge middleware 301s both to the canonical form in a single hop, so there
 * is exactly one live URL per page.
 *
 * `_redirects` cannot express a generic "append a trailing slash" rule, so this
 * is the single source of truth for the policy. Kept pure (no Astro/runtime
 * imports) so it is unit-testable.
 */

// Apex (non-www) host is canonical, matching `site` in astro.config.mjs.
const CANONICAL_HOST = 'singaporehandpans.com';

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

/**
 * Compute the canonical redirect target for a request, or `null` if the URL is
 * already canonical. Folds the `www.`→apex and trailing-slash redirects into a
 * single 301 so no request ever takes two hops.
 */
export function canonicalRedirectTarget(url: {
  protocol: string; // includes the trailing colon, e.g. "https:"
  hostname: string;
  port?: string;
  pathname: string;
  search: string;
}): string | null {
  let changed = false;

  let host = url.hostname;
  if (host === `www.${CANONICAL_HOST}`) {
    host = CANONICAL_HOST;
    changed = true;
  }

  let pathname = url.pathname;
  if (needsTrailingSlash(pathname)) {
    pathname = `${pathname}/`;
    changed = true;
  }

  if (!changed) return null;
  // Preserve the incoming scheme/port (http→https is handled at the CF edge);
  // only the host and trailing slash are canonicalised here.
  const portPart = url.port ? `:${url.port}` : '';
  return `${url.protocol}//${host}${portPart}${pathname}${url.search}`;
}
