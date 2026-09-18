/** Domains without a live Admin Edge Function (see docs/backend/ADMIN_API_CONTRACT.md). */
export type PendingAdminDomain = never

/**
 * Fail loudly in live mode instead of calling non-existent `/admin/…` paths
 * or silently returning mock KPI/catalog data.
 *
 * Catalog Data pages now hit `admin-catalog` (#92). Keep this helper for
 * future Gate-deferred domains.
 */
export function notImplemented(domain: string): never {
  throw new Error(`Live Admin API is not implemented for domain: ${domain}`)
}

export function isNotImplementedError(err: unknown): boolean {
  return err instanceof Error && /not implemented/i.test(err.message)
}
