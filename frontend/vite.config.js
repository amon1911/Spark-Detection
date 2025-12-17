import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

 
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://anthropocentric-poisonous-darcie.ngrok-free.dev',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
