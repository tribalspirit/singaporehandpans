# 3. Implementation Details

## 3.1 Shopify Storefront API usage

### Endpoint

POST to:
`https://<SHOP_DOMAIN>/api/<API_VERSION>/graphql.json`

Headers:

- `Content-Type: application/json`
- `X-Shopify-Storefront-Access-Token: <TOKEN>`

### GraphQL query (catalog)

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

## 3.2 Normalized product model (recommended)

Normalize API output into a shape that is easy for UI:

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

## 3.3 Client-side filtering logic

Maintain state for:

- `searchTerm`
- `categoryFilter`
- `priceFilter` (bucket)
- `availabilityFilter`

Example price buckets (adjust to match real pricing):

- All
- Under S$500
- S$500–S$1500
- Above S$1500

Filtering steps:

1. Search match (case-insensitive):
   - title includes term OR description includes term (optionally tags)
2. Category match:
   - if category != All, productType must match
3. Availability:
   - In Stock => availableForSale true
   - Out of Stock => availableForSale false
4. Price bucket:
   - Use `priceMin.amount` for comparisons

## 3.4 Buy link behavior

- Use `<a>` styled as button.
- URL is `shopUrl`.
- Recommend:
  - `target="_blank"` so user keeps the site open
  - `rel="noopener noreferrer"` for safety

Out-of-stock behavior (choose one):

- Disable “Buy” button + show “Sold out” badge
- OR keep “View” link to Shopify product page

## 3.5 Rendering notes

- Use `loading="lazy"` for images.
- Truncate descriptions on the card (e.g., 100–160 chars).
- Provide empty-state message:
  - “No products found. Try adjusting filters.”

## 3.6 Error handling

- If Shopify fetch fails:
  - Log details server-side
  - Render a friendly UI message:
    - “Shop is temporarily unavailable.”
