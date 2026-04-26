import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// import { VitePWA } from 'vite-plugin-pwa'; // Temporarily disabled

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // PWA temporarily disabled due to service worker ES module issues
    // TODO: Re-enable after fixing workbox configuration
    // VitePWA({
    //   registerType: 'autoUpdate',
    //   ...
    // })
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    middlewares: []
  }
});
