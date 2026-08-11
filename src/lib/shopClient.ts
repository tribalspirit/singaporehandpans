import { getStoryblokClient } from './storyblok';

/**
 * Storyblok-backed shop catalog client.
 *
 * Replaces the former Shopify Storefront client with the same exported
 * surface (`ShopProduct`, `ShopCollection`, fetchers, `isShopEnabled`) so
 * shop pages and islands consume identical shapes. Products live under
 * `shop/products/` (content type `product`), collections under
 * `shop/collections/` (content type `shop_collection`); a product's `brand`
 * field must match a collection story slug.
 */

import type { ShopProduct, ShopCollection } from './shopTypes';

export type { ShopProduct, ShopCollection } from './shopTypes';

type StoryblokAsset = {
  filename: string;
  alt?: string | null;
  title?: string | null;
};

/**
 * Marker the catalog migration writes into an automatically chosen collection
 * cover's `title` (see scripts/migrate-shop-catalog.js). It distinguishes a
 * product photo the migration picked from an image an editor uploaded.
 */
const AUTO_COVER_MARK = 'auto: collection cover';

export type ProductStory = {
  uuid: string;
  name: string;
  slug: string;
  full_slug: string;
  content: {
    component: string;
    name?: string;
    price_sgd?: number | string;
    description?: string;
    images?: StoryblokAsset[];
    brand?: string;
    product_type?: string;
    in_stock?: boolean;
    featured?: boolean;
    seo_description?: string;
  };
};

export type CollectionStory = {
  uuid: string;
  name: string;
  slug: string;
  full_slug: string;
  content: {
    component: string;
    title?: string;
    description?: string;
    image?: StoryblokAsset | null;
  };
};

const PRODUCTS_PATH = 'shop/products/';
const COLLECTIONS_PATH = 'shop/collections/';
const CURRENCY = 'SGD';

function storyblokVersion(): 'published' | 'draft' {
  return import.meta.env.PROD ? 'published' : 'draft';
}

export function parsePrice(value: number | string | undefined): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function toImage(
  asset: StoryblokAsset | null | undefined,
  fallbackAlt: string
): { url: string; altText?: string } | undefined {
  if (!asset?.filename) return undefined;
  return { url: asset.filename, altText: asset.alt || fallbackAlt };
}

export function transformProduct(story: ProductStory): ShopProduct {
  const content = story.content;
  const title = content.name || story.name;
  const images = (content.images ?? [])
    .map((asset) => toImage(asset, title))
    .filter((img): img is { url: string; altText?: string } => Boolean(img));

  return {
    id: story.uuid,
    title,
    handle: story.slug,
    productType: content.product_type || 'Uncategorized',
    description: content.description || '',
    availableForSale: content.in_stock !== false,
    priceMin: { amount: parsePrice(content.price_sgd), currencyCode: CURRENCY },
    image: images[0],
    images,
    tags: content.featured ? ['featured'] : [],
    brand: content.brand || '',
    featured: content.featured === true,
    seoDescription: content.seo_description || undefined,
    shopUrl: `/shop/product/${story.slug}/`,
  };
}

export function transformCollection(
  story: CollectionStory,
  productCount: number
): ShopCollection {
  return {
    id: story.uuid,
    title: story.content.title || story.name,
    handle: story.slug,
    description: story.content.description || '',
    image: toImage(story.content.image, story.content.title || story.name),
    imageIsAutoCover: story.content.image?.title === AUTO_COVER_MARK,
    productCount,
  };
}

export function buildCollectionProductMap(
  products: ShopProduct[]
): Record<string, string[]> {
  return products.reduce<Record<string, string[]>>((map, product) => {
    if (!product.brand) return map;
    return {
      ...map,
      [product.brand]: [...(map[product.brand] ?? []), product.id],
    };
  }, {});
}

async function fetchProductStories(token: string): Promise<ProductStory[]> {
  const client = getStoryblokClient(token);
  const { data } = await client.get('cdn/stories', {
    version: storyblokVersion(),
    starts_with: PRODUCTS_PATH,
    content_type: 'product',
    per_page: 100,
  });
  return (data?.stories ?? []) as ProductStory[];
}

async function fetchCollectionStories(
  token: string
): Promise<CollectionStory[]> {
  const client = getStoryblokClient(token);
  const { data } = await client.get('cdn/stories', {
    version: storyblokVersion(),
    starts_with: COLLECTIONS_PATH,
    content_type: 'shop_collection',
    per_page: 100,
  });
  return (data?.stories ?? []) as CollectionStory[];
}

export async function fetchAllProducts(
  token: string | undefined
): Promise<ShopProduct[]> {
  if (!token) {
    console.warn('Storyblok token missing. Shop feature disabled.');
    return [];
  }

  try {
    const stories = await fetchProductStories(token);
    return stories.map(transformProduct);
  } catch (error) {
    console.error('Failed to fetch products from Storyblok:', error);
    return [];
  }
}

export async function fetchAllCollections(token: string | undefined): Promise<{
  collections: ShopCollection[];
  allProducts: ShopProduct[];
  collectionProductMap: Record<string, string[]>;
}> {
  const empty = { collections: [], allProducts: [], collectionProductMap: {} };

  if (!token) {
    console.warn('Storyblok token missing. Shop feature disabled.');
    return empty;
  }

  try {
    const [collectionStories, productStories] = await Promise.all([
      fetchCollectionStories(token),
      fetchProductStories(token),
    ]);

    const allProducts = productStories.map(transformProduct);
    const collectionProductMap = buildCollectionProductMap(allProducts);
    const collections = collectionStories
      .map((story) =>
        transformCollection(
          story,
          collectionProductMap[story.slug]?.length ?? 0
        )
      )
      .filter((collection) => collection.productCount > 0);

    return { collections, allProducts, collectionProductMap };
  } catch (error) {
    console.error('Failed to fetch collections from Storyblok:', error);
    return empty;
  }
}

export async function fetchCollectionByHandle(
  token: string | undefined,
  handle: string
): Promise<{ collection: ShopCollection | null; products: ShopProduct[] }> {
  if (!token) {
    console.warn('Storyblok token missing. Shop feature disabled.');
    return { collection: null, products: [] };
  }

  try {
    const client = getStoryblokClient(token);
    const [{ data }, productStories] = await Promise.all([
      client.get(`cdn/stories/${COLLECTIONS_PATH}${handle}`, {
        version: storyblokVersion(),
      }),
      fetchProductStories(token),
    ]);

    const story = data?.story as CollectionStory | undefined;
    if (!story) {
      return { collection: null, products: [] };
    }

    const products = productStories
      .map(transformProduct)
      .filter((product) => product.brand === handle);

    return {
      collection: transformCollection(story, products.length),
      products,
    };
  } catch (error) {
    console.error('Failed to fetch collection from Storyblok:', error);
    return { collection: null, products: [] };
  }
}

export async function fetchProductBySlug(
  token: string | undefined,
  slug: string
): Promise<ShopProduct | null> {
  if (!token) {
    console.warn('Storyblok token missing. Shop feature disabled.');
    return null;
  }

  try {
    const client = getStoryblokClient(token);
    const { data } = await client.get(`cdn/stories/${PRODUCTS_PATH}${slug}`, {
      version: storyblokVersion(),
    });

    const story = data?.story as ProductStory | undefined;
    return story ? transformProduct(story) : null;
  } catch (error) {
    console.error(`Failed to fetch product "${slug}" from Storyblok:`, error);
    return null;
  }
}

export function isShopEnabled(): boolean {
  return import.meta.env.PUBLIC_ENABLE_SHOP === 'true';
}
