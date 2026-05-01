import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    // VitePWA({
    //   registerType: 'autoUpdate',
    //   includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
    //   manifest: {
    //     name: 'Mindful Journal',
    //     short_name: 'Mindful',
    //     description: 'A private mental wellness journal with AI support',
    //     theme_color: '#6E2B8A',
    //     background_color: '#ffffff',
    //     display: 'standalone',
    //     scope: '/',
    //     start_url: '/',
    //     icons: [
    //       {
    //         src: 'pwa-192x192.png',
    //         sizes: '192x192',
    //         type: 'image/png',
    //         purpose: 'any',
    //       },
    //       {
    //         src: 'pwa-512x512.png',
    //         sizes: '512x512',
    //         type: 'image/png',
    //         purpose: 'any',
    //       },
    //       {
    //         src: 'pwa-maskable-192x192.png',
    //         sizes: '192x192',
    //         type: 'image/png',
    //         purpose: 'maskable',
    //       },
    //       {
    //         src: 'pwa-maskable-512x512.png',
    //         sizes: '512x512',
    //         type: 'image/png',
    //         purpose: 'maskable',
    //       },
    //     ],
    //   },
    //   workbox: {
    //     globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    //     inlineWorkboxRuntime: false,
    //     runtimeCaching: [
    //       {
    //         urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
    //         handler: 'CacheFirst',
    //         options: {
    //           cacheName: 'google-fonts-stylesheets',
    //           expiration: {
    //             maxEntries: 10,
    //             maxAgeSeconds: 60 * 60 * 24 * 365,
    //           },
    //         },
    //       },
    //       {
    //         urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
    //         handler: 'CacheFirst',
    //         options: {
    //           cacheName: 'google-fonts-webfonts',
    //           expiration: {
    //             maxEntries: 30,
    //             maxAgeSeconds: 60 * 60 * 24 * 365,
    //           },
    //         },
    //       },
    //       {
    //         urlPattern: /^https:\/\/mindfulljournal-production\.up\.railway\.app\/.*/i,
    //         handler: 'NetworkFirst',
    //         options: {
    //           cacheName: 'api-cache',
    //           expiration: {
    //             maxEntries: 50,
    //             maxAgeSeconds: 60 * 60 * 24,
    //           },
    //           networkTimeoutSeconds: 10,
    //         },
    //       },
    //     ],
    //   },
    //   devOptions: {
    //     enabled: false,
    //   },
    // }),
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});