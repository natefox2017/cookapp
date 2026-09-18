import {
  LayoutDashboard,
  Users,
  CookingPot,
  Carrot,
  Tags,
  CreditCard,
  Settings,
  Sparkles,
  ClipboardCheck,
  Receipt,
  BarChart3,
  Workflow,
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
 * Admin nav — ops + catalog + Gate-released operational pages (#101).
 * End-user personal surfaces (Meal Plan, Grocery, Pantry, Collections) stay in the
 * iOS app, not the ops console. Integrations (#63) and AI Platform live under Settings tabs.
 */
export const navItems: NavItem[] = [
  { title: 'Dashboard', href: '/', icon: LayoutDashboard, apiStatus: 'live' },
  { title: 'Users', href: '/users', icon: Users, apiStatus: 'live' },
  {
    title: 'Recipes',
    href: '/recipes',
    icon: CookingPot,
    apiStatus: 'hybrid',
    children: [
      { title: 'Recipes', href: '/recipes', icon: CookingPot, apiStatus: 'mock_only' },
      { title: 'AI Import', href: '/recipes/import', icon: Sparkles, apiStatus: 'live' },
      { title: 'Import Review', href: '/recipes/import-review', icon: ClipboardCheck, apiStatus: 'live' },
    ],
  },
  { title: 'Ingredients', href: '/ingredients', icon: Carrot, apiStatus: 'mock_only' },
  { title: 'Categories', href: '/categories', icon: Tags, apiStatus: 'mock_only' },
  {
    title: 'Commerce',
    href: '/subscription',
    icon: CreditCard,
    apiStatus: 'live',
    children: [
      { title: 'Subscription', href: '/subscription', icon: CreditCard, apiStatus: 'live' },
      { title: 'Payments', href: '/commerce/payments', icon: Receipt, apiStatus: 'live' },
    ],
  },
  { title: 'Analytics', href: '/analytics', icon: BarChart3, apiStatus: 'live' },
  { title: 'Operations', href: '/operations/jobs', icon: Workflow, apiStatus: 'live' },
  { title: 'Settings', href: '/settings', icon: Settings, apiStatus: 'hybrid' },
]

export function navLeaves(items: NavItem[] = navItems): NavItem[] {
  return items.flatMap((item) => (item.children?.length ? item.children : [item]))
}

export function isNavHrefActive(href: string, pathname: string): boolean {
  if (href === '/') return pathname === '/'
  if (href === '/recipes') {
    return (
      pathname === '/recipes' ||
      (pathname.startsWith('/recipes/') && !pathname.startsWith('/recipes/import'))
    )
  }
  if (href === '/settings') return pathname.startsWith('/settings')
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function pageTitleForPath(pathname: string) {
  if (pathname.startsWith('/recipes/import-review')) return 'Import Review'
  if (pathname.startsWith('/recipes/import')) return 'AI Import'
  if (pathname.startsWith('/recipes/') && pathname !== '/recipes') return 'Recipe Detail'
  if (pathname.startsWith('/settings')) return 'Settings'
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
