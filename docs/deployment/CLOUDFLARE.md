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
  }
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



