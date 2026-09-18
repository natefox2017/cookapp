import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const opsSource = readFileSync(join(here, 'ops.ts'), 'utf8')
const mocksSource = readFileSync(join(here, '../mocks/ops.ts'), 'utf8')

describe('admin ops API client (Issue #101)', () => {
  it('calls live Edge Functions rather than /admin/ placeholders', () => {
    const required = [
      '/functions/v1/admin-analytics',
      '/functions/v1/admin-operations/jobs',
      '/functions/v1/admin-operations/jobs/run',
      '/functions/v1/admin-subscriptions/transactions',
      '/functions/v1/admin-recipe-import/jobs',
      '/functions/v1/admin-ai/providers',
      '/functions/v1/admin-ai/models',
      '/functions/v1/admin-ai/routes',
      '/functions/v1/admin-ai/usage',
      '/functions/v1/admin-ai/health',
    ]
    for (const path of required) {
      assert.equal(opsSource.includes(path), true, `missing live path ${path}`)
    }
    assert.equal(opsSource.includes('/admin/analytics'), false)
    assert.equal(opsSource.includes('/admin/payments'), false)
    assert.equal(opsSource.includes('/admin/ai'), false)
  })

  it('keeps Google Play Future Reserved in mock analytics (never fake Android zeros)', () => {
    assert.match(mocksSource, /future_reserved/)
    assert.match(mocksSource, /Google Play/)
    assert.doesNotMatch(
      mocksSource,
      /downloadsAndroid:\s*0/,
      'must not seed fake Android download zeros',
    )
  })
})
