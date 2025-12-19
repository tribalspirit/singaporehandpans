import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import storyblok from '@storyblok/astro';

// https://astro.build/config
export default defineConfig({
  // Cloudflare Pages configuration
  site: 'https://singaporehandpans.com',
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
    inlineStylesheets: 'auto'
  },
  
  compressHTML: true,
  
  // Cloudflare Pages works best with 'ignore' for trailing slashes
  trailingSlash: 'ignore'
});
