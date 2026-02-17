# 1. Requirements

## 1.1 Scope

Implement a **Shop** section for the site, integrated with an existing (future) Shopify store via **Shopify Storefront GraphQL API**.

## 1.2 Functional requirements

### Navigation

- Add a **Shop** link to the **main menu**.
- The link is visible only when the feature toggle is enabled.

### Catalog listing

- Display ~50–100 products from Shopify (handpans + accessories).
- Each product card shows:
  - Product image (thumbnail)
  - Product name
  - Short description (teaser/truncated)
  - Price (formatted currency)
  - Category (derived from Shopify `productType`)
  - **Buy** button linking to the product page on Shopify (no in-site cart)

### Search & filter

- Search input: keyword match (title + description; optionally tags).
- Filters (dropdowns):
  - Category: All + unique categories from products (`productType`)
  - Price range: All + preset buckets (example below)
  - Availability: All / In Stock / Out of Stock
- Filtering updates dynamically without page reload.

### Buy flow

- No cart/checkout on the site.
- Clicking **Buy** navigates to `https://<store>.myshopify.com/products/<handle>`.

### Feature toggle

- Entire Shop section must be controlled by env var:
  - Example: `NEXT_PUBLIC_ENABLE_SHOP=false` (disabled by default)
- When disabled:
  - No Shop link in main menu
  - Direct access to `/shop` results in redirect to 404 (or equivalent)

## 1.3 Non-functional requirements

- Minimalistic UI consistent with existing site styling.
- Responsive (mobile-first).
- Accessible (labels/aria for controls, alt text for images, keyboard-friendly).
- Keep implementation lightweight (no heavy libraries for filtering).

## 1.4 Assumptions

- Shopify store will use standard `myshopify.com` domain.
- Product categories are mapped using Shopify `productType`.
- Availability uses Shopify `availableForSale`.
- Price uses `priceRange.minVariantPrice` (with option to show range later).
