// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// TODO(domain): confirm saifuddinkapasi.in is connected on Vercel before launch.
export default defineConfig({
  site: 'https://saifuddinkapasi.in',
  output: 'static',
  integrations: [
    react(),
    sitemap({ filter: (page) => !page.includes('/style-test') }),
  ],
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  // The dev toolbar overlaps the phone dock while reviewing; production never has it.
  devToolbar: { enabled: false },
  vite: {
    plugins: [tailwindcss()],
  },
});
