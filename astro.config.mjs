import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.tulipprecast.com',
  output: 'static',
  integrations: [
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      serialize(item) {
        const url = item.url.replace(/\/$/, '');
        if (url === 'https://www.tulipprecast.com') {
          return { ...item, priority: 1.0, changefreq: 'weekly' };
        }
        if (
          url === 'https://www.tulipprecast.com/limestone' ||
          url === 'https://www.tulipprecast.com/gfrc' ||
          url === 'https://www.tulipprecast.com/precast'
        ) {
          return { ...item, priority: 0.9, changefreq: 'weekly' };
        }
        if (
          url === 'https://www.tulipprecast.com/services' ||
          url === 'https://www.tulipprecast.com/portfolio' ||
          url === 'https://www.tulipprecast.com/colours'
        ) {
          return { ...item, priority: 0.8, changefreq: 'monthly' };
        }
        if (
          url === 'https://www.tulipprecast.com/about' ||
          url === 'https://www.tulipprecast.com/contact'
        ) {
          return { ...item, priority: 0.6, changefreq: 'monthly' };
        }
        return item;
      },
    }),
  ],
  image: {
    domains: ['res.cloudinary.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
    service: {
      entrypoint: 'astro/assets/services/sharp',
    },
  },
  vite: {
    build: {
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          assetFileNames: '_astro/[name].[hash][extname]',
          chunkFileNames: '_astro/[name].[hash].js',
          entryFileNames: '_astro/[name].[hash].js',
        },
      },
    },
    css: {
      devSourcemap: true,
    },
  },
});
