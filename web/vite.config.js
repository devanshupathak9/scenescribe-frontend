import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // Where the dev server forwards /api and /uploads.
  // Normally this is the same origin the browser talks to (VITE_API_URL), but in
  // Docker they differ: the browser reaches the API through this proxy on
  // localhost:5173, while the proxy itself must dial the `api` service by its
  // container name. VITE_PROXY_TARGET overrides the target for that case.
  const proxyTarget =
    process.env.VITE_PROXY_TARGET || env.VITE_PROXY_TARGET || env.VITE_API_URL || 'http://localhost:3001'

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': proxyTarget,
        '/uploads': proxyTarget,
      },
    },
  }
})
