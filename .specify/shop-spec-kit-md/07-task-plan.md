# 7. Task Plan (GitHub Spec Kit style)

> IDs are examples; adapt to your repo conventions.

## T001 – Add env var scaffolding

- Add `.env.example` entries:
  - `PUBLIC_SHOPIFY_STORE_DOMAIN`
  - `PUBLIC_SHOPIFY_STOREFRONT_TOKEN`
  - `NEXT_PUBLIC_ENABLE_SHOP`

## T002 – Implement Shopify client

- Create `src/lib/shopifyClient.ts`
- Implement:
  - Endpoint builder
  - GraphQL query for products
  - `fetchAllProducts()` returning normalized `ShopProduct[]`
- Include robust error handling

## T003 – Create `/shop` page route

- Add `src/pages/shop.astro`
- Guard with feature toggle:
  - Disabled => redirect to 404
- Fetch products server-side and pass to React island

## T004 – Add navigation link (feature-toggled)

- Update header/nav component to:
  - Add “Shop” link only if enabled

## T005 – Build React island for product list

- Create `src/components/ShopProductList.tsx`
- Implement:
  - Search input (title/description, optional tags)
  - Dropdown filters (category/price/availability)
  - Client-side filtering and product grid

## T006 – Build ProductCard component

- Create `src/components/ProductCard.tsx`
- Render:
  - image, title, short description, price, category
  - Buy link to Shopify
  - sold-out state

## T007 – Add styling

- Create `src/styles/ShopProductList.module.scss`
- Ensure responsive grid and minimal UI.

## T008 – QA checklist

- Feature toggle off:
  - Shop link hidden
  - /shop redirects to 404
- Feature toggle on:
  - Products load and display correctly
  - Filters work correctly
  - Buy links correct and open Shopify product pages
  - Mobile layout looks good

## T009 – Documentation

- Add `docs/features/SHOP.md` (optional) or keep these docs in repo.
- Include Shopify setup steps + env instructions.
