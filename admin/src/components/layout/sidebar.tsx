import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronsLeft, ChevronsRight, ChevronDown, CookingPot } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  isNavGroup,
  isPathUnderGroup,
  navItems,
  type NavApiStatus,
  type NavEntry,
  type NavGroup,
  type NavLeaf,
} from '@/components/layout/nav'
import { useSidebar } from '@/components/layout/sidebar-context'
import { Button } from '@/components/ui/button'
import { isMockMode } from '@/api'

function statusBadge(apiStatus: NavApiStatus): { label: string; className: string } | null {
  if (isMockMode()) return null
  if (apiStatus === 'mock_only') {
    return {
      label: 'Pending',
      className:
        'bg-amber-500/15 text-amber-700 dark:text-amber-400',
    }
  }
  if (apiStatus === 'planned') {
    return {
      label: 'Not implemented',
      className: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
    }
  }
  if (apiStatus === 'hybrid') {
    return {
      label: 'Partial',
      className: 'bg-sky-500/15 text-sky-700 dark:text-sky-400',
    }
  }
  return null
}

function NavStatusBadge({ apiStatus }: { apiStatus: NavApiStatus }) {
  const badge = statusBadge(apiStatus)
  if (!badge) return null
  return (
    <span
      className={cn(
        'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide',
        badge.className,
      )}
    >
      {badge.label}
    </span>
  )
}

function leafTitle(item: NavLeaf) {
  const badge = statusBadge(item.apiStatus)
  return badge ? `${item.title} (${badge.label})` : item.title
}

function leafIsActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  if (href === '/recipes') {
    return (
      pathname === '/recipes' ||
      (/^\/recipes\/[^/]+$/.test(pathname) &&
        pathname !== '/recipes/import' &&
        pathname !== '/recipes/import-review')
    )
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}

function LeafLink({
  item,
  onNavigate,
  collapsed = false,
  nested = false,
}: {
  item: NavLeaf
  onNavigate?: () => void
  collapsed?: boolean
  nested?: boolean
}) {
  const location = useLocation()
  const Icon = item.icon
  const active = leafIsActive(location.pathname, item.href)
  return (
    <NavLink
      to={item.href}
      end={item.href === '/'}
      onClick={onNavigate}
      title={leafTitle(item)}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center rounded-md py-2 text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-primary-foreground active:bg-sidebar-accent/80',
        collapsed ? 'justify-center px-2' : 'gap-2.5 px-3',
        nested && !collapsed && 'py-1.5 pl-9 text-[13px]',
        active && 'bg-sidebar-accent text-sidebar-primary-foreground',
      )}
    >
      <Icon className={cn('shrink-0 opacity-80', nested ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
      {!collapsed ? (
        <>
          <span className="min-w-0 flex-1 truncate">{item.title}</span>
          <NavStatusBadge apiStatus={item.apiStatus} />
        </>
      ) : null}
    </NavLink>
  )
}

function NavGroupBlock({
  group,
  onNavigate,
  collapsed = false,
}: {
  group: NavGroup
  onNavigate?: () => void
  collapsed?: boolean
}) {
  const location = useLocation()
  const under = isPathUnderGroup(location.pathname, group)
  const [open, setOpen] = useState(under)
  const Icon = group.icon

  useEffect(() => {
    if (under) setOpen(true)
  }, [under])

  if (collapsed) {
    return (
      <div className="space-y-0.5">
        {group.children.map((child) => (
          <LeafLink
            key={child.href}
            item={child}
            onNavigate={onNavigate}
            collapsed
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-0.5">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-primary-foreground',
          under && 'text-sidebar-primary-foreground',
        )}
        aria-expanded={open}
      >
        <Icon className="h-4 w-4 shrink-0 opacity-80" />
        <span className="min-w-0 flex-1 truncate text-left">{group.title}</span>
        <ChevronDown
          className={cn('h-3.5 w-3.5 shrink-0 opacity-70 transition-transform', open && 'rotate-180')}
        />
      </button>
      {open ? (
        <div className="space-y-0.5">
          {group.children.map((child) => (
            <LeafLink key={child.href} item={child} onNavigate={onNavigate} nested />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function renderEntry(
  entry: NavEntry,
  onNavigate?: () => void,
  collapsed?: boolean,
) {
  if (isNavGroup(entry)) {
    return (
      <NavGroupBlock
        key={entry.title}
        group={entry}
        onNavigate={onNavigate}
        collapsed={collapsed}
      />
    )
  }
  return (
    <LeafLink
      key={entry.href}
      item={entry}
      onNavigate={onNavigate}
      collapsed={collapsed}
    />
  )
}

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
        {navItems.map((entry) => renderEntry(entry, onNavigate, collapsed))}
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
