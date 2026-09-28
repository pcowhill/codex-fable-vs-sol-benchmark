import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Base path for static hosting under a sub-path (e.g. GitHub Pages project sites):
//   BASE_PATH=/<repo-name>/ npm run build
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
