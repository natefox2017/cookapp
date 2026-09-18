/**
 * Admin write-capability gate for live pending domains (#61).
 * Live mode must not show CRUD that will 501; mock/dev keeps existing writes.
 */

import type { PendingAdminDomain } from '@/api/not-implemented'

export function canWritePendingDomain(mockMode: boolean): boolean {
  return mockMode === true
}

export function pendingWriteMessage(domain: PendingAdminDomain): string {
  return `Live Admin ${domain} API is pending (not_implemented). Write actions are hidden until the live contract exists.`
}

export function writeCapability(domain: PendingAdminDomain, mockMode: boolean) {
  const canWrite = canWritePendingDomain(mockMode)
  return {
    domain,
    canWrite,
    reason: canWrite ? null : pendingWriteMessage(domain),
  }
}
