# Cloudflare Pages Deployment Guide - Singapore Handpan Studio

This guide explains how to deploy the Singapore Handpan Studio website to Cloudflare Pages with automatic CI/CD.

## 🚀 Why Cloudflare Pages?

- **Ultra-fast global CDN** with edge caching
- **Automatic HTTPS** with SSL certificates
- **Git integration** with GitHub for automatic deployments
- **Custom domains** with easy DNS management
- **Free tier** with generous limits
- **Edge functions** for advanced functionality
- **Analytics** and performance monitoring
- **Preview deployments** for every commit

## 📋 Quick Setup (5 minutes)

### 1. Prepare Your Repository

Your code is already configured for Cloudflare Pages! The configuration includes:

- ✅ **Astro config**: Optimized for Cloudflare Pages
- ✅ **Build settings**: Standard `npm run build` command
- ✅ **Headers & redirects**: Security and performance optimizations
- ✅ **Custom domain**: Pre-configured for singaporehandpans.com

### 2. Create Cloudflare Pages Project

1. **Sign up/Login** to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Go to **Pages** in the sidebar
3. Click **Create a project** → **Connect to Git**
4. **Connect your GitHub account** (if not already connected)
5. **Select your repository**: `tribalspirit/singaporehandpans`
6. **Configure build settings**:
   - **Project name**: `singaporehandpans`
   - **Production branch**: `main`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Node.js version**: `20.x` (in Environment variables)

7. Click **Save and Deploy**

### 3. Configure Environment Variables

In your Cloudflare Pages project:

1. Go to **Settings** → **Environment variables**
2. **Add variables** (if using Storyblok):
   - `STORYBLOK_TOKEN`: Your Storyblok preview token
   - `NODE_VERSION`: `20` (for consistent builds)

### 4. Setup Custom Domain

1. In your Pages project, go to **Custom domains**
2. Click **Set up a custom domain**
3. Enter: `singaporehandpans.com`
4. **Configure DNS** (if domain is with Cloudflare):
   - Cloudflare will automatically configure DNS
5. **If domain is elsewhere**:
   - Add CNAME record: `singaporehandpans.com` → `[project-name].pages.dev`
   - Or point A record to Cloudflare's IPs

## 🔧 Configuration Files

### `astro.config.mjs`
```javascript
export default defineConfig({
  site: 'https://singaporehandpans.com',
  output: 'static',
  // ... optimized for Cloudflare Pages
});
```

### `wrangler.toml`
```toml
name = "singaporehandpans"
compatibility_date = "2024-01-01"
pages_build_output_dir = "dist"
```

### `_redirects`
- Security headers (X-Frame-Options, CSP, etc.)
- Cache optimization for assets
- Custom redirects (if needed)

## 🚀 Deployment Workflow

### Automatic Deployments

1. **Push to `main`** → Production deployment
2. **Push to any branch** → Preview deployment
3. **Pull requests** → Preview deployments with unique URLs
4. **Build time**: ~2-3 minutes
5. **Global propagation**: Instant via CDN

### Manual Deployment

```bash
# Make changes
git add .
git commit -m "Update website"
git push origin main

# Cloudflare Pages automatically builds and deploys
```

### Preview Deployments

Every branch and PR gets a preview URL:
- `https://[commit-hash].singaporehandpans.pages.dev`
- Perfect for testing changes before merging

## 🌐 DNS & Domain Configuration

### Option 1: Domain with Cloudflare (Recommended)

1. **Transfer domain** to Cloudflare (or add as external domain)
2. **Automatic configuration**: Cloudflare handles everything
3. **Benefits**: Full CDN, DDoS protection, advanced analytics

### Option 2: External DNS Provider

Add these records to your DNS provider:

```
Type: CNAME
Name: singaporehandpans.com (or @)
Value: singaporehandpans.pages.dev
```

For apex domain (singaporehandpans.com):
```
Type: A
Name: @ 
Value: 172.66.40.87

Type: A  
Name: @
Value: 172.66.41.87

Type: AAAA
Name: @
Value: 2606:4700:10::ac42:2857

Type: AAAA
Name: @
Value: 2606:4700:10::ac42:2957
```

## ⚡ Performance Optimizations

### Included Optimizations

- ✅ **Static site generation**: Pre-built HTML for fastest loading
- ✅ **Asset optimization**: Compressed CSS, JS, images
- ✅ **CDN caching**: Global edge cache for static assets
- ✅ **Security headers**: CSP, HSTS, XSS protection
- ✅ **Modern formats**: WebP images, modern JS

### Advanced Optimizations

1. **Enable Cloudflare features**:
   - Auto Minify (HTML, CSS, JS)
   - Brotli compression
   - Image optimization
   - Rocket Loader (optional)

2. **Configure caching rules**:
   - Browser cache: 1 year for assets
   - Edge cache: Automatic optimization

## 📊 Analytics & Monitoring

### Cloudflare Analytics (Free)

- **Page views** and **unique visitors**
- **Performance metrics** and **Core Web Vitals**
- **Geographic breakdown**
- **Referrer analysis**

### Web Analytics Setup

1. Go to **Analytics** → **Web Analytics**
2. **Add site**: singaporehandpans.com
3. **Add beacon** to your site (optional - Cloudflare auto-tracks)
4. **View insights** in dashboard

### Real User Monitoring

- **Lighthouse scores** tracked automatically
- **Loading performance** across different regions
- **Error tracking** and **uptime monitoring**

## 🔍 Troubleshooting

### Build Failures

1. **Check build logs** in Pages dashboard
2. **Common issues**:
   - Node.js version mismatch
   - Missing environment variables
   - Dependency installation failures
3. **Solutions**:
   - Set `NODE_VERSION=20` in environment variables
   - Verify all dependencies in package.json
   - Check for syntax errors

### Domain Issues

1. **DNS propagation**: Can take up to 24 hours
2. **SSL certificate**: Auto-generated, may take 10-15 minutes
3. **Check status**: Pages dashboard shows domain status
4. **Troubleshooting**: Use `dig` or online DNS tools

### Performance Issues

1. **Check Cloudflare cache settings**
2. **Review _redirects file** for conflicts
3. **Optimize images** and **minimize JS/CSS**
4. **Use Cloudflare's optimization features**

## 🔒 Security Features

### Automatic Security

- ✅ **DDoS protection** via Cloudflare network
- ✅ **SSL/TLS encryption** with modern ciphers
- ✅ **Security headers** via _redirects file
- ✅ **Rate limiting** and **bot protection**

### Additional Security

1. **Enable Bot Fight Mode** (free tier)
2. **Configure WAF rules** (paid tiers)
3. **Set up Access policies** for admin areas
4. **Monitor security events** in dashboard

## 🚢 Going Live Checklist

- [ ] Repository connected to Cloudflare Pages
- [ ] Build settings configured (Node 20, npm run build, dist/)
- [ ] Environment variables set (STORYBLOK_TOKEN if needed)
- [ ] Custom domain added and verified
- [ ] DNS configured and propagating
- [ ] SSL certificate issued
- [ ] Test deployment successful
- [ ] Analytics enabled
- [ ] Performance optimizations active

## 🎯 Expected Results

After setup completion:

- **Live site**: https://singaporehandpans.com
- **Preview deployments**: Every branch/PR gets unique URL
- **Build time**: 2-3 minutes per deployment
- **Global availability**: Instant via 330+ edge locations
- **Performance**: 90+ Lighthouse scores
- **Uptime**: 99.99% SLA with enterprise-grade reliability

## 📈 Next Steps

### Content Management

1. **Configure Storyblok** for dynamic content
2. **Set up webhooks** for content updates
3. **Create content workflows** for editors

### Advanced Features

1. **Edge functions** for dynamic functionality
2. **A/B testing** with Cloudflare
3. **Advanced analytics** and **heatmaps**
4. **Email routing** for contact forms

### Marketing

1. **SEO optimization** with Cloudflare tools
2. **Social media integration**
3. **Newsletter signup** with edge functions
4. **Contact form** processing

---

**Need help?** Check the [Cloudflare Pages documentation](https://developers.cloudflare.com/pages/) or contact support.

## 🎵 Ready for Launch!

Your Singapore Handpan Studio website is now configured for **ultra-fast deployment** on Cloudflare's global network. Enjoy lightning-fast loading times and enterprise-grade reliability! 🚀
