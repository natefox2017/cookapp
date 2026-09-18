const USE_MOCK = (import.meta.env.VITE_ADMIN_USE_MOCK ?? 'true') === 'true'
const API_BASE = import.meta.env.VITE_ADMIN_API_BASE_URL ?? ''
const ADMIN_TOKEN_KEY = 'cookapp-admin-token'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function adminAuthHeaders(): Record<string, string> {
  try {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY)
    return token ? { Authorization: `Bearer ${token}` } : {}
  } catch {
    return {}
  }
}

async function delay(ms = 220) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

export async function mockRequest<T>(factory: () => T | Promise<T>): Promise<T> {
  await delay()
  return factory()
}

export async function httpRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...adminAuthHeaders(),
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    let message = response.statusText
    try {
      const payload = (await response.json()) as {
        error?: { message?: string }
        message?: string
      }
      message = payload.error?.message || payload.message || message
    } catch {
      try {
        message = (await response.text()) || message
      } catch {
        // keep statusText
      }
    }
    throw new ApiError(message, response.status)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export function isMockMode() {
  return USE_MOCK
}

export { USE_MOCK, API_BASE }
