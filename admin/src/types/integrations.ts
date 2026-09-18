export type IntegrationId =
  | 'supabase'
  | 'revenuecat'
  | 'app_store_connect'
  | 'ai_gateway'
  | 'google_play'

export type IntegrationConnectionStatus =
  | 'connected'
  | 'not_configured'
  | 'degraded'
  | 'future_reserved'

export interface IntegrationConfigCompleteness {
  required: string[]
  configured: string[]
  missing: string[]
  percent: number
}

export interface IntegrationStatus {
  id: IntegrationId
  name: string
  status: IntegrationConnectionStatus
  lastSuccessAt: string | null
  lastErrorAt: string | null
  lastErrorMessage: string | null
  lastCheckedAt: string | null
  configCompleteness: IntegrationConfigCompleteness
  /** Server-side secret present; never includes plaintext. */
  secretConfigured: boolean
  testSupported: boolean
  secretWriteSupported: boolean
  reserved: boolean
  notes: string | null
}

export interface IntegrationsListResponse {
  integrations: IntegrationStatus[]
  checkedAt: string
}

export interface IntegrationTestResult {
  ok: boolean
  message: string
  integration: IntegrationStatus
}

export interface IntegrationSecretWriteResult {
  ok: boolean
  secretConfigured: true
  integration: IntegrationStatus
}

export interface IntegrationSecretWriteInput {
  /** Write-only; never echoed by the API. */
  privateKey?: string
  apiKey?: string
  secret?: string
  issuerId?: string
  keyId?: string
}

export interface IntegrationConfigWriteInput {
  issuerId?: string
  keyId?: string
}
