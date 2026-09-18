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
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  /** When true, Production live mode has no Admin Edge Function yet (Issue #52). */
  liveApi?: boolean
}

export const navItems: NavItem[] = [
  { title: 'Dashboard', href: '/', icon: LayoutDashboard, liveApi: true },
  { title: 'Users', href: '/users', icon: Users, liveApi: true },
  { title: 'Recipes', href: '/recipes', icon: CookingPot, liveApi: false },
  { title: 'Collections', href: '/collections', icon: Library, liveApi: false },
  { title: 'Ingredients', href: '/ingredients', icon: Carrot, liveApi: false },
  { title: 'Grocery', href: '/grocery', icon: ShoppingCart, liveApi: false },
  { title: 'Meal Plans', href: '/meal-plans', icon: CalendarDays, liveApi: false },
  { title: 'Pantry', href: '/pantry', icon: Refrigerator, liveApi: false },
  { title: 'Categories', href: '/categories', icon: Tags, liveApi: false },
  { title: 'Subscription', href: '/subscription', icon: CreditCard, liveApi: true },
  { title: 'Settings', href: '/settings', icon: Settings, liveApi: true },
]

export function pageTitleForPath(pathname: string) {
  if (pathname.startsWith('/recipes/') && pathname !== '/recipes') return 'Recipe Detail'
  const match = navItems.find((item) =>
    item.href === '/' ? pathname === '/' : pathname === item.href || pathname.startsWith(`${item.href}/`),
  )
  return match?.title ?? 'Admin'
}
