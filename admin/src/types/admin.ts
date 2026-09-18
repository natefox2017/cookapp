export type UserStatus = 'active' | 'suspended' | 'deleted'
export type SubscriptionPlan = 'free' | 'pro' | 'lifetime'
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'trialing' | 'billing_issue'
/** Store platforms used for plan catalog + record filters. */
export type StorePlatform = 'app_store' | 'play_store'
export type BillingPeriod = 'monthly' | 'yearly' | 'lifetime'
/** Auth registration provider (Sign in with Apple / Google / email). */
export type RegistrationProvider = 'apple' | 'google' | 'email' | 'unknown'
/** Client device class captured at registration / first session. */
export type DeviceType = 'ios' | 'android' | 'web' | 'unknown'

export interface AdminUser {
  id: string
  email: string
  displayName: string
  avatarUrl: string | null
  subscription: SubscriptionPlan
  recipeCount: number
  favoriteCount: number
  createdAt: string
  status: UserStatus
  /** Auth provider used at signup. */
  registrationProvider: RegistrationProvider
  /** Device class recorded for the account. */
  deviceType: DeviceType
}

export interface UserPaymentRecord {
  id: string
  eventType: string
  productId: string | null
  store: StorePlatform | null
  amount: number | null
  currency: string | null
  environment: string | null
  purchasedAt: string
}

export interface AdminUserDetail extends AdminUser {
  lastLoginAt: string | null
  locale: string
  timezone: string
  /** Registration request IP when captured (null if unknown). */
  registrationIp: string | null
  /** Purchase / subscription timeline for this user. */
  payments: UserPaymentRecord[]
}

export interface UserMixBucket<T extends string> {
  key: T
  label: string
  count: number
}

export interface UserRegistrationStats {
  total: number
  byProvider: UserMixBucket<RegistrationProvider>[]
  byDevice: UserMixBucket<DeviceType>[]
}

export interface RecipeSummary {
  id: string
  title: string
  coverUrl: string
  cuisine: string
  category: string
  tags: string[]
  createdAt: string
  ownerEmail: string
}

export interface RecipeIngredient {
  name: string
  quantity: string
  unit: string
}

export interface RecipeStep {
  order: number
  instruction: string
}

export interface RecipeNutrition {
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
}

export interface RecipeDetail extends RecipeSummary {
  ingredients: RecipeIngredient[]
  steps: RecipeStep[]
  nutrition: RecipeNutrition
  notes: string
  servings: number
  updatedAt: string
}

export interface CollectionSummary {
  id: string
  name: string
  coverUrl: string
  recipeCount: number
  owner: {
    id: string
    displayName: string
    avatarUrl: string | null
  }
  createdAt: string
  isPublic: boolean
}

export interface Ingredient {
  id: string
  name: string
  category: string
  unit: string
  alternativeName: string | null
}

export type IngredientInput = Omit<Ingredient, 'id'>

export interface GroceryUser {
  id: string
  displayName: string
  email: string
  itemCount: number
  completedCount: number
}

export interface GroceryItem {
  id: string
  userId: string
  ingredient: string
  quantity: string
  category: string
  completed: boolean
}

export interface MealPlanEntry {
  date: string
  breakfast: string | null
  lunch: string | null
  dinner: string | null
}

export interface PantryItem {
  id: string
  ingredient: string
  quantity: number
  unit: string
  expirationDate: string
  freshnessPercent: number
}

export interface TaxonomyItem {
  id: string
  name: string
  slug: string
  usageCount: number
}

/** Admin-managed catalog row — one product SKU per platform. */
export interface SubscriptionPlanProduct {
  id: string
  /** Logical plan key shown to ops (e.g. pro_monthly). */
  planKey: string
  displayName: string
  platform: StorePlatform
  /** App Store / Play Console product identifier. */
  productId: string
  price: number
  currency: string
  billingPeriod: BillingPeriod
  active: boolean
  description: string | null
  updatedAt: string
}

export type SubscriptionPlanInput = Omit<SubscriptionPlanProduct, 'id' | 'updatedAt'>

export interface SubscriptionRecord {
  id: string
  user: {
    id: string
    displayName: string
    email: string
  }
  plan: SubscriptionPlan
  status: SubscriptionStatus
  platform: StorePlatform | null
  productId: string | null
  /** Last known paid amount for this entitlement (null for free). */
  amount: number | null
  currency: string | null
  startDate: string
  expirationDate: string | null
}

export interface SubscriptionRevenuePoint {
  month: string
  apple: number
  android: number
  total: number
}

export interface SubscriptionRevenueStats {
  mrr: number
  appleRevenue: number
  androidRevenue: number
  activePaid: number
}

export interface SubscriptionRevenueData {
  stats: SubscriptionRevenueStats
  series: SubscriptionRevenuePoint[]
}

export interface ListSubscriptionsParams {
  platform?: StorePlatform | 'all'
}

export interface DashboardStats {
  totalUsers: number
  totalRecipes: number
  collections: number
  favorites: number
  /** Users created in the current calendar month (UTC). */
  newUsersThisMonth: number
  activePaidUsers: number
  suspendedUsers: number
  revenueTotal: number
  revenueMrr: number
  revenueApple: number
  revenueAndroid: number
  paymentTransactions: number
  downloadsTotal: number
  downloadsIos: number
  downloadsAndroid: number
}

export interface GrowthPoint {
  month: string
  users: number
  recipes: number
}

export interface DashboardSeriesPoint {
  month: string
  users: number
  recipes: number
  revenue: number
  revenueApple: number
  revenueAndroid: number
  downloadsIos: number
  downloadsAndroid: number
}

export interface DashboardBreakdownItem {
  key: string
  label: string
  value: number
}

export interface DashboardRecentPayment {
  id: string
  userLabel: string
  eventType: string
  store: string
  amount: number | null
  currency: string | null
  createdAt: string
}

export interface RecentActivity {
  id: string
  type: 'user' | 'recipe' | 'collection' | 'subscription' | 'payment' | 'download'
  title: string
  subtitle: string
  createdAt: string
}

export interface DashboardData {
  stats: DashboardStats
  growth: GrowthPoint[]
  series: DashboardSeriesPoint[]
  userBreakdown: {
    byRegistrationType: DashboardBreakdownItem[]
    byDeviceType: DashboardBreakdownItem[]
    byPlan: DashboardBreakdownItem[]
  }
  recent: RecentActivity[]
  recentPayments: DashboardRecentPayment[]
}

export interface AdminSettings {
  general: {
    appName: string
    supportEmail: string
    defaultLocale: string
    maintenanceMode: boolean
  }
  units: {
    measurementSystem: 'metric' | 'imperial'
    temperatureUnit: 'celsius' | 'fahrenheit'
  }
  categories: {
    allowUserTags: boolean
    requireCuisine: boolean
  }
  system: {
    mockMode: boolean
    apiBaseUrl: string
    logLevel: 'debug' | 'info' | 'warn' | 'error'
  }
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

export interface ListUsersParams {
  q?: string
  status?: UserStatus | 'all'
  subscription?: SubscriptionPlan | 'all'
  registrationProvider?: RegistrationProvider | 'all'
  deviceType?: DeviceType | 'all'
  page?: number
  pageSize?: number
}

export interface ListRecipesParams {
  cuisine?: string
  category?: string
  tag?: string
  q?: string
}
