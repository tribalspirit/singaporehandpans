import type { APIRoute } from 'astro';
import { getStoryblokClient } from '../lib/storyblok';
import { fetchAllStories } from '../lib/storiesApi';
import { fetchAllCollections, isShopEnabled } from '../lib/shopClient';
import type { StoryArticleStory } from '../types/stories';

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
  { path: '/stories/', changefreq: 'weekly', priority: 0.8 },
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
  const runtime = locals.runtime;
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

  // Dynamic story article pages from Storyblok (paginated so >100 don't drop)
  try {
    const storyblokApi = getStoryblokClient(token);
    const stories = await fetchAllStories<StoryArticleStory>(storyblokApi, {
      starts_with: 'stories/',
      content_type: 'story_article',
      version: storyblokVersion,
    });

    for (const story of stories) {
      if (story.slug) {
        entries.push(
          urlEntry(`${SITE}/stories/${story.slug}/`, 'monthly', 0.6)
        );
      }
    }
  } catch (err) {
    console.error('[sitemap] Failed to fetch stories:', err);
  }

  // Dynamic shop collection + product pages from Storyblok
  if (isShopEnabled()) {
    try {
      const { collections, allProducts } = await fetchAllCollections(token);
      for (const col of collections) {
        entries.push(urlEntry(`${SITE}/shop/${col.handle}/`, 'weekly', 0.7));
      }
      for (const product of allProducts) {
        entries.push(urlEntry(`${SITE}${product.shopUrl}`, 'weekly', 0.6));
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
