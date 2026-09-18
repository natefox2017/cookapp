import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { navItems, pageTitleForPath } from './nav.ts'

describe('admin nav (Issue #61 — #64 IA rollback)', () => {
  it('exposes only approved flat capabilities (no hierarchical/planned IA)', () => {
    const titles = navItems.map((item) => item.title)
    assert.deepEqual(titles, [
      'Dashboard',
      'Users',
      'Recipes',
      'Collections',
      'Ingredients',
      'Grocery',
      'Meal Plans',
      'Pantry',
      'Categories',
      'Subscription',
      'Settings',
    ])
  })

  it('does not expose Gate-blocked planned modules as nav leaves', () => {
    const hrefs = navItems.map((item) => item.href)
    for (const blocked of [
      '/analytics',
      '/operations/jobs',
      '/operations/audit-log',
      '/commerce/payments',
      '/commerce/products',
      '/recipes/import',
      '/recipes/import-review',
      '/settings/ai-platform',
      '/data/collections',
    ]) {
      assert.equal(hrefs.includes(blocked), false, `blocked nav leaf ${blocked}`)
    }
  })

  it('keeps Settings as hybrid entry (Integrations lives in Settings tabs via #63)', () => {
    const settings = navItems.find((item) => item.href === '/settings')
    assert.ok(settings)
    assert.equal(settings?.apiStatus, 'hybrid')
  })

  it('resolves page titles for existing routes and recipe detail', () => {
    assert.equal(pageTitleForPath('/'), 'Dashboard')
    assert.equal(pageTitleForPath('/subscription'), 'Subscription')
    assert.equal(pageTitleForPath('/grocery'), 'Grocery')
    assert.equal(pageTitleForPath('/recipes/abc-123'), 'Recipe Detail')
    assert.equal(pageTitleForPath('/settings/integrations'), 'Settings')
    assert.equal(pageTitleForPath('/settings/general'), 'Settings')
  })
})
