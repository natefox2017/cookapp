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
}

export const navItems: NavItem[] = [
  { title: 'Dashboard', href: '/', icon: LayoutDashboard },
  { title: 'Users', href: '/users', icon: Users },
  { title: 'Recipes', href: '/recipes', icon: CookingPot },
  { title: 'Collections', href: '/collections', icon: Library },
  { title: 'Ingredients', href: '/ingredients', icon: Carrot },
  { title: 'Grocery', href: '/grocery', icon: ShoppingCart },
  { title: 'Meal Plans', href: '/meal-plans', icon: CalendarDays },
  { title: 'Pantry', href: '/pantry', icon: Refrigerator },
  { title: 'Categories', href: '/categories', icon: Tags },
  { title: 'Subscription', href: '/subscription', icon: CreditCard },
  { title: 'Settings', href: '/settings', icon: Settings },
]

export function pageTitleForPath(pathname: string) {
  if (pathname.startsWith('/recipes/') && pathname !== '/recipes') return 'Recipe Detail'
  const match = navItems.find((item) =>
    item.href === '/' ? pathname === '/' : pathname === item.href || pathname.startsWith(`${item.href}/`),
  )
  return match?.title ?? 'Admin'
}
