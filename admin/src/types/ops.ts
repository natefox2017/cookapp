import type { DashboardKpiMetric, PaginatedResponse } from '@/types/admin'

export type OpsJobStatus =
  | 'pending'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'cancelled'
  | 'not_configured'
  | 'future_reserved'

export interface OpsJob {
  id: string
  jobType: string
  provider: string
  status: OpsJobStatus
  trigger: string
  startedAt: string | null
  completedAt: string | null
  nextRunAt: string | null
  rowsAffected: number | null
  itemsTotal: number | null
  itemsFailed: number | null
  retryCount: number
  maxRetries: number
  errorCode: string | null
  errorMessage: string | null
  requestId: string | null
}

export interface OpsJobList {
  data: OpsJob[]
  total: number
  pageSize: number
  offset: number
}

export interface PaymentTransaction {
  id: string
  userId: string | null
  platform: string | null
  store: string | null
  eventType: string
  status: string
  productId: string | null
  currency: string | null
  grossAmount: number | null
  refundAmount: number | null
  estimatedProceeds: number | null
  finalProceeds: number | null
  purchaseAt: string | null
  providerSource: string | null
  createdAt: string
}

export interface PaymentTransactionList extends PaginatedResponse<PaymentTransaction> {
  googlePlay: { status: string; note: string }
}

export interface AnalyticsPayload {
  generatedAt?: string
  dateRange?: { from: string | null; to: string | null }
  downloads: {
    ios?: DashboardKpiMetric
    android?: DashboardKpiMetric
    series: { month: string; downloadsIos: number | null; downloadsAndroid: number | null }[]
  }
  userGrowth: { source: string; series: { month: string; users: number; recipes: number }[] }
  importQuality: {
    source: string
    imported: number
    failed: number
    needsReview: number
    bySourceType: { key: string; total: number; imported: number; failed: number }[]
  }
  revenue: {
    apple?: DashboardKpiMetric
    android?: DashboardKpiMetric
    note: string
  }
  platforms?: {
    ios?: { availability: string }
    android?: { availability: string; status?: string; note?: string }
  }
}

export interface RecipeImportJob {
  id: string
  batchId: string | null
  sourceType: string
  sourceUrl: string | null
  canonicalUrl: string | null
  status: string
  stage: string
  confidence: number | null
  duplicateStatus: string | null
  recipeId: string | null
  errorCode: string | null
  errorMessage: string | null
  retryCount: number
  createdAt: string
  updatedAt: string
}

export interface AiProvider {
  id: string
  name: string
  protocol: string
  baseUrl: string
  secretConfigured: boolean
  enabled: boolean
  status: string
  lastHealthCheckAt: string | null
  environment: string
}

export interface AiModel {
  id: string
  providerId: string
  displayName: string
  upstreamModelId: string
  enabled: boolean
}

export interface AiRoute {
  routeKey: string
  primaryModelId: string | null
  fallbackModelIds: string[]
  enabled: boolean
}

export interface AiUsageSummary {
  requestCount?: number
  errorCount?: number
  totalInputTokens?: number
  totalOutputTokens?: number
  events?: { routeKey?: string; modelId?: string; status?: string; createdAt?: string }[]
}

export interface AiHealthRow {
  providerId: string
  status: string
  lastSuccessAt: string | null
  lastError: string | null
}
