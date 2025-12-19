import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import storyblok from '@storyblok/astro';

// https://astro.build/config
export default defineConfig({
  // Update this to your GitHub Pages URL when deploying
  // Format: https://username.github.io/repository-name/
  site: process.env.GITHUB_PAGES ? 'https://tribalspirit.github.io/singaporehandpans/' : 'https://singaporehandpans.com',
  
  // Uncomment if your repository is not at the root (has a path)
  // base: process.env.GITHUB_PAGES ? '/singaporehandpans' : '/',
  
  output: 'static',
  integrations: [
    react(),
    storyblok({
      accessToken: process.env.STORYBLOK_TOKEN || '',
      bridge: process.env.NODE_ENV === 'development',
      components: {
        event: 'src/components/storyblok/Event',
        gallery_item: 'src/components/storyblok/GalleryItem', 
        workshop: 'src/components/storyblok/Workshop',
        page: 'src/components/storyblok/Page',
      }
    })
  ],
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@import "src/styles/tokens.scss";`
        }
      }
    }
  },
  build: {
    inlineStylesheets: 'auto',
    // Ensure assets use relative paths for GitHub Pages compatibility
    assetsPrefix: process.env.GITHUB_PAGES ? '/sghandpan' : undefined
  },
  compressHTML: true,
  
  // Ensure trailing slashes for better GitHub Pages compatibility
  trailingSlash: 'always'
});
