import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    sourcemap: true
  },
  server: {
    open: true
  },
  base: './'
})
