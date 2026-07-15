# Shop Feature — Storyblok Catalog + HitPay Checkout

The shop is a custom storefront: the product catalog lives in Storyblok CMS
and payments run through HitPay's hosted checkout (PayNow QR + cards). It
replaced the earlier Shopify Storefront integration to cut fees (no monthly
subscription, PayNow at 0.65% + S$0.30 vs ~3.2% + S$0.50 card-only) and to
add native PayNow support.

## Overview

- Products and collections are Storyblok stories, editable without deploys
- Product grid with search and filtering (brand, category, price, availability)
- Product detail pages at `/shop/product/{slug}/` with a "Buy now" form
- Checkout redirects to HitPay's hosted payment page; no card data on-site
- Payment confirmation arrives via an HMAC-signed webhook that emails the
  shop owner (Resend); orders are not stored in a database — the inbox and
  the HitPay dashboard are the record
- Feature-toggled: disabled by default

## Architecture

```text
Storyblok (shop/products/, shop/collections/)
        │ CDN API (src/lib/shopClient.ts)
        ▼
SSR pages: /shop/, /shop/[collection]/, /shop/product/[slug]/
        │ POST (slug + buyer email, honeypot, origin check)
        ▼
/api/shop/checkout  ── validates price/stock server-side from Storyblok
        │ creates payment request (src/lib/hitpay.ts)
        ▼
HitPay hosted checkout (PayNow QR / cards)
        │ redirect                      │ webhook (HMAC verified)
        ▼                               ▼
/shop/thank-you/            /api/shop/hitpay-webhook
                                        │ status=completed
                                        ▼
                            owner email via Resend (src/lib/orderEmail.ts)
```

Key files:

| File                                        | Role                                               |
| ------------------------------------------- | -------------------------------------------------- |
| `src/lib/shopClient.ts`                     | Storyblok-backed catalog fetchers + transforms     |
| `src/lib/hitpay.ts`                         | Payment request creation, webhook signature verify |
| `src/lib/orderEmail.ts`                     | Owner notification via Resend REST API             |
| `src/pages/shop/product/[slug].astro`       | Product page with Buy form                         |
| `src/pages/api/shop/checkout.ts`            | Creates the HitPay payment, redirects              |
| `src/pages/api/shop/hitpay-webhook.ts`      | Confirms payment, sends email                      |
| `src/pages/shop/thank-you.astro`            | Post-payment status page (no-store)                |
| `storyblok/components/product.json`         | Product content-type schema                        |
| `storyblok/components/shop_collection.json` | Collection content-type schema                     |

## Configuration

### Environment Variables

```bash
# Enable/disable the shop feature (default: false)
PUBLIC_ENABLE_SHOP=true

# Storyblok (already required by the rest of the site)
STORYBLOK_TOKEN=your_storyblok_preview_token

# HitPay — server-side secrets (Cloudflare Pages secrets in production)
# Sandbox: https://api.sandbox.hit-pay.com | Production: https://api.hit-pay.com
HITPAY_API_URL=https://api.sandbox.hit-pay.com
HITPAY_API_KEY=your_hitpay_api_key
HITPAY_SALT=your_hitpay_webhook_salt

# Order notifications via Resend
RESEND_API_KEY=your_resend_api_key
SHOP_EMAIL_FROM=shop@singaporehandpans.com   # domain must be verified in Resend
SHOP_ORDER_EMAIL=owner-inbox@example.com     # where new-order emails go
```

Secrets are read from `Astro.locals.runtime.env` at request time on
Cloudflare; never give them a `PUBLIC_` prefix.

### Feature Toggle

When `PUBLIC_ENABLE_SHOP=false` (default): the shop link is hidden from
navigation, `/shop`, product pages, thank-you and the checkout API return
404/redirects.

## Storyblok Setup

1. Create the content types (uses `storyblok/components/*.json`):

   ```bash
   npm run storyblok:components product
   npm run storyblok:components shop_collection
   ```

2. Create folders `shop/collections/` and `shop/products/` in Storyblok.
3. Add one `shop_collection` story per brand under `shop/collections/`.
   The story slug is the collection URL (`/shop/{slug}/`) and must match the
   `brand` option values on products (`mag`, `battiloro`, `sirvan`, `sew`).
   To add a brand, extend the `brand` options in
   `storyblok/components/product.json` and re-run the component script.
4. Add `product` stories under `shop/products/`: name, price (SGD), images
   (first image is the card cover), brand, product type, in-stock flag, and
   optional featured flag (surfaces the product on the homepage rail).

## HitPay Setup

1. Register a HitPay business account (requires UEN) and a sandbox account
   at <https://dashboard.sandbox.hit-pay.com> for testing.
2. In the dashboard, create an API key (Settings → Payment Gateway → API
   Keys); note the **API key** and the **salt** (used to sign webhooks).
3. Set the env vars above. Point `HITPAY_API_URL` at sandbox until go-live.
4. The webhook URL is passed per payment request
   (`/api/shop/hitpay-webhook`) — no dashboard webhook config is needed for
   the checkout flow.

## Security Notes

- The checkout endpoint re-fetches price and stock from published Storyblok
  content; client-submitted values are never trusted.
- Webhooks are rejected unless the HMAC-SHA256 signature (HitPay salt)
  verifies; verification happens before any side effect.
- The Buy form carries a honeypot field and the endpoint enforces a
  same-origin check and input length caps.
- Add a Cloudflare WAF rate-limiting rule for `/api/shop/*` in the
  dashboard (no KV/state needed in the app).

## Testing

- Unit tests: `src/lib/shopClient.test.ts`, `src/lib/hitpay.test.ts`,
  `src/lib/orderEmail.test.ts` (`npm test`).
- Sandbox end-to-end: run with sandbox keys, buy a test product, pay with
  the simulated PayNow flow, and confirm the webhook fires and the owner
  email arrives before switching `HITPAY_API_URL` to production.
