import { ApiError } from '@/api/client'

/** Domains without a live Admin Edge Function (see docs/backend/ADMIN_API_CONTRACT.md). */
export type PendingAdminDomain =
  | 'recipes'
  | 'collections'
  | 'ingredients'
  | 'grocery'
  | 'meal-plans'
  | 'pantry'
  | 'categories'
  | 'settings-persist'

const MESSAGES: Record<PendingAdminDomain, string> = {
  recipes:
    'Live Admin Recipes API is not implemented yet. Use mock mode for UI work, or wait for Backend V2 (#55).',
  collections:
    'Live Admin Collections API is not implemented yet (contract: missing). See docs/backend/ADMIN_API_CONTRACT.md.',
  ingredients:
    'Live Admin Ingredients API is not implemented yet (contract: missing).',
  grocery:
    'Live Admin Grocery API is not implemented yet (contract: missing).',
  'meal-plans':
    'Live Admin Meal Plans API is not implemented yet (contract: missing).',
  pantry: 'Live Admin Pantry API is not implemented yet (contract: missing).',
  categories:
    'Live Admin Categories API is not implemented yet (contract: missing).',
  'settings-persist':
    'Live Admin Settings persist API is not implemented. Security password changes use admin-auth; general settings are diagnostics-only in live mode.',
}

/**
 * Fail loudly in live mode instead of calling non-existent `/admin/…` paths
 * or silently returning mock KPI/catalog data.
 */
export function notImplemented(domain: PendingAdminDomain): never {
  throw new ApiError(MESSAGES[domain], 501, 'not_implemented')
}

export function isNotImplementedError(err: unknown): boolean {
  return err instanceof ApiError && (err.status === 501 || err.code === 'not_implemented')
}
