import { isMockMode, liveNotImplemented, mockRequest } from '@/api/client'
import { mockRecipeDetails, mockRecipes } from '@/mocks/data'
import type { ListRecipesParams, RecipeDetail, RecipeSummary } from '@/types/admin'

/** Recipes Admin API is not live yet — mock for local/dev only (Issue #52). */

export async function listRecipes(params: ListRecipesParams = {}): Promise<RecipeSummary[]> {
  if (isMockMode()) {
    return mockRequest(() => {
      const q = params.q?.trim().toLowerCase() ?? ''
      return mockRecipes.filter((recipe) => {
        const matchesQuery = !q || recipe.title.toLowerCase().includes(q)
        const matchesCuisine = !params.cuisine || recipe.cuisine === params.cuisine
        const matchesCategory = !params.category || recipe.category === params.category
        const matchesTag = !params.tag || recipe.tags.includes(params.tag)
        return matchesQuery && matchesCuisine && matchesCategory && matchesTag
      })
    })
  }
  liveNotImplemented('recipes')
}

export async function getRecipe(id: string): Promise<RecipeDetail> {
  if (isMockMode()) {
    return mockRequest(() => {
      const recipe = mockRecipeDetails[id]
      if (!recipe) throw new Error(`Recipe ${id} not found`)
      return recipe
    })
  }
  liveNotImplemented('recipes')
}

export async function updateRecipe(
  id: string,
  payload: Partial<RecipeDetail>,
): Promise<RecipeDetail> {
  if (isMockMode()) {
    return mockRequest(() => {
      const current = mockRecipeDetails[id]
      if (!current) throw new Error(`Recipe ${id} not found`)
      const next = { ...current, ...payload, updatedAt: new Date().toISOString() }
      mockRecipeDetails[id] = next
      const index = mockRecipes.findIndex((item) => item.id === id)
      if (index >= 0) {
        mockRecipes[index] = {
          id: next.id,
          title: next.title,
          coverUrl: next.coverUrl,
          cuisine: next.cuisine,
          category: next.category,
          tags: next.tags,
          createdAt: next.createdAt,
          ownerEmail: next.ownerEmail,
        }
      }
      return next
    })
  }
  void id
  void payload
  liveNotImplemented('recipes')
}

export async function deleteRecipe(id: string): Promise<void> {
  if (isMockMode()) {
    return mockRequest(() => {
      delete mockRecipeDetails[id]
      const index = mockRecipes.findIndex((item) => item.id === id)
      if (index >= 0) mockRecipes.splice(index, 1)
    })
  }
  void id
  liveNotImplemented('recipes')
}
