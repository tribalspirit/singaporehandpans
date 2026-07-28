import { describe, expect, test } from 'vitest';
import {
  multiassetToMediaItems,
  transformArticle,
  transformArticleSummary,
} from './storiesApi';
import type { StoryArticleStory } from '../types/stories';
import type { StoryblokAsset } from '../types/gallery';

const asset = (over: Partial<StoryblokAsset> = {}): StoryblokAsset => ({
  id: 1,
  filename: 'https://a.storyblok.com/f/1/pic.jpg',
  alt: 'a picture',
  meta_data: { width: 1200, height: 800 },
  ...over,
});

const story = (
  over: Partial<StoryArticleStory['content']> = {},
  top: Partial<StoryArticleStory> = {}
): StoryArticleStory => ({
  id: 10,
  uuid: 'uuid-10',
  name: 'Workshop Recap',
  slug: 'workshop-recap',
  full_slug: 'stories/workshop-recap',
  published_at: '2026-06-01T00:00:00.000Z',
  content: {
    component: 'story_article',
    title: 'Workshop Recap',
    excerpt: 'A lovely day.',
    cover_image: asset(),
    date: '2026-05-20',
    tags: 'workshop, community',
    body: [{ _uid: 'b1', component: 'story_text' }],
    seo_title: 'Workshop Recap SEO',
    seo_description: 'SEO desc',
    ...over,
  },
  ...top,
});

describe('transformArticle', () => {
  test('maps fields, normalizes tags and resolves publishedAt', () => {
    const article = transformArticle(story());
    expect(article.slug).toBe('workshop-recap');
    expect(article.title).toBe('Workshop Recap');
    expect(article.coverSrc).toBe('https://a.storyblok.com/f/1/pic.jpg');
    expect(article.coverAlt).toBe('a picture');
    expect(article.tags).toEqual(['workshop', 'community']);
    expect(article.publishedAt).toBe('2026-06-01T00:00:00.000Z');
    expect(article.body).toHaveLength(1);
  });

  test('falls back to date for publishedAt and title for coverAlt', () => {
    const article = transformArticle(
      story(
        { cover_image: asset({ alt: undefined, title: undefined }) },
        { published_at: undefined, first_published_at: undefined }
      )
    );
    expect(article.publishedAt).toBe('2026-05-20');
    expect(article.coverAlt).toBe('Workshop Recap');
  });

  test('handles a missing body gracefully', () => {
    const article = transformArticle(story({ body: undefined }));
    expect(article.body).toEqual([]);
  });
});

describe('transformArticleSummary', () => {
  test('produces a lightweight summary', () => {
    const summary = transformArticleSummary(story());
    expect(summary).toEqual({
      slug: 'workshop-recap',
      title: 'Workshop Recap',
      excerpt: 'A lovely day.',
      coverSrc: 'https://a.storyblok.com/f/1/pic.jpg',
      coverAlt: 'a picture',
      date: '2026-05-20',
      tags: ['workshop', 'community'],
    });
  });
});

describe('multiassetToMediaItems', () => {
  test('maps image assets with dimensions and skips videos', () => {
    const items = multiassetToMediaItems([
      asset({ id: 2, filename: 'https://a.storyblok.com/f/2/a.jpg' }),
      asset({ id: 3, filename: 'https://a.storyblok.com/f/3/clip.mp4' }),
    ]);
    expect(items).toHaveLength(1);
    expect(items[0].src).toBe('https://a.storyblok.com/f/2/a.jpg');
    expect(items[0].width).toBe(1200);
    expect(items[0].height).toBe(800);
    expect(items[0].mediaType).toBe('image');
  });

  test('returns empty array for undefined', () => {
    expect(multiassetToMediaItems(undefined)).toEqual([]);
  });
});
