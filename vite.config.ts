import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    port: 8877,
    host: '0.0.0.0',
    proxy: {
      '/1': {
        target: 'http://10.10.12.50:3000',
        changeOrigin: true,
        cookieDomainRewrite: 'localhost',
        secure: false,
      },
      '/2': {
        target: 'http://10.10.12.50:3000',
        changeOrigin: true,
        cookieDomainRewrite: 'localhost',
        secure: false,
      },
      '/static': {
        target: 'http://10.10.12.50:3000',
        changeOrigin: true,
        cookieDomainRewrite: 'localhost',
        secure: false,
      },
    },
  },
})
