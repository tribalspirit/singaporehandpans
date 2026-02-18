---
name: deploy
description: Cloudflare Pages deployment for SG Handpan Studio. Build settings, environment variables, webhooks, and troubleshooting.
---

# Cloudflare Pages Deployment

## Prerequisites

- GitHub account
- Cloudflare account (free tier works)
- Code pushed to GitHub repository

## Quick Deploy

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages**
2. **Create Application** → **Pages** → **Connect to Git**
3. Authorize GitHub access → Select repository
4. Configure build settings (below)
5. **Save and Deploy**

## Build Configuration

| Setting                | Value           |
| ---------------------- | --------------- |
| Framework preset       | Astro           |
| Build command          | `npm run build` |
| Build output directory | `dist`          |
| Root directory         | (leave empty)   |

## Environment Variables

### Production (Required)

```bash
NODE_ENV=production
PUBLIC_SITE_URL=https://your-domain.com
STORYBLOK_TOKEN=your_published_token_here
```

### Production (Optional)

```bash
PUBLIC_CALENDLY_EVENT_URL=https://calendly.com/...
PUBLIC_CALENDLY_PRIVATE_URL=https://calendly.com/...
PUBLIC_ENABLE_SHOP=true
PUBLIC_SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
PUBLIC_SHOPIFY_STOREFRONT_TOKEN=your_token
```

**Important**: Use **Published** token for production (not Preview)!

### Preview Branches

- Same as production
- Use Preview token instead
- Different `PUBLIC_SITE_URL` if needed

## Automatic Deployments

### Git Push

- **Production**: Deploys from `main` branch
- **Preview**: Deploys from all other branches

### Storyblok Webhook

Auto-rebuild when content changes:

1. Cloudflare Pages → **Settings** → **Builds & deployments**
2. Copy **Deploy hook URL**
3. Storyblok → **Settings** → **Webhooks**
4. Add webhook: **Story published** → Paste URL
5. Save

## Custom Domain

1. Cloudflare Pages → Your project
2. **Custom domains** tab
3. **Set up a custom domain**
4. Enter domain (e.g., `singaporehandpans.com`)

### DNS Config

**If domain on Cloudflare**: Auto-configured

**If domain elsewhere**:

```
Type: CNAME
Name: @ (or www)
Value: your-site.pages.dev
```

Wait 5-30 minutes for DNS propagation.

## Redirects

Create `public/_redirects`:

```
/old-page /new-page 301
/events/:slug /workshops/:slug 301
```

## Free Tier Limits

- Unlimited bandwidth
- Unlimited requests
- 500 builds/month
- 1 concurrent build
- 20,000 files

## Automatic Optimizations

Cloudflare provides:

- Global CDN (300+ locations)
- HTTP/2 and HTTP/3
- Brotli compression
- Auto minify (HTML, CSS, JS)
- DDoS protection
- SSL certificate

## Troubleshooting

### Build Failures

Check build log for:

- Missing environment variables
- Node version mismatch
- Dependency issues

```bash
# Test locally first
npm run build
node --version  # Should be 18+
```

### Site Not Updating

1. Check deployment succeeded
2. Clear CDN cache: Cloudflare → **Caching** → **Purge Everything**
3. Hard refresh: Ctrl+Shift+R

### Environment Variables Not Working

1. Verify variables set in Cloudflare
2. **Redeploy** after adding variables
3. Check variable names match code exactly

### Custom Domain Issues

1. Verify DNS records with [DNS Checker](https://dnschecker.org/)
2. Check SSL certificate status
3. Wait for propagation (up to 24 hours)

## Related Skills

- `/setup` - Environment variables
- `/storyblok` - Webhook setup for auto-rebuild

## Source Documentation

- `docs/deployment/CLOUDFLARE.md`
