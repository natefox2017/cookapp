import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { PRODUCTION_MOCK_BLOCKED } from '@/api/client'
import { AuthProvider } from '@/auth/auth-context'
import { AppShell } from '@/components/layout/app-shell'
import { LoginPage } from '@/pages/login/login-page'
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

function ProductionMockBlocked() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-6">
      <div className="max-w-lg rounded-xl border border-destructive/40 bg-card p-6 shadow-sm">
        <h1 className="text-xl font-semibold tracking-tight text-destructive">
          Production mock blocked
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This Admin build was compiled with <code>VITE_ADMIN_USE_MOCK=true</code>. Mock KPI and
          fake commerce data are forbidden in production (Issue #51 / Backend V2). Rebuild with
          mock disabled and point <code>VITE_ADMIN_API_BASE_URL</code> at the live Backend.
        </p>
      </div>
    </div>
  )
}

export default function App() {
  if (PRODUCTION_MOCK_BLOCKED) {
    return <ProductionMockBlocked />
  }

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
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
    </AuthProvider>
  )
}
