export type ShopProduct = {
  id: string;
  title: string;
  handle: string;
  productType: string;
  description: string;
  availableForSale: boolean;
  priceMin: { amount: number; currencyCode: string };
  priceMax?: { amount: number; currencyCode: string };
  image?: { url: string; altText?: string };
  tags: string[];
  shopUrl: string;
};

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

    return json.data.products.edges.map((edge) =>
      normalizeProduct(edge.node, config.domain)
    );
  } catch (error) {
    console.error('Failed to fetch products from Shopify:', error);
    return [];
  }
}

export function isShopEnabled(): boolean {
  return import.meta.env.PUBLIC_ENABLE_SHOP === 'true';
}
