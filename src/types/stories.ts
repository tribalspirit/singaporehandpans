import type { StoryblokAsset, GalleryMediaItem } from './gallery';

// Loose rich-text document shape. @storyblok/js validates/normalises at render
// time, so we only need enough structure to guard against empty/invalid input.
export interface RichTextDocument {
  type: string;
  content?: unknown[];
  [key: string]: unknown;
}

// --- Body bloks (flexible content) ---

export interface StoryTextBlok {
  _uid: string;
  component: 'story_text';
  content?: RichTextDocument;
}

export interface StoryImageBlok {
  _uid: string;
  component: 'story_image';
  image?: StoryblokAsset;
  caption?: string;
  alt_text?: string;
}

export interface StoryGalleryBlok {
  _uid: string;
  component: 'story_gallery';
  title?: string;
  images?: StoryblokAsset[];
}

export interface StoryYouTubeBlok {
  _uid: string;
  component: 'story_youtube';
  url?: string;
  title?: string;
  caption?: string;
}

export type StoryBodyBlok =
  StoryTextBlok | StoryImageBlok | StoryGalleryBlok | StoryYouTubeBlok;

// --- Article content (raw from Storyblok) ---

export interface StoryArticleContent {
  component: 'story_article';
  title: string;
  excerpt?: string;
  cover_image?: StoryblokAsset;
  date?: string;
  tags?: string | string[];
  body?: StoryBodyBlok[];
  seo_title?: string;
  seo_description?: string;
}

export interface StoryArticleStory {
  id: number | string;
  uuid: string;
  name: string;
  slug: string;
  full_slug: string;
  created_at?: string;
  published_at?: string;
  first_published_at?: string;
  content: StoryArticleContent;
}

// --- Transformed types for components ---

export interface Article {
  slug: string;
  title: string;
  excerpt?: string;
  coverSrc: string;
  coverAlt: string;
  date?: string;
  publishedAt?: string;
  tags: string[];
  body: StoryBodyBlok[];
  seoTitle?: string;
  seoDescription?: string;
}

export interface ArticleSummary {
  slug: string;
  title: string;
  excerpt?: string;
  coverSrc: string;
  coverAlt: string;
  date?: string;
  tags: string[];
}

// Re-export for convenience so gallery bloks can build lightbox slides.
export type { GalleryMediaItem };
