import { httpRequest, isMockMode, mockRequest } from '@/api/client'
import {
  mockAiHealth,
  mockAiModels,
  mockAiProviders,
  mockAiRoutes,
  mockAiUsage,
  mockAnalytics,
  mockImportJobs,
  mockOpsJobs,
  mockPaymentTransactions,
} from '@/mocks/ops'
import type {
  AiHealthRow,
  AiModel,
  AiProvider,
  AiRoute,
  AiUsageSummary,
  AnalyticsPayload,
  OpsJobList,
  PaymentTransactionList,
  RecipeImportJob,
} from '@/types/ops'

export async function getAnalytics(): Promise<AnalyticsPayload> {
  if (isMockMode()) return mockRequest(() => structuredClone(mockAnalytics))
  return httpRequest('/functions/v1/admin-analytics')
}

export async function listOpsJobs(): Promise<OpsJobList> {
  if (isMockMode()) {
    return mockRequest(() => ({
      data: structuredClone(mockOpsJobs),
      total: mockOpsJobs.length,
      pageSize: 50,
      offset: 0,
    }))
  }
  return httpRequest('/functions/v1/admin-operations/jobs?limit=50')
}

export async function runOpsJob(jobType: string): Promise<{ jobId: string; status: string }> {
  if (isMockMode()) {
    return mockRequest(() => ({ jobId: `job_${Date.now()}`, status: 'running' }))
  }
  return httpRequest('/functions/v1/admin-operations/jobs/run', {
    method: 'POST',
    body: JSON.stringify({ jobType }),
  })
}

export async function retryOpsJob(jobId: string): Promise<{ jobId: string; status: string }> {
  if (isMockMode()) {
    return mockRequest(() => ({ jobId, status: 'pending' }))
  }
  return httpRequest(`/functions/v1/admin-operations/jobs/${jobId}/retry`, { method: 'POST' })
}

export async function listPaymentTransactions(): Promise<PaymentTransactionList> {
  if (isMockMode()) {
    return mockRequest(() => ({
      data: structuredClone(mockPaymentTransactions),
      total: mockPaymentTransactions.length,
      page: 1,
      pageSize: 50,
      googlePlay: {
        status: 'reserved_not_implemented',
        note: 'Google Play schema/enum only — no live sync or fake Android revenue',
      },
    }))
  }
  return httpRequest('/functions/v1/admin-subscriptions/transactions?pageSize=50')
}

export async function listImportJobs(status?: string): Promise<RecipeImportJob[]> {
  if (isMockMode()) {
    return mockRequest(() => {
      const rows = structuredClone(mockImportJobs)
      return status ? rows.filter((job) => job.status === status) : rows
    })
  }
  const qs = status ? `?status=${encodeURIComponent(status)}` : ''
  const payload = await httpRequest<{ jobs: RecipeImportJob[] }>(
    `/functions/v1/admin-recipe-import/jobs${qs}`,
  )
  return payload.jobs
}

export async function enqueueImportJob(sourceUrl: string): Promise<RecipeImportJob> {
  if (isMockMode()) {
    return mockRequest(() => {
      const job: RecipeImportJob = {
        id: `imp_${Date.now()}`,
        batchId: null,
        sourceType: 'web',
        sourceUrl,
        canonicalUrl: sourceUrl,
        status: 'pending',
        stage: 'resolve',
        confidence: null,
        duplicateStatus: null,
        recipeId: null,
        errorCode: null,
        errorMessage: null,
        retryCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      mockImportJobs.unshift(job)
      return job
    })
  }
  const payload = await httpRequest<{ job: RecipeImportJob }>(
    '/functions/v1/admin-recipe-import/jobs',
    { method: 'POST', body: JSON.stringify({ sourceUrl }) },
  )
  return payload.job
}

async function importAction(id: string, action: 'approve' | 'reject' | 'reparse' | 'retry') {
  if (isMockMode()) {
    return mockRequest(() => {
      const job = mockImportJobs.find((item) => item.id === id)
      if (!job) throw new Error('Import job not found')
      if (action === 'approve') job.status = 'imported'
      if (action === 'reject') job.status = 'rejected'
      if (action === 'reparse' || action === 'retry') job.status = 'pending'
      job.updatedAt = new Date().toISOString()
      return structuredClone(job)
    })
  }
  await httpRequest(`/functions/v1/admin-recipe-import/jobs/${id}/${action}`, {
    method: 'POST',
    body: '{}',
  })
}

export const approveImportJob = (id: string) => importAction(id, 'approve')
export const rejectImportJob = (id: string) => importAction(id, 'reject')
export const reparseImportJob = (id: string) => importAction(id, 'reparse')
export const retryImportJob = (id: string) => importAction(id, 'retry')

export async function listAiProviders(): Promise<AiProvider[]> {
  if (isMockMode()) return mockRequest(() => structuredClone(mockAiProviders))
  return httpRequest('/functions/v1/admin-ai/providers')
}

export async function listAiModels(): Promise<AiModel[]> {
  if (isMockMode()) return mockRequest(() => structuredClone(mockAiModels))
  return httpRequest('/functions/v1/admin-ai/models')
}

export async function listAiRoutes(): Promise<AiRoute[]> {
  if (isMockMode()) return mockRequest(() => structuredClone(mockAiRoutes))
  return httpRequest('/functions/v1/admin-ai/routes')
}

export async function getAiUsage(): Promise<AiUsageSummary> {
  if (isMockMode()) return mockRequest(() => structuredClone(mockAiUsage))
  const payload = await httpRequest<{
    summary?: {
      requests?: number
      errorRate?: number
      inputTokens?: number
      outputTokens?: number
    }
    events?: AiUsageSummary['events']
    requestCount?: number
    errorCount?: number
    totalInputTokens?: number
    totalOutputTokens?: number
  }>('/functions/v1/admin-ai/usage')
  if (payload.summary) {
    const requests = payload.summary.requests ?? 0
    return {
      requestCount: requests,
      errorCount: Math.round((payload.summary.errorRate ?? 0) * requests),
      totalInputTokens: payload.summary.inputTokens ?? 0,
      totalOutputTokens: payload.summary.outputTokens ?? 0,
      events: payload.events,
    }
  }
  return {
    requestCount: payload.requestCount ?? 0,
    errorCount: payload.errorCount ?? 0,
    totalInputTokens: payload.totalInputTokens ?? 0,
    totalOutputTokens: payload.totalOutputTokens ?? 0,
    events: payload.events,
  }
}

export async function listAiHealth(): Promise<AiHealthRow[]> {
  if (isMockMode()) return mockRequest(() => structuredClone(mockAiHealth))
  const payload = await httpRequest<
    AiHealthRow[] | { data?: AiHealthRow[]; providers?: AiHealthRow[] }
  >('/functions/v1/admin-ai/health')
  if (Array.isArray(payload)) return payload
  return payload.providers ?? payload.data ?? []
}

export async function writeAiProviderSecret(id: string, secret: string): Promise<void> {
  if (isMockMode()) {
    return mockRequest(() => {
      const provider = mockAiProviders.find((item) => item.id === id)
      if (provider) provider.secretConfigured = true
    })
  }
  await httpRequest(`/functions/v1/admin-ai/providers/${id}/secret`, {
    method: 'PUT',
    body: JSON.stringify({ secret }),
  })
}

export async function testAiProvider(id: string): Promise<{ ok: boolean; latencyMs?: number }> {
  if (isMockMode()) return mockRequest(() => ({ ok: true, latencyMs: 42 }))
  return httpRequest(`/functions/v1/admin-ai/providers/${id}/test`, {
    method: 'POST',
    body: '{}',
  })
}
