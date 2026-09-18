import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const adminCatalogPath = '/functions/v1/admin-catalog'
const catalogClientLive = readFileSync(path.join(rootDir, 'src/api/catalog.ts'), 'utf8').includes(
  adminCatalogPath,
)
const recipesClientLive = readFileSync(path.join(rootDir, 'src/api/recipes.ts'), 'utf8').includes(
  adminCatalogPath,
)

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
  define: {
    __COOKAPP_ADMIN_CATALOG_LIVE__: JSON.stringify(catalogClientLive),
    __COOKAPP_ADMIN_RECIPES_LIVE__: JSON.stringify(recipesClientLive),
  },
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
