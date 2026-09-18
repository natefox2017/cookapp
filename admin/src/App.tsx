import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom'
import { PRODUCTION_MOCK_BLOCKED } from '@/api/client'
import { AuthProvider } from '@/auth/auth-context'
import { AppShell } from '@/components/layout/app-shell'
import { LoginPage } from '@/pages/login/login-page'
import { DashboardPage } from '@/pages/dashboard/dashboard-page'
import { UsersPage } from '@/pages/users/users-page'
import { RecipeDetailPage, RecipesPage } from '@/pages/recipes/recipes-page'
import { ImportPage } from '@/pages/recipes/import-page'
import { ImportReviewPage } from '@/pages/recipes/import-review-page'
import { IngredientsPage } from '@/pages/ingredients/ingredients-page'
import { CategoriesPage } from '@/pages/categories/categories-page'
import { SubscriptionPage } from '@/pages/subscription/subscription-page'
import { PaymentsPage } from '@/pages/payments/payments-page'
import { AnalyticsPage } from '@/pages/analytics/analytics-page'
import { OperationsPage } from '@/pages/operations/operations-page'
import { SettingsPage, type SettingsSection } from '@/pages/settings/settings-page'

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

/** Settings deep-links: General / Security / System / Integrations / AI Platform. */
const SETTINGS_SECTIONS = new Set<SettingsSection>([
  'general',
  'security',
  'system',
  'integrations',
  'ai-platform',
])

function SettingsSectionRoute() {
  const { section } = useParams()
  if (!section || !SETTINGS_SECTIONS.has(section as SettingsSection)) {
    return <Navigate to="/settings/general" replace />
  }
  return <SettingsPage section={section as SettingsSection} />
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

            {/* Compatibility redirects from rolled-back #64 paths (before :id catch-alls) */}
            <Route path="commerce/products" element={<Navigate to="/subscription" replace />} />
            <Route path="data/ingredients" element={<Navigate to="/ingredients" replace />} />
            <Route path="data/categories" element={<Navigate to="/categories" replace />} />
            <Route path="operations/audit-log" element={<Navigate to="/operations/jobs" replace />} />

            {/* End-user personal surfaces — not an Admin ops view */}
            <Route path="collections" element={<Navigate to="/" replace />} />
            <Route path="grocery" element={<Navigate to="/" replace />} />
            <Route path="meal-plans" element={<Navigate to="/" replace />} />
            <Route path="pantry" element={<Navigate to="/" replace />} />
            <Route path="data/collections" element={<Navigate to="/" replace />} />
            <Route path="data/grocery" element={<Navigate to="/" replace />} />
            <Route path="data/meal-plans" element={<Navigate to="/" replace />} />
            <Route path="data/pantry" element={<Navigate to="/" replace />} />

            <Route path="recipes/import" element={<ImportPage />} />
            <Route path="recipes/import-review" element={<ImportReviewPage />} />
            <Route path="recipes" element={<RecipesPage />} />
            <Route path="recipes/:id" element={<RecipeDetailPage />} />
            <Route path="ingredients" element={<IngredientsPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="subscription" element={<SubscriptionPage />} />
            <Route path="commerce/payments" element={<PaymentsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="operations/jobs" element={<OperationsPage />} />

            {/* Settings — implemented tabs only (unknown sections → general) */}
            <Route path="settings" element={<Navigate to="/settings/general" replace />} />
            <Route path="settings/:section" element={<SettingsSectionRoute />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
