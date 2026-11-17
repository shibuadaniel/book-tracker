import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const nytProxy = {
  '/api/nyt': {
    target: 'https://api.nytimes.com',
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/api\/nyt/, '/svc/books/v3'),
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    proxy: nytProxy,
  },
  preview: {
    host: '127.0.0.1',
    port: 4173,
    proxy: nytProxy,
  },
})
