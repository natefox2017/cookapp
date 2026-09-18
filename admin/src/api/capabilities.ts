/**
 * Admin write-capability gate for live pending domains (#61).
 *
 * Live mode must not show CRUD that will 501. Mock/dev keeps existing writes.
 * Merge-order safe with #93: Vite inlines whether `catalog.ts` / `recipes.ts`
 * already call `/functions/v1/admin-catalog` (see vite.config.ts). Node tests
 * set the same flags from those files via `globalThis`.
 */

/** Domains that may be 501-pending or live via admin-catalog. Independent of `PendingAdminDomain` so #93 can set that type to `never`. */
export type AdminWriteDomain =
  | 'recipes'
  | 'collections'
  | 'ingredients'
  | 'grocery'
  | 'meal-plans'
  | 'pantry'
  | 'categories'
  | 'settings-persist'

export const ADMIN_CATALOG_PATH = '/functions/v1/admin-catalog'

declare const __COOKAPP_ADMIN_CATALOG_LIVE__: boolean | undefined
declare const __COOKAPP_ADMIN_RECIPES_LIVE__: boolean | undefined

type TestLiveFlags = {
  __cookappAdminCatalogLive?: boolean
  __cookappAdminRecipesLive?: boolean
}

export function functionUsesAdminCatalog(fn: Function): boolean {
  return Function.prototype.toString.call(fn).includes(ADMIN_CATALOG_PATH)
}

function viteOrTestFlag(viteValue: () => boolean | undefined, testKey: keyof TestLiveFlags): boolean {
  try {
    const value = viteValue()
    if (typeof value === 'boolean') return value
  } catch {
    /* node tests: identifier is not defined */
  }
  return (globalThis as TestLiveFlags)[testKey] === true
}

export function catalogClientIsLive(): boolean {
  return viteOrTestFlag(() => __COOKAPP_ADMIN_CATALOG_LIVE__, '__cookappAdminCatalogLive')
}

export function recipesClientIsLive(): boolean {
  return viteOrTestFlag(() => __COOKAPP_ADMIN_RECIPES_LIVE__, '__cookappAdminRecipesLive')
}

export function domainHasLiveCatalogClient(domain: AdminWriteDomain): boolean {
  if (domain === 'recipes') return recipesClientIsLive()
  return catalogClientIsLive()
}

export function canWritePendingDomain(mockMode: boolean, domain?: AdminWriteDomain): boolean {
  if (mockMode === true) return true
  if (!domain) return false
  return domainHasLiveCatalogClient(domain)
}

export function pendingWriteMessage(domain: AdminWriteDomain): string {
  return `Live Admin ${domain} API is pending (not_implemented). Write actions are hidden until the live contract exists.`
}

export function writeCapability(domain: AdminWriteDomain, mockMode: boolean) {
  const canWrite = canWritePendingDomain(mockMode, domain)
  return {
    domain,
    canWrite,
    reason: canWrite ? null : pendingWriteMessage(domain),
  }
}
