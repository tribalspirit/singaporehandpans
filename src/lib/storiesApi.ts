import { normalizeTags } from '../utils/tags';
import { extractDimensions, isVideoAsset } from './galleryApi';
import type { GalleryMediaItem, StoryblokAsset } from '../types/gallery';
import type {
  Article,
  ArticleSummary,
  StoryArticleStory,
} from '../types/stories';

// Storyblok's CDN caps a single page at 100 stories.
const STORYBLOK_MAX_PER_PAGE = 100;

/** Minimal shape of the Storyblok list client used for pagination. */
export interface StoryblokListClient {
  get(
    path: string,
    params: Record<string, unknown>
  ): Promise<{ data: { stories?: unknown[] }; total: number }>;
}

/**
 * Fetch every matching story across all pages, so lists never silently truncate
 * once more than 100 stories exist. The total-count header drives how many pages
 * to request; sorting/filtering params are applied consistently to every page.
 */
export async function fetchAllStories<T = StoryArticleStory>(
  client: StoryblokListClient,
  params: Record<string, unknown>
): Promise<T[]> {
  const first = await client.get('cdn/stories', {
    ...params,
    per_page: STORYBLOK_MAX_PER_PAGE,
    page: 1,
  });
  const collected = [...((first.data.stories as T[] | undefined) ?? [])];
  const total = first.total || collected.length;
  const pageCount = Math.ceil(total / STORYBLOK_MAX_PER_PAGE);

  for (let page = 2; page <= pageCount; page += 1) {
    const res = await client.get('cdn/stories', {
      ...params,
      per_page: STORYBLOK_MAX_PER_PAGE,
      page,
    });
    collected.push(...((res.data.stories as T[] | undefined) ?? []));
  }

  return collected;
}

/** Convert a Storyblok multiasset (images) into lightbox-ready media items. */
export function multiassetToMediaItems(
  assets: StoryblokAsset[] | undefined
): GalleryMediaItem[] {
  if (!Array.isArray(assets)) return [];
  return assets
    .filter((asset) => asset?.filename && !isVideoAsset(asset.filename))
    .map((asset, index) => {
      const { width, height } = extractDimensions(asset);
      return {
        id: asset.id ? String(asset.id) : `${asset.filename}-${index}`,
        title: asset.title || asset.name || '',
        src: asset.filename,
        width,
        height,
        alt: asset.alt || asset.title || asset.name || '',
        mediaType: 'image' as const,
        tags: [],
      };
    });
}

function resolveCoverAlt(story: StoryArticleStory): string {
  return story.content.cover_image?.alt || story.content.title;
}

/** Transform a story_article story into a full Article (detail page). */
export function transformArticle(story: StoryArticleStory): Article {
  const content = story.content;
  return {
    slug: story.slug,
    title: content.title,
    excerpt: content.excerpt,
    coverSrc: content.cover_image?.filename || '',
    coverAlt: resolveCoverAlt(story),
    date: content.date,
    publishedAt: story.published_at || story.first_published_at || content.date,
    tags: normalizeTags(content.tags),
    body: Array.isArray(content.body) ? content.body : [],
    seoTitle: content.seo_title,
    seoDescription: content.seo_description,
  };
}

/** Transform a story_article story into a lightweight summary (index cards). */
export function transformArticleSummary(
  story: StoryArticleStory
): ArticleSummary {
  const content = story.content;
  return {
    slug: story.slug,
    title: content.title,
    excerpt: content.excerpt,
    coverSrc: content.cover_image?.filename || '',
    coverAlt: resolveCoverAlt(story),
    date: content.date,
    tags: normalizeTags(content.tags),
  };
}
