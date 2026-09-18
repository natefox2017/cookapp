import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

import { isNavHrefActive, navItems, navLeaves, pageTitleForPath } from './nav.ts'

const here = dirname(fileURLToPath(import.meta.url))

describe('admin nav (Issue #104 — §14 IA rebuild)', () => {
  it('exposes primary §14 IA groups', () => {
    const titles = navItems.map((item) => item.title)
    assert.deepEqual(titles, [
      'Dashboard',
      'Users',
      'Commerce',
      'Analytics',
      'Content & AI',
      'Operations',
      'Settings',
    ])
  })

  it('exposes Commerce / Content / Operations leaves with live status', () => {
    const leaves = navLeaves()
    const hrefs = leaves.map((item) => item.href)
    for (const href of [
      '/commerce',
      '/commerce/subscriptions',
      '/commerce/payments',
      '/commerce/products',
      '/analytics',
      '/content/recipes',
      '/content/import',
      '/content/import-review',
      '/content/taxonomy',
      '/operations/health',
      '/operations/jobs',
      '/operations/errors',
      '/operations/audit-log',
      '/settings/runtime-config',
      '/settings/ai-platform',
    ]) {
      assert.equal(hrefs.includes(href), true, `missing nav leaf ${href}`)
    }
    const byHref = Object.fromEntries(leaves.map((item) => [item.href, item.apiStatus]))
    assert.equal(byHref['/content/import'], 'live')
    assert.equal(byHref['/commerce/payments'], 'live')
    assert.equal(byHref['/operations/jobs'], 'live')
    assert.equal(byHref['/operations/audit-log'], 'live')
  })

  it('does not expose personal-content or pre-§14 flat catalog as primary leaves', () => {
    const hrefs = navLeaves().map((item) => item.href)
    for (const blocked of [
      '/recipes',
      '/ingredients',
      '/categories',
      '/subscription',
      '/data/collections',
      '/grocery',
      '/meal-plans',
      '/pantry',
      '/collections',
    ]) {
      assert.equal(hrefs.includes(blocked), false, `blocked nav leaf ${blocked}`)
    }
  })

  it('labels System Recipe Library (not user recipes)', () => {
    const leaf = navLeaves().find((item) => item.href === '/content/recipes')
    assert.equal(leaf?.title, 'System Recipe Library')
  })

  it('does not expose end-user personal surfaces', () => {
    const titles = [...navItems.map((item) => item.title), ...navLeaves().map((item) => item.title)]
    for (const title of ['Grocery', 'Meal Plans', 'Pantry', 'Collections']) {
      assert.equal(titles.includes(title), false, `user-personal nav title ${title}`)
    }
  })

  it('keeps Settings as hybrid entry', () => {
    const settings = navItems.find((item) => item.href === '/settings')
    assert.ok(settings)
    assert.equal(settings?.apiStatus, 'hybrid')
  })

  it('resolves page titles for §14 paths', () => {
    assert.equal(pageTitleForPath('/'), 'Dashboard')
    assert.equal(pageTitleForPath('/commerce'), 'Commerce Overview')
    assert.equal(pageTitleForPath('/commerce/subscriptions'), 'Subscriptions')
    assert.equal(pageTitleForPath('/commerce/payments'), 'Payments')
    assert.equal(pageTitleForPath('/commerce/products'), 'Products & Plans')
    assert.equal(pageTitleForPath('/content/recipes'), 'System Recipe Library')
    assert.equal(pageTitleForPath('/content/recipes/abc-123'), 'System Recipe Detail')
    assert.equal(pageTitleForPath('/content/import'), 'AI Import')
    assert.equal(pageTitleForPath('/content/import-review'), 'Import Review')
    assert.equal(pageTitleForPath('/content/taxonomy'), 'Taxonomy')
    assert.equal(pageTitleForPath('/operations/health'), 'System Health')
    assert.equal(pageTitleForPath('/operations/jobs'), 'Jobs & Syncs')
    assert.equal(pageTitleForPath('/operations/errors'), 'Errors & Incidents')
    assert.equal(pageTitleForPath('/operations/audit-log'), 'Audit Log')
    assert.equal(pageTitleForPath('/settings/integrations'), 'Integrations')
    assert.equal(pageTitleForPath('/settings/ai-platform'), 'AI Platform')
    assert.equal(pageTitleForPath('/settings/runtime-config'), 'Runtime Config')
    assert.equal(pageTitleForPath('/settings/general'), 'General')
    assert.equal(pageTitleForPath('/grocery'), 'Admin')
  })

  it('does not mark AI Import as the System Recipe Library item', () => {
    assert.equal(isNavHrefActive('/content/recipes', '/content/recipes'), true)
    assert.equal(isNavHrefActive('/content/recipes', '/content/recipes/abc-123'), true)
    assert.equal(isNavHrefActive('/content/recipes', '/content/import'), false)
    assert.equal(isNavHrefActive('/content/recipes', '/content/import-review'), false)
    assert.equal(isNavHrefActive('/content/import', '/content/import'), true)
    assert.equal(isNavHrefActive('/commerce', '/commerce'), true)
    assert.equal(isNavHrefActive('/commerce', '/commerce/payments'), false)
  })
})

describe('admin routes mount §14 IA pages and redirect legacy paths', () => {
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

  it('mounts §14 pages instead of placeholder redirects', () => {
    const source = readFileSync(join(here, '../../App.tsx'), 'utf8')
    for (const token of [
      'ImportPage',
      'ImportReviewPage',
      'PaymentsPage',
      'AnalyticsPage',
      'OperationsPage',
      'CommerceOverviewPage',
      'ProductsPage',
      'TaxonomyPage',
      'HealthPage',
      'ErrorsPage',
      'AuditLogPage',
    ]) {
      assert.equal(source.includes(token), true, `App.tsx missing ${token}`)
    }
    assert.equal(source.includes('path="content/import"'), true)
    assert.equal(source.includes('path="commerce/payments"'), true)
    assert.equal(source.includes('path="operations/audit-log" element={<AuditLogPage'), true)
    assert.equal(source.includes('path="operations/audit-log" element={<Navigate'), false)
  })

  it('redirects legacy catalog paths into §14 IA', () => {
    const source = readFileSync(join(here, '../../App.tsx'), 'utf8')
    assert.equal(source.includes('path="recipes" element={<Navigate to="/content/recipes"'), true)
    assert.equal(
      source.includes('path="ingredients" element={<Navigate to="/content/taxonomy"'),
      true,
    )
    assert.equal(
      source.includes('path="subscription" element={<Navigate to="/commerce/subscriptions"'),
      true,
    )
  })
})
