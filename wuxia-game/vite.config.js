/// <reference types="vitest" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    globals: true, // Allows using describe, it, expect without imports
    include: ['**/*.test.js'],
  },
})
