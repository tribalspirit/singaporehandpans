# Shop Feature - Shopify Integration

The Shop feature integrates with Shopify Storefront API to display products from a Shopify store.

## Overview

- Displays handpans and accessories from a Shopify store
- Product grid with search and filtering (category, price, availability)
- "Buy" buttons link directly to Shopify product pages
- Feature-toggled: disabled by default

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Enable/disable the shop feature (default: false)
PUBLIC_ENABLE_SHOP=true

# Your Shopify store domain (without https://)
PUBLIC_SHOPIFY_STORE_DOMAIN=your-store-name.myshopify.com

# Shopify Storefront API access token
PUBLIC_SHOPIFY_STOREFRONT_TOKEN=your_storefront_access_token_here
```

### Feature Toggle

When `PUBLIC_ENABLE_SHOP=false` (default):

- Shop link is hidden from navigation
- Accessing `/shop` redirects to 404

When `PUBLIC_ENABLE_SHOP=true`:

- Shop link appears in the main navigation
- Shop page displays products from Shopify

## Shopify Setup

### 1. Create a Shopify Store

1. Sign up for Shopify and create a store
2. Note your store domain: `your-store-name.myshopify.com`

### 2. Add Products

In Shopify Admin:

1. Go to **Products > Add product**
2. Fill in title, description, images, pricing (SGD)
3. Set **Product type** for categorization (e.g., "Handpans", "Accessories")
4. Add **Tags** for improved search (optional)
5. Ensure product status is Active

### 3. Enable Storefront API

1. In Shopify Admin, go to **Apps**
2. Install the **Headless** sales channel
3. Create a storefront (e.g., "Website Storefront")
4. Copy the generated **Storefront API access token**

Required permissions:

- Products (read)
- Product images (read)

### 4. Configure the Site

1. Add environment variables (see Configuration above)
2. Set `PUBLIC_ENABLE_SHOP=true`
3. Rebuild and deploy

## Usage

### Search

Type in the search box to filter products by:

- Title
- Description
- Tags

### Filters

- **Category**: Filter by product type (e.g., Handpans, Accessories)
- **Price**: Filter by price range (Under S$500, S$500-S$1,500, Above S$1,500)
- **Availability**: Filter by stock status (In Stock, Out of Stock)

### Buy Flow

Clicking "Buy" on a product opens the Shopify product page in a new tab. All checkout and payment is handled by Shopify.

## Technical Details

### Architecture

```
src/
├── lib/
│   └── shopifyClient.ts    # Shopify API client
├── components/
│   ├── ShopProductList.tsx # React island with filters
│   ├── ShopProductList.module.scss
│   ├── ProductCard.tsx     # Product card component
│   └── ProductCard.module.scss
└── pages/
    └── shop.astro          # Shop page route
```

### Data Flow

1. Products are fetched from Shopify at build time
2. Product data is passed to the React island
3. Filtering happens client-side (no additional API calls)

### API Version

Uses Shopify Storefront API version `2024-01`.

## Troubleshooting

### Products not loading

1. Check that environment variables are set correctly
2. Verify your Storefront API token has correct permissions
3. Check browser console for error messages

### Shop link not appearing

Ensure `PUBLIC_ENABLE_SHOP=true` is set and the site has been rebuilt.

### Images not displaying

1. Verify products have at least one image in Shopify
2. Check that image URLs are accessible

### Prices showing incorrectly

Products use `priceRange.minVariantPrice`. For products with multiple variants, the lowest price is displayed.
