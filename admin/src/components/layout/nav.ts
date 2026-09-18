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

/** Matches docs/backend/ADMIN_API_CONTRACT.md */
export type NavApiStatus = 'live' | 'mock_only' | 'hybrid'

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  apiStatus: NavApiStatus
}

export const navItems: NavItem[] = [
  { title: 'Dashboard', href: '/', icon: LayoutDashboard, apiStatus: 'live' },
  { title: 'Users', href: '/users', icon: Users, apiStatus: 'live' },
  { title: 'Recipes', href: '/recipes', icon: CookingPot, apiStatus: 'mock_only' },
  { title: 'Collections', href: '/collections', icon: Library, apiStatus: 'mock_only' },
  { title: 'Ingredients', href: '/ingredients', icon: Carrot, apiStatus: 'mock_only' },
  { title: 'Grocery', href: '/grocery', icon: ShoppingCart, apiStatus: 'mock_only' },
  { title: 'Meal Plans', href: '/meal-plans', icon: CalendarDays, apiStatus: 'mock_only' },
  { title: 'Pantry', href: '/pantry', icon: Refrigerator, apiStatus: 'mock_only' },
  { title: 'Categories', href: '/categories', icon: Tags, apiStatus: 'mock_only' },
  { title: 'Subscription', href: '/subscription', icon: CreditCard, apiStatus: 'live' },
  { title: 'Settings', href: '/settings', icon: Settings, apiStatus: 'hybrid' },
]

export function pageTitleForPath(pathname: string) {
  if (pathname.startsWith('/recipes/') && pathname !== '/recipes') return 'Recipe Detail'
  const match = navItems.find((item) =>
    item.href === '/' ? pathname === '/' : pathname === item.href || pathname.startsWith(`${item.href}/`),
  )
  return match?.title ?? 'Admin'
}
