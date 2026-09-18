/** Admin password strength policy (Issue #51). Mirror of Edge `_shared/admin-password.ts`. */

export const ADMIN_PASSWORD_MIN_LENGTH = 12

const BLOCKLIST = new Set([
  'admin',
  'password',
  'password123',
  'cookappadmin',
  'adminadmin',
])

export function validateAdminPassword(password: string): {
  ok: boolean
  message?: string
} {
  if (!password || password.length < ADMIN_PASSWORD_MIN_LENGTH) {
    return {
      ok: false,
      message: `Password must be at least ${ADMIN_PASSWORD_MIN_LENGTH} characters`,
    }
  }
  if (!/[A-Z]/.test(password)) {
    return { ok: false, message: 'Password must include an uppercase letter' }
  }
  if (!/[a-z]/.test(password)) {
    return { ok: false, message: 'Password must include a lowercase letter' }
  }
  if (!/[0-9]/.test(password)) {
    return { ok: false, message: 'Password must include a digit' }
  }
  if (BLOCKLIST.has(password.toLowerCase())) {
    return { ok: false, message: 'Password is too common' }
  }
  return { ok: true }
}

export function isDefaultAdminCredentials(
  username: string,
  password: string,
): boolean {
  return username.trim().toLowerCase() === 'admin' && password === 'admin'
}

/** Vite/browser: production MODE forbids mock unless explicitly overridden at build. */
export function isProductionAdminBuild(): boolean {
  return import.meta.env.MODE === 'production'
}
