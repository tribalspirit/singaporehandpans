import { normalizeTags } from '../utils/tags';
import { extractDimensions, isVideoAsset } from './galleryApi';
import type { GalleryMediaItem, StoryblokAsset } from '../types/gallery';
import type {
  Article,
  ArticleSummary,
  StoryArticleStory,
} from '../types/stories';

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
