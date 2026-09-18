import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

/** Fail production-mode builds that enable mock KPI/data (Issue #51). */
function forbidProductionMock(): Plugin {
  return {
    name: 'forbid-production-mock',
    configResolved(config) {
      if (config.command !== 'build') return
      const mode = config.mode
      const fromProcess = process.env.VITE_ADMIN_USE_MOCK
      const fromViteEnv = config.env?.VITE_ADMIN_USE_MOCK
      const mockEnabled = fromProcess === 'true' || fromViteEnv === 'true'

      if (mode === 'production' && mockEnabled) {
        throw new Error(
          'VITE_ADMIN_USE_MOCK=true is forbidden for production admin builds (Issue #51).',
        )
      }

      // Release artifacts must use production mode (blocks --mode development deploys).
      if (process.env.COOKAPP_ADMIN_RELEASE_BUILD === 'true' && mode !== 'production') {
        throw new Error(
          'COOKAPP_ADMIN_RELEASE_BUILD requires vite production mode (Issue #51).',
        )
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), forbidProductionMock()],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
})
