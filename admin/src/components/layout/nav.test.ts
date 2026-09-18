import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

import { isNavHrefActive, navItems, navLeaves, pageTitleForPath } from './nav.ts'

const here = dirname(fileURLToPath(import.meta.url))

describe('admin nav (Issue #101 — Gate-released ops pages)', () => {
  it('exposes ops/catalog plus released operational modules', () => {
    const titles = navItems.map((item) => item.title)
    assert.deepEqual(titles, [
      'Dashboard',
      'Users',
      'Recipes',
      'Ingredients',
      'Categories',
      'Commerce',
      'Analytics',
      'Operations',
      'Settings',
    ])
  })

  it('exposes live AI Import, Import Review, Payments, Analytics, and Operations leaves', () => {
    const leaves = navLeaves()
    const hrefs = leaves.map((item) => item.href)
    for (const href of [
      '/recipes/import',
      '/recipes/import-review',
      '/commerce/payments',
      '/analytics',
      '/operations/jobs',
    ]) {
      assert.equal(hrefs.includes(href), true, `missing released nav leaf ${href}`)
    }
    const byHref = Object.fromEntries(leaves.map((item) => [item.href, item.apiStatus]))
    assert.equal(byHref['/recipes/import'], 'live')
    assert.equal(byHref['/recipes/import-review'], 'live')
    assert.equal(byHref['/commerce/payments'], 'live')
    assert.equal(byHref['/analytics'], 'live')
    assert.equal(byHref['/operations/jobs'], 'live')
  })

  it('does not expose remaining placeholder or personal-surface modules as nav leaves', () => {
    const hrefs = navLeaves().map((item) => item.href)
    for (const blocked of [
      '/operations/audit-log',
      '/commerce/products',
      '/settings/ai-platform',
      '/data/collections',
      '/grocery',
      '/meal-plans',
      '/pantry',
      '/collections',
    ]) {
      assert.equal(hrefs.includes(blocked), false, `blocked nav leaf ${blocked}`)
    }
  })

  it('does not expose end-user personal surfaces (meal plan, grocery, pantry, collections)', () => {
    const titles = [...navItems.map((item) => item.title), ...navLeaves().map((item) => item.title)]
    for (const title of ['Grocery', 'Meal Plans', 'Pantry', 'Collections']) {
      assert.equal(titles.includes(title), false, `user-personal nav title ${title}`)
    }
  })

  it('keeps Settings as hybrid entry (Integrations + AI Platform live in Settings tabs)', () => {
    const settings = navItems.find((item) => item.href === '/settings')
    assert.ok(settings)
    assert.equal(settings?.apiStatus, 'hybrid')
  })

  it('resolves page titles with longest-prefix (import is not Recipe Detail)', () => {
    assert.equal(pageTitleForPath('/'), 'Dashboard')
    assert.equal(pageTitleForPath('/subscription'), 'Subscription')
    assert.equal(pageTitleForPath('/recipes/abc-123'), 'Recipe Detail')
    assert.equal(pageTitleForPath('/recipes/import'), 'AI Import')
    assert.equal(pageTitleForPath('/recipes/import-review'), 'Import Review')
    assert.equal(pageTitleForPath('/commerce/payments'), 'Payments')
    assert.equal(pageTitleForPath('/analytics'), 'Analytics')
    assert.equal(pageTitleForPath('/operations/jobs'), 'Operations')
    assert.equal(pageTitleForPath('/settings/integrations'), 'Settings')
    assert.equal(pageTitleForPath('/settings/ai-platform'), 'Settings')
    assert.equal(pageTitleForPath('/settings/general'), 'Settings')
    assert.equal(pageTitleForPath('/grocery'), 'Admin')
    assert.equal(pageTitleForPath('/meal-plans'), 'Admin')
  })

  it('does not mark AI Import as the Recipes catalog item', () => {
    assert.equal(isNavHrefActive('/recipes', '/recipes'), true)
    assert.equal(isNavHrefActive('/recipes', '/recipes/abc-123'), true)
    assert.equal(isNavHrefActive('/recipes', '/recipes/import'), false)
    assert.equal(isNavHrefActive('/recipes', '/recipes/import-review'), false)
    assert.equal(isNavHrefActive('/recipes/import', '/recipes/import'), true)
  })
})

describe('admin routes hide end-user personal pages and mount ops pages', () => {
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

  it('mounts Gate-released operational pages instead of redirects', () => {
    const source = readFileSync(join(here, '../../App.tsx'), 'utf8')
    for (const token of [
      'ImportPage',
      'ImportReviewPage',
      'PaymentsPage',
      'AnalyticsPage',
      'OperationsPage',
    ]) {
      assert.equal(source.includes(token), true, `App.tsx missing ${token}`)
    }
    assert.equal(source.includes('path="recipes/import" element={<Navigate'), false)
    assert.equal(source.includes('path="analytics" element={<Navigate'), false)
    assert.equal(source.includes('path="commerce/payments" element={<Navigate'), false)
  })
})
