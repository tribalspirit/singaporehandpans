import { describe, expect, test } from 'vitest';
import { buildArticleSchema, buildStoriesBreadcrumb } from './articleSchema';
import type { Article } from '../types/stories';

const SITE = 'https://singaporehandpans.com';
const CANONICAL = `${SITE}/stories/workshop-recap/`;

const article: Article = {
  slug: 'workshop-recap',
  title: 'Workshop Recap',
  excerpt: 'A lovely day.',
  coverSrc: 'https://a.storyblok.com/f/1/pic.jpg',
  coverAlt: 'cover',
  date: '2026-05-20',
  publishedAt: '2026-06-01T00:00:00.000Z',
  tags: ['workshop', 'community'],
  body: [],
  seoDescription: 'SEO description',
};

describe('buildArticleSchema', () => {
  test('produces a valid BlogPosting with required keys', () => {
    const schema = buildArticleSchema(article, CANONICAL, SITE);
    expect(schema['@type']).toBe('BlogPosting');
    expect(schema.headline).toBe('Workshop Recap');
    expect(schema.description).toBe('SEO description');
    expect(schema.image).toBe('https://a.storyblok.com/f/1/pic.jpg');
    expect(schema.datePublished).toBe('2026-05-20');
    expect(schema.dateModified).toBe('2026-06-01T00:00:00.000Z');
    expect(schema.keywords).toBe('workshop, community');
    expect(schema.mainEntityOfPage).toEqual({
      '@type': 'WebPage',
      '@id': CANONICAL,
    });
  });

  test('falls back to excerpt then title for description; omits empty image/keywords', () => {
    const bare: Article = {
      ...article,
      seoDescription: undefined,
      coverSrc: '',
      tags: [],
    };
    const schema = buildArticleSchema(bare, CANONICAL, SITE);
    expect(schema.description).toBe('A lovely day.');
    expect(schema.image).toBeUndefined();
    expect(schema.keywords).toBeUndefined();
  });
});

describe('buildStoriesBreadcrumb', () => {
  test('emits Home > Stories > title with correct positions', () => {
    const crumb = buildStoriesBreadcrumb(article, SITE) as {
      itemListElement: { position: number; name: string; item: string }[];
    };
    expect(crumb.itemListElement.map((i) => i.name)).toEqual([
      'Home',
      'Stories',
      'Workshop Recap',
    ]);
    expect(crumb.itemListElement[2].item).toBe(CANONICAL);
  });
});
