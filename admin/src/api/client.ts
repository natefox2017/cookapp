/** Admin API HTTP client. Mock is development-only (Issue #51). */

function resolveMockFlag(): boolean {
  const explicit = import.meta.env.VITE_ADMIN_USE_MOCK
  const isProd = import.meta.env.MODE === 'production'

  if (isProd) {
    // Production builds never default to mock. Explicit true is still blocked at boot.
    return explicit === 'true'
  }

  // Local/dev: default mock on unless explicitly disabled.
  if (explicit === undefined || explicit === '') return true
  return explicit === 'true'
}

const USE_MOCK = resolveMockFlag()
const API_BASE = import.meta.env.VITE_ADMIN_API_BASE_URL ?? ''
const ADMIN_TOKEN_KEY = 'cookapp-admin-token'

/** True when a production build was incorrectly compiled with mock=true. */
export const PRODUCTION_MOCK_BLOCKED =
  import.meta.env.MODE === 'production' && USE_MOCK

export class ApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
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
  if (PRODUCTION_MOCK_BLOCKED) {
    throw new ApiError(
      'Mock Admin API is forbidden in production builds (Issue #51).',
      503,
    )
  }
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
  return USE_MOCK && !PRODUCTION_MOCK_BLOCKED
}

export { USE_MOCK, API_BASE }
