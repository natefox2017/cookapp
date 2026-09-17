export interface AdminIdentity {
  id: string
  username: string
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
