import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';
import storyblok from '@storyblok/astro';
import { loadEnv } from 'vite';

// Load environment variables - try multiple sources for Cloudflare compatibility
const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '');
const storyblokToken = process.env.STORYBLOK_TOKEN || env.STORYBLOK_TOKEN || '';

// https://astro.build/config
export default defineConfig({
  // Cloudflare Pages configuration
  site: 'https://singaporehandpans.com',
  output: 'hybrid',
  adapter: cloudflare(),
  
  integrations: [
    react(),
    storyblok({
      accessToken: storyblokToken,
      bridge: (env.NODE_ENV || process.env.NODE_ENV) === 'development',
      components: {
        event: 'src/components/storyblok/Event',
        gallery_item: 'src/components/storyblok/GalleryItem',
        gallery_album: 'src/components/storyblok/GalleryAlbum',
        gallery_media: 'src/components/storyblok/GalleryMedia',
        page: 'src/components/storyblok/Page',
        story_article: 'src/components/storyblok/StoryArticle',
        story_text: 'src/components/storyblok/StoryText',
        story_image: 'src/components/storyblok/StoryImage',
        story_gallery: 'src/components/storyblok/StoryGallery',
        story_youtube: 'src/components/storyblok/StoryYouTube',
      }
    })
  ],
  
  vite: {
    // Inject environment variables so they're available in import.meta.env
    define: {
      'import.meta.env.STORYBLOK_TOKEN': JSON.stringify(storyblokToken),
    },

    ssr: {
      // @tonaljs/* ships dual CJS/ESM the old way: `main` + `module`, with no
      // `exports` map and no `type`. Left external, Vite's dev SSR resolves it
      // through `main` to the CJS build, and `import * as Scale` does not hoist
      // the named exports off it — so `Scale.get` is undefined and
      // /academy/memorization/ dies with "__vite_ssr_import_0__.get is not a
      // function". Bundling it applies the interop and fixes dev; the
      // production build already bundled it, which is why only dev was broken.
      noExternal: ['@tonaljs/*'],
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
        'react-photo-album',
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
