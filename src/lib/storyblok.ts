const STORYBLOK_BASE = 'https://api.storyblok.com/v2';

/**
 * Lightweight Storyblok CDN client for SSR pages on Cloudflare Workers.
 *
 * Uses native fetch instead of storyblok-js-client, whose internal
 * throttle/setTimeout machinery hangs inside the Workers runtime.
 */
export function getStoryblokClient(token: string) {
  return {
    async get(path: string, params: Record<string, unknown> = {}) {
      const query = new URLSearchParams();
      query.set('token', token);

      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          query.set(key, String(value));
        }
      }

      const url = `${STORYBLOK_BASE}/${path}?${query}`;
      console.log('[storyblok] fetching:', url.replace(token, '***'));

      const res = await fetch(url);

      if (!res.ok) {
        console.error(
          '[storyblok] error:',
          res.status,
          res.statusText,
          'url:',
          url.replace(token, '***')
        );
        throw new Error(`Storyblok API error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      console.log(
        '[storyblok] success:',
        path,
        '- stories:',
        data?.stories?.length ?? 'n/a'
      );
      return { data, total: Number(res.headers.get('total') ?? 0) };
    },
  };
}
