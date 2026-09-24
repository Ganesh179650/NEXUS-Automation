import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true, // Enable PWA service worker in dev server mode
      },
      includeAssets: [
        'App_image.png',
        'favicon.ico',
        'favicon-16x16.png',
        'favicon-32x32.png',
        'apple-touch-icon.png',
        'icon-192.png',
        'icon-512.png',
        'icon-maskable-192.png',
        'icon-maskable-512.png',
      ],
      manifest: {
        name: 'NEXUS HOME — IoT Home Automation',
        short_name: 'NEXUS HOME',
        description: 'IoT Home Automation & Environmental Monitoring — real-time ESP32 + Firebase control dashboard',
        start_url: '/dashboard',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait-primary',
        background_color: '#0b101d',
        theme_color: '#0b101d',
        categories: ['utilities', 'productivity'],
        icons: [
          {
            src: '/App_image.png',
            sizes: '192x192 512x512',
            type: 'image/png',
          },
          {
            src: '/App_image.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png',
          },
        ],
        shortcuts: [
          {
            name: 'Dashboard',
            short_name: 'Dashboard',
            description: 'Open NEXUS HOME Dashboard',
            url: '/dashboard',
            icons: [{ src: '/App_image.png', sizes: '192x192' }],
          },
          {
            name: 'Devices',
            short_name: 'Devices',
            description: 'Control Hardware Appliances & Servos',
            url: '/devices',
            icons: [{ src: '/App_image.png', sizes: '192x192' }],
          },
          {
            name: 'Analytics',
            short_name: 'Analytics',
            description: 'View Session Telemetry Analytics',
            url: '/analytics',
            icons: [{ src: '/App_image.png', sizes: '192x192' }],
          },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024, // 4MB precache limit for 3D/chart bundle
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        // Firebase traffic MUST ALWAYS go live over the network (NetworkOnly) - never served stale from cache
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/(.*\.firebaseio\.com|.*\.googleapis\.com)\/.*/i,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
      },
    }),
  ],
});
