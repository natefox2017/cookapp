import { LogOut, Menu, Moon, PanelLeftClose, PanelLeftOpen, RefreshCw, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { pageTitleForPath } from '@/components/layout/nav'
import { SidebarNav } from '@/components/layout/sidebar'
import { useSidebar } from '@/components/layout/sidebar-context'
import { useTheme } from '@/hooks/use-theme'
import { useAuth } from '@/auth/auth-context'
import { isMockMode } from '@/api'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

export function Header({ onRefresh }: { onRefresh?: () => void }) {
  const location = useLocation()
  const navigate = useNavigate()
  const title = pageTitleForPath(location.pathname)
  const { isDark, toggle: toggleTheme } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { collapsed, toggle } = useSidebar()
  const { admin, logout } = useAuth()
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  async function onLogout() {
    setLoggingOut(true)
    try {
      await logout()
      navigate('/login', { replace: true })
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-5">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <Button
          variant="outline"
          size="icon"
          className="md:hidden"
          aria-label="Open navigation"
          onClick={() => setMobileOpen(true)}
        >
          <Menu />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="hidden md:inline-flex"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={toggle}
        >
          {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
        </Button>
        <h2 className="truncate text-sm font-semibold">{title}</h2>
        {isMockMode() ? (
          <Badge variant="warning" className="hidden sm:inline-flex">
            Mock data
          </Badge>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        {admin ? (
          <span className="hidden text-xs text-muted-foreground sm:inline">{admin.username}</span>
        ) : null}
        {onRefresh ? (
          <Button variant="outline" size="sm" onClick={onRefresh} aria-label="Refresh data">
            <RefreshCw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        ) : null}
        <Button
          variant="outline"
          size="icon"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={toggleTheme}
        >
          {isDark ? <Sun /> : <Moon />}
        </Button>
        <Button
          variant="outline"
          size="sm"
          loading={loggingOut}
          onClick={() => void onLogout()}
          aria-label="Log out"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Log out</span>
        </Button>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 bg-sidebar p-0 text-sidebar-foreground sm:max-w-xs">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
            <SheetDescription>Admin module navigation</SheetDescription>
          </SheetHeader>
          <div className="flex h-full flex-col">
            <SidebarNav onNavigate={() => setMobileOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </header>
  )
}
