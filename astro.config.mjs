import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import storyblok from '@storyblok/astro';
import { loadEnv } from 'vite';

// Load environment variables - try multiple sources for Cloudflare compatibility
const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '');
const storyblokToken = process.env.STORYBLOK_TOKEN || env.STORYBLOK_TOKEN || '';

// https://astro.build/config
export default defineConfig({
  // Cloudflare Pages configuration
  site: 'https://singaporehandpans.com',
  output: 'static',
  
  integrations: [
    react(),
    storyblok({
      accessToken: storyblokToken,
      bridge: (env.NODE_ENV || process.env.NODE_ENV) === 'development',
      components: {
        event: 'src/components/storyblok/Event',
        gallery_item: 'src/components/storyblok/GalleryItem', 
        page: 'src/components/storyblok/Page',
      }
    })
  ],
  
  vite: {
    // Inject environment variables so they're available in import.meta.env
    define: {
      'import.meta.env.STORYBLOK_TOKEN': JSON.stringify(storyblokToken),
    },
    
    css: {
      devSourcemap: true,
      preprocessorOptions: {
        scss: {
          silenceDeprecations: ['legacy-js-api'],
          additionalData: `@use "src/styles/tokens.scss" as *;`
        }
      }
    },
    
    esbuild: {
      logOverride: { 'bigint': 'silent' }
    },
    
    // Optimize dependencies but keep source maps in development
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'yet-another-react-lightbox',
        'embla-carousel-react',
        'embla-carousel-autoplay'
      ]
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
