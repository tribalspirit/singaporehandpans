import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import storyblok from '@storyblok/astro';
import { loadEnv } from 'vite';

// Load environment variables - try multiple sources for Cloudflare compatibility
const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '');

// Debug: Log ALL environment variable sources
console.log('========================================');
console.log('🔧 STORYBLOK DEBUG - BUILD TIME');
console.log('========================================');
console.log('process.env keys containing STORYBLOK:', Object.keys(process.env).filter(k => k.includes('STORYBLOK')));
console.log('process.env.STORYBLOK_TOKEN:', process.env.STORYBLOK_TOKEN ? `[${process.env.STORYBLOK_TOKEN.length} chars]` : 'UNDEFINED');
console.log('loadEnv result keys:', Object.keys(env).filter(k => k.includes('STORYBLOK')));
console.log('env.STORYBLOK_TOKEN:', env.STORYBLOK_TOKEN ? `[${env.STORYBLOK_TOKEN.length} chars]` : 'UNDEFINED');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('========================================');

// Try to get token from multiple sources
const storyblokToken = process.env.STORYBLOK_TOKEN || env.STORYBLOK_TOKEN || '';

if (!storyblokToken) {
  console.error('❌ WARNING: No Storyblok token found! API calls will fail.');
  console.error('   Set STORYBLOK_TOKEN in Cloudflare Pages Environment Variables');
} else {
  console.log('✅ Storyblok token loaded successfully');
}

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
        workshop: 'src/components/storyblok/Workshop',
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
