import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))

describe('admin dashboard ops KPIs', () => {
  it('does not surface grocery / meal plan / pantry / collections / favorites as dashboard cards', () => {
    const source = readFileSync(join(here, 'dashboard-page.tsx'), 'utf8')
    for (const label of ['Grocery', 'Meal Plans', 'Pantry', 'Collections', 'Favorites']) {
      assert.equal(
        source.includes(`label: '${label}'`) || source.includes(`label: "${label}"`),
        false,
        `dashboard still shows user-personal KPI ${label}`,
      )
    }
  })
})
