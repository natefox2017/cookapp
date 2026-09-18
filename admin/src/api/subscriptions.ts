import { httpRequest, isMockMode, mockRequest } from '@/api/client'
import {
  mockSubscriptionPlans,
  mockSubscriptionRevenue,
  mockSubscriptions,
} from '@/mocks/data'
import type {
  ListSubscriptionsParams,
  StorePlatform,
  SubscriptionPlanInput,
  SubscriptionPlanProduct,
  SubscriptionRecord,
  SubscriptionRevenueData,
} from '@/types/admin'

const BASE = '/functions/v1/admin-subscriptions'

function filterSeries(
  data: SubscriptionRevenueData,
  platform: StorePlatform | 'all',
): SubscriptionRevenueData {
  if (platform === 'all') return structuredClone(data)
  const series = data.series.map((point) => {
    const apple = platform === 'app_store' ? point.apple : 0
    const android = platform === 'play_store' ? point.android : 0
    return { month: point.month, apple, android, total: apple + android }
  })
  return {
    stats: {
      ...data.stats,
      appleRevenue: platform === 'app_store' ? data.stats.appleRevenue : 0,
      androidRevenue: platform === 'play_store' ? data.stats.androidRevenue : 0,
      mrr: platform === 'app_store' ? 44.98 : platform === 'play_store' ? 9.99 : data.stats.mrr,
    },
    series,
  }
}

export async function listSubscriptionPlans(): Promise<SubscriptionPlanProduct[]> {
  if (isMockMode()) {
    return mockRequest(() =>
      [...mockSubscriptionPlans].sort((a, b) => a.planKey.localeCompare(b.planKey) || a.platform.localeCompare(b.platform)),
    )
  }
  return httpRequest(`${BASE}/plans`)
}

export async function createSubscriptionPlan(
  payload: SubscriptionPlanInput,
): Promise<SubscriptionPlanProduct> {
  if (isMockMode()) {
    return mockRequest(() => {
      const row: SubscriptionPlanProduct = {
        ...payload,
        id: `plan_${crypto.randomUUID().slice(0, 8)}`,
        updatedAt: new Date().toISOString(),
      }
      mockSubscriptionPlans.push(row)
      return structuredClone(row)
    })
  }
  return httpRequest(`${BASE}/plans`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateSubscriptionPlan(
  id: string,
  payload: SubscriptionPlanInput,
): Promise<SubscriptionPlanProduct> {
  if (isMockMode()) {
    return mockRequest(() => {
      const index = mockSubscriptionPlans.findIndex((item) => item.id === id)
      if (index < 0) throw new Error('Plan not found')
      mockSubscriptionPlans[index] = {
        ...mockSubscriptionPlans[index],
        ...payload,
        id,
        updatedAt: new Date().toISOString(),
      }
      return structuredClone(mockSubscriptionPlans[index])
    })
  }
  return httpRequest(`${BASE}/plans/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function deleteSubscriptionPlan(id: string): Promise<void> {
  if (isMockMode()) {
    return mockRequest(() => {
      const index = mockSubscriptionPlans.findIndex((item) => item.id === id)
      if (index >= 0) mockSubscriptionPlans.splice(index, 1)
    })
  }
  await httpRequest(`${BASE}/plans/${id}`, { method: 'DELETE' })
}

export async function listSubscriptions(
  params: ListSubscriptionsParams = {},
): Promise<SubscriptionRecord[]> {
  const platform = params.platform ?? 'all'
  if (isMockMode()) {
    return mockRequest(() => {
      if (platform === 'all') return structuredClone(mockSubscriptions)
      return mockSubscriptions.filter((item) => item.platform === platform)
    })
  }
  const search = new URLSearchParams()
  if (platform !== 'all') search.set('platform', platform)
  const qs = search.toString()
  return httpRequest(`${BASE}/records${qs ? `?${qs}` : ''}`)
}

export async function getSubscriptionRevenue(
  platform: StorePlatform | 'all' = 'all',
): Promise<SubscriptionRevenueData> {
  if (isMockMode()) {
    return mockRequest(() => filterSeries(mockSubscriptionRevenue, platform))
  }
  const search = new URLSearchParams()
  if (platform !== 'all') search.set('platform', platform)
  const qs = search.toString()
  return httpRequest(`${BASE}/revenue${qs ? `?${qs}` : ''}`)
}
