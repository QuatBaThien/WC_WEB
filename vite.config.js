import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/WC_WEB/',
  plugins: [react()],
  server: {
    host: true,
    port: 8080
  }
})

