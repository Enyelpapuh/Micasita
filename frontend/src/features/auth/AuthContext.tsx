import axios from 'axios'
import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import type { AuthResponse, AuthState, AuthUser } from './auth.types'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api'
const AUTH_STORAGE_KEY = 'micasita.auth'

const api = axios.create({
  baseURL: API_BASE_URL,
})

type AuthContextValue = {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  isReady: boolean
  login: (email: string, password: string) => Promise<AuthUser>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function decodeJwtPayload(token: string): { exp?: number } | null {
  try {
    const payloadPart = token.split('.')[1]
    if (!payloadPart) {
      return null
    }

    const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
    const json = atob(padded)
    return JSON.parse(json) as { exp?: number }
  } catch {
    return null
  }
}

function readStoredAuth(): AuthState | null {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY)
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as AuthState
    const payload = decodeJwtPayload(parsed.token)

    if (!payload?.exp || payload.exp * 1000 <= Date.now()) {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      return null
    }

    return parsed
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [authState, setAuthState] = useState<AuthState | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const storedAuth = readStoredAuth()

    if (!storedAuth) {
      setAuthState(null)
      setIsReady(true)
      return
    }

    let cancelled = false

    const validateSession = async () => {
      try {
        const response = await api.get<AuthUser>('/auth/me', {
          headers: {
            Authorization: `Bearer ${storedAuth.token}`,
          },
        })

        const nextAuthState = {
          token: storedAuth.token,
          user: response.data,
        }

        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextAuthState))

        if (!cancelled) {
          setAuthState(nextAuthState)
        }
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY)
        if (!cancelled) {
          setAuthState(null)
        }
      } finally {
        if (!cancelled) {
          setIsReady(true)
        }
      }
    }

    validateSession()

    return () => {
      cancelled = true
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post<AuthResponse>('/auth/login', { email, password })
      const data = response.data

      const nextAuthState = {
        token: data.token,
        user: data.user,
      }

      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextAuthState))
      setAuthState(nextAuthState)
      return data.user
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = (error.response?.data as { message?: string } | undefined)?.message
        throw new Error(message || 'No fue posible iniciar sesion')
      }

      throw new Error('No fue posible iniciar sesion')
    }
  }

  const logout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    setAuthState(null)
  }

  const value = useMemo<AuthContextValue>(() => ({
    user: authState?.user ?? null,
    token: authState?.token ?? null,
    isAuthenticated: Boolean(authState),
    isReady,
    login,
    logout,
  }), [authState, isReady])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }

  return context
}
