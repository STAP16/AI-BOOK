import { cp } from 'node:fs/promises'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const copyBookAssets = () => ({
  name: 'copy-book-assets',
  async closeBundle() {
    await cp(resolve('book-assets'), resolve('dist/book-assets'), { recursive: true, force: true })
  },
})

export default defineConfig({
  plugins: [react(), copyBookAssets()],
  base: '/AI-BOOK/',
  server: { host: '0.0.0.0' },
})
