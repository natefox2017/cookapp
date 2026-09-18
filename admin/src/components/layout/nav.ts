import {
  LayoutDashboard,
  Users,
  Sparkles,
  ClipboardCheck,
  CookingPot,
  Tags,
  CreditCard,
  Receipt,
  Package,
  BarChart3,
  Workflow,
  Activity,
  AlertTriangle,
  ScrollText,
  Settings,
  type LucideIcon,
} from 'lucide-react'

/** Matches docs/backend/ADMIN_API_CONTRACT.md */
export type NavApiStatus = 'live' | 'mock_only' | 'hybrid'

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  apiStatus: NavApiStatus
  children?: NavItem[]
}

/**
 * Admin §14 IA (Issue #104) — ops console, not a DB browser.
 * Content & AI manages System Recommended Recipes only (same recipes table,
 * library_kind=system_recommended). User private content stays out of nav (#98).
 */
export const navItems: NavItem[] = [
  { title: 'Dashboard', href: '/', icon: LayoutDashboard, apiStatus: 'live' },
  { title: 'Users', href: '/users', icon: Users, apiStatus: 'live' },
  {
    title: 'Commerce',
    href: '/commerce',
    icon: CreditCard,
    apiStatus: 'live',
    children: [
      { title: 'Overview', href: '/commerce', icon: CreditCard, apiStatus: 'live' },
      { title: 'Subscriptions', href: '/commerce/subscriptions', icon: CreditCard, apiStatus: 'live' },
      { title: 'Payments', href: '/commerce/payments', icon: Receipt, apiStatus: 'live' },
      { title: 'Products & Plans', href: '/commerce/products', icon: Package, apiStatus: 'live' },
    ],
  },
  { title: 'Analytics', href: '/analytics', icon: BarChart3, apiStatus: 'live' },
  {
    title: 'Content & AI',
    href: '/content/recipes',
    icon: CookingPot,
    apiStatus: 'live',
    children: [
      { title: 'System Recipe Library', href: '/content/recipes', icon: CookingPot, apiStatus: 'live' },
      { title: 'AI Import', href: '/content/import', icon: Sparkles, apiStatus: 'live' },
      { title: 'Import Review', href: '/content/import-review', icon: ClipboardCheck, apiStatus: 'live' },
      { title: 'Taxonomy', href: '/content/taxonomy', icon: Tags, apiStatus: 'live' },
    ],
  },
  {
    title: 'Operations',
    href: '/operations/health',
    icon: Workflow,
    apiStatus: 'live',
    children: [
      { title: 'System Health', href: '/operations/health', icon: Activity, apiStatus: 'live' },
      { title: 'Jobs & Syncs', href: '/operations/jobs', icon: Workflow, apiStatus: 'live' },
      { title: 'Errors & Incidents', href: '/operations/errors', icon: AlertTriangle, apiStatus: 'live' },
      { title: 'Audit Log', href: '/operations/audit-log', icon: ScrollText, apiStatus: 'live' },
    ],
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
    apiStatus: 'hybrid',
    children: [
      { title: 'General', href: '/settings/general', icon: Settings, apiStatus: 'hybrid' },
      { title: 'Runtime Config', href: '/settings/runtime-config', icon: Settings, apiStatus: 'live' },
      { title: 'AI Platform', href: '/settings/ai-platform', icon: Sparkles, apiStatus: 'live' },
      { title: 'Integrations', href: '/settings/integrations', icon: Settings, apiStatus: 'live' },
      { title: 'Security & Admin', href: '/settings/security', icon: Settings, apiStatus: 'live' },
      { title: 'System', href: '/settings/system', icon: Settings, apiStatus: 'hybrid' },
    ],
  },
]

export function navLeaves(items: NavItem[] = navItems): NavItem[] {
  return items.flatMap((item) => (item.children?.length ? item.children : [item]))
}

export function isNavHrefActive(href: string, pathname: string): boolean {
  if (href === '/') return pathname === '/'
  if (href === '/commerce') {
    return pathname === '/commerce'
  }
  if (href === '/content/recipes') {
    return (
      pathname === '/content/recipes' ||
      (pathname.startsWith('/content/recipes/') &&
        !pathname.startsWith('/content/import'))
    )
  }
  if (href === '/settings' || href.startsWith('/settings/')) {
    if (href === '/settings') return pathname.startsWith('/settings')
    return pathname === href || pathname.startsWith(`${href}/`)
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function pageTitleForPath(pathname: string) {
  if (pathname.startsWith('/content/import-review')) return 'Import Review'
  if (pathname.startsWith('/content/import')) return 'AI Import'
  if (pathname.startsWith('/content/recipes/') && pathname !== '/content/recipes') {
    return 'System Recipe Detail'
  }
  if (pathname.startsWith('/content/taxonomy')) return 'Taxonomy'
  if (pathname.startsWith('/operations/health')) return 'System Health'
  if (pathname.startsWith('/operations/jobs')) return 'Jobs & Syncs'
  if (pathname.startsWith('/operations/errors')) return 'Errors & Incidents'
  if (pathname.startsWith('/operations/audit-log')) return 'Audit Log'
  if (pathname.startsWith('/commerce/subscriptions')) return 'Subscriptions'
  if (pathname.startsWith('/commerce/payments')) return 'Payments'
  if (pathname.startsWith('/commerce/products')) return 'Products & Plans'
  if (pathname === '/commerce') return 'Commerce Overview'
  if (pathname.startsWith('/settings')) {
    const leaf = navLeaves().find((item) => item.href === pathname)
    return leaf?.title ?? 'Settings'
  }
  const match = navLeaves()
    .slice()
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) =>
      item.href === '/'
        ? pathname === '/'
        : pathname === item.href || pathname.startsWith(`${item.href}/`),
    )
  return match?.title ?? 'Admin'
}
