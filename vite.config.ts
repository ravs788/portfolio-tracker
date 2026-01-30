import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  build: {
    // Raise the warning limit since we are code-splitting vendor libs
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        // Group heavy dependencies into their own chunks to improve caching and reduce initial load
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts')) return 'vendor-charts';
            if (id.includes('@mui') || id.includes('@emotion')) return 'vendor-mui';
            if (id.includes('date-fns')) return 'vendor-date-fns';
            if (id.includes('react')) return 'vendor-react';
            return 'vendor';
          }
        },
      },
    },
  },
})
