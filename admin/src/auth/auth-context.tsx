import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  changeAdminPassword,
  clearStoredSession,
  getAdminSession,
  getStoredAdmin,
  getStoredToken,
  loginAdmin,
  logoutAdmin,
  persistSession,
} from '@/api/auth'
import type { AdminIdentity } from '@/types/auth'
import { ApiError } from '@/api/client'

interface AuthContextValue {
  admin: AdminIdentity | null
  token: string | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminIdentity | null>(() => getStoredAdmin())
  const [token, setToken] = useState<string | null>(() => getStoredToken())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function bootstrap() {
      const stored = getStoredToken()
      if (!stored) {
        if (!cancelled) {
          setAdmin(null)
          setToken(null)
          setLoading(false)
        }
        return
      }
      try {
        const session = await getAdminSession()
        if (!cancelled) {
          setAdmin(session.admin)
          setToken(stored)
          persistSession(stored, session.admin)
        }
      } catch {
        clearStoredSession()
        if (!cancelled) {
          setAdmin(null)
          setToken(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const result = await loginAdmin(username, password)
    persistSession(result.token, result.admin)
    setToken(result.token)
    setAdmin(result.admin)
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutAdmin()
    } finally {
      clearStoredSession()
      setToken(null)
      setAdmin(null)
    }
  }, [])

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    const result = await changeAdminPassword(currentPassword, newPassword)
    persistSession(result.token, result.admin)
    setToken(result.token)
    setAdmin(result.admin)
  }, [])

  const value = useMemo(
    () => ({ admin, token, loading, login, logout, changePassword }),
    [admin, token, loading, login, logout, changePassword],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function useAuthOptional() {
  return useContext(AuthContext)
}

export function authErrorMessage(err: unknown) {
  if (err instanceof ApiError) return err.message
  if (err instanceof Error) return err.message
  return 'Request failed'
}
