import type { Article } from '../types/stories';

const ORG_NAME = 'Singapore Handpan Studio';

export type JsonLd = Record<string, unknown>;

/** Resolve an asset src to an absolute URL (Storyblok assets are already absolute). */
function toAbsolute(src: string, siteUrl: string): string {
  if (!src) return '';
  if (src.startsWith('http')) return src;
  return `${siteUrl}${src.startsWith('/') ? '' : '/'}${src}`;
}

/** BlogPosting structured data for a Stories article. */
export function buildArticleSchema(
  article: Article,
  canonicalUrl: string,
  siteUrl: string
): JsonLd {
  const image = toAbsolute(article.coverSrc, siteUrl);
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.seoDescription || article.excerpt || article.title,
    ...(image && { image }),
    ...(article.date && { datePublished: article.date }),
    ...(article.publishedAt && { dateModified: article.publishedAt }),
    author: { '@type': 'Organization', name: ORG_NAME },
    publisher: {
      '@type': 'Organization',
      name: ORG_NAME,
      logo: { '@type': 'ImageObject', url: `${siteUrl}/images/logo.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
    ...(article.tags.length > 0 && { keywords: article.tags.join(', ') }),
  };
}

/** Home › Stories › {title} breadcrumb structured data. */
export function buildStoriesBreadcrumb(
  article: Article,
  siteUrl: string
): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Stories',
        item: `${siteUrl}/stories/`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: article.title,
        item: `${siteUrl}/stories/${article.slug}/`,
      },
    ],
  };
}
