import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base:"/jin-poc",
  plugins: [react()],
  server: {
    port: 7777,
  },
  build:{
    rollupOptions:{
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith(".jpg")) {
            // Keep original name but hashed for cache busting
            return "assets/[name]-[hash][extname]";
          }
          return "assets/[name]-[hash][extname]";
        },
      },
    }
  }
})
