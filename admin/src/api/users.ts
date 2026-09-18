import { httpRequest, isMockMode, mockRequest } from '@/api/client'
import {
  computeUserRegistrationStats,
  mockDashboard,
  mockUserDetails,
  mockUsers,
} from '@/mocks/data'
import type {
  AdminUser,
  AdminUserDetail,
  DashboardData,
  ListUsersParams,
  PaginatedResponse,
} from '@/types/admin'

const BASE = '/functions/v1/admin-users'

export async function getDashboard(): Promise<DashboardData> {
  if (isMockMode()) {
    return mockRequest(() => mockDashboard)
  }
  return httpRequest<DashboardData>('/admin/dashboard')
}

export async function listUsers(
  params: ListUsersParams = {},
): Promise<PaginatedResponse<AdminUser>> {
  if (isMockMode()) {
    return mockRequest(() => {
      const q = params.q?.trim().toLowerCase() ?? ''
      const status = params.status ?? 'all'
      const subscription = params.subscription ?? 'all'
      const registrationType = params.registrationType ?? 'all'
      const deviceType = params.deviceType ?? 'all'
      const page = params.page ?? 1
      const pageSize = params.pageSize ?? 20

      const filtered = mockUsers.filter((user) => {
        const matchesQuery =
          !q ||
          user.email.toLowerCase().includes(q) ||
          user.displayName.toLowerCase().includes(q) ||
          (user.registrationIp ?? '').includes(q)
        const matchesStatus = status === 'all' || user.status === status
        const matchesPlan = subscription === 'all' || user.subscription === subscription
        const matchesReg =
          registrationType === 'all' || user.registrationType === registrationType
        const matchesDevice = deviceType === 'all' || user.deviceType === deviceType
        return matchesQuery && matchesStatus && matchesPlan && matchesReg && matchesDevice
      })

      const start = (page - 1) * pageSize
      return {
        data: filtered.slice(start, start + pageSize),
        total: filtered.length,
        page,
        pageSize,
        stats: computeUserRegistrationStats(filtered),
      }
    })
  }

  const search = new URLSearchParams()
  if (params.q) search.set('q', params.q)
  if (params.status && params.status !== 'all') search.set('status', params.status)
  if (params.subscription && params.subscription !== 'all') {
    search.set('subscription', params.subscription)
  }
  if (params.registrationType && params.registrationType !== 'all') {
    search.set('registrationType', params.registrationType)
  }
  if (params.deviceType && params.deviceType !== 'all') {
    search.set('deviceType', params.deviceType)
  }
  if (params.page) search.set('page', String(params.page))
  if (params.pageSize) search.set('pageSize', String(params.pageSize))
  const qs = search.toString()
  return httpRequest<PaginatedResponse<AdminUser>>(`${BASE}${qs ? `?${qs}` : ''}`)
}

export async function getUser(id: string): Promise<AdminUserDetail> {
  if (isMockMode()) {
    return mockRequest(() => {
      const user = mockUserDetails[id]
      if (!user) throw new Error(`User ${id} not found`)
      return structuredClone(user)
    })
  }
  return httpRequest<AdminUserDetail>(`${BASE}/${id}`)
}
