export type UserStatus = 'active' | 'suspended' | 'deleted'
export type SubscriptionPlan = 'free' | 'pro' | 'lifetime'
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'trialing'

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
}

export interface AdminUserDetail extends AdminUser {
  lastLoginAt: string | null
  locale: string
  timezone: string
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

export interface SubscriptionRecord {
  id: string
  user: {
    id: string
    displayName: string
    email: string
  }
  plan: SubscriptionPlan
  status: SubscriptionStatus
  startDate: string
  expirationDate: string | null
}

export interface DashboardStats {
  totalUsers: number
  totalRecipes: number
  collections: number
  favorites: number
}

export interface GrowthPoint {
  month: string
  users: number
  recipes: number
}

export interface RecentActivity {
  id: string
  type: 'user' | 'recipe' | 'collection' | 'subscription'
  title: string
  subtitle: string
  createdAt: string
}

export interface DashboardData {
  stats: DashboardStats
  growth: GrowthPoint[]
  recent: RecentActivity[]
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
  page?: number
  pageSize?: number
}

export interface ListRecipesParams {
  cuisine?: string
  category?: string
  tag?: string
  q?: string
}
