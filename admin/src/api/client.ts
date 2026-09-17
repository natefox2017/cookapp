const USE_MOCK = (import.meta.env.VITE_ADMIN_USE_MOCK ?? 'true') === 'true'
const API_BASE = import.meta.env.VITE_ADMIN_API_BASE_URL ?? ''

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
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
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new ApiError(text || response.statusText, response.status)
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
