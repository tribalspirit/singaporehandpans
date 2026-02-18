// Reusable Storyblok asset shape
export interface StoryblokAsset {
  id?: number;
  filename: string;
  alt?: string;
  name?: string;
  title?: string;
  meta_data?: {
    width?: number;
    height?: number;
  };
}

// --- CMS story shapes (raw from Storyblok) ---

export interface GalleryAlbumContent {
  component: 'gallery_album';
  title: string;
  description?: string;
  cover_image?: StoryblokAsset;
  tags?: string | string[];
  date?: string;
  featured?: boolean;
  sort_order?: number;
  seo_title?: string;
  seo_description?: string;
}

export interface GalleryAlbumStory {
  id: string;
  uuid: string;
  name: string;
  slug: string;
  full_slug: string;
  content: GalleryAlbumContent;
}

export interface GalleryMediaContent {
  component: 'gallery_media';
  title: string;
  media?: StoryblokAsset;
  media_type?: 'image' | 'video';
  description?: string;
  tags?: string | string[];
  alt_text?: string;
  photographer?: string;
  date_taken?: string;
  sort_order?: number;
  video_poster?: StoryblokAsset;
  video_duration?: string;
}

export interface GalleryMediaStory {
  id: string;
  uuid: string;
  name: string;
  slug: string;
  full_slug: string;
  content: GalleryMediaContent;
}

// Legacy gallery_item (backward compat)
export interface GalleryItemContent {
  component: 'gallery_item';
  title: string;
  media?: StoryblokAsset;
  description?: string;
  tags?: string | string[];
  alt_text?: string;
  photographer?: string;
  featured?: boolean;
  sort_order?: number;
}

export interface GalleryItemStory {
  id: string;
  uuid: string;
  name: string;
  slug: string;
  content: GalleryItemContent;
}

// --- Transformed types for components ---

export interface GalleryAlbum {
  slug: string;
  title: string;
  description?: string;
  coverSrc: string;
  tags: string[];
  date?: string;
  itemCount: number;
  featured: boolean;
  sortOrder: number;
}

export interface GalleryMediaItem {
  id: string;
  title: string;
  src: string;
  width: number;
  height: number;
  alt: string;
  description?: string;
  mediaType: 'image' | 'video';
  posterSrc?: string;
  videoDuration?: string;
  photographer?: string;
  tags: string[];
}

// --- YARL lightbox slide types ---

export interface ImageSlide {
  type: 'image';
  src: string;
  alt: string;
  title?: string;
  description?: string;
  width: number;
  height: number;
}

export interface VideoSlide {
  type: 'video';
  poster?: string;
  width: number;
  height: number;
  title?: string;
  description?: string;
  sources: { src: string; type: string }[];
}

export type LightboxSlide = ImageSlide | VideoSlide;
