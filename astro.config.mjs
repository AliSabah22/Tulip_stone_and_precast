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
      customPages: [
        'https://www.tulipprecast.com/',
        'https://www.tulipprecast.com/limestone',
        'https://www.tulipprecast.com/precast',
        'https://www.tulipprecast.com/services',
        'https://www.tulipprecast.com/gfrc/',
        'https://www.tulipprecast.com/portfolio',
        'https://www.tulipprecast.com/colours',
        'https://www.tulipprecast.com/about',
        'https://www.tulipprecast.com/contact',
      ],
      serialize(item) {
        if (item.url === 'https://www.tulipprecast.com/gfrc/') {
          return { ...item, priority: 0.85, changefreq: 'monthly' };
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
