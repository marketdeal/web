import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        id: '/',
        name: 'MarketDeal — Africa’s Digital Market',
        short_name: 'MarketDeal',
        description: 'Shop trusted markets, pay through escrow, and sell from your phone.',
        theme_color: '#14304F',
        background_color: '#14304F',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        categories: ['shopping', 'business'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'Cart', url: '/cart', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
          { name: 'My orders', url: '/orders', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
          { name: 'Merchant dashboard', url: '/vendor', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,woff}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/bridge\.html/],
        cleanupOutdatedCaches: true,
      },
      devOptions: { enabled: false },
    }),
  ],
  server: { port: 5180, strictPort: true },
  preview: { port: 5180, strictPort: true },
});
