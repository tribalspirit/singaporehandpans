import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import exclusions from './catalogExclusions.json';
import {
  EXCLUDED_SHOPIFY_HANDLES,
  isExcludedShopifyHandle,
} from './catalogExclusions';

const EXCLUDED = exclusions.excludedShopifyHandles[0];

describe('the shared exclusion list', () => {
  test('is non-empty, so the guard is actually doing something', () => {
    expect(EXCLUDED_SHOPIFY_HANDLES.size).toBeGreaterThan(0);
  });

  test('matches an excluded handle and nothing else', () => {
    expect(isExcludedShopifyHandle(EXCLUDED)).toBe(true);
    expect(isExcludedShopifyHandle('handpan-d-kurd-10-notes')).toBe(false);
  });

  test('carries no customer name — the point is to keep names out', () => {
    // Entries are Shopify handles. A handle is lowercase, hyphenated and
    // derived from the ORIGINAL product, so it never carries the name the
    // invoice was retitled with. Anything else means a name was pasted in.
    for (const handle of EXCLUDED_SHOPIFY_HANDLES) {
      expect(handle).toMatch(/^[a-z0-9-]+$/);
    }
  });
});

/**
 * The Shopify backend is what production serves, so the filter has to hold
 * there — excluding a product from the Storyblok migration alone would leave
 * it on the live site.
 */
describe('shopifyClient applies the exclusion', () => {
  function productNode(handle: string, id: string) {
    return {
      node: {
        id,
        handle,
        title: handle,
        description: '',
        descriptionHtml: '',
        productType: 'Handpan',
        vendor: 'v',
        tags: [],
        availableForSale: true,
        priceRange: {
          minVariantPrice: { amount: '1', currencyCode: 'SGD' },
          maxVariantPrice: { amount: '1', currencyCode: 'SGD' },
        },
        images: { edges: [] },
        variants: { edges: [] },
      },
    };
  }

  function mockGraphQL(data: unknown) {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json: async () => ({ data }) }))
    );
  }

  beforeEach(() => {
    vi.stubEnv('PUBLIC_SHOPIFY_STORE_DOMAIN', 'example.myshopify.com');
    vi.stubEnv('PUBLIC_SHOPIFY_STOREFRONT_TOKEN', 'token');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  test('fetchAllProducts drops the excluded product', async () => {
    mockGraphQL({
      products: {
        edges: [
          productNode(EXCLUDED, 'gid/1'),
          productNode('keep-me', 'gid/2'),
        ],
      },
    });
    const { fetchAllProducts } = await import('./shopifyClient');
    const products = await fetchAllProducts();
    expect(products.map((p) => p.handle)).toEqual(['keep-me']);
  });

  test('fetchAllCollections drops it and does not count it', async () => {
    mockGraphQL({
      collections: {
        edges: [
          {
            node: {
              id: 'c1',
              title: 'Bags',
              handle: 'bags',
              description: '',
              image: null,
              products: {
                edges: [
                  productNode(EXCLUDED, 'gid/1'),
                  productNode('keep-me', 'gid/2'),
                ],
              },
            },
          },
        ],
      },
    });
    const { fetchAllCollections } = await import('./shopifyClient');
    const { collections, allProducts, collectionProductMap } =
      await fetchAllCollections();

    expect(allProducts.map((p) => p.handle)).toEqual(['keep-me']);
    // A stale count would advertise a product the grid never renders.
    expect(collections[0]?.productCount).toBe(1);
    // A dangling id here would point at a product that is not in allProducts.
    expect(collectionProductMap.bags).toEqual(['gid/2']);
  });

  test('a collection left empty by the exclusion is dropped entirely', async () => {
    mockGraphQL({
      collections: {
        edges: [
          {
            node: {
              id: 'c1',
              title: 'Invoices',
              handle: 'invoices',
              description: '',
              image: null,
              products: { edges: [productNode(EXCLUDED, 'gid/1')] },
            },
          },
        ],
      },
    });
    const { fetchAllCollections } = await import('./shopifyClient');
    const { collections, allProducts } = await fetchAllCollections();
    expect(collections).toEqual([]);
    expect(allProducts).toEqual([]);
  });
});
