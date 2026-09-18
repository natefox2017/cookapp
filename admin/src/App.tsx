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
import { TaxonomyPage } from '@/pages/content/taxonomy-page'
import { CommerceOverviewPage } from '@/pages/commerce/commerce-overview-page'
import { ProductsPage } from '@/pages/commerce/products-page'
import { SubscriptionPage } from '@/pages/subscription/subscription-page'
import { PaymentsPage } from '@/pages/payments/payments-page'
import { AnalyticsPage } from '@/pages/analytics/analytics-page'
import { OperationsPage } from '@/pages/operations/operations-page'
import { HealthPage } from '@/pages/operations/health-page'
import { ErrorsPage } from '@/pages/operations/errors-page'
import { AuditLogPage } from '@/pages/operations/audit-log-page'
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

/** Settings deep-links matching §14 IA. */
const SETTINGS_SECTIONS = new Set<SettingsSection>([
  'general',
  'runtime-config',
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

function LegacyRecipeDetailRedirect() {
  const { id } = useParams()
  return <Navigate to={`/content/recipes/${id ?? ''}`} replace />
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

            {/* Commerce */}
            <Route path="commerce" element={<CommerceOverviewPage />} />
            <Route
              path="commerce/subscriptions"
              element={
                <SubscriptionPage
                  title="Subscriptions"
                  initialTab="records"
                  description="Entitlements and subscription revenue. Manage plan SKUs under Products & Plans."
                />
              }
            />
            <Route path="commerce/payments" element={<PaymentsPage />} />
            <Route path="commerce/products" element={<ProductsPage />} />

            <Route path="analytics" element={<AnalyticsPage />} />

            {/* Content & AI */}
            <Route path="content/recipes" element={<RecipesPage />} />
            <Route path="content/recipes/:id" element={<RecipeDetailPage />} />
            <Route path="content/import" element={<ImportPage />} />
            <Route path="content/import-review" element={<ImportReviewPage />} />
            <Route path="content/taxonomy" element={<TaxonomyPage />} />

            {/* Operations */}
            <Route path="operations/health" element={<HealthPage />} />
            <Route path="operations/jobs" element={<OperationsPage />} />
            <Route path="operations/errors" element={<ErrorsPage />} />
            <Route path="operations/audit-log" element={<AuditLogPage />} />

            {/* Compatibility redirects from pre-§14 paths */}
            <Route path="recipes/import" element={<Navigate to="/content/import" replace />} />
            <Route
              path="recipes/import-review"
              element={<Navigate to="/content/import-review" replace />}
            />
            <Route path="recipes/:id" element={<LegacyRecipeDetailRedirect />} />
            <Route path="recipes" element={<Navigate to="/content/recipes" replace />} />
            <Route path="ingredients" element={<Navigate to="/content/taxonomy" replace />} />
            <Route path="categories" element={<Navigate to="/content/taxonomy" replace />} />
            <Route path="data/ingredients" element={<Navigate to="/content/taxonomy" replace />} />
            <Route path="data/categories" element={<Navigate to="/content/taxonomy" replace />} />
            <Route path="subscription" element={<Navigate to="/commerce/subscriptions" replace />} />

            {/* End-user personal surfaces — not an Admin ops view */}
            <Route path="collections" element={<Navigate to="/" replace />} />
            <Route path="grocery" element={<Navigate to="/" replace />} />
            <Route path="meal-plans" element={<Navigate to="/" replace />} />
            <Route path="pantry" element={<Navigate to="/" replace />} />
            <Route path="data/collections" element={<Navigate to="/" replace />} />
            <Route path="data/grocery" element={<Navigate to="/" replace />} />
            <Route path="data/meal-plans" element={<Navigate to="/" replace />} />
            <Route path="data/pantry" element={<Navigate to="/" replace />} />

            {/* Settings */}
            <Route path="settings" element={<Navigate to="/settings/general" replace />} />
            <Route path="settings/:section" element={<SettingsSectionRoute />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
