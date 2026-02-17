# 2. Architecture

## 2.1 Suggested file structure

```text
src/
├─ pages/
│   └─ shop.astro
├─ components/
│   ├─ ShopProductList.tsx
│   ├─ ProductCard.tsx
│   └─ ...
├─ styles/
│   ├─ ShopProductList.module.scss
│   └─ ...
├─ lib/
│   └─ shopifyClient.ts
└─ docs/
    └─ features/SHOP.md (optional)
```

## 2.2 Responsibilities

### `pages/shop.astro`

- Route for `/shop`.
- Gate via feature toggle.
- Server-side fetch products via Storefront API (build-time or SSR depending on site setup).
- Pass products to React island for client-side filtering.

### `lib/shopifyClient.ts`

- Encapsulate Storefront GraphQL API calls:
  - Endpoint construction (domain + API version)
  - Auth headers with Storefront token
  - GraphQL query strings
  - Response validation + error handling
- Export `fetchAllProducts()` that returns normalized product model.

### `components/ShopProductList.tsx`

- React “island” rendering:
  - Search input
  - 3 dropdown filters
  - Product grid
  - Empty state messages
- Client-side filtering for ~50–100 products.

### `components/ProductCard.tsx`

- Stateless presentational component:
  - Thumbnail
  - Title
  - Short description
  - Price
  - Category badge (optional)
  - Availability badge (optional)
  - “Buy” link to Shopify product URL

## 2.3 Data strategy

- Fetch the catalog once (server-side), then filter in-memory on the client.
- Reasoning: 50–100 items is small enough to avoid repeated API calls and keep UX snappy.

## 2.4 Feature toggle enforcement

- Header: hide Shop menu item unless enabled.
- Shop page: if disabled, redirect to `/404` or show not-found response.
