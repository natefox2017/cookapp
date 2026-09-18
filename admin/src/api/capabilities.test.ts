import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

import {
  ADMIN_CATALOG_PATH,
  canWritePendingDomain,
  domainHasLiveCatalogClient,
  functionUsesAdminCatalog,
  pendingWriteMessage,
  writeCapability,
  type AdminWriteDomain,
} from './capabilities.ts'

const here = dirname(fileURLToPath(import.meta.url))

function sourceUsesAdminCatalog(fileName: string): boolean {
  return readFileSync(join(here, fileName), 'utf8').includes(ADMIN_CATALOG_PATH)
}

const catalogLive = sourceUsesAdminCatalog('catalog.ts')
const recipesLive = sourceUsesAdminCatalog('recipes.ts')
const testFlags = globalThis as {
  __cookappAdminCatalogLive?: boolean
  __cookappAdminRecipesLive?: boolean
}
testFlags.__cookappAdminCatalogLive = catalogLive
testFlags.__cookappAdminRecipesLive = recipesLive

describe('admin write capability (#61 live pending domains)', () => {
  it('allows writes in mock mode even when the live client is pending', () => {
    assert.equal(canWritePendingDomain(true), true)
    assert.equal(canWritePendingDomain(true, 'ingredients'), true)
    assert.equal(writeCapability('ingredients', true).canWrite, true)
    assert.equal(writeCapability('ingredients', true).reason, null)
  })

  it('matches catalog.ts / recipes.ts admin-catalog client (merge-safe with #93)', () => {
    assert.equal(domainHasLiveCatalogClient('ingredients'), catalogLive)
    assert.equal(domainHasLiveCatalogClient('categories'), catalogLive)
    assert.equal(domainHasLiveCatalogClient('settings-persist'), catalogLive)
    assert.equal(domainHasLiveCatalogClient('collections'), catalogLive)
    assert.equal(domainHasLiveCatalogClient('recipes'), recipesLive)

    const liveIngredients = writeCapability('ingredients', false)
    assert.equal(liveIngredients.canWrite, catalogLive)
    if (!catalogLive) {
      assert.match(liveIngredients.reason ?? '', /not_implemented/)
      assert.match(pendingWriteMessage('categories'), /categories/)
    } else {
      assert.equal(liveIngredients.reason, null)
    }

    const liveRecipes = writeCapability('recipes', false)
    assert.equal(liveRecipes.canWrite, recipesLive)
  })

  it('detects admin-catalog clients from function source', () => {
    const pending = () => {
      throw new Error('not_implemented')
    }
    const live = () => '/functions/v1/admin-catalog/ingredients'
    assert.equal(functionUsesAdminCatalog(pending), false)
    assert.equal(functionUsesAdminCatalog(live), true)
  })

  it('keeps AdminWriteDomain usable after PendingAdminDomain becomes never', () => {
    const domains: AdminWriteDomain[] = [
      'recipes',
      'collections',
      'ingredients',
      'grocery',
      'meal-plans',
      'pantry',
      'categories',
      'settings-persist',
    ]
    for (const domain of domains) {
      const mock = writeCapability(domain, true)
      assert.equal(mock.canWrite, true)
      assert.equal(mock.domain, domain)
    }
  })
})
