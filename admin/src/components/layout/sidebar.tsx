import { NavLink } from 'react-router-dom'
import { CookingPot } from 'lucide-react'
import { cn } from '@/lib/utils'
import { navItems } from '@/components/layout/nav'
import { isMockMode } from '@/api'

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <div className="flex items-center gap-2.5 border-b border-sidebar-border px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <CookingPot className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold tracking-tight text-sidebar-primary-foreground">
            CookApp Admin
          </div>
          <div className="text-xs text-sidebar-foreground/70">Local ops console</div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === '/'}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-primary-foreground active:bg-sidebar-accent/80',
                  isActive && 'bg-sidebar-accent text-sidebar-primary-foreground',
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0 opacity-80" />
              <span>{item.title}</span>
            </NavLink>
          )
        })}
      </nav>

      <div className="border-t border-sidebar-border px-4 py-3 text-xs text-sidebar-foreground/60">
        {isMockMode() ? 'Mock API mode' : 'Live API mode'}
      </div>
    </>
  )
}

export function Sidebar() {
  return (
    <aside className="hidden h-full w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
      <SidebarNav />
    </aside>
  )
}
