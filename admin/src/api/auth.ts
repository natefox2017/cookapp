import { httpRequest, isMockMode, mockRequest, ApiError } from '@/api/client'
import { validateAdminPassword } from '@/lib/password-policy'
import type {
  AdminBootstrapResult,
  AdminChangePasswordResult,
  AdminIdentity,
  AdminLoginResult,
  AdminSessionResult,
} from '@/types/auth'

const TOKEN_KEY = 'cookapp-admin-token'
const ADMIN_KEY = 'cookapp-admin-user'

/** In-memory mock password store (resets on full page reload of module). */
let mockPassword = 'admin'
const mockAdmin: AdminIdentity = {
  id: 'adm_mock_01',
  username: 'admin',
  role: 'owner',
  mustChangePassword: false,
}

const mockSessions = new Map<string, { adminId: string; expiresAt: number }>()

function mockToken() {
  return `mock_${crypto.randomUUID().replace(/-/g, '')}`
}

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function getStoredAdmin(): AdminIdentity | null {
  try {
    const raw = localStorage.getItem(ADMIN_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AdminIdentity
  } catch {
    return null
  }
}

export function persistSession(token: string, admin: AdminIdentity) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(ADMIN_KEY, JSON.stringify(admin))
}

export function clearStoredSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(ADMIN_KEY)
}

export async function loginAdmin(
  username: string,
  password: string,
): Promise<AdminLoginResult> {
  if (isMockMode()) {
    return mockRequest(() => {
      if (username.trim().toLowerCase() !== 'admin' || password !== mockPassword) {
        throw new ApiError('Invalid username or password', 401)
      }
      const token = mockToken()
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      mockSessions.set(token, { adminId: mockAdmin.id, expiresAt: Date.parse(expiresAt) })
      return { token, expiresAt, admin: { ...mockAdmin } }
    })
  }

  return httpRequest<AdminLoginResult>('/functions/v1/admin-auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

export async function bootstrapAdminOwner(input: {
  username?: string
  newPassword: string
  currentPassword?: string
}): Promise<AdminBootstrapResult> {
  const strength = validateAdminPassword(input.newPassword)
  if (!strength.ok) {
    throw new ApiError(strength.message ?? 'Weak password', 400)
  }

  if (isMockMode()) {
    return mockRequest(() => {
      mockPassword = input.newPassword
      mockAdmin.username = (input.username ?? 'admin').trim().toLowerCase()
      mockAdmin.mustChangePassword = false
      mockSessions.clear()
      const token = mockToken()
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      mockSessions.set(token, { adminId: mockAdmin.id, expiresAt: Date.parse(expiresAt) })
      return { token, expiresAt, admin: { ...mockAdmin } }
    })
  }

  return httpRequest<AdminBootstrapResult>('/functions/v1/admin-auth/bootstrap', {
    method: 'POST',
    body: JSON.stringify({
      username: input.username ?? 'admin',
      newPassword: input.newPassword,
      currentPassword: input.currentPassword ?? 'admin',
    }),
  })
}

export async function logoutAdmin(): Promise<void> {
  const token = getStoredToken()
  if (isMockMode()) {
    return mockRequest(() => {
      if (token) mockSessions.delete(token)
    })
  }
  if (!token) return
  try {
    await httpRequest<{ ok: boolean }>('/functions/v1/admin-auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
  } catch {
    // Still clear local session on failure
  }
}

export async function getAdminSession(): Promise<AdminSessionResult> {
  const token = getStoredToken()
  if (!token) throw new ApiError('Not authenticated', 401)

  if (isMockMode()) {
    return mockRequest(() => {
      const session = mockSessions.get(token)
      if (session && session.expiresAt > Date.now()) {
        return { admin: { ...mockAdmin } }
      }
      const storedAdmin = getStoredAdmin()
      if (token.startsWith('mock_') && storedAdmin) {
        const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000
        mockSessions.set(token, { adminId: mockAdmin.id, expiresAt })
        return { admin: { ...mockAdmin, ...storedAdmin } }
      }
      mockSessions.delete(token)
      throw new ApiError('Invalid or expired admin session', 401)
    })
  }

  return httpRequest<AdminSessionResult>('/functions/v1/admin-auth/session', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function changeAdminPassword(
  currentPassword: string,
  newPassword: string,
): Promise<AdminChangePasswordResult> {
  const token = getStoredToken()
  if (!token) throw new ApiError('Not authenticated', 401)

  const strength = validateAdminPassword(newPassword)
  if (!strength.ok) {
    throw new ApiError(strength.message ?? 'Weak password', 400)
  }

  if (isMockMode()) {
    return mockRequest(() => {
      if (currentPassword !== mockPassword) {
        throw new ApiError('Current password is incorrect', 401)
      }
      mockPassword = newPassword
      mockAdmin.mustChangePassword = false
      mockSessions.clear()
      const next = mockToken()
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      mockSessions.set(next, { adminId: mockAdmin.id, expiresAt: Date.parse(expiresAt) })
      return {
        ok: true as const,
        token: next,
        expiresAt,
        admin: { ...mockAdmin },
      }
    })
  }

  return httpRequest<AdminChangePasswordResult>('/functions/v1/admin-auth/change-password', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ currentPassword, newPassword }),
  })
}
