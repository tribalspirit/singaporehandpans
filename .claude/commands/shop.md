---
name: shop
description: Shopify Storefront API integration for product catalog. Covers architecture, feature toggle, filtering, and implementation patterns.
---

# Shop Feature - Shopify Integration

Product catalog integration with Shopify Storefront API. Feature-toggled, disabled by default.

## Overview

- Displays handpans and accessories from Shopify store
- Product grid with search and filtering
- "Buy" buttons link to Shopify product pages (no in-site checkout)
- Feature toggle controls visibility

## Environment Variables

```bash
# Enable/disable shop (default: false)
PUBLIC_ENABLE_SHOP=true

# Shopify store domain (without https://)
PUBLIC_SHOPIFY_STORE_DOMAIN=your-store-name.myshopify.com

# Shopify Storefront API token
PUBLIC_SHOPIFY_STOREFRONT_TOKEN=your_storefront_access_token
```

## Feature Toggle Behavior

**When `PUBLIC_ENABLE_SHOP=false`**:

- Shop link hidden from navigation
- `/shop` redirects to 404

**When `PUBLIC_ENABLE_SHOP=true`**:

- Shop link appears in navigation
- Shop page displays products

## Architecture

```
src/
├── lib/
│   └── shopifyClient.ts      # Shopify API client
├── components/
│   ├── ShopProductList.tsx   # React island with filters
│   ├── ShopProductList.module.scss
│   ├── ProductCard.tsx       # Product card component
│   └── ProductCard.module.scss
└── pages/
    └── shop.astro            # Shop page route
```

### Component Responsibilities

| Component             | Purpose                                           |
| --------------------- | ------------------------------------------------- |
| `shop.astro`          | Route, feature gate, server-side product fetch    |
| `shopifyClient.ts`    | API calls, auth headers, response normalization   |
| `ShopProductList.tsx` | React island: search, filters, grid, empty states |
| `ProductCard.tsx`     | Stateless: thumbnail, title, price, Buy link      |

### Data Flow

1. Products fetched from Shopify at **build time**
2. Product data passed to React island
3. Filtering happens **client-side** (no additional API calls)
4. ~50-100 products kept in memory

## Shopify API

### Endpoint

```
POST https://<SHOP_DOMAIN>/api/2024-01/graphql.json
```

### Headers

```
Content-Type: application/json
X-Shopify-Storefront-Access-Token: <TOKEN>
```

### GraphQL Query

```graphql
query GetProducts {
  products(first: 100) {
    edges {
      node {
        title
        handle
        productType
        description
        availableForSale
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
          maxVariantPrice {
            amount
            currencyCode
          }
        }
        images(first: 1) {
          edges {
            node {
              url
              altText
            }
          }
        }
        tags
      }
    }
  }
}
```

## Product Model

```ts
type ShopProduct = {
  title: string;
  handle: string;
  productType: string; // category
  description: string;
  availableForSale: boolean;
  priceMin: { amount: number; currencyCode: string };
  priceMax?: { amount: number; currencyCode: string };
  image?: { url: string; altText?: string };
  tags?: string[];
  shopUrl: string; // https://<domain>/products/<handle>
};
```

## Client-Side Filtering

### State Variables

- `searchTerm` - Text search
- `categoryFilter` - Product type dropdown
- `priceFilter` - Price bucket dropdown
- `availabilityFilter` - Stock status dropdown

### Price Buckets

- All
- Under S$500
- S$500–S$1,500
- Above S$1,500

### Filter Logic

1. **Search**: title OR description includes term (case-insensitive)
2. **Category**: productType must match (if not "All")
3. **Availability**: `availableForSale` boolean
4. **Price**: Compare `priceMin.amount` against bucket

## Buy Link Behavior

```tsx
<a href={shopUrl} target="_blank" rel="noopener noreferrer">
  Buy
</a>
```

**Out-of-stock**: Disable button + show "Sold out" badge

## Shopify Setup

1. Create Shopify store, note domain
2. Add products with:
   - Title, description, images
   - **Product type** for categorization
   - **Tags** for search
   - Active status
3. Install **Headless** sales channel
4. Create storefront, copy **Storefront API token**
5. Required permissions: Products (read), Product images (read)

## Troubleshooting

### Products Not Loading

1. Check environment variables
2. Verify Storefront API token permissions
3. Check browser console for errors

### Shop Link Not Appearing

- Ensure `PUBLIC_ENABLE_SHOP=true`
- Rebuild and deploy after changing

### Images Not Displaying

1. Verify products have images in Shopify
2. Check image URLs accessible

### Prices Showing Incorrectly

- Products use `priceRange.minVariantPrice`
- Multi-variant products show lowest price

## Related Skills

- `/setup` - Environment variable configuration
- `/deploy` - Deployment after enabling shop

## Source Documentation

- `docs/features/SHOP.md`
- `.specify/shop-spec-kit-md/`
