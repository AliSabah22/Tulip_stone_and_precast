import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.tulipstone.ca',
  output: 'static',
  integrations: [
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      serialize(item) {
        const url = item.url.replace(/\/$/, '');
        if (url === 'https://www.tulipstone.ca') {
          return { ...item, priority: 1.0, changefreq: 'weekly' };
        }
        if (
          url === 'https://www.tulipstone.ca/limestone' ||
          url.startsWith('https://www.tulipstone.ca/limestone/') ||
          url === 'https://www.tulipstone.ca/gfrc' ||
          url === 'https://www.tulipstone.ca/precast'
        ) {
          return { ...item, priority: 0.9, changefreq: 'weekly' };
        }
        if (
          url === 'https://www.tulipstone.ca/services' ||
          url === 'https://www.tulipstone.ca/portfolio' ||
          url === 'https://www.tulipstone.ca/colours'
        ) {
          return { ...item, priority: 0.8, changefreq: 'monthly' };
        }
        if (
          url === 'https://www.tulipstone.ca/about' ||
          url === 'https://www.tulipstone.ca/contact'
        ) {
          return { ...item, priority: 0.6, changefreq: 'monthly' };
        }
        if (
          url === 'https://www.tulipstone.ca/brampton' ||
          url === 'https://www.tulipstone.ca/toronto' ||
          url === 'https://www.tulipstone.ca/mississauga' ||
          url === 'https://www.tulipstone.ca/oakville'
        ) {
          return { ...item, priority: 0.9, changefreq: 'weekly' };
        }
        if (
          url === 'https://www.tulipstone.ca/montreal' ||
          url === 'https://www.tulipstone.ca/vancouver'
        ) {
          return { ...item, priority: 0.8, changefreq: 'weekly' };
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
