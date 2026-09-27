import type { ShopProduct, ShopCollection } from './shopTypes';
import { isExcludedShopifyHandle } from './catalogExclusions';

export type { ShopProduct, ShopCollection } from './shopTypes';

type ShopifyProductNode = {
  id: string;
  title: string;
  handle: string;
  productType: string;
  description: string;
  availableForSale: boolean;
  priceRange: {
    minVariantPrice: { amount: string; currencyCode: string };
    maxVariantPrice: { amount: string; currencyCode: string };
  };
  images: {
    edges: Array<{
      node: { url: string; altText: string | null };
    }>;
  };
  tags: string[];
};

type ShopifyProductsResponse = {
  data?: {
    products: {
      edges: Array<{ node: ShopifyProductNode }>;
    };
  };
  errors?: Array<{ message: string }>;
};

type ShopifyCollectionNode = {
  id: string;
  title: string;
  handle: string;
  description: string;
  image: { url: string; altText: string | null } | null;
  products: {
    edges: Array<{ node: ShopifyProductNode }>;
  };
};

type ShopifyCollectionsResponse = {
  data?: {
    collections: {
      edges: Array<{ node: ShopifyCollectionNode }>;
    };
  };
  errors?: Array<{ message: string }>;
};

type ShopifyCollectionByHandleResponse = {
  data?: {
    collectionByHandle: ShopifyCollectionNode | null;
  };
  errors?: Array<{ message: string }>;
};

const PRODUCTS_QUERY = `
  query GetProducts {
    products(first: 100) {
      edges {
        node {
          id
          title
          handle
          productType
          description
          availableForSale
          priceRange {
            minVariantPrice { amount currencyCode }
            maxVariantPrice { amount currencyCode }
          }
          images(first: 1) {
            edges {
              node { url altText }
            }
          }
          tags
        }
      }
    }
  }
`;

const PRODUCT_FIELDS = `
  id
  title
  handle
  productType
  description
  availableForSale
  priceRange {
    minVariantPrice { amount currencyCode }
    maxVariantPrice { amount currencyCode }
  }
  images(first: 1) {
    edges {
      node { url altText }
    }
  }
  tags
`;

const COLLECTIONS_QUERY = `
  query GetCollections {
    collections(first: 20) {
      edges {
        node {
          id
          title
          handle
          description
          image { url altText }
          products(first: 100) {
            edges {
              node {
                ${PRODUCT_FIELDS}
              }
            }
          }
        }
      }
    }
  }
`;

const COLLECTION_BY_HANDLE_QUERY = `
  query GetCollectionByHandle($handle: String!) {
    collectionByHandle(handle: $handle) {
      id
      title
      handle
      description
      image { url altText }
      products(first: 100) {
        edges {
          node {
            ${PRODUCT_FIELDS}
          }
        }
      }
    }
  }
`;

function getShopifyConfig() {
  const domain = import.meta.env.PUBLIC_SHOPIFY_STORE_DOMAIN;
  const token = import.meta.env.PUBLIC_SHOPIFY_STOREFRONT_TOKEN;

  if (!domain || !token) {
    return null;
  }

  return { domain, token };
}

function buildShopifyUrl(domain: string): string {
  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  return `https://${cleanDomain}/api/2024-01/graphql.json`;
}

function normalizeProduct(
  node: ShopifyProductNode,
  storeDomain: string
): ShopProduct {
  const cleanDomain = storeDomain
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '');
  const firstImage = node.images.edges[0]?.node;

  return {
    id: node.id,
    title: node.title,
    handle: node.handle,
    productType: node.productType || 'Uncategorized',
    description: node.description,
    availableForSale: node.availableForSale,
    priceMin: {
      amount: parseFloat(node.priceRange.minVariantPrice.amount),
      currencyCode: node.priceRange.minVariantPrice.currencyCode,
    },
    priceMax: {
      amount: parseFloat(node.priceRange.maxVariantPrice.amount),
      currencyCode: node.priceRange.maxVariantPrice.currencyCode,
    },
    image: firstImage
      ? { url: firstImage.url, altText: firstImage.altText ?? undefined }
      : undefined,
    tags: node.tags || [],
    shopUrl: `https://${cleanDomain}/products/${node.handle}`,
  };
}

export async function fetchAllProducts(): Promise<ShopProduct[]> {
  const config = getShopifyConfig();

  if (!config) {
    console.warn('Shopify configuration missing. Shop feature disabled.');
    return [];
  }

  const endpoint = buildShopifyUrl(config.domain);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': config.token,
      },
      body: JSON.stringify({ query: PRODUCTS_QUERY }),
    });

    if (!response.ok) {
      console.error(
        `Shopify API error: ${response.status} ${response.statusText}`
      );
      return [];
    }

    const json: ShopifyProductsResponse = await response.json();

    if (json.errors && json.errors.length > 0) {
      console.error('Shopify GraphQL errors:', json.errors);
      return [];
    }

    if (!json.data?.products?.edges) {
      console.warn('No products found in Shopify response.');
      return [];
    }

    return json.data.products.edges
      .filter((edge) => !isExcludedShopifyHandle(edge.node.handle))
      .map((edge) => normalizeProduct(edge.node, config.domain));
  } catch (error) {
    console.error('Failed to fetch products from Shopify:', error);
    return [];
  }
}

/**
 * `productCount` is passed in rather than read off `node.products.edges`, so an
 * excluded product is not counted in a tile that will never display it.
 */
function normalizeCollection(
  node: ShopifyCollectionNode,
  productCount: number
): ShopCollection {
  return {
    id: node.id,
    title: node.title,
    handle: node.handle,
    description: node.description || '',
    image: node.image
      ? { url: node.image.url, altText: node.image.altText ?? undefined }
      : undefined,
    productCount,
  };
}

export async function fetchAllCollections(): Promise<{
  collections: ShopCollection[];
  allProducts: ShopProduct[];
  collectionProductMap: Record<string, string[]>;
}> {
  const config = getShopifyConfig();
  const empty = { collections: [], allProducts: [], collectionProductMap: {} };

  if (!config) {
    console.warn('Shopify configuration missing. Shop feature disabled.');
    return empty;
  }

  const endpoint = buildShopifyUrl(config.domain);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': config.token,
      },
      body: JSON.stringify({ query: COLLECTIONS_QUERY }),
    });

    if (!response.ok) {
      console.error(
        `Shopify API error: ${response.status} ${response.statusText}`
      );
      return empty;
    }

    const json: ShopifyCollectionsResponse = await response.json();

    if (json.errors && json.errors.length > 0) {
      console.error('Shopify GraphQL errors:', json.errors);
      return empty;
    }

    if (!json.data?.collections?.edges) {
      console.warn('No collections found in Shopify response.');
      return empty;
    }

    const collectionProductMap: Record<string, string[]> = {};
    const productMap = new Map<string, ShopProduct>();
    const collections: ShopCollection[] = [];

    for (const edge of json.data.collections.edges) {
      const node = edge.node;
      const productEdges = node.products.edges.filter(
        (productEdge) => !isExcludedShopifyHandle(productEdge.node.handle)
      );
      // A collection left empty by the exclusion is dropped, exactly as one
      // that was empty in Shopify — otherwise the grid shows a dead tile.
      if (productEdges.length === 0) continue;

      collections.push(normalizeCollection(node, productEdges.length));

      const productIds: string[] = [];
      for (const productEdge of productEdges) {
        const product = normalizeProduct(productEdge.node, config.domain);
        productIds.push(product.id);
        if (!productMap.has(product.id)) {
          productMap.set(product.id, product);
        }
      }
      collectionProductMap[node.handle] = productIds;
    }

    return {
      collections,
      allProducts: Array.from(productMap.values()),
      collectionProductMap,
    };
  } catch (error) {
    console.error('Failed to fetch collections from Shopify:', error);
    return empty;
  }
}

export async function fetchCollectionByHandle(
  handle: string
): Promise<{ collection: ShopCollection | null; products: ShopProduct[] }> {
  const config = getShopifyConfig();

  if (!config) {
    console.warn('Shopify configuration missing. Shop feature disabled.');
    return { collection: null, products: [] };
  }

  const endpoint = buildShopifyUrl(config.domain);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': config.token,
      },
      body: JSON.stringify({
        query: COLLECTION_BY_HANDLE_QUERY,
        variables: { handle },
      }),
    });

    if (!response.ok) {
      console.error(
        `Shopify API error: ${response.status} ${response.statusText}`
      );
      return { collection: null, products: [] };
    }

    const json: ShopifyCollectionByHandleResponse = await response.json();

    if (json.errors && json.errors.length > 0) {
      console.error('Shopify GraphQL errors:', json.errors);
      return { collection: null, products: [] };
    }

    const node = json.data?.collectionByHandle;
    if (!node) {
      return { collection: null, products: [] };
    }

    const productEdges = node.products.edges.filter(
      (edge) => !isExcludedShopifyHandle(edge.node.handle)
    );

    return {
      collection: normalizeCollection(node, productEdges.length),
      products: productEdges.map((edge) =>
        normalizeProduct(edge.node, config.domain)
      ),
    };
  } catch (error) {
    console.error('Failed to fetch collection from Shopify:', error);
    return { collection: null, products: [] };
  }
}

export function isShopEnabled(): boolean {
  return import.meta.env.PUBLIC_ENABLE_SHOP === 'true';
}
