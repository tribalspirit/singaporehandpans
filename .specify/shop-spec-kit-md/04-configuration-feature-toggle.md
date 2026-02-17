# 4. Configuration & Feature Toggle

## 4.1 Environment variables

Add to `.env` / deployment environment:

```bash
PUBLIC_SHOPIFY_STORE_DOMAIN="your-store-name.myshopify.com"
PUBLIC_SHOPIFY_STOREFRONT_TOKEN="your-storefront-access-token"
NEXT_PUBLIC_ENABLE_SHOP="false"
```

Notes:

- Domain should be **without** `https://` and **without** trailing slash.
- Token is a Storefront API access token.
- Feature toggle is **off** by default.

## 4.2 Navigation gating

In the header component, only show Shop item when enabled.

Pseudo-logic:

- Read `enableShop = import.meta.env.NEXT_PUBLIC_ENABLE_SHOP === 'true'`
- Conditionally include nav link.

## 4.3 Route gating

In `shop.astro`:

- If disabled:
  - Redirect to `/404` (or return not-found)
- If enabled:
  - Render Shop page + product list

## 4.4 Deployment

- Configure env vars in your hosting provider.
- Changing the flag requires rebuild/redeploy (Astro env is typically build-time).
- Recommend using a staging environment to test before enabling in prod.
