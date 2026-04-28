import type { APIRoute } from 'astro';
import { getStoryblokClient } from '../lib/storyblok';
import { fetchAllCollections, isShopEnabled } from '../lib/shopifyClient';

const SITE = 'https://singaporehandpans.com';

/**
 * Static pages with their change frequency and priority.
 * NOTE: /privacy/ and /terms/ are intentionally excluded — they are
 * marked noindex and should not appear in the sitemap.
 */
const STATIC_PAGES: { path: string; changefreq: string; priority: number }[] = [
  { path: '/', changefreq: 'weekly', priority: 1.0 },
  { path: '/about/', changefreq: 'monthly', priority: 0.8 },
  { path: '/events/', changefreq: 'weekly', priority: 0.9 },
  { path: '/academy/', changefreq: 'monthly', priority: 0.8 },
  { path: '/academy/memorization/', changefreq: 'monthly', priority: 0.7 },
  { path: '/gallery/', changefreq: 'weekly', priority: 0.8 },
  { path: '/shop/', changefreq: 'weekly', priority: 0.9 },
  { path: '/contacts/', changefreq: 'monthly', priority: 0.7 },
];

function urlEntry(loc: string, changefreq: string, priority: number): string {
  return `  <url>
    <loc>${loc}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority.toFixed(1)}</priority>
  </url>`;
}

export const GET: APIRoute = async ({ locals }) => {
  const runtime = (locals as any).runtime;
  const token =
    runtime?.env?.STORYBLOK_TOKEN ?? import.meta.env.STORYBLOK_TOKEN;
  const storyblokVersion = import.meta.env.PROD ? 'published' : 'draft';

  const entries: string[] = [];

  // Static pages
  for (const page of STATIC_PAGES) {
    entries.push(
      urlEntry(`${SITE}${page.path}`, page.changefreq, page.priority)
    );
  }

  // Dynamic event pages from Storyblok
  try {
    const storyblokApi = getStoryblokClient(token);
    const { data } = await storyblokApi.get('cdn/stories', {
      starts_with: 'events/',
      content_type: 'event',
      version: storyblokVersion,
      per_page: 100,
    });

    const events = data?.stories || [];
    for (const event of events) {
      entries.push(urlEntry(`${SITE}/events/${event.slug}/`, 'weekly', 0.7));
    }
  } catch (err) {
    console.error('[sitemap] Failed to fetch events:', err);
  }

  // Dynamic gallery album pages from Storyblok
  try {
    const storyblokApi = getStoryblokClient(token);
    const { data } = await storyblokApi.get('cdn/stories', {
      starts_with: 'gallery/albums/',
      content_type: 'gallery_album',
      version: storyblokVersion,
      per_page: 100,
    });

    const albums = data?.stories || [];
    for (const album of albums) {
      // Album slug is the folder name, extract from full_slug
      // e.g. "gallery/albums/workshop-moments/workshop-moments" → "workshop-moments"
      const parts = album.full_slug.split('/');
      const albumSlug = parts[2]; // gallery/albums/{slug}/...
      if (albumSlug) {
        entries.push(
          urlEntry(`${SITE}/gallery/albums/${albumSlug}/`, 'monthly', 0.5)
        );
      }
    }
  } catch (err) {
    console.error('[sitemap] Failed to fetch gallery albums:', err);
  }

  // Dynamic shop collection pages from Shopify
  if (isShopEnabled()) {
    try {
      const { collections } = await fetchAllCollections();
      for (const col of collections) {
        entries.push(urlEntry(`${SITE}/shop/${col.handle}/`, 'weekly', 0.7));
      }
    } catch (err) {
      console.error('[sitemap] Failed to fetch shop collections:', err);
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      // s-maxage lets the edge middleware cache the sitemap for 1 hour so
      // Googlebot doesn't trigger live Storyblok + Shopify fetches on every
      // crawl. stale-while-revalidate keeps the contract correct downstream.
      'Cache-Control':
        'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
};
