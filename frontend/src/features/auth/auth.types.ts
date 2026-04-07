export type AuthUser = {
  id: number
  personaId: number
  email: string
  nombre: string
  apellido: string
  roles: string[]
  permisos: string[]
}

export type AuthResponse = {
  token: string
  tokenType: string
  expiresInMinutes: number
  user: AuthUser
}

export type AuthState = {
  token: string
  user: AuthUser
}
