import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Get host and port from environment variables or use defaults
const HOST = process.env.VITE_HOST || 'localhost'
const PORT = parseInt(process.env.PORT, 10) || 3000

export default defineConfig({
  plugins: [react()],
  server: {
    port: PORT,
    host: true, // Allow network access
    cors: true // Enable CORS for development
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false // Disable sourcemaps in production to reduce bundle size
  },
  resolve: {
    alias: {
      '@': '/src' // Optional: Enable @ imports
    }
  }
})
