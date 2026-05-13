import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      '.ngrok-free.dev',  // 모든 ngrok-free.dev 주소 허용
      '.ngrok-free.app',  // 모든 ngrok-free.app 주소 허용
      '.ngrok.io',         // 옛날 ngrok 주소도 허용
    ],
  },
})