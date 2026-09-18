import { API_BASE, httpRequest, isMockMode, mockRequest } from '@/api/client'
import {
  mockCategories,
  mockCollections,
  mockCuisines,
  mockGroceryItems,
  mockGroceryUsers,
  mockIngredients,
  mockMealPlans,
  mockPantry,
  mockSettings,
  mockTags,
} from '@/mocks/data'
import type {
  AdminSettings,
  CollectionSummary,
  GroceryItem,
  GroceryUser,
  Ingredient,
  IngredientInput,
  MealPlanEntry,
  PantryItem,
  TaxonomyItem,
} from '@/types/admin'

function replaceList<T>(target: T[], next: T[]) {
  target.splice(0, target.length, ...next)
}

export async function listCollections(): Promise<CollectionSummary[]> {
  if (isMockMode()) return mockRequest(() => mockCollections)
  return httpRequest('/functions/v1/admin-catalog/collections')
}

export async function listIngredients(): Promise<Ingredient[]> {
  if (isMockMode()) return mockRequest(() => [...mockIngredients])
  return httpRequest('/functions/v1/admin-catalog/ingredients')
}

export async function createIngredient(input: IngredientInput): Promise<Ingredient> {
  if (isMockMode()) {
    return mockRequest(() => {
      const item: Ingredient = { id: `ing_${Date.now()}`, ...input }
      mockIngredients.unshift(item)
      return item
    })
  }
  return httpRequest('/functions/v1/admin-catalog/ingredients', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function updateIngredient(id: string, input: IngredientInput): Promise<Ingredient> {
  if (isMockMode()) {
    return mockRequest(() => {
      const index = mockIngredients.findIndex((item) => item.id === id)
      if (index < 0) throw new Error(`Ingredient ${id} not found`)
      const next = { id, ...input }
      mockIngredients[index] = next
      return next
    })
  }
  return httpRequest(`/functions/v1/admin-catalog/ingredients/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export async function deleteIngredient(id: string): Promise<void> {
  if (isMockMode()) {
    return mockRequest(() => {
      replaceList(
        mockIngredients,
        mockIngredients.filter((item) => item.id !== id),
      )
    })
  }
  await httpRequest(`/functions/v1/admin-catalog/ingredients/${id}`, { method: 'DELETE' })
}

export async function listGroceryUsers(): Promise<GroceryUser[]> {
  if (isMockMode()) {
    return mockRequest(() =>
      mockGroceryUsers.map((user) => {
        const items = mockGroceryItems.filter((item) => item.userId === user.id)
        return {
          ...user,
          itemCount: items.length,
          completedCount: items.filter((item) => item.completed).length,
        }
      }),
    )
  }
  return httpRequest('/functions/v1/admin-catalog/grocery/users')
}

export async function listGroceryItems(userId: string): Promise<GroceryItem[]> {
  if (isMockMode()) {
    return mockRequest(() => mockGroceryItems.filter((item) => item.userId === userId))
  }
  return httpRequest(`/functions/v1/admin-catalog/grocery/users/${userId}/items`)
}

export async function listMealPlans(): Promise<MealPlanEntry[]> {
  if (isMockMode()) return mockRequest(() => mockMealPlans)
  return httpRequest('/functions/v1/admin-catalog/meal-plans')
}

export async function listPantry(): Promise<PantryItem[]> {
  if (isMockMode()) return mockRequest(() => mockPantry)
  return httpRequest('/functions/v1/admin-catalog/pantry')
}

function taxonomyList(kind: 'cuisine' | 'category' | 'tags') {
  if (kind === 'cuisine') return mockCuisines
  if (kind === 'category') return mockCategories
  return mockTags
}

export async function listTaxonomy(
  kind: 'cuisine' | 'category' | 'tags',
): Promise<TaxonomyItem[]> {
  if (isMockMode()) {
    return mockRequest(() => [...taxonomyList(kind)])
  }
  return httpRequest(`/functions/v1/admin-catalog/taxonomy/${kind}`)
}

export async function createTaxonomyItem(
  kind: 'cuisine' | 'category' | 'tags',
  name: string,
): Promise<TaxonomyItem> {
  if (isMockMode()) {
    return mockRequest(() => {
      const item: TaxonomyItem = {
        id: `${kind}_${Date.now()}`,
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        usageCount: 0,
      }
      taxonomyList(kind).unshift(item)
      return item
    })
  }
  return httpRequest(`/functions/v1/admin-catalog/taxonomy/${kind}`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

export async function updateTaxonomyItem(
  kind: 'cuisine' | 'category' | 'tags',
  id: string,
  name: string,
): Promise<TaxonomyItem> {
  if (isMockMode()) {
    return mockRequest(() => {
      const list = taxonomyList(kind)
      const index = list.findIndex((item) => item.id === id)
      if (index < 0) throw new Error('Taxonomy item not found')
      const next = {
        ...list[index],
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
      }
      list[index] = next
      return next
    })
  }
  return httpRequest(`/functions/v1/admin-catalog/taxonomy/${kind}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  })
}

export async function deleteTaxonomyItem(
  kind: 'cuisine' | 'category' | 'tags',
  id: string,
): Promise<void> {
  if (isMockMode()) {
    return mockRequest(() => {
      const list = taxonomyList(kind)
      replaceList(
        list,
        list.filter((item) => item.id !== id),
      )
    })
  }
  await httpRequest(`/functions/v1/admin-catalog/taxonomy/${kind}/${id}`, { method: 'DELETE' })
}

/** Live: System tab stays diagnostics; General/Units/Categories persist via admin-catalog. */
export function liveSettingsDiagnostics(): AdminSettings {
  return {
    general: {
      appName: 'CookApp',
      supportEmail: '',
      defaultLocale: 'en-US',
      maintenanceMode: false,
    },
    units: {
      measurementSystem: 'metric',
      temperatureUnit: 'celsius',
    },
    categories: {
      allowUserTags: true,
      requireCuisine: true,
    },
    system: {
      mockMode: false,
      apiBaseUrl: API_BASE || '(set VITE_ADMIN_API_BASE_URL)',
      logLevel: 'info',
    },
  }
}

function overlaySystemDiagnostics(settings: AdminSettings): AdminSettings {
  const fallback = liveSettingsDiagnostics().system
  return {
    ...settings,
    system: {
      mockMode: false,
      apiBaseUrl: API_BASE || settings.system?.apiBaseUrl || fallback.apiBaseUrl,
      logLevel: settings.system?.logLevel ?? 'info',
    },
  }
}

export async function getSettings(): Promise<AdminSettings> {
  if (isMockMode()) return mockRequest(() => structuredClone(mockSettings))
  const remote = await httpRequest<AdminSettings>('/functions/v1/admin-catalog/settings')
  return overlaySystemDiagnostics(remote)
}

export async function updateSettings(payload: AdminSettings): Promise<AdminSettings> {
  if (isMockMode()) {
    return mockRequest(() => {
      mockSettings.general = structuredClone(payload.general)
      mockSettings.units = structuredClone(payload.units)
      mockSettings.categories = structuredClone(payload.categories)
      mockSettings.system = structuredClone(payload.system)
      return structuredClone(mockSettings)
    })
  }
  const remote = await httpRequest<AdminSettings>('/functions/v1/admin-catalog/settings', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  return overlaySystemDiagnostics(remote)
}
