import { describe, expect, test } from 'vitest';
import {
  buildCollectionProductMap,
  parsePrice,
  transformCollection,
  transformProduct,
  type CollectionStory,
  type ProductStory,
} from './shopClient';

function makeProductStory(
  overrides: Partial<ProductStory['content']> = {},
  story: Partial<Omit<ProductStory, 'content'>> = {}
): ProductStory {
  return {
    uuid: 'uuid-1',
    name: 'Fallback Name',
    slug: 'mag-d-kurd-9',
    full_slug: 'shop/products/mag-d-kurd-9',
    content: {
      component: 'product',
      name: 'MAG D Kurd 9',
      price_sgd: 2400,
      description: 'Ember steel, 9 notes.',
      images: [
        { filename: 'https://a.storyblok.com/f/1/main.jpg', alt: 'Front' },
        { filename: 'https://a.storyblok.com/f/1/side.jpg', alt: null },
      ],
      brand: 'mag',
      product_type: 'Handpan',
      in_stock: true,
      featured: true,
      ...overrides,
    },
    ...story,
  };
}

describe('parsePrice', () => {
  test('passes through finite numbers', () => {
    expect(parsePrice(2400)).toBe(2400);
    expect(parsePrice(2400.5)).toBe(2400.5);
  });

  test('parses numeric strings', () => {
    expect(parsePrice('2400')).toBe(2400);
    expect(parsePrice('2400.50')).toBe(2400.5);
  });

  test('returns 0 for missing or invalid values', () => {
    expect(parsePrice(undefined)).toBe(0);
    expect(parsePrice('not-a-price')).toBe(0);
    expect(parsePrice(NaN)).toBe(0);
  });
});

describe('transformProduct', () => {
  test('maps a full story to the ShopProduct shape', () => {
    const product = transformProduct(makeProductStory());

    expect(product).toMatchObject({
      id: 'uuid-1',
      title: 'MAG D Kurd 9',
      handle: 'mag-d-kurd-9',
      productType: 'Handpan',
      description: 'Ember steel, 9 notes.',
      availableForSale: true,
      priceMin: { amount: 2400, currencyCode: 'SGD' },
      brand: 'mag',
      featured: true,
      tags: ['featured'],
      shopUrl: '/shop/product/mag-d-kurd-9/',
    });
    expect(product.image).toEqual({
      url: 'https://a.storyblok.com/f/1/main.jpg',
      altText: 'Front',
    });
    expect(product.images).toHaveLength(2);
    expect(product.images?.[1].altText).toBe('MAG D Kurd 9');
  });

  test('applies defaults for missing optional fields', () => {
    const product = transformProduct(
      makeProductStory({
        name: undefined,
        description: undefined,
        images: undefined,
        brand: undefined,
        product_type: undefined,
        in_stock: undefined,
        featured: undefined,
        price_sgd: undefined,
      })
    );

    expect(product.title).toBe('Fallback Name');
    expect(product.description).toBe('');
    expect(product.image).toBeUndefined();
    expect(product.images).toEqual([]);
    expect(product.brand).toBe('');
    expect(product.productType).toBe('Uncategorized');
    // in_stock unset is treated as available; editors uncheck to mark sold out
    expect(product.availableForSale).toBe(true);
    expect(product.featured).toBe(false);
    expect(product.tags).toEqual([]);
    expect(product.priceMin.amount).toBe(0);
  });

  test('marks products with in_stock=false as unavailable', () => {
    const product = transformProduct(makeProductStory({ in_stock: false }));
    expect(product.availableForSale).toBe(false);
  });

  test('skips images without a filename', () => {
    const product = transformProduct(
      makeProductStory({
        images: [
          { filename: '', alt: 'broken' },
          { filename: 'https://a.storyblok.com/f/1/ok.jpg', alt: 'OK' },
        ],
      })
    );
    expect(product.images).toHaveLength(1);
    expect(product.image?.url).toBe('https://a.storyblok.com/f/1/ok.jpg');
  });
});

describe('transformCollection', () => {
  const story: CollectionStory = {
    uuid: 'col-1',
    name: 'MAG folder name',
    slug: 'mag',
    full_slug: 'shop/collections/mag',
    content: {
      component: 'shop_collection',
      title: 'MAG',
      description: 'Handpans from MAG.',
      image: { filename: 'https://a.storyblok.com/f/1/mag.png', alt: 'MAG' },
    },
  };

  test('maps a collection story with product count', () => {
    expect(transformCollection(story, 4)).toEqual({
      id: 'col-1',
      title: 'MAG',
      handle: 'mag',
      description: 'Handpans from MAG.',
      image: { url: 'https://a.storyblok.com/f/1/mag.png', altText: 'MAG' },
      imageIsAutoCover: false,
      productCount: 4,
    });
  });

  test('treats an unmarked image as editor-supplied so it is fitted, not cropped', () => {
    expect(transformCollection(story, 4).imageIsAutoCover).toBe(false);
  });

  test('flags a cover the migration picked so the card can crop it to fill', () => {
    const auto = {
      ...story,
      content: {
        ...story.content,
        image: {
          filename: 'https://a.storyblok.com/f/1/product.jpg',
          alt: 'MAG',
          title: 'auto: collection cover',
        },
      },
    } as CollectionStory;
    expect(transformCollection(auto, 4).imageIsAutoCover).toBe(true);
  });

  test('reports no auto cover when the collection has no image at all', () => {
    const bare = {
      ...story,
      content: { component: 'shop_collection', title: 'MAG' },
    } as CollectionStory;
    const collection = transformCollection(bare, 0);
    expect(collection.image).toBeUndefined();
    expect(collection.imageIsAutoCover).toBe(false);
  });

  test('falls back to the story name and empty description', () => {
    const bare = {
      ...story,
      content: { component: 'shop_collection' },
    } as CollectionStory;
    const collection = transformCollection(bare, 0);
    expect(collection.title).toBe('MAG folder name');
    expect(collection.description).toBe('');
    expect(collection.image).toBeUndefined();
  });
});

describe('buildCollectionProductMap', () => {
  test('groups product ids by brand and skips brandless products', () => {
    const products = [
      transformProduct(makeProductStory({}, { uuid: 'p1' })),
      transformProduct(
        makeProductStory({ brand: 'sew' }, { uuid: 'p2', slug: 'sew-case' })
      ),
      transformProduct(makeProductStory({}, { uuid: 'p3', slug: 'mag-2' })),
      transformProduct(
        makeProductStory({ brand: undefined }, { uuid: 'p4', slug: 'other' })
      ),
    ];

    expect(buildCollectionProductMap(products)).toEqual({
      mag: ['p1', 'p3'],
      sew: ['p2'],
    });
  });
});
