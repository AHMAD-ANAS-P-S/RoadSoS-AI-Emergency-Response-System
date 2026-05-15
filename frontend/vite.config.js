import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'public',
      filename: 'service-worker.js',
      manifest: false, // use our own manifest.json
      injectManifest: {
        injectionPoint: undefined
      }
    })
  ],
  optimizeDeps: {
    exclude: ['@xenova/transformers', 'sql.js']
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          maps: ['leaflet', 'react-leaflet'],
          ai: ['@xenova/transformers'],
          db: ['sql.js'],
        }
      }
    }
  },
  server: {
    port: 5173,
    host: true,
    headers: {
      // Required for SharedArrayBuffer (needed by some WASM models)
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    }
  }
});
