import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// Temporarily disable PWA to prevent service worker caching issues
// import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  // Force single instance of React and React-DOM
  resolve: {
    alias: {
      'react': path.resolve('./node_modules/react'),
      'react-dom': path.resolve('./node_modules/react-dom'),
      'use-sync-external-store/shim': path.resolve('./node_modules/use-sync-external-store/shim'),
      'use-sync-external-store/shim/with-selector': path.resolve('./node_modules/use-sync-external-store/shim/with-selector')
    },
    dedupe: ['react', 'react-dom', 'use-sync-external-store']
  },
  plugins: [
    react({ jsxRuntime: 'automatic' }),
    // PWA temporarily disabled to prevent service worker caching old builds
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
        drop_console: false, // Keep console.log temporarily for debugging
        drop_debugger: true,
        pure_funcs: []
      },
      mangle: {
        // Keep function and class names for better error stack traces
        keep_classnames: true,
        keep_fnames: true
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
          if (id.includes('chart.js') || id.includes('react-chartjs-2')) {
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
    // Source map for production debugging (ENABLED for better error tracking)
    sourcemap: true
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
