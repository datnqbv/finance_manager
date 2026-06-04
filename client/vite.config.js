import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    // Allow requests from ngrok hostnames used for public sharing.
    allowedHosts: ['.ngrok-free.dev', 'dreamy-karma-resample.ngrok-free.dev'],
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        // Cần cho SSE (Server-Sent Events): tắt buffering để nhận event ngay lập tức
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Connection', 'keep-alive');
          });
        }
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@react-oauth/google')) {
              return 'google-auth';
            }
            if (id.includes('recharts') || id.includes('chart.js') || id.includes('react-chartjs-2')) {
              return 'charts';
            }
            if (id.includes('framer-motion') || id.includes('gsap')) {
              return 'animations';
            }
            if (id.includes('react-icons')) {
              return 'icons';
            }
          }
        }
      }
    }
  }
})
