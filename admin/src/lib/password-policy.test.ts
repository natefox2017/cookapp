import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  isDefaultAdminCredentials,
  validateAdminPassword,
} from './password-policy.ts'

describe('validateAdminPassword', () => {
  it('rejects short passwords', () => {
    const r = validateAdminPassword('Ab1')
    assert.equal(r.ok, false)
  })

  it('rejects missing character classes', () => {
    assert.equal(validateAdminPassword('abcdefghijkl').ok, false)
    assert.equal(validateAdminPassword('ABCDEFGHIJKL').ok, false)
    assert.equal(validateAdminPassword('Abcdefghijkl').ok, false)
  })

  it('rejects common passwords', () => {
    assert.equal(validateAdminPassword('password1234').ok, false)
  })

  it('accepts strong passwords', () => {
    const r = validateAdminPassword('CookAppOwner1!')
    assert.equal(r.ok, true)
  })
})

describe('isDefaultAdminCredentials', () => {
  it('detects admin/admin', () => {
    assert.equal(isDefaultAdminCredentials('admin', 'admin'), true)
    assert.equal(isDefaultAdminCredentials('Admin', 'admin'), true)
    assert.equal(isDefaultAdminCredentials('admin', 'other'), false)
  })
})
