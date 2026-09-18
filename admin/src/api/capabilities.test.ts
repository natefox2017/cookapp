import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { canWritePendingDomain, pendingWriteMessage, writeCapability } from './capabilities.ts'

describe('admin write capability (#61 live pending domains)', () => {
  it('allows writes only in mock mode', () => {
    assert.equal(canWritePendingDomain(true), true)
    assert.equal(canWritePendingDomain(false), false)
  })

  it('live pending domains hide writes with an explicit reason', () => {
    const live = writeCapability('ingredients', false)
    assert.equal(live.canWrite, false)
    assert.match(live.reason ?? '', /not_implemented/)
    assert.match(pendingWriteMessage('categories'), /categories/)

    const mock = writeCapability('categories', true)
    assert.equal(mock.canWrite, true)
    assert.equal(mock.reason, null)
  })
})
