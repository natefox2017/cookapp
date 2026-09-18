import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

/**
 * Lightweight structural checks for nav IA (Issue #64).
 * Imports the compiled TS via strip-types like password-policy tests.
 */
import {
  flattenNavLeaves,
  isNavGroup,
  isPathUnderGroup,
  navItems,
  pageTitleForPath,
} from './nav.ts'

describe('admin nav IA (#64)', () => {
  it('exposes Notion §14 top-level groups and leaves', () => {
    const titles = navItems.map((entry) => entry.title)
    assert.deepEqual(titles, [
      'Dashboard',
      'Users',
      'Recipes',
      'Commerce',
      'Analytics',
      'Operations',
      'Data',
      'Settings',
    ])
  })

  it('keeps existing capabilities reachable as leaves', () => {
    const hrefs = new Set(flattenNavLeaves().map((leaf) => leaf.href))
    for (const href of [
      '/',
      '/users',
      '/recipes',
      '/commerce/products',
      '/data/collections',
      '/data/ingredients',
      '/data/grocery',
      '/data/meal-plans',
      '/data/pantry',
      '/data/categories',
      '/settings/general',
      '/settings/security',
      '/settings/system',
    ]) {
      assert.ok(hrefs.has(href), `missing leaf ${href}`)
    }
  })

  it('marks planned secondary menus so they are not fake-complete', () => {
    const planned = flattenNavLeaves().filter((leaf) => leaf.apiStatus === 'planned')
    const titles = planned.map((leaf) => leaf.title).sort()
    assert.deepEqual(titles, [
      'AI Import',
      'AI Platform',
      'Analytics',
      'Audit Log',
      'Import Review',
      'Integrations',
      'Jobs & Syncs',
      'Payments',
    ])
  })

  it('resolves page titles for nested routes and recipe detail', () => {
    assert.equal(pageTitleForPath('/'), 'Dashboard')
    assert.equal(pageTitleForPath('/commerce/products'), 'Products · Subscriptions')
    assert.equal(pageTitleForPath('/data/grocery'), 'Grocery')
    assert.equal(pageTitleForPath('/recipes/import'), 'AI Import')
    assert.equal(pageTitleForPath('/recipes/abc-123'), 'Recipe Detail')
    assert.equal(pageTitleForPath('/settings/ai-platform'), 'AI Platform')
  })

  it('detects path membership for collapsible groups', () => {
    const recipes = navItems.find((entry) => isNavGroup(entry) && entry.title === 'Recipes')
    assert.ok(recipes && isNavGroup(recipes))
    assert.equal(isPathUnderGroup('/recipes', recipes), true)
    assert.equal(isPathUnderGroup('/recipes/import', recipes), true)
    assert.equal(isPathUnderGroup('/recipes/xyz', recipes), true)
    assert.equal(isPathUnderGroup('/users', recipes), false)
  })
})
