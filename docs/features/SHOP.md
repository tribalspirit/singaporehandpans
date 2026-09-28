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
- Two ways to pay, depending on configuration (see **Payment options**)
- Card checkout redirects to HitPay's hosted page; no card data on-site
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

| File                                        | Role                                                |
| ------------------------------------------- | --------------------------------------------------- |
| `src/lib/shopClient.ts`                     | Storyblok-backed catalog fetchers + transforms      |
| `src/lib/hitpay.ts`                         | Payment request creation, webhook signature verify  |
| `src/lib/orderEmail.ts`                     | Owner and buyer notifications via Resend REST API   |
| `src/lib/paynow.ts`                         | EMVCo PayNow QR payload, and the PayNow config gate |
| `src/lib/qrSvg.ts`                          | Server-rendered QR as inline SVG                    |
| `src/lib/cardSurcharge.ts`                  | Card surcharge arithmetic, in integer cents         |
| `src/pages/api/shop/paynow.ts`              | Raises a PayNow order and notifies both sides       |
| `src/pages/shop/paynow.astro`               | PayNow QR and payment instructions                  |
| `src/pages/shop/product/[slug].astro`       | Product page with Buy form                          |
| `src/pages/api/shop/checkout.ts`            | Creates the HitPay payment, redirects               |
| `src/pages/api/shop/hitpay-webhook.ts`      | Confirms payment, sends email                       |
| `src/pages/shop/thank-you.astro`            | Post-payment status page (no-store)                 |
| `storyblok/components/product.json`         | Product content-type schema                         |
| `storyblok/components/shop_collection.json` | Collection content-type schema                      |

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

## Payment options

Which options appear depends on whether direct PayNow is configured
(`PAYNOW_PROXY_*` plus the Resend variables — see `.dev.vars.example`).

**PayNow not configured** — the original behaviour. One "Buy now" button posts
to `/api/shop/checkout`, which creates a HitPay payment request offering both
PayNow and card. The buyer pays the list price; the studio absorbs HitPay's fee.

**PayNow configured** — the product page shows two submit buttons on one form,
each with its own `formaction`, so no JavaScript and no duplicated fields:

| Option | Endpoint             | Buyer pays           | Costs the studio |
| ------ | -------------------- | -------------------- | ---------------- |
| PayNow | `/api/shop/paynow`   | list price           | nothing          |
| Card   | `/api/shop/checkout` | list + 2.8% + S$0.50 | 2.8% + S$0.50    |

The HitPay request is then restricted to `payment_methods: ['card']`. Without
that, a buyer quoted the card surcharge could pick PayNow on HitPay's own page
and be overcharged for a method that costs the studio 0.65%.

### Why the surcharge only appears alongside PayNow

Surcharging is only defensible when the buyer had a free alternative. With no
direct PayNow, suppressing HitPay's PayNow to make the surcharge honest would
remove the cheapest method the studio has, so the surcharge is simply not
applied. Both behaviours live in one conditional in `checkout.ts`.

The percentage is **grossed up**, not simply added: HitPay charges its fee on
the amount presented to it, so `base + base * rate + flat` leaves the studio
short — charge S$3,906.90 and HitPay takes S$109.89, netting S$3,797.01 against
a S$3,800 list price. Solving `total - (total * rate + flat) = base` gives
S$3,909.98, on which the studio nets exactly S$3,800. A test asserts that round
trip rather than trusting the formula.

The rate is HitPay's published online **domestic** card rate. An
internationally issued card costs 3.65% + S$0.50, so the studio absorbs roughly
0.85% on those; the shop sells domestically and the issuing country is unknown
at the time the price is quoted. The figures live in `src/lib/cardSurcharge.ts`
and the buyer-facing wording is derived from them, so prose cannot drift from
the arithmetic.

Card surcharging is legal in Singapore but is commonly prohibited by card
network and acquirer merchant terms. Presenting the same difference as a PayNow
discount off a card-inclusive list price carries the same economics without
that exposure.

### Direct PayNow flow

```text
/api/shop/paynow  ── re-reads price and stock from Storyblok
        │ mints SHP-XXXXXXXXXX, emails owner (critical) and buyer (best effort)
        ▼
/shop/paynow/?slug=…&reference=…&t=<signature>
        │ rebuilds the amount from the CMS, never from the URL
        ▼
EMVCo PayNow QR (src/lib/paynow.ts) rendered as inline SVG (src/lib/qrSvg.ts)
```

There is no webhook on a bank transfer, so nothing confirms payment. The owner
reconciles against their bank by hand; the owner's email states in capitals
that the money is unconfirmed. This is why `getPayNowConfig` refuses to return
a configuration unless order email is also configured — an order nobody is told
about would exist nowhere at all.

The page is bound to a real order by a signed, expiring token
(`src/lib/orderToken.ts`) that only the POST can mint. Without it the URL is
just query parameters: anyone could construct a payable QR for any product
under a reference the owner was never told about, and a buyer who edited the
slug after ordering would see a QR for a different instrument than their
reference was raised against. The amount is signed too, so a price change
between ordering and paying fails closed instead of quietly showing a different
sum than the buyer was emailed. Key material is derived from `HITPAY_SALT` with
domain separation, so a page token cannot be confused with a webhook signature
and no extra secret is needed.

The QR locks the amount and is marked single-use, and the reference is
restricted to characters a bank reference field preserves intact.

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
