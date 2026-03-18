import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    https: true,
    host: true,
    port: 5173,
    strictPort: true,
    allowedHosts: true,
    proxy: {
      "/api": {
        target: "http://10.0.0.52:3000",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, "")

      }
    }
  }
})
