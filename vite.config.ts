import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  base: '/admin/',
  build: {
    sourcemap: false, // Отключите source maps для продакшена
    rollupOptions: {
      output: {
        manualChunks: {
          // Выносим MUI Material в отдельный файл (тяжёлый)
          'mui-material': ['@mui/material', '@emotion/react', '@emotion/styled'],
          // Выносим MUI Joy отдельно (если используется)
          'mui-joy': ['@mui/joy'],
          // Выносим графики отдельно
          'mui-charts': ['@mui/x-charts'],
          // React и роутер
          'react-vendor': ['react', 'react-dom', 'react-router'],
        },
      },
    },
  }
})
