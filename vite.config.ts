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
      '/api/webrtc': {
        target: 'http://127.0.0.1:1984',
        changeOrigin: true,
        secure: false,
      },
      '/api/streams': {
        target: 'http://127.0.0.1:1984',
        changeOrigin: true,
        secure: false,
      },
      // Proxy for go2rtc MP4 streaming/downloading without timeout
      '/api/stream.mp4': {
        target: 'http://127.0.0.1:1984',
        changeOrigin: true,
        secure: false,
        timeout: 0, // Disable proxy timeout for massive 1-hour streams
        proxyTimeout: 0,
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            // Force browser save dialog instead of inline streaming
            proxyRes.headers['content-disposition'] = 'attachment; filename="OmniRecord_Video.mp4"';
          });
        }
      },
      // Proxy for Hikvision NVR ISAPI
      '/api/nvr': {
        target: 'http://10.10.12.2', // NVR IP address
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/nvr/, ''),
        // NVR credentials placeholder (requires NVR to support Basic Auth)
        auth: 'admin:16@SnV?cR1',
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            if (proxyRes.statusCode === 401) {
              delete proxyRes.headers['www-authenticate'];
            }
          });
        }
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
