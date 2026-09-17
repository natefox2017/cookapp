import { httpRequest, isMockMode, mockRequest } from '@/api/client'
import {
  mockDashboard,
  mockUserDetails,
  mockUsers,
} from '@/mocks/data'
import type {
  AdminUserDetail,
  DashboardData,
  ListUsersParams,
  PaginatedResponse,
  AdminUser,
} from '@/types/admin'

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
      const page = params.page ?? 1
      const pageSize = params.pageSize ?? 20

      const filtered = mockUsers.filter((user) => {
        const matchesQuery =
          !q ||
          user.email.toLowerCase().includes(q) ||
          user.displayName.toLowerCase().includes(q)
        const matchesStatus = status === 'all' || user.status === status
        const matchesPlan = subscription === 'all' || user.subscription === subscription
        return matchesQuery && matchesStatus && matchesPlan
      })

      const start = (page - 1) * pageSize
      return {
        data: filtered.slice(start, start + pageSize),
        total: filtered.length,
        page,
        pageSize,
      }
    })
  }

  const search = new URLSearchParams()
  if (params.q) search.set('q', params.q)
  if (params.status && params.status !== 'all') search.set('status', params.status)
  if (params.subscription && params.subscription !== 'all') {
    search.set('subscription', params.subscription)
  }
  if (params.page) search.set('page', String(params.page))
  if (params.pageSize) search.set('pageSize', String(params.pageSize))
  const qs = search.toString()
  return httpRequest<PaginatedResponse<AdminUser>>(`/admin/users${qs ? `?${qs}` : ''}`)
}

export async function getUser(id: string): Promise<AdminUserDetail> {
  if (isMockMode()) {
    return mockRequest(() => {
      const user = mockUserDetails[id]
      if (!user) throw new Error(`User ${id} not found`)
      return user
    })
  }
  return httpRequest<AdminUserDetail>(`/admin/users/${id}`)
}
