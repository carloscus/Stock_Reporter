import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/Stock_Reporter/', // IMPORTANTE: Nombre exacto de tu repo
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
