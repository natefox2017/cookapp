import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom'
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
import { NotImplementedPage } from '@/pages/placeholders/not-implemented-page'

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

const SETTINGS_SECTIONS = new Set(['general', 'security', 'system', 'integrations'])

function SettingsSectionRoute() {
  const { section } = useParams()
  if (!section || !SETTINGS_SECTIONS.has(section)) {
    return <Navigate to="/settings/general" replace />
  }
  return <SettingsPage section={section as 'general' | 'security' | 'system' | 'integrations'} />
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

            {/* Recipes */}
            <Route path="recipes" element={<RecipesPage />} />
            <Route
              path="recipes/import"
              element={
                <NotImplementedPage
                  title="AI Import"
                  description="Paste or batch-import recipe URLs through the shared Backend import pipeline."
                  contractNote="Backend admin-recipe-import exists (#55/#56). Admin typed client + UI are not wired yet — this route is IA-only until the Import Admin module lands."
                  relatedHref="/recipes"
                  relatedLabel="Open Recipe Library"
                />
              }
            />
            <Route
              path="recipes/import-review"
              element={
                <NotImplementedPage
                  title="Import Review"
                  description="Human review queue for low-confidence or failed AI imports."
                  contractNote="Approve/reject/reparse APIs are on admin-recipe-import; Admin UI review board is not implemented yet."
                  relatedHref="/recipes"
                  relatedLabel="Open Recipe Library"
                />
              }
            />
            <Route path="recipes/:id" element={<RecipeDetailPage />} />

            {/* Commerce */}
            <Route path="commerce/products" element={<SubscriptionPage />} />
            <Route
              path="commerce/payments"
              element={
                <NotImplementedPage
                  title="Payments"
                  description="Normalized payment transactions, refunds, and proceeds (Notion V2 §7)."
                  contractNote="Tracked under #58. Existing subscription catalog remains under Products · Subscriptions."
                  relatedHref="/commerce/products"
                  relatedLabel="Open Products · Subscriptions"
                />
              }
            />
            <Route path="subscription" element={<Navigate to="/commerce/products" replace />} />

            {/* Analytics */}
            <Route
              path="analytics"
              element={
                <NotImplementedPage
                  title="Analytics"
                  description="Downloads, acquisition, conversion, and import quality — separate from Payments."
                  contractNote="Planned under #59/#60. Dashboard continues to show only live aggregations."
                  relatedHref="/"
                  relatedLabel="Back to Dashboard"
                />
              }
            />

            {/* Operations */}
            <Route
              path="operations/jobs"
              element={
                <NotImplementedPage
                  title="Jobs & Syncs"
                  description="Unified view of import jobs, store syncs, and webhook health."
                  contractNote="Planned under #60. Backend import queue exists (#56) without an Admin ops console yet."
                />
              }
            />
            <Route
              path="operations/audit-log"
              element={
                <NotImplementedPage
                  title="Audit Log"
                  description="Privileged Admin action history (actor, action, object, redacted diff)."
                  contractNote="admin_audit_logs + writers shipped in #57. Admin list/read UI is not implemented yet."
                />
              }
            />

            {/* Data */}
            <Route path="data/collections" element={<CollectionsPage />} />
            <Route path="data/ingredients" element={<IngredientsPage />} />
            <Route path="data/grocery" element={<GroceryPage />} />
            <Route path="data/meal-plans" element={<MealPlansPage />} />
            <Route path="data/pantry" element={<PantryPage />} />
            <Route path="data/categories" element={<CategoriesPage />} />
            <Route path="collections" element={<Navigate to="/data/collections" replace />} />
            <Route path="ingredients" element={<Navigate to="/data/ingredients" replace />} />
            <Route path="grocery" element={<Navigate to="/data/grocery" replace />} />
            <Route path="meal-plans" element={<Navigate to="/data/meal-plans" replace />} />
            <Route path="pantry" element={<Navigate to="/data/pantry" replace />} />
            <Route path="categories" element={<Navigate to="/data/categories" replace />} />

            {/* Settings — static planned routes before :section */}
            <Route path="settings" element={<Navigate to="/settings/general" replace />} />
            <Route
              path="settings/ai-platform"
              element={
                <NotImplementedPage
                  title="AI Platform"
                  description="Providers, models, routes, usage, and health — single model entry for Admin and App."
                  contractNote="Backend admin-ai APIs shipped in #53. Admin Settings UI is not wired yet."
                  relatedHref="/settings/general"
                  relatedLabel="Open Settings · General"
                />
              }
            />
            <Route path="settings/:section" element={<SettingsSectionRoute />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
