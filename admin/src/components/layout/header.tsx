import { Menu, Moon, RefreshCw, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { pageTitleForPath } from '@/components/layout/nav'
import { SidebarNav } from '@/components/layout/sidebar'
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
  const title = pageTitleForPath(location.pathname)
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b bg-card/90 px-4 backdrop-blur sm:px-5">
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
        <h2 className="truncate text-sm font-semibold">{title}</h2>
        {isMockMode() ? (
          <Badge variant="warning" className="hidden sm:inline-flex">
            Mock data
          </Badge>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        {onRefresh ? (
          <Button variant="outline" size="sm" onClick={onRefresh} aria-label="Refresh data">
            <RefreshCw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        ) : null}
        <Button
          variant="outline"
          size="icon"
          aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={() => setDark((value) => !value)}
        >
          {dark ? <Sun /> : <Moon />}
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
