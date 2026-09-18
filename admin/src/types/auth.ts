export type AdminRole = 'owner' | 'admin' | 'operator' | 'readonly'

export interface AdminIdentity {
  id: string
  username: string
  role?: AdminRole
  mustChangePassword?: boolean
}

export interface AdminLoginResult {
  token: string
  expiresAt: string
  admin: AdminIdentity
}

export interface AdminSessionResult {
  admin: AdminIdentity
}

export interface AdminChangePasswordResult {
  ok: true
  token: string
  expiresAt: string
  admin: AdminIdentity
}

export interface AdminBootstrapResult {
  token: string
  expiresAt: string
  admin: AdminIdentity
}
