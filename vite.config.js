import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { polarDevPlugin } from './vite-plugin-polar.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), polarDevPlugin()],
})
