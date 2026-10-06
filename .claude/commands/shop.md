---
name: shop
description: Shop section with two selectable backends — Storyblok catalog + HitPay checkout, or the legacy Shopify Storefront API. Covers the selector, catalog migration, filtering, and implementation patterns.
---

# Shop Feature

The shop has **two implementations behind one contract**. `PUBLIC_SHOP_IMPL`
picks which one a given deploy uses, so production and preview can run
different backends from the same codebase.

| `PUBLIC_SHOP_IMPL` | Catalog                     | Checkout                      |
| ------------------ | --------------------------- | ----------------------------- |
| `hitpay`           | Storyblok stories           | On-site → HitPay hosted page  |
| `shopify` (default)| Shopify Storefront API      | Links out to the Shopify store|

`PUBLIC_ENABLE_SHOP` remains the master on/off switch for the whole section.

**Never import a concrete client.** Pages and islands import from the facade
`src/lib/shop.ts`, which dispatches to the active implementation. Both clients
return the same `ShopProduct` / `ShopCollection` shapes (`src/lib/shopTypes.ts`).

## Environment Variables

```bash
PUBLIC_ENABLE_SHOP=true        # master switch (default: false)
PUBLIC_SHOP_IMPL=hitpay        # 'hitpay' | 'shopify' (default: shopify)

# --- hitpay implementation ---
STORYBLOK_TOKEN=...            # catalog lives in Storyblok
HITPAY_API_URL=https://api.sandbox.hit-pay.com   # or https://api.hit-pay.com
HITPAY_API_KEY=...             # server-side secret, never PUBLIC_
HITPAY_SALT=...                # verifies the webhook HMAC
RESEND_API_KEY=...             # order notification email
SHOP_EMAIL_FROM=shop@singaporehandpans.com
SHOP_ORDER_EMAIL=singaporehandpanstudio@gmail.com

# --- shopify implementation ---
PUBLIC_SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
PUBLIC_SHOPIFY_STOREFRONT_TOKEN=...
```

HitPay values are **server-side secrets** — set them as encrypted Cloudflare
Pages secrets, never with a `PUBLIC_` prefix. To obtain them, see
[docs/features/HITPAY-CREDENTIALS.md](../../docs/features/HITPAY-CREDENTIALS.md),
which is written to be handed to the product owner.

## Feature Toggle Behaviour

**`PUBLIC_ENABLE_SHOP=false`**: shop link hidden from navigation, `/shop`
returns 404, homepage product rail does not render.

**`PUBLIC_ENABLE_SHOP=true`**: shop link appears, `/shop` lists the catalog.

## Architecture

```
src/
├── lib/
│   ├── shop.ts             # facade — selects backend, the only thing pages import
│   ├── shopTypes.ts        # shared ShopProduct / ShopCollection contract
│   ├── shopClient.ts       # hitpay impl: Storyblok catalog fetchers
│   ├── shopifyClient.ts    # shopify impl: Storefront API
│   ├── hitpay.ts           # payment request creation + webhook HMAC verify
│   └── orderEmail.ts       # order notification via Resend
├── components/
│   ├── ShopProductList.tsx # React island: search + filters + grid
│   ├── ProductCard.tsx     # stateless card
│   └── home/FeaturedProducts.astro
└── pages/
    ├── shop/index.astro           # catalog
    ├── shop/[collection].astro    # per-collection listing
    ├── shop/product/[slug].astro  # detail page (hitpay only)
    ├── shop/thank-you.astro       # post-payment (no-store)
    └── api/shop/
        ├── checkout.ts            # validates price/stock server-side, redirects to HitPay
        └── hitpay-webhook.ts      # verifies HMAC, then notifies the owner
```

Shop pages are **SSR at request time** — do not add `prerender = true`, or the
catalog goes stale between deploys.

## Storyblok Catalog Model (hitpay)

Products are `product` stories under `shop/products/`; collections are
`shop_collection` stories under `shop/collections/`.

**A product's `brand` field must exactly equal a collection story slug** —
that is the only thing joining a product to its collection
(`buildCollectionProductMap` in `shopClient.ts`). Collections with zero
products are filtered out of the listing.

Brand slugs: `mag`, `battiloro`, `sew`, `sirvan`, `sg-pan`, `rav`, `hardcase`,
`studio`. Product types: `Handpan`, `Tongue Drum`, `Case`, `Stand`,
`Accessory`. Both are `option` fields in
[storyblok/components/product.json](../../storyblok/components/product.json) —
adding a brand means adding the option **and** creating the matching
collection story.

The schema carries **one price per story and no variant field**. Products that
vary by colour/size are stored as one story per variant, so each has its own
price and `in_stock` flag, and HitPay checkout stays single-item.

### Catalog Migration

`npm run shop:migrate` copies the Shopify catalog into Storyblok
([scripts/migrate-shop-catalog.js](../../scripts/migrate-shop-catalog.js)).
It derives brand from the product **title** (Shopify's `vendor` is mostly the
reseller, not the maker), splits colour variants, uploads images into Storyblok
assets, and upserts stories by `full_slug` so re-runs update rather than
duplicate.

```bash
npm run shop:migrate -- --dry-run --verbose   # report only, no writes
npm run shop:migrate                          # perform the migration
```

Push the component schemas to the space before the first run, or the fields
will not be editable in the CMS.

## Product Model

```ts
type ShopProduct = {
  id: string;
  title: string;
  handle: string;
  productType: string;
  description: string;
  availableForSale: boolean;
  priceMin: { amount: number; currencyCode: string };
  priceMax?: { amount: number; currencyCode: string };
  image?: { url: string; altText?: string };
  images?: { url: string; altText?: string }[];
  tags: string[];
  brand: string;
  featured: boolean;
  seoDescription?: string;
  shopUrl: string; // hitpay: /shop/product/<slug>/ · shopify: absolute external URL
};
```

`shopUrl` is **relative for hitpay and absolute for shopify** — use
`toAbsoluteShopUrl()` from the facade when building canonical or structured-data
URLs, or you will produce `https://site.comhttps://store...`.

## Client-Side Filtering

Filtering happens in the island with no extra API calls.

- `searchTerm` — title OR description contains the term (case-insensitive)
- `categoryFilter` — must match `productType`
- `availabilityFilter` — `availableForSale`
- `priceFilter` — buckets: All · Under S$500 · S$500–S$1,500 · Above S$1,500,
  compared against `priceMin.amount`

**Out of stock**: Buy control disabled + "Sold out" badge.

## Checkout Flow (hitpay)

1. Buy form POSTs to `/api/shop/checkout` (honeypot + origin check + input caps).
2. The endpoint re-reads price and stock **from published CMS content** — it
   never trusts the posted price — then creates a HitPay payment request.
3. Buyer is redirected to HitPay's hosted page (PayNow QR + cards). Card
   details never touch this site.
4. HitPay calls `/api/shop/hitpay-webhook`; the HMAC-SHA256 signature is
   verified against `HITPAY_SALT` **before any side effect**, then the owner is
   emailed.
5. Buyer lands on `/shop/thank-you/` (sent `no-store`).

The webhook is deliberately **not** gated on the feature flags — the signature
check is its authentication, and in-flight orders must still settle if the shop
is toggled off.

## Troubleshooting

**Products not loading** — confirm `PUBLIC_SHOP_IMPL` matches the backend you
expect; check `STORYBLOK_TOKEN` (hitpay) or the Storefront token (shopify).

**A collection is missing** — a collection with zero matching products is
filtered out. Check that products carry a `brand` exactly equal to the
collection slug.

**Shop link not appearing** — `PUBLIC_ENABLE_SHOP=true`, then rebuild;
`PUBLIC_*` vars are inlined at build time, so changing them needs a redeploy.

**Checkout redirects to `?checkout=error`** — the server logged the reason.
Most often `HITPAY_API_URL`/`HITPAY_API_KEY`/`HITPAY_SALT` are unset.

**Webhook returns 400** — signature mismatch, usually the wrong salt, or the
sandbox salt against production (the two accounts are fully separate).

## Related Skills

- `/setup` — environment variable configuration
- `/deploy` — deployment after enabling the shop
- `/storyblok` — CMS content workflows

## Source Documentation

- `docs/features/SHOP.md`
- `docs/features/HITPAY-CREDENTIALS.md`
- `.specify/shop-spec-kit-md/`
