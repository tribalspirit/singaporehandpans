# Deployment Guide - Singapore Handpan Studio

This guide explains how to deploy the Singapore Handpan Studio website to GitHub Pages using automated CI/CD.

## 🚀 Quick Setup

### 1. Repository Setup

1. **Create a GitHub repository** (if not already done):
   ```bash
   # Initialize git if not already done
   git init
   git add .
   git commit -m "Initial commit: Singapore Handpan Studio website"
   
   # Add your GitHub repository as origin
   git remote add origin https://github.com/YOUR_USERNAME/sghandpan.git
   git branch -M main
   git push -u origin main
   ```

2. **Update the site URL** in `astro.config.mjs`:
   ```javascript
   // Replace 'username' with your actual GitHub username
   site: process.env.GITHUB_PAGES ? 'https://YOUR_USERNAME.github.io/sghandpan/' : 'https://sghandpan.com',
   ```

### 2. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** tab
3. Scroll down to **Pages** section
4. Under **Source**, select **GitHub Actions**
5. Save the settings

### 3. Configure Repository Permissions

1. In your repository, go to **Settings** → **Actions** → **General**
2. Under **Workflow permissions**, select:
   - ✅ **Read and write permissions**
   - ✅ **Allow GitHub Actions to create and approve pull requests**
3. Click **Save**

### 4. Deploy

Push any changes to the `main` branch:

```bash
git add .
git commit -m "Deploy to GitHub Pages"
git push origin main
```

The deployment will automatically start! 🎉

## 📋 What Happens During Deployment

1. **Trigger**: Push to `main` branch or manual workflow dispatch
2. **Build**: 
   - Install Node.js and dependencies
   - Run `npm run build:gh-pages` with GitHub Pages optimizations
   - Generate static site in `dist/` directory
3. **Deploy**: Upload and deploy to GitHub Pages
4. **Live**: Site available at `https://YOUR_USERNAME.github.io/sghandpan/`

## 🛠️ Local Development vs Production

### Local Development
```bash
npm run dev          # Development server
npm run build        # Build for custom domain
npm run preview      # Preview production build
```

### GitHub Pages Deployment
```bash
npm run build:gh-pages  # Build optimized for GitHub Pages
npm run deploy          # Alias for build:gh-pages
```

## 🔧 Configuration Files

### `.github/workflows/deploy.yml`
- GitHub Actions workflow for automated deployment
- Triggers on push to `main` branch
- Builds and deploys to GitHub Pages

### `astro.config.mjs`
- Configures different settings for GitHub Pages vs custom domain
- Sets correct base paths and asset prefixes
- Handles environment-specific URLs

### `.nojekyll`
- Prevents GitHub from processing the site with Jekyll
- Required for Astro sites on GitHub Pages

## 🌐 Custom Domain (Optional)

To use a custom domain instead of GitHub Pages default:

1. **Add CNAME file**:
   ```bash
   echo "yourdomain.com" > public/CNAME
   ```

2. **Update astro.config.mjs**:
   ```javascript
   site: 'https://yourdomain.com',
   // Remove or comment out GitHub Pages specific config
   ```

3. **Configure DNS** with your domain provider:
   - Add CNAME record pointing to `YOUR_USERNAME.github.io`

4. **Enable in GitHub**:
   - Go to Settings → Pages
   - Add your custom domain
   - Enable "Enforce HTTPS"

## 🔍 Troubleshooting

### Build Fails
- Check the Actions tab for error details
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

### Site Not Loading
- Check if GitHub Pages is enabled in repository settings
- Verify the site URL in `astro.config.mjs`
- Ensure `.nojekyll` file exists

### Assets Not Loading
- Verify `base` and `assetsPrefix` configuration
- Check browser console for 404 errors
- Ensure relative paths are used correctly

### Storyblok Integration
- Add `STORYBLOK_TOKEN` as repository secret if using CMS
- Update workflow to include environment variables

## 📊 Monitoring

- **GitHub Actions**: Monitor deployments in the Actions tab
- **Pages Settings**: Check deployment status in Settings → Pages
- **Analytics**: Consider adding Google Analytics for traffic monitoring

## 🔄 Continuous Deployment

Every push to `main` automatically:
1. ✅ Builds the site
2. ✅ Runs quality checks
3. ✅ Deploys to GitHub Pages
4. ✅ Updates live site

No manual intervention required! 🚀

## 📝 Environment Variables

For production deployments with Storyblok:

1. Go to repository **Settings** → **Secrets and variables** → **Actions**
2. Add repository secrets:
   - `STORYBLOK_TOKEN`: Your Storyblok preview token

Update the workflow to use secrets:
```yaml
- name: Build with Astro
  env:
    GITHUB_PAGES: true
    STORYBLOK_TOKEN: ${{ secrets.STORYBLOK_TOKEN }}
  run: npm run build:gh-pages
```

---

**Need help?** Check the [GitHub Pages documentation](https://docs.github.com/en/pages) or [Astro deployment guide](https://docs.astro.build/en/guides/deploy/github/).
