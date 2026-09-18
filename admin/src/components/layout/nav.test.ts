import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

import { navItems, pageTitleForPath } from './nav.ts'

const here = dirname(fileURLToPath(import.meta.url))

describe('admin nav (Issue #61 — #64 IA rollback)', () => {
  it('exposes only ops/catalog capabilities (no hierarchical/planned IA)', () => {
    const titles = navItems.map((item) => item.title)
    assert.deepEqual(titles, [
      'Dashboard',
      'Users',
      'Recipes',
      'Ingredients',
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

  it('does not expose end-user personal surfaces (meal plan, grocery, pantry, collections)', () => {
    const hrefs = navItems.map((item) => item.href)
    const titles = navItems.map((item) => item.title)
    for (const href of ['/grocery', '/meal-plans', '/pantry', '/collections']) {
      assert.equal(hrefs.includes(href), false, `user-personal nav leaf ${href}`)
    }
    for (const title of ['Grocery', 'Meal Plans', 'Pantry', 'Collections']) {
      assert.equal(titles.includes(title), false, `user-personal nav title ${title}`)
    }
  })

  it('marks ops catalog pages as live (Issue #92)', () => {
    const live = navItems.filter((item) => item.apiStatus === 'live').map((item) => item.href)
    for (const href of ['/', '/users', '/recipes', '/ingredients', '/categories', '/subscription']) {
      assert.equal(live.includes(href), true, `expected live nav ${href}`)
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
    assert.equal(pageTitleForPath('/recipes/abc-123'), 'Recipe Detail')
    assert.equal(pageTitleForPath('/settings/integrations'), 'Settings')
    assert.equal(pageTitleForPath('/settings/general'), 'Settings')
    assert.equal(pageTitleForPath('/grocery'), 'Admin')
    assert.equal(pageTitleForPath('/meal-plans'), 'Admin')
  })
})

describe('admin routes hide end-user personal pages', () => {
  it('does not mount grocery / meal-plan / pantry / collections pages', () => {
    const source = readFileSync(join(here, '../../App.tsx'), 'utf8')
    for (const token of [
      'GroceryPage',
      'MealPlansPage',
      'PantryPage',
      'CollectionsPage',
    ]) {
      assert.equal(source.includes(token), false, `App.tsx still mounts ${token}`)
    }
  })
})
