import { NavLink } from 'react-router-dom'
import { ChevronsLeft, ChevronsRight, CookingPot } from 'lucide-react'
import { cn } from '@/lib/utils'
import { navItems } from '@/components/layout/nav'
import { useSidebar } from '@/components/layout/sidebar-context'
import { Button } from '@/components/ui/button'
import { isMockMode } from '@/api'

export function SidebarNav({
  onNavigate,
  collapsed = false,
}: {
  onNavigate?: () => void
  collapsed?: boolean
}) {
  return (
    <>
      <div
        className={cn(
          'flex items-center border-b border-sidebar-border py-4',
          collapsed ? 'justify-center px-2' : 'gap-2.5 px-5',
        )}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <CookingPot className="h-5 w-5" />
        </div>
        {!collapsed ? (
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold tracking-tight text-sidebar-primary-foreground">
              CookApp Admin
            </div>
            <div className="text-xs text-sidebar-foreground/70">Local ops console</div>
          </div>
        ) : null}
      </div>

      <nav className={cn('flex-1 space-y-0.5 overflow-y-auto py-4', collapsed ? 'px-2' : 'px-3')}>
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === '/'}
              onClick={onNavigate}
              title={item.title}
              className={({ isActive }) =>
                cn(
                  'flex items-center rounded-md py-2 text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-primary-foreground active:bg-sidebar-accent/80',
                  collapsed ? 'justify-center px-2' : 'gap-2.5 px-3',
                  isActive && 'bg-sidebar-accent text-sidebar-primary-foreground',
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0 opacity-80" />
              {!collapsed ? <span>{item.title}</span> : null}
            </NavLink>
          )
        })}
      </nav>

      {!collapsed ? (
        <div className="border-t border-sidebar-border px-4 py-3 text-xs text-sidebar-foreground/60">
          {isMockMode() ? 'Mock API mode' : 'Live API mode'}
        </div>
      ) : (
        <div className="border-t border-sidebar-border py-3" />
      )}
    </>
  )
}

export function Sidebar() {
  const { collapsed, toggle } = useSidebar()

  return (
    <aside
      className={cn(
        'relative hidden h-full shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 md:flex',
        collapsed ? 'w-[72px]' : 'w-64',
      )}
    >
      <SidebarNav collapsed={collapsed} />
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="absolute -right-3 top-20 z-10 hidden h-6 w-6 rounded-full border bg-card shadow-sm md:inline-flex"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        onClick={toggle}
      >
        {collapsed ? <ChevronsRight className="h-3.5 w-3.5" /> : <ChevronsLeft className="h-3.5 w-3.5" />}
      </Button>
    </aside>
  )
}
