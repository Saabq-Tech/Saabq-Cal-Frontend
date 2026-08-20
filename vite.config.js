import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify(
      '333771442482-0ip5t2oeentnfm6rjac75fj40891iuam.apps.googleusercontent.com'
    ),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom') || id.includes('react-helmet-async')) {
              return 'vendor-react';
            }
            if (id.includes('firebase')) {
              return 'vendor-firebase';
            }
            if (id.includes('axios')) {
              return 'vendor-axios';
            }
            return 'vendor-utils';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 3000,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'https://admin.cal.saabq.com',
        changeOrigin: true,
        secure: false,
      },
      '/storage': {
        target: 'https://admin.cal.saabq.com',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
