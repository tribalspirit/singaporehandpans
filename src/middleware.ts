import { defineMiddleware } from 'astro:middleware';

/**
 * Edge HTML caching middleware for Cloudflare Pages.
 *
 * SSR pages opt in by setting `Cache-Control: ... s-maxage=N` (via the
 * `setEdgeCache` helper in `src/lib/edgeCache.ts`). This middleware then
 * stores the rendered HTML in Cloudflare's per-colo cache (`caches.default`)
 * and serves subsequent requests directly from that cache, giving Googlebot
 * and repeat visitors static-fast TTFB without losing the live data flow.
 *
 * The cache is per-edge-location, keyed by full URL, and only used for GET/
 * HEAD requests. Responses with `Set-Cookie` are never cached.
 */

const EDGE_CACHE_RUNTIME_KEY = 'caches';

function parseSMaxAge(header: string | null): number | null {
  if (!header) return null;
  const match = header.match(/s-maxage=(\d+)/);
  if (!match) return null;
  const value = parseInt(match[1], 10);
  return Number.isFinite(value) ? value : null;
}

function getAgeSeconds(response: Response): number {
  const dateHeader = response.headers.get('Date');
  if (!dateHeader) return Number.POSITIVE_INFINITY;
  const responseTime = new Date(dateHeader).getTime();
  if (Number.isNaN(responseTime)) return Number.POSITIVE_INFINITY;
  return Math.max(0, Math.floor((Date.now() - responseTime) / 1000));
}

// Static asset extensions are served by Cloudflare Pages directly and
// shouldn't reach the middleware, but guard anyway. Note: `.xml` (sitemap),
// `.txt` (robots.txt), etc. are intentionally NOT in this list — they are
// dynamic responses we DO want to cache.
const STATIC_ASSET_EXTENSIONS =
  /\.(jpe?g|png|webp|gif|svg|ico|css|js|mjs|map|woff2?|ttf|otf|eot|mp4|webm|mp3|pdf)$/i;

function isCacheablePath(pathname: string): boolean {
  // API routes are dynamic / per-user — never cache.
  if (pathname.startsWith('/api/')) return false;
  if (STATIC_ASSET_EXTENSIONS.test(pathname)) return false;
  return true;
}

export const onRequest = defineMiddleware(async (context, next) => {
  // Only GET is cached. HEAD is intentionally excluded: the cache key is
  // normalised to GET, so storing a (bodyless) HEAD response would poison
  // subsequent GET requests with an empty page until s-maxage expires.
  if (context.request.method !== 'GET') {
    return next();
  }

  const url = new URL(context.request.url);
  if (!isCacheablePath(url.pathname)) {
    return next();
  }

  // Cloudflare's `caches.default` is only present on the production Workers
  // runtime. In `astro dev` / wrangler local mode it may be missing — fall
  // back to plain SSR with no caching.
  const cache = (globalThis as unknown as { caches?: { default?: Cache } })[
    EDGE_CACHE_RUNTIME_KEY
  ]?.default;
  if (!cache) {
    return next();
  }

  // Use a normalised cache key (URL only, no per-request headers) so all
  // visitors share the same cached HTML.
  const cacheKey = new Request(url.toString(), { method: 'GET' });

  const cached = await cache.match(cacheKey);
  if (cached) {
    const sMaxAge = parseSMaxAge(cached.headers.get('Cache-Control'));
    if (sMaxAge !== null) {
      const age = getAgeSeconds(cached);
      if (age < sMaxAge) {
        const response = new Response(cached.body, cached);
        response.headers.set('Age', age.toString());
        response.headers.set('X-Edge-Cache', 'HIT');
        return response;
      }
    }
  }

  // Cache miss or expired — render and store.
  const response = await next();

  const cacheControl = response.headers.get('Cache-Control');
  const optedIn = cacheControl?.includes('s-maxage');
  const hasCookie = response.headers.has('Set-Cookie');

  if (response.status === 200 && optedIn && !hasCookie) {
    if (!response.headers.has('Date')) {
      response.headers.set('Date', new Date().toUTCString());
    }
    const toCache = response.clone();
    const runtime = (
      context.locals as {
        runtime?: { ctx?: { waitUntil?: (p: Promise<unknown>) => void } };
      }
    ).runtime;
    const waitUntil = runtime?.ctx?.waitUntil;
    if (waitUntil) {
      waitUntil(cache.put(cacheKey, toCache));
    }
    response.headers.set('X-Edge-Cache', 'MISS');
  }

  return response;
});
