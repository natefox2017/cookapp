import {
  LayoutDashboard,
  Users,
  CookingPot,
  Library,
  Carrot,
  ShoppingCart,
  CalendarDays,
  Refrigerator,
  Tags,
  CreditCard,
  Settings,
  Sparkles,
  ClipboardCheck,
  Package,
  Wallet,
  BarChart3,
  Activity,
  ScrollText,
  Database,
  Bot,
  Plug,
  Shield,
  Server,
  type LucideIcon,
} from 'lucide-react'

/** Matches docs/backend/ADMIN_API_CONTRACT.md */
export type NavApiStatus = 'live' | 'mock_only' | 'hybrid' | 'planned'

export interface NavLeaf {
  title: string
  href: string
  icon: LucideIcon
  apiStatus: NavApiStatus
}

export interface NavGroup {
  title: string
  icon: LucideIcon
  /** First / default child when expanding or matching the section */
  children: NavLeaf[]
}

export type NavEntry = NavLeaf | NavGroup

export function isNavGroup(entry: NavEntry): entry is NavGroup {
  return 'children' in entry && Array.isArray(entry.children)
}

/**
 * Notion V2 §14 Navigation IA.
 * Existing capabilities stay reachable; new modules use planned/mock_only until live Admin UI APIs exist.
 */
export const navItems: NavEntry[] = [
  { title: 'Dashboard', href: '/', icon: LayoutDashboard, apiStatus: 'live' },
  { title: 'Users', href: '/users', icon: Users, apiStatus: 'live' },
  {
    title: 'Recipes',
    icon: CookingPot,
    children: [
      { title: 'Library', href: '/recipes', icon: CookingPot, apiStatus: 'mock_only' },
      { title: 'AI Import', href: '/recipes/import', icon: Sparkles, apiStatus: 'planned' },
      {
        title: 'Import Review',
        href: '/recipes/import-review',
        icon: ClipboardCheck,
        apiStatus: 'planned',
      },
    ],
  },
  {
    title: 'Commerce',
    icon: CreditCard,
    children: [
      {
        title: 'Products · Subscriptions',
        href: '/commerce/products',
        icon: Package,
        apiStatus: 'live',
      },
      { title: 'Payments', href: '/commerce/payments', icon: Wallet, apiStatus: 'planned' },
    ],
  },
  { title: 'Analytics', href: '/analytics', icon: BarChart3, apiStatus: 'planned' },
  {
    title: 'Operations',
    icon: Activity,
    children: [
      { title: 'Jobs & Syncs', href: '/operations/jobs', icon: Activity, apiStatus: 'planned' },
      { title: 'Audit Log', href: '/operations/audit-log', icon: ScrollText, apiStatus: 'planned' },
    ],
  },
  {
    title: 'Data',
    icon: Database,
    children: [
      { title: 'Collections', href: '/data/collections', icon: Library, apiStatus: 'mock_only' },
      { title: 'Ingredients', href: '/data/ingredients', icon: Carrot, apiStatus: 'mock_only' },
      { title: 'Grocery', href: '/data/grocery', icon: ShoppingCart, apiStatus: 'mock_only' },
      { title: 'Meal Plans', href: '/data/meal-plans', icon: CalendarDays, apiStatus: 'mock_only' },
      { title: 'Pantry', href: '/data/pantry', icon: Refrigerator, apiStatus: 'mock_only' },
      { title: 'Categories', href: '/data/categories', icon: Tags, apiStatus: 'mock_only' },
    ],
  },
  {
    title: 'Settings',
    icon: Settings,
    children: [
      { title: 'General', href: '/settings/general', icon: Settings, apiStatus: 'hybrid' },
      { title: 'AI Platform', href: '/settings/ai-platform', icon: Bot, apiStatus: 'planned' },
      { title: 'Integrations', href: '/settings/integrations', icon: Plug, apiStatus: 'planned' },
      { title: 'Security', href: '/settings/security', icon: Shield, apiStatus: 'live' },
      { title: 'System', href: '/settings/system', icon: Server, apiStatus: 'hybrid' },
    ],
  },
]

/** Flat leaves for redirects, title lookup, and active-state matching. */
export function flattenNavLeaves(entries: NavEntry[] = navItems): NavLeaf[] {
  const leaves: NavLeaf[] = []
  for (const entry of entries) {
    if (isNavGroup(entry)) leaves.push(...entry.children)
    else leaves.push(entry)
  }
  return leaves
}

const RECIPE_DETAIL = /^\/recipes\/(?!import(?:-review)?$)[^/]+$/

export function pageTitleForPath(pathname: string) {
  if (RECIPE_DETAIL.test(pathname)) return 'Recipe Detail'

  const leaves = flattenNavLeaves()
  const exact = leaves.find((item) => item.href === pathname)
  if (exact) return exact.title

  const nested = leaves
    .filter((item) => item.href !== '/' && pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]
  if (nested) return nested.title

  if (pathname === '/' || pathname === '') return 'Dashboard'
  return 'Admin'
}

export function navLeafForPath(pathname: string): NavLeaf | undefined {
  if (RECIPE_DETAIL.test(pathname)) {
    return flattenNavLeaves().find((item) => item.href === '/recipes')
  }
  const leaves = flattenNavLeaves()
  const exact = leaves.find((item) => item.href === pathname)
  if (exact) return exact
  return leaves
    .filter((item) => item.href !== '/' && pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]
}

export function isPathUnderGroup(pathname: string, group: NavGroup): boolean {
  return group.children.some((child) =>
    child.href === '/'
      ? pathname === '/'
      : pathname === child.href || pathname.startsWith(`${child.href}/`) ||
        (child.href === '/recipes' && RECIPE_DETAIL.test(pathname)),
  )
}
