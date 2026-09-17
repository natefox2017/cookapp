import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/app-shell'
import { DashboardPage } from '@/pages/dashboard/dashboard-page'
import { UsersPage } from '@/pages/users/users-page'
import { RecipeDetailPage, RecipesPage } from '@/pages/recipes/recipes-page'
import { CollectionsPage } from '@/pages/collections/collections-page'
import { IngredientsPage } from '@/pages/ingredients/ingredients-page'
import { GroceryPage } from '@/pages/grocery/grocery-page'
import { MealPlansPage } from '@/pages/meal-plans/meal-plans-page'
import { PantryPage } from '@/pages/pantry/pantry-page'
import { CategoriesPage } from '@/pages/categories/categories-page'
import { SubscriptionPage } from '@/pages/subscription/subscription-page'
import { SettingsPage } from '@/pages/settings/settings-page'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="recipes" element={<RecipesPage />} />
          <Route path="recipes/:id" element={<RecipeDetailPage />} />
          <Route path="collections" element={<CollectionsPage />} />
          <Route path="ingredients" element={<IngredientsPage />} />
          <Route path="grocery" element={<GroceryPage />} />
          <Route path="meal-plans" element={<MealPlansPage />} />
          <Route path="pantry" element={<PantryPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="subscription" element={<SubscriptionPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
