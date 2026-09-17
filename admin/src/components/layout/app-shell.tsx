import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { SidebarProvider } from '@/components/layout/sidebar-context'
import { useAuth } from '@/auth/auth-context'
import { LoadingBlock } from '@/components/ui/page'

export function AppShell() {
  const { admin, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex h-svh items-center justify-center bg-background p-6">
        <LoadingBlock label="Checking session…" />
      </div>
    )
  }

  if (!admin) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return (
    <SidebarProvider>
      <div className="flex h-svh overflow-hidden bg-background">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header />
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-5">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
