# 5. Shopify Setup Guide (from scratch)

This guide is written for a store that does **not exist yet**.

## 5.1 Create a Shopify store

1. Sign up for Shopify and create a store.
2. Note your store domain:
   - `your-store-name.myshopify.com`

## 5.2 Add products (handpans + accessories)

In Shopify Admin:

1. Go to **Products → Add product**
2. Fill:
   - Title
   - Description (keep first sentences short; will be used for card teaser)
   - Images (upload at least 1; first image used as thumbnail)
   - Pricing (SGD)
   - Inventory (track stock if you want availability filter accurate)
3. Ensure **Product status** is Active and available to Online Store.

### Categories

Use Shopify **Product type** as the category.
Examples:

- `Handpans`
- `Accessories`

Keep names consistent (same capitalization/spelling), because the site builds the category dropdown from these values.

### Tags (optional but recommended)

Add useful keywords as **Tags**:

- scale/tuning, material, size, “beginner”, “case”, etc.
  These can improve site search matching.

## 5.3 Enable Storefront API & generate token

Recommended modern approach:

1. In Shopify Admin: **Apps**
2. Install/open Shopify **Headless** sales channel (or “Headless” app).
3. Create a storefront (e.g., “Website Storefront”).
4. Copy the generated **Storefront API access token**.

### Permissions

Enable read permissions for:

- Products
- Product images
- (Optional) Tags and collections, if you use them

## 5.4 Connect the site

Put values into site env:

- `PUBLIC_SHOPIFY_STORE_DOMAIN`
- `PUBLIC_SHOPIFY_STOREFRONT_TOKEN`

Enable shop:

- `NEXT_PUBLIC_ENABLE_SHOP=true`

Restart dev server, then validate `/shop` loads products.

## 5.5 Validate Buy links

Product page URL format:
`https://your-store-name.myshopify.com/products/<product-handle>`

Confirm:

- Buy button routes to correct Shopify product page
- Out-of-stock products show as sold out in Shopify and are filterable in the site
