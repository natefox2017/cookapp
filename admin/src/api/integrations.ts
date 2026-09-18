import { httpRequest, isMockMode, mockRequest } from '@/api/client'
import type {
  IntegrationConfigWriteInput,
  IntegrationId,
  IntegrationSecretWriteInput,
  IntegrationSecretWriteResult,
  IntegrationStatus,
  IntegrationTestResult,
  IntegrationsListResponse,
} from '@/types/integrations'

const mockIntegrations: IntegrationStatus[] = [
  {
    id: 'supabase',
    name: 'Supabase',
    status: 'connected',
    lastSuccessAt: '2026-09-18T03:00:00.000Z',
    lastErrorAt: null,
    lastErrorMessage: null,
    lastCheckedAt: '2026-09-18T03:00:00.000Z',
    configCompleteness: {
      required: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
      configured: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
      missing: [],
      percent: 100,
    },
    secretConfigured: true,
    testSupported: true,
    secretWriteSupported: false,
    reserved: false,
    notes: 'Mock: local/dev only — not production KPI truth.',
  },
  {
    id: 'revenuecat',
    name: 'RevenueCat',
    status: 'not_configured',
    lastSuccessAt: null,
    lastErrorAt: null,
    lastErrorMessage: null,
    lastCheckedAt: null,
    configCompleteness: {
      required: ['REVENUECAT_WEBHOOK_SECRET'],
      configured: [],
      missing: ['REVENUECAT_WEBHOOK_SECRET'],
      percent: 0,
    },
    secretConfigured: false,
    testSupported: true,
    secretWriteSupported: false,
    reserved: false,
    notes: 'Mock: webhook secret via supabase secrets.',
  },
  {
    id: 'app_store_connect',
    name: 'App Store Connect',
    status: 'not_configured',
    lastSuccessAt: null,
    lastErrorAt: null,
    lastErrorMessage: null,
    lastCheckedAt: null,
    configCompleteness: {
      required: ['issuerId', 'keyId', 'privateKey'],
      configured: [],
      missing: ['issuerId', 'keyId', 'privateKey'],
      percent: 0,
    },
    secretConfigured: false,
    testSupported: true,
    secretWriteSupported: true,
    reserved: false,
    notes: 'Mock: ASC Analytics lands with #59.',
  },
  {
    id: 'ai_gateway',
    name: 'AI Gateway',
    status: 'degraded',
    lastSuccessAt: '2026-09-17T12:00:00.000Z',
    lastErrorAt: '2026-09-18T01:00:00.000Z',
    lastErrorMessage: 'Mock: provider reported unhealthy',
    lastCheckedAt: '2026-09-18T01:00:00.000Z',
    configCompleteness: {
      required: ['enabledProvider', 'providerSecret'],
      configured: ['enabledProvider', 'providerSecret'],
      missing: [],
      percent: 100,
    },
    secretConfigured: true,
    testSupported: true,
    secretWriteSupported: false,
    reserved: false,
    notes: 'Mock: manage secrets under AI Platform.',
  },
  {
    id: 'google_play',
    name: 'Google Play',
    status: 'future_reserved',
    lastSuccessAt: null,
    lastErrorAt: null,
    lastErrorMessage: null,
    lastCheckedAt: null,
    configCompleteness: {
      required: [],
      configured: [],
      missing: [],
      percent: 0,
    },
    secretConfigured: false,
    testSupported: false,
    secretWriteSupported: false,
    reserved: true,
    notes: 'Future Reserved / Not Connected. Never mock as connected.',
  },
]

function cloneMocks(): IntegrationStatus[] {
  return structuredClone(mockIntegrations)
}

export async function listIntegrations(): Promise<IntegrationsListResponse> {
  if (isMockMode()) {
    return mockRequest(() => ({
      integrations: cloneMocks(),
      checkedAt: new Date().toISOString(),
    }))
  }
  return httpRequest<IntegrationsListResponse>('/functions/v1/admin-integrations')
}

export async function getIntegration(id: IntegrationId): Promise<IntegrationStatus> {
  if (isMockMode()) {
    return mockRequest(() => {
      const row = cloneMocks().find((i) => i.id === id)
      if (!row) throw new Error(`Unknown integration: ${id}`)
      return row
    })
  }
  return httpRequest<IntegrationStatus>(`/functions/v1/admin-integrations/${id}`)
}

export async function testIntegration(id: IntegrationId): Promise<IntegrationTestResult> {
  if (isMockMode()) {
    return mockRequest(() => {
      const integration = cloneMocks().find((i) => i.id === id)
      if (!integration) throw new Error(`Unknown integration: ${id}`)
      if (id === 'google_play') {
        return {
          ok: false,
          message: 'Google Play is Future Reserved',
          integration,
        }
      }
      const now = new Date().toISOString()
      if (integration.status === 'not_configured') {
        return {
          ok: false,
          message: 'Not configured — complete required settings before testing',
          integration: {
            ...integration,
            lastCheckedAt: now,
            lastErrorAt: now,
            lastErrorMessage: 'Integration is not fully configured',
          },
        }
      }
      return {
        ok: integration.status !== 'degraded',
        message:
          integration.status === 'degraded'
            ? integration.lastErrorMessage ?? 'Degraded'
            : 'Mock probe ok (dev only)',
        integration: {
          ...integration,
          lastCheckedAt: now,
          lastSuccessAt: integration.status === 'degraded' ? integration.lastSuccessAt : now,
        },
      }
    })
  }
  return httpRequest<IntegrationTestResult>(`/functions/v1/admin-integrations/${id}/test`, {
    method: 'POST',
    body: JSON.stringify({}),
  })
}

export async function writeIntegrationSecret(
  id: IntegrationId,
  input: IntegrationSecretWriteInput,
): Promise<IntegrationSecretWriteResult> {
  if (isMockMode()) {
    return mockRequest(() => {
      const integration = cloneMocks().find((i) => i.id === id)
      if (!integration) throw new Error(`Unknown integration: ${id}`)
      const updated: IntegrationStatus = {
        ...integration,
        secretConfigured: true,
        configCompleteness: {
          ...integration.configCompleteness,
          configured: integration.configCompleteness.required,
          missing: [],
          percent: 100,
        },
        status: 'connected',
      }
      // Never store or return the plaintext key in mock either.
      return { ok: true as const, secretConfigured: true as const, integration: updated }
    })
  }
  return httpRequest<IntegrationSecretWriteResult>(
    `/functions/v1/admin-integrations/${id}/secret`,
    {
      method: 'PUT',
      body: JSON.stringify(input),
    },
  )
}

export async function writeIntegrationConfig(
  id: IntegrationId,
  input: IntegrationConfigWriteInput,
): Promise<{ ok: boolean; integration: IntegrationStatus }> {
  if (isMockMode()) {
    return mockRequest(() => {
      const integration = cloneMocks().find((i) => i.id === id)
      if (!integration) throw new Error(`Unknown integration: ${id}`)
      return { ok: true, integration }
    })
  }
  return httpRequest(`/functions/v1/admin-integrations/${id}/config`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}
