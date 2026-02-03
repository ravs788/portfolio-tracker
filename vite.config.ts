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
            const path = id.replace(/\\/g, '/');
            // Keep React core and libraries that expect the React namespace together.
            // This avoids cases where CJS shims (e.g., use-sync-external-store) evaluate
            // React.useState while React is in a different async chunk, leading to
            // "Cannot read properties of undefined (reading 'useState')".
            if (/(^|\/)node_modules\/(react|react-dom|scheduler|react-router|react-router-dom|use-sync-external-store|zustand)(\/|$)/.test(path)) {
              return 'vendor-react';
            }
            if (/node_modules\/recharts\//.test(path)) return 'vendor-charts';
            if (/node_modules\/(@mui|@emotion)\//.test(path)) return 'vendor-mui';
            if (/node_modules\/date-fns\//.test(path)) return 'vendor-date-fns';
            return 'vendor';
          }
        },
      },
    },
  },
})
