import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({ jsxRuntime: 'automatic' }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['vite.svg'],
      manifest: {
        name: 'Takip CRM',
        short_name: 'TakipCRM',
        description: 'Müşteri İlişkileri Yönetim Sistemi',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/0711takipcrm/',
        scope: '/0711takipcrm/',
        icons: [
          {
            src: '/0711takipcrm/vite.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'firebase-storage-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 1 week
              }
            }
          }
        ]
      }
    }),
    visualizer({
      open: false,
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true
    })
  ],
  base: '/0711takipcrm/',
  build: {
    // Optimize build output
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info']
      }
    },
    rollupOptions: {
      output: {
        // Optimized manual chunks for better code splitting
        manualChunks: (id) => {
          // Core React libraries
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor';
          }

          // Firebase - split into smaller chunks
          if (id.includes('firebase/app') || id.includes('@firebase/app')) {
            return 'firebase-core';
          }
          if (id.includes('firebase/auth') || id.includes('@firebase/auth')) {
            return 'firebase-auth';
          }
          if (id.includes('firebase/firestore') || id.includes('@firebase/firestore')) {
            return 'firebase-firestore';
          }

          // Charts library - heavy, keep separate
          if (id.includes('recharts')) {
            return 'charts';
          }

          // Calendar library
          if (id.includes('react-big-calendar') || id.includes('moment')) {
            return 'calendar';
          }

          // PDF generation - very heavy, keep separate
          if (id.includes('jspdf') || id.includes('html2canvas')) {
            return 'pdf';
          }

          // Excel library - heavy
          if (id.includes('xlsx')) {
            return 'excel';
          }

          // Toast notifications
          if (id.includes('react-hot-toast')) {
            return 'notifications';
          }

          // All other node_modules
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        // Optimize chunk file names
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // Increase chunk size warning limit (we're optimizing chunks)
    chunkSizeWarningLimit: 500,
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Source map for production debugging (optional, increases build size)
    sourcemap: false
  },
  // Optimize dependencies pre-bundling
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore'
    ],
    exclude: [
      // Don't pre-bundle these heavy libraries
      'jspdf',
      'xlsx',
      'html2canvas'
    ]
  },
  // Server optimization for development
  server: {
    hmr: {
      overlay: true
    }
  }
});
