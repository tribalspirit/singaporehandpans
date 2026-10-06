# Cloudflare Pages Deployment

Guide for deploying Singapore Handpan Studio to Cloudflare Pages.

## Prerequisites

- GitHub account
- Cloudflare account (free tier works)
- Code pushed to GitHub repository

## Automatic Deployment Setup

### 1. Connect to Cloudflare Pages

1. Log into [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages**
3. Click **Create Application** → **Pages**
4. Click **Connect to Git**
5. Authorize Cloudflare to access your GitHub account
6. Select your repository

### 2. Configure Build Settings

**Framework preset**: Astro

**Build settings**:

```
Build command: npm run build
Build output directory: dist
Root directory: (leave empty)
```

**Environment variables**:

```
NODE_ENV=production
PUBLIC_SITE_URL=https://your-site.pages.dev
STORYBLOK_TOKEN=your_preview_token_here
```

### 3. Deploy

1. Click **Save and Deploy**
2. Wait for build to complete (2-3 minutes)
3. Site will be available at `https://your-site.pages.dev`

## Custom Domain

### Add Custom Domain

1. In Cloudflare Pages → Your project
2. Go to **Custom domains** tab
3. Click **Set up a custom domain**
4. Enter your domain (e.g., `singaporehandpans.com`)
5. Follow DNS configuration instructions

### DNS Configuration

If domain is on Cloudflare:

- Automatically configured ✅

If domain is elsewhere:

1. Add CNAME record:
   ```
   Name: @ (or www)
   Value: your-site.pages.dev
   ```
2. Wait for DNS propagation (5-30 minutes)

## Environment Variables

### Production Variables

Add in Cloudflare Pages → Settings → Environment Variables:

```
# Required
STORYBLOK_TOKEN=your_published_token_here
NODE_ENV=production
PUBLIC_SITE_URL=https://your-domain.com

# Optional
PUBLIC_CALENDLY_EVENT_URL=https://calendly.com/...
PUBLIC_CALENDLY_PRIVATE_URL=https://calendly.com/...
```

**Important**: Use **Published** token for production, not Preview token!

### Preview Variables

For preview branches:

1. Same as production
2. Use Preview token instead
3. Different PUBLIC_SITE_URL if needed

### Shop Variables (HitPay)

Two kinds of variable, set in two different places. Getting this wrong is the
usual cause of `?checkout=error`.

| Kind                | Where it is set                          | How code reads it                   | Goes in             |
| ------------------- | ---------------------------------------- | ----------------------------------- | ------------------- |
| Build-time / public | Pages → Settings → Environment variables | `import.meta.env`, inlined at build | `.env` locally      |
| Runtime secret      | `wrangler pages secret put` (encrypted)  | `Astro.locals.runtime.env`          | `.dev.vars` locally |

Payment credentials are always the second kind. A `PUBLIC_` prefix on any of
them would ship the value to the browser, and putting them in `.env` lets Vite
inline them into the build output.

#### Runtime secrets

All three are required together — `getHitPayConfig()` returns `null` if any one
is missing, and checkout then redirects to `?checkout=error`.

```bash
# Production
wrangler pages secret put HITPAY_API_URL --project-name=singaporehandpans
wrangler pages secret put HITPAY_API_KEY --project-name=singaporehandpans
wrangler pages secret put HITPAY_SALT    --project-name=singaporehandpans

# Preview (all non-production branches) — a separate set of bindings,
# so all three must be set again here, not just the ones that differ
wrangler pages secret put HITPAY_API_URL --project-name=singaporehandpans --env=preview
wrangler pages secret put HITPAY_API_KEY --project-name=singaporehandpans --env=preview
wrangler pages secret put HITPAY_SALT    --project-name=singaporehandpans --env=preview
```

Verify each environment separately — `--env=preview` is not implied:

```bash
wrangler pages secret list --project-name=singaporehandpans
wrangler pages secret list --project-name=singaporehandpans --env=preview
```

Secrets apply to the **next** deployment; setting one does not redeploy.

`HITPAY_API_URL` is `https://api.hit-pay.com` (live) or
`https://api.sandbox.hit-pay.com` (sandbox). Sandbox is a separate HitPay
account with its own key and salt; the two sets are not interchangeable.

> **Both environments currently hold the live key.** A checkout run from a
> preview deploy or from localhost therefore creates a real, payable payment
> request, and HitPay emails a real receipt to whatever address is entered
> (`send_email: true` in `buildPaymentRequestBody`). Cancel test requests in the
> HitPay dashboard afterwards. Swap in sandbox credentials if that is not what
> you want.

#### Build-time variables

Set these in the dashboard, per environment:

| Variable             | Production | Preview  |
| -------------------- | ---------- | -------- |
| `PUBLIC_ENABLE_SHOP` | `true`     | `true`   |
| `PUBLIC_SHOP_IMPL`   | `shopify`  | `hitpay` |

`PUBLIC_SHOP_IMPL` is what selects the backend, and it is read at build time —
changing it needs a redeploy, not just a save. Production stays on `shopify`
until a HitPay order has been tested end to end on preview.

#### Order notifications — not yet configured

`RESEND_API_KEY`, `SHOP_EMAIL_FROM` and `SHOP_ORDER_EMAIL` are unset in both
environments. Until all three exist:

- a paid HitPay order is verified and acknowledged by the webhook but **nobody
  is emailed**, and orders are not persisted, so the HitPay dashboard is the
  only record; and
- **direct PayNow stays switched off**, because a bank transfer has no webhook
  and the owner's inbox would be the only record that the order exists at all.

`SHOP_EMAIL_FROM` must be on a domain verified in Resend. These are runtime
secrets — set them the same way as the HitPay values above.

#### Direct PayNow (optional)

Lets a buyer pay by bank transfer straight to the studio's own PayNow, which
costs nothing, rather than through HitPay at 0.65% + S$0.30. Requires the three
Resend values above **and** all three of:

| Variable               | Value                                                      |
| ---------------------- | ---------------------------------------------------------- |
| `PAYNOW_PROXY_TYPE`    | `uen` or `mobile`                                          |
| `PAYNOW_PROXY_VALUE`   | the UEN (e.g. `201912345K`) or mobile (e.g. `+6591234567`) |
| `PAYNOW_MERCHANT_NAME` | shown to the payer; truncated at 25 characters by EMVCo    |

```bash
wrangler pages secret put PAYNOW_PROXY_TYPE --project-name=singaporehandpans --env=preview
wrangler pages secret put PAYNOW_PROXY_VALUE --project-name=singaporehandpans --env=preview
wrangler pages secret put PAYNOW_MERCHANT_NAME --project-name=singaporehandpans --env=preview
```

**Switching this on changes the prices shown.** With it off, the shop offers a
single HitPay checkout carrying both PayNow and card, at the list price. With
it on, the product page offers two prices — PayNow at the list price, and card
at list + 2.8% + S$0.50 — and the HitPay checkout is restricted to cards, so a
buyer quoted the surcharge cannot then pick a cheaper method on HitPay's page.

**A WAF rate-limit rule on `/api/shop/*` is a prerequisite, not a nicety.**
The order endpoint sends mail through the studio's Resend account, so without
a rate limit a script can exhaust the quota and flood the owner's inbox. The
endpoints require a matching `Origin` header, which turns away the simplest
abuse, but `Origin` is trivially spoofed and is a speed bump rather than a
control. Add the rule in Cloudflare → Security → WAF → Rate limiting rules
before switching PayNow on.

Mail is only ever sent to the studio's own address. Nothing is sent to the
address submitted with an order, so the endpoint cannot be pointed at a third
party and the domain's sending reputation is not exposed.

Two things to be aware of before enabling it:

- **Reconciliation is manual.** Nothing confirms a bank transfer. The buyer is
  shown a reference, both sides are emailed, and the owner matches the transfer
  in their bank by hand before shipping. The owner's email says in capitals that
  the money is _not_ confirmed, precisely because nothing else will say so.
- **The surcharge is a card surcharge.** Singapore has no law against it, but
  Visa prohibits surcharging outside the US absent local law requiring it be
  allowed, and acquirer and gateway merchant terms commonly forbid it. The
  alternative with the same economics and no such exposure is to present it as
  a PayNow _discount_ off a card-inclusive list price. The rate lives in
  `src/lib/cardSurcharge.ts`.

#### Webhook

No dashboard configuration needed. The site sends the callback URL with each
payment request (`${url.origin}/api/shop/hitpay-webhook`), so it automatically
matches whichever deployment created the order.

## Automatic Deployments

### On Git Push

**Production**: Deploys from `main` branch
**Preview**: Deploys from all other branches

### Webhook from Storyblok

Auto-rebuild when content changes:

1. Cloudflare Pages → **Settings** → **Builds & deployments**
2. Copy **Deploy hook URL**
3. In Storyblok → **Settings** → **Webhooks**
4. Add webhook:
   - **Story published**: Paste deploy hook URL
   - **Method**: POST
5. Save

Now publishes in Storyblok trigger rebuilds!

## Build Configuration

### Custom Build Command

If needed, create `_worker.js` for advanced configs:

```javascript
export default {
  async fetch(request, env) {
    return new Response('Hello World');
  },
};
```

### Redirects

Create `public/_redirects` file:

```
/old-page /new-page 301
/events/:slug /workshops/:slug 301
```

## Performance

### Automatic Optimizations

Cloudflare automatically provides:

- ✅ Global CDN (300+ locations)
- ✅ HTTP/2 and HTTP/3
- ✅ Brotli compression
- ✅ Auto minify (HTML, CSS, JS)
- ✅ DDoS protection
- ✅ SSL certificate (automatic)

### Custom Optimizations

In Cloudflare Dashboard:

1. **Speed** → **Optimization**
2. Enable:
   - Auto Minify
   - Brotli compression
   - Early Hints
   - Image optimization

## Monitoring

### Analytics

View in Cloudflare Pages:

- **Analytics** tab
- Page views
- Bandwidth usage
- Request count
- Cache hit rate

### Logs

View build logs:

1. Cloudflare Pages → Your project
2. **Deployments** tab
3. Click any deployment
4. View build log

## Troubleshooting

### Build Failures

**Check build log** for errors:

1. Missing environment variables
2. Node version mismatch
3. Dependency issues

**Solutions**:

```bash
# Locally test production build
npm run build

# Check Node version matches
node --version  # Should be 18+
```

### Site Not Updating

1. Check deployment succeeded
2. Clear CDN cache:
   - Cloudflare → **Caching** → **Purge Everything**
3. Hard refresh browser (Ctrl+Shift+R)

### Environment Variables Not Working

1. Verify variables are set in Cloudflare
2. Redeploy after adding variables
3. Check variable names match code

### Custom Domain Issues

1. Verify DNS records
2. Check SSL certificate status
3. Wait for propagation (up to 24 hours)
4. Use [DNS Checker](https://dnschecker.org/)

## Limits & Pricing

### Free Tier

- ✅ Unlimited bandwidth
- ✅ Unlimited requests
- ✅ 500 builds/month
- ✅ 1 concurrent build
- ✅ 20,000 files

### Paid Tiers

- **$20/month**: 5,000 builds
- **$200/month**: 20,000 builds
- Custom enterprise options

## Best Practices

1. **Use branches** for testing changes
2. **Review preview deployments** before merging
3. **Set up webhooks** for automatic content updates
4. **Monitor analytics** for traffic patterns
5. **Enable cache** for better performance
6. **Use custom domain** for production
7. **Backup site** regularly

## Resources

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Framework Guides](https://developers.cloudflare.com/pages/framework-guides/)
- [Custom Domains](https://developers.cloudflare.com/pages/platform/custom-domains/)
- [Build Configuration](https://developers.cloudflare.com/pages/platform/build-configuration/)
