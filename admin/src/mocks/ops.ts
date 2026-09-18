import type {
  AiHealthRow,
  AiModel,
  AiProvider,
  AiRoute,
  AiUsageSummary,
  AnalyticsPayload,
  OpsJob,
  PaymentTransaction,
  RecipeImportJob,
} from '@/types/ops'

export const mockAnalytics: AnalyticsPayload = {
  generatedAt: '2026-09-18T12:00:00Z',
  dateRange: { from: null, to: null },
  downloads: {
    ios: {
      key: 'downloads_ios',
      label: 'iOS downloads',
      value: null,
      source: 'app_store_connect_analytics',
      freshness: null,
      availability: 'not_configured',
      note: 'ASC credentials not configured',
    },
    android: {
      key: 'downloads_android',
      label: 'Android downloads',
      value: null,
      source: null,
      freshness: null,
      availability: 'future_reserved',
      note: 'Google Play / Android Future Reserved — not connected; never fake zeros',
    },
    series: [],
  },
  userGrowth: {
    source: 'cookapp_db.profiles',
    series: [
      { month: 'Jul', users: 12, recipes: 4 },
      { month: 'Aug', users: 18, recipes: 9 },
      { month: 'Sep', users: 21, recipes: 11 },
    ],
  },
  importQuality: {
    source: 'cookapp_db.recipe_import_jobs',
    imported: 0,
    failed: 0,
    needsReview: 1,
    bySourceType: [{ key: 'web', total: 1, imported: 0, failed: 0 }],
  },
  revenue: {
    apple: {
      key: 'revenue_apple_estimated',
      label: 'Apple estimated gross',
      value: null,
      source: 'revenuecat',
      freshness: null,
      availability: 'no_data',
    },
    android: {
      key: 'revenue_android',
      label: 'Android revenue',
      value: null,
      source: null,
      freshness: null,
      availability: 'future_reserved',
      note: 'Google Play Future Reserved',
    },
    note: 'Analytics must not merge Financial Report final proceeds with RC estimates',
  },
  platforms: {
    ios: { availability: 'available' },
    android: { availability: 'future_reserved', status: 'future_reserved' },
  },
}

export const mockOpsJobs: OpsJob[] = [
  {
    id: 'job_01',
    jobType: 'recipe_import_worker',
    provider: 'cookapp',
    status: 'succeeded',
    trigger: 'cron',
    startedAt: '2026-09-18T11:00:00Z',
    completedAt: '2026-09-18T11:01:12Z',
    nextRunAt: '2026-09-18T12:00:00Z',
    rowsAffected: 0,
    itemsTotal: 0,
    itemsFailed: 0,
    retryCount: 0,
    maxRetries: 3,
    errorCode: null,
    errorMessage: null,
    requestId: 'req_01',
  },
  {
    id: 'job_02',
    jobType: 'google_play_sync',
    provider: 'google_play',
    status: 'future_reserved',
    trigger: 'system',
    startedAt: null,
    completedAt: null,
    nextRunAt: null,
    rowsAffected: null,
    itemsTotal: null,
    itemsFailed: null,
    retryCount: 0,
    maxRetries: 0,
    errorCode: null,
    errorMessage: 'Google Play Future Reserved',
    requestId: null,
  },
]

export const mockPaymentTransactions: PaymentTransaction[] = [
  {
    id: 'txn_01',
    userId: 'usr_01',
    platform: 'ios',
    store: 'app_store',
    eventType: 'INITIAL_PURCHASE',
    status: 'recorded',
    productId: 'pro_monthly',
    currency: 'USD',
    grossAmount: 4.99,
    refundAmount: 0,
    estimatedProceeds: 4.24,
    finalProceeds: null,
    purchaseAt: '2026-09-12T09:00:00Z',
    providerSource: 'revenuecat',
    createdAt: '2026-09-12T09:00:05Z',
  },
]

export const mockImportJobs: RecipeImportJob[] = [
  {
    id: 'imp_01',
    batchId: null,
    sourceType: 'web',
    sourceUrl: 'https://example.com/recipe/tomato-pasta',
    canonicalUrl: 'https://example.com/recipe/tomato-pasta',
    status: 'needs_review',
    stage: 'validate',
    confidence: 0.41,
    duplicateStatus: null,
    recipeId: null,
    errorCode: 'LOW_CONFIDENCE',
    errorMessage: 'Missing yield; flagged for review',
    retryCount: 0,
    createdAt: '2026-09-18T10:12:00Z',
    updatedAt: '2026-09-18T10:12:40Z',
  },
]

export const mockAiProviders: AiProvider[] = [
  {
    id: 'prov_01',
    name: 'Primary gateway',
    protocol: 'openai_compatible',
    baseUrl: 'https://gateway.example.invalid/v1',
    secretConfigured: false,
    enabled: true,
    status: 'not_configured',
    lastHealthCheckAt: null,
    environment: 'production',
  },
]

export const mockAiModels: AiModel[] = [
  {
    id: 'mdl_01',
    providerId: 'prov_01',
    displayName: 'Import text',
    upstreamModelId: 'gpt-4o-mini',
    enabled: true,
  },
]

export const mockAiRoutes: AiRoute[] = [
  {
    routeKey: 'recipe_import_text',
    primaryModelId: 'mdl_01',
    fallbackModelIds: [],
    enabled: true,
  },
]

export const mockAiUsage: AiUsageSummary = {
  requestCount: 0,
  errorCount: 0,
  totalInputTokens: 0,
  totalOutputTokens: 0,
  events: [],
}

export const mockAiHealth: AiHealthRow[] = [
  {
    providerId: 'prov_01',
    status: 'unknown',
    lastSuccessAt: null,
    lastError: 'Secret not configured',
  },
]
