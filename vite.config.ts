import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Server-side proxy hop, so this must be a target the dev-server process can
// reach: in Docker that's the compose service (`api`), not localhost (which is
// the admin container itself). On the host it's localhost.
const proxyTarget = process.env.VITE_DEV_PROXY_TARGET ?? 'http://localhost:8000'

export default defineConfig({
  plugins: [tailwindcss(), react()],
  base: '/admin/',
  server: {
    proxy: {
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
      },
      // Locally-stored media (mission covers) is served same-origin via this
      // hop so <img src="/media/…"> resolves against the admin origin. In prod
      // (S3) image URLs are absolute and skip the dev server.
      '/media': {
        target: proxyTarget,
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    exclude: ['**/node_modules/**', '**/tests/e2e/**'],
    coverage: {
      provider: 'v8',
      include: ['src/features/**', 'src/api/**'],
      exclude: ['**/tests/e2e/**'],
      thresholds: {
        lines: 80,
      },
    },
  },
})
