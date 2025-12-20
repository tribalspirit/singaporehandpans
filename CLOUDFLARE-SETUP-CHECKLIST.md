# Cloudflare Pages Setup Checklist

## ✅ Pre-configured (Already Done)

### 1. Astro Configuration
- [x] **astro.config.mjs**: Optimized for Cloudflare Pages
- [x] **Site URL**: Set to https://singaporehandpans.com
- [x] **Build settings**: Standard static output
- [x] **Trailing slashes**: Configured for Cloudflare compatibility

### 2. Build Configuration  
- [x] **package.json**: Clean build scripts
- [x] **Dependencies**: All required packages installed
- [x] **Node.js**: Compatible with Cloudflare Pages (Node 20+)

### 3. Cloudflare Pages Files
- [x] **wrangler.toml**: Project configuration
- [x] **_redirects**: Security headers and cache rules
- [x] **Build output**: Configured for `dist/` directory

### 4. Code Quality
- [x] **ESLint**: Code linting configured
- [x] **Prettier**: Code formatting configured
- [x] **TypeScript**: Strict mode enabled
- [x] **SCSS**: Styling with design tokens

### 5. Content & SEO
- [x] **4 Complete pages**: Home, About, Workshops, Contacts
- [x] **SEO optimization**: Meta tags, sitemap, structured data
- [x] **Responsive design**: Mobile-first approach
- [x] **Accessibility**: WCAG compliant

## 🚀 Manual Setup (5-10 minutes)

### Step 1: Push to GitHub (if not done)

```bash
# Ensure your code is committed and pushed
git add .
git commit -m "Configure for Cloudflare Pages deployment"
git push origin main
```

### Step 2: Create Cloudflare Pages Project

1. **Go to [Cloudflare Dashboard](https://dash.cloudflare.com)**
2. **Click "Pages"** in the left sidebar
3. **Click "Create a project"**
4. **Select "Connect to Git"**

### Step 3: Connect Repository

1. **Connect GitHub account** (if not already connected)
2. **Select repository**: `tribalspirit/singaporehandpans`
3. **Click "Begin setup"**

### Step 4: Configure Build Settings

Fill in these **exact settings**:

```
Project name: singaporehandpans
Production branch: main
Framework preset: Astro
Build command: npm run build
Build output directory: dist
Root directory: / (leave empty)
```

**Environment variables** (click "Add variable" if using Storyblok):
```
NODE_VERSION = 20
STORYBLOK_TOKEN = your_token_here (if applicable)
```

5. **Click "Save and Deploy"**

### Step 5: Wait for First Build

- ⏱️ **Build time**: 2-3 minutes
- 📊 **Watch progress** in the deployment dashboard
- ✅ **Success**: You'll get a `.pages.dev` URL

### Step 6: Setup Custom Domain

1. **In your Pages project**, go to **Custom domains**
2. **Click "Set up a custom domain"**
3. **Enter**: `singaporehandpans.com`
4. **Follow DNS instructions** (see options below)

#### DNS Option A: Domain with Cloudflare (Recommended)
- If your domain is already with Cloudflare, it will configure automatically ✨
- If not, consider transferring for full benefits

#### DNS Option B: External DNS Provider
Add these records to your current DNS provider:

**For www.singaporehandpans.com:**
```
Type: CNAME
Name: www
Value: singaporehandpans.pages.dev
```

**For apex domain (singaporehandpans.com):**
```
Type: A
Name: @ (or leave blank)  
Value: 172.66.40.87

Type: A
Name: @ (or leave blank)
Value: 172.66.41.87
```

## 🎯 Verification Checklist

After setup, verify everything works:

- [ ] **Build successful**: Check Pages dashboard
- [ ] **Site loads**: Visit your .pages.dev URL  
- [ ] **All pages work**: Test /, /about, /workshops, /contacts
- [ ] **Mobile responsive**: Test on mobile device
- [ ] **Custom domain**: DNS propagated (can take 24 hours)
- [ ] **SSL certificate**: HTTPS working (auto-generated)
- [ ] **Performance**: Run Lighthouse test

## 🚀 Expected Results

### Immediate (After Step 5)
- ✅ **Live site**: `https://[random-name].pages.dev`
- ✅ **Automatic deployments**: Every push triggers rebuild
- ✅ **Preview deployments**: Every branch gets unique URL
- ✅ **Build logs**: Detailed logs in dashboard

### Within 24 hours (After Step 6)
- ✅ **Custom domain**: https://singaporehandpans.com
- ✅ **SSL certificate**: Automatically issued and configured
- ✅ **Global CDN**: Site served from 330+ edge locations
- ✅ **Performance**: 90+ Lighthouse scores

## 🔄 Deployment Workflow

### Automatic Deployments

```bash
# Production deployment
git push origin main
→ Builds and deploys to singaporehandpans.com

# Preview deployment  
git checkout -b feature/new-content
git push origin feature/new-content
→ Creates preview at unique URL for testing
```

### Branch Strategy

- **main branch** → Production (singaporehandpans.com)
- **Any other branch** → Preview deployment
- **Pull requests** → Automatic preview deployments

## 📊 Monitoring & Analytics

### Built-in Analytics (Free)
1. **Pages dashboard** → **Analytics** tab
2. **View metrics**: Page views, performance, geographic data
3. **Core Web Vitals**: Automatic Lighthouse scoring

### Optional: Web Analytics
1. **Analytics** → **Web Analytics** in Cloudflare dashboard
2. **Add site**: singaporehandpans.com  
3. **Enhanced tracking**: Real user monitoring

## 🛠️ Advanced Configuration (Optional)

### Performance Optimizations
1. **Speed** → **Optimization**: Enable Auto Minify
2. **Speed** → **Optimization**: Enable Brotli compression
3. **Caching** → **Configuration**: Customize cache rules

### Security Enhancements  
1. **Security** → **Bot Fight Mode**: Enable bot protection
2. **SSL/TLS** → **Edge Certificates**: Verify HTTPS settings
3. **Firewall** → **WAF**: Configure if needed (paid feature)

## 🔧 Troubleshooting

### Build Fails
- **Check build logs** in Pages dashboard
- **Common fix**: Add `NODE_VERSION=20` environment variable
- **Dependency issues**: Verify package.json and package-lock.json

### Domain Issues
- **DNS propagation**: Wait up to 24 hours
- **Check DNS**: Use [DNS Checker](https://dnschecker.org/)
- **Cloudflare status**: Check domain status in dashboard

### Performance Issues
- **Review _redirects**: Check for conflicting rules
- **Cloudflare settings**: Enable optimization features
- **Content optimization**: Compress images, minify code

## ✨ Success Indicators

When everything is working correctly:

- 🟢 **Build status**: Green checkmark in Pages dashboard
- 🟢 **Domain status**: "Active" in custom domains
- 🟢 **SSL status**: "Active" certificate  
- 🟢 **Performance**: 90+ Lighthouse score
- 🟢 **Global availability**: Fast loading worldwide
- 🟢 **Automatic deployments**: Every push deploys successfully

## 🎵 You're Live!

Once complete, your Singapore Handpan Studio website will be:

- ⚡ **Lightning fast** via global CDN
- 🔒 **Secure** with automatic HTTPS  
- 🌍 **Global** with 330+ edge locations
- 🔄 **Auto-deploying** on every commit
- 📊 **Monitored** with built-in analytics
- 🎯 **Professional** with custom domain

**Total setup time**: 5-10 minutes + DNS propagation

Welcome to the modern web! 🚀

