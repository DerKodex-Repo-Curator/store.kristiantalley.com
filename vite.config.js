import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Base path for production build - adjust if hosting in a subdirectory
  base: '/',
  build: {
    // Output directory for nginx to serve
    outDir: 'dist',
    // Generate source maps for debugging
    sourcemap: false,
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          shopify: ['@shopify/storefront-api-client'],
        },
      },
    },
  },
  // Environment variable prefix for client-side exposure
  envPrefix: 'VITE_',
})
