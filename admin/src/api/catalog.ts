import { isMockMode, liveNotImplemented, mockRequest, API_BASE, USE_MOCK } from '@/api/client'
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

/**
 * Catalog domains without live Admin Edge Functions.
 * Mock only when VITE_ADMIN_USE_MOCK=true; Production live → Not Implemented (Issue #52).
 */

function replaceList<T>(target: T[], next: T[]) {
  target.splice(0, target.length, ...next)
}

function liveDiagnosticsSettings(): AdminSettings {
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
      requireCuisine: false,
    },
    system: {
      mockMode: USE_MOCK,
      apiBaseUrl: API_BASE || '(not set)',
      logLevel: 'info',
    },
  }
}

export async function listCollections(): Promise<CollectionSummary[]> {
  if (isMockMode()) return mockRequest(() => mockCollections)
  liveNotImplemented('collections')
}

export async function listIngredients(): Promise<Ingredient[]> {
  if (isMockMode()) return mockRequest(() => [...mockIngredients])
  liveNotImplemented('ingredients')
}

export async function createIngredient(input: IngredientInput): Promise<Ingredient> {
  if (isMockMode()) {
    return mockRequest(() => {
      const item: Ingredient = { id: `ing_${Date.now()}`, ...input }
      mockIngredients.unshift(item)
      return item
    })
  }
  void input
  liveNotImplemented('ingredients')
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
  void id
  void input
  liveNotImplemented('ingredients')
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
  void id
  liveNotImplemented('ingredients')
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
  liveNotImplemented('grocery')
}

export async function listGroceryItems(userId: string): Promise<GroceryItem[]> {
  if (isMockMode()) {
    return mockRequest(() => mockGroceryItems.filter((item) => item.userId === userId))
  }
  void userId
  liveNotImplemented('grocery')
}

export async function listMealPlans(): Promise<MealPlanEntry[]> {
  if (isMockMode()) return mockRequest(() => mockMealPlans)
  liveNotImplemented('meal-plans')
}

export async function listPantry(): Promise<PantryItem[]> {
  if (isMockMode()) return mockRequest(() => mockPantry)
  liveNotImplemented('pantry')
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
  void kind
  liveNotImplemented('categories')
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
  void kind
  void name
  liveNotImplemented('categories')
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
  void kind
  void id
  void name
  liveNotImplemented('categories')
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
  void kind
  void id
  liveNotImplemented('categories')
}

export async function getSettings(): Promise<AdminSettings> {
  if (isMockMode()) return mockRequest(() => structuredClone(mockSettings))
  // Live: expose build-time diagnostics only — no fake persisted settings.
  return liveDiagnosticsSettings()
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
  void payload
  liveNotImplemented('settings')
}
