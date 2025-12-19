import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import storyblok from '@storyblok/astro';
import { loadEnv } from 'vite';

// Load environment variables
const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '');

// https://astro.build/config
export default defineConfig({
  // Cloudflare Pages configuration
  site: 'https://singaporehandpans.com',
  output: 'static',
  
  integrations: [
    react(),
    storyblok({
      accessToken: env.STORYBLOK_TOKEN || process.env.STORYBLOK_TOKEN || '',
      bridge: (env.NODE_ENV || process.env.NODE_ENV) === 'development',
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
      // Enable CSS source maps for SCSS debugging
      devSourcemap: true,
      preprocessorOptions: {
        scss: {
          additionalData: `@import "src/styles/tokens.scss";`
        }
      }
    },
    
    // Optimize dependencies but keep source maps in development
    optimizeDeps: {
      include: ['react', 'react-dom']
    },
    
    // Enable source maps in development
    ...((env.NODE_ENV || process.env.NODE_ENV) === 'development' && {
      build: {
        sourcemap: true
      }
    })
  },
  
  build: {
    inlineStylesheets: 'auto'
  },
  
  compressHTML: true,
  
  // Cloudflare Pages works best with 'ignore' for trailing slashes
  trailingSlash: 'ignore'
});
