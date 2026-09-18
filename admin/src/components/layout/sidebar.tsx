import { NavLink } from 'react-router-dom'
import { CookingPot } from 'lucide-react'
import { cn } from '@/lib/utils'
import { navItems } from '@/components/layout/nav'
import { useSidebar } from '@/components/layout/sidebar-context'
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
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <CookingPot className="h-5 w-5" />
        </div>
        {!collapsed ? (
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold tracking-tight text-sidebar-foreground">
              CookApp Admin
            </div>
            <div className="text-xs text-muted-foreground">Local ops console</div>
          </div>
        ) : null}
      </div>

      <nav className={cn('flex-1 space-y-0.5 overflow-y-auto py-4', collapsed ? 'px-2' : 'px-3')}>
        {navItems.map((item) => {
          const Icon = item.icon
          const showPending = !isMockMode() && item.apiStatus === 'mock_only'
          const showHybrid = !isMockMode() && item.apiStatus === 'hybrid'
          return (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === '/'}
              onClick={onNavigate}
              title={
                showPending
                  ? `${item.title} (live API pending)`
                  : showHybrid
                    ? `${item.title} (partial live)`
                    : item.title
              }
              className={({ isActive }) =>
                cn(
                  'flex items-center rounded-md py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent/80',
                  collapsed ? 'justify-center px-2' : 'gap-2.5 px-3',
                  isActive && 'bg-sidebar-accent text-sidebar-accent-foreground',
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0 opacity-80" />
              {!collapsed ? (
                <>
                  <span className="min-w-0 flex-1 truncate">{item.title}</span>
                  {showPending ? (
                    <span className="shrink-0 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400">
                      Pending
                    </span>
                  ) : null}
                  {showHybrid ? (
                    <span className="shrink-0 rounded bg-sky-500/15 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-sky-700 dark:text-sky-400">
                      Partial
                    </span>
                  ) : null}
                </>
              ) : null}
            </NavLink>
          )
        })}
      </nav>

      {!collapsed ? (
        <div className="border-t border-sidebar-border px-4 py-3 text-xs text-muted-foreground">
          {isMockMode() ? 'Mock API mode' : 'Live API mode'}
        </div>
      ) : (
        <div className="border-t border-sidebar-border py-3" />
      )}
    </>
  )
}

export function Sidebar() {
  const { collapsed } = useSidebar()

  return (
    <aside
      className={cn(
        'hidden h-full shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 md:flex',
        collapsed ? 'w-[72px]' : 'w-64',
      )}
    >
      <SidebarNav collapsed={collapsed} />
    </aside>
  )
}
