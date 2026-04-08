/**
 * Edge cache profiles for SSR pages.
 *
 * Pages stay server-rendered (so admins see fresh CMS/Shopify content without
 * waiting for a rebuild), but their HTML response is cached at the Cloudflare
 * edge so Googlebot and repeat visitors get static-fast TTFB. The actual
 * read/write against `caches.default` happens in `src/middleware.ts`.
 *
 * Trade-off: a fresh publish in Storyblok or Shopify becomes visible to users
 * within `sMaxAge` seconds (worst case, per edge location). Pick shorter
 * values for high-churn surfaces and longer values for stable ones.
 *
 *  - sMaxAge: how long Cloudflare serves the cached HTML before treating it
 *    as expired. After this window, the next request triggers an SSR render.
 *  - staleWhileRevalidate: signalled to downstream caches/browsers via the
 *    Cache-Control header. Cloudflare's Cache API itself does not implement
 *    SWR — we re-render on the next request after sMaxAge — but the header
 *    keeps the contract correct for any intermediate cache.
 */
export const EDGE_CACHE_PROFILES = {
  /** High-traffic surfaces where freshness matters: home, events index. */
  short: { sMaxAge: 60, staleWhileRevalidate: 86400 },
  /** Default for CMS/shop list and detail pages. */
  medium: { sMaxAge: 300, staleWhileRevalidate: 86400 },
  /** Rarely-updated content. */
  long: { sMaxAge: 3600, staleWhileRevalidate: 86400 },
} as const;

export type EdgeCacheProfile = keyof typeof EDGE_CACHE_PROFILES;

/**
 * Mark the current SSR response as edge-cacheable. Call from a page's
 * frontmatter before any potential `Astro.redirect()`.
 */
export function setEdgeCache(
  response: { headers: Headers },
  profile: EdgeCacheProfile = 'medium'
): void {
  const { sMaxAge, staleWhileRevalidate } = EDGE_CACHE_PROFILES[profile];
  response.headers.set(
    'Cache-Control',
    `public, max-age=0, s-maxage=${sMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`
  );
}
