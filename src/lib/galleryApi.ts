import { normalizeTags } from '../utils/tags';
import type {
  StoryblokAsset,
  GalleryAlbumStory,
  GalleryMediaStory,
  GalleryItemStory,
  GalleryAlbum,
  GalleryMediaItem,
  LightboxSlide,
} from '../types/gallery';

const VIDEO_EXT_REGEX = /\.(mp4|webm|mov)(\?|$)/i;
const DEFAULT_WIDTH = 800;
const DEFAULT_HEIGHT = 600;

/**
 * Appends Storyblok Image Service transform parameters.
 * @see https://www.storyblok.com/docs/image-service
 */
export function storyblokImageTransform(
  filename: string,
  width: number,
  height?: number,
  quality = 80
): string {
  if (!filename || isVideoAsset(filename)) return filename;
  const dimensions = height ? `${width}x${height}` : `${width}x0`;
  return `${filename}/m/${dimensions}/filters:quality(${quality})`;
}

/** Extract width/height from Storyblok asset meta_data, with fallbacks. */
export function extractDimensions(asset?: StoryblokAsset): {
  width: number;
  height: number;
} {
  const width = asset?.meta_data?.width || DEFAULT_WIDTH;
  const height = asset?.meta_data?.height || DEFAULT_HEIGHT;
  return { width, height };
}

/** Check if a filename points to a video file. */
export function isVideoAsset(filename: string): boolean {
  return VIDEO_EXT_REGEX.test(filename);
}

/** Guess video MIME type from extension. */
function videoMimeType(filename: string): string {
  if (/\.webm(\?|$)/i.test(filename)) return 'video/webm';
  if (/\.mov(\?|$)/i.test(filename)) return 'video/quicktime';
  return 'video/mp4';
}

/** Transform a gallery_album story into a component-ready GalleryAlbum. */
export function transformAlbum(
  story: GalleryAlbumStory,
  itemCount: number,
  fallbackCoverSrc?: string
): GalleryAlbum {
  return {
    slug: story.slug,
    title: story.content.title,
    description: story.content.description,
    coverSrc: story.content.cover_image?.filename || fallbackCoverSrc || '',
    tags: normalizeTags(story.content.tags),
    date: story.content.date,
    itemCount,
    featured: story.content.featured || false,
    sortOrder: story.content.sort_order || 999,
  };
}

/** Transform a gallery_media story into a component-ready GalleryMediaItem. */
export function transformMedia(story: GalleryMediaStory): GalleryMediaItem {
  const filename = story.content.media?.filename || '';
  const { width, height } = extractDimensions(story.content.media);
  const detectedVideo = isVideoAsset(filename);
  const mediaType =
    story.content.media_type || (detectedVideo ? 'video' : 'image');

  return {
    id: story.uuid,
    title: story.content.title,
    src: filename,
    width,
    height,
    alt:
      story.content.alt_text || story.content.media?.alt || story.content.title,
    description: story.content.description,
    mediaType,
    posterSrc: story.content.video_poster?.filename,
    videoDuration: story.content.video_duration,
    photographer: story.content.photographer,
    tags: normalizeTags(story.content.tags),
  };
}

/** Transform a legacy gallery_item story into a GalleryMediaItem. */
export function transformLegacyItem(story: GalleryItemStory): GalleryMediaItem {
  const filename = story.content.media?.filename || '';
  const { width, height } = extractDimensions(story.content.media);
  const detectedVideo = isVideoAsset(filename);

  return {
    id: story.uuid || story.id,
    title: story.content.title,
    src: filename,
    width,
    height,
    alt:
      story.content.alt_text || story.content.media?.alt || story.content.title,
    description: story.content.description,
    mediaType: detectedVideo ? 'video' : 'image',
    photographer: story.content.photographer,
    tags: normalizeTags(story.content.tags),
  };
}

/** Build a YARL-compatible lightbox slide from a GalleryMediaItem. */
export function buildLightboxSlide(item: GalleryMediaItem): LightboxSlide {
  if (item.mediaType === 'video') {
    return {
      type: 'video',
      poster: item.posterSrc || storyblokImageTransform(item.src, 1200),
      width: item.width,
      height: item.height,
      title: item.title,
      description: item.description,
      sources: [{ src: item.src, type: videoMimeType(item.src) }],
    };
  }

  return {
    type: 'image',
    src: item.src,
    alt: item.alt,
    title: item.title,
    description: item.description,
    width: item.width,
    height: item.height,
  };
}
