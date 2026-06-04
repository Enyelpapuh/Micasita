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
  refreshUser: () => Promise<AuthUser>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const API_MESSAGE_MAP: Record<string, string> = {
  AUTH_VALIDATION_REQUIRED_CREDENTIALS: 'Debes ingresar correo y contraseña.',
  AUTH_INVALID_CREDENTIALS: 'Credenciales inválidas.',
  AUTH_USER_BLOCKED_TOO_MANY_ATTEMPTS: 'Cuenta bloqueada temporalmente por demasiados intentos fallidos.',
  AUTH_USER_INACTIVE: 'Tu usuario está inactivo. Contacta a un administrador.',
  AUTH_SESSION_INVALID: 'La sesión no es válida. Inicia sesión de nuevo.',
  AUTH_PHONE_INVALID: 'El teléfono debe tener exactamente 8 dígitos.',
  AUTH_CEDULA_INVALID: 'Cédula inválida. Usa formato ###-######-####L o sin guiones.',
  AUTH_CEDULA_ALREADY_USED: 'La cédula ya está registrada por otro usuario.',
  AUTH_PASSWORD_FIELDS_REQUIRED: 'Debes indicar la contraseña actual y la nueva contraseña.',
  AUTH_PASSWORD_SAME_AS_CURRENT: 'La nueva contraseña debe ser diferente a la actual.',
  AUTH_CURRENT_PASSWORD_INVALID: 'La contraseña actual no coincide.',
  PASSWORD_REQUIRED: 'La contraseña es obligatoria.',
  PASSWORD_LENGTH_INVALID: 'La contraseña debe tener entre 8 y 64 caracteres.',
  PASSWORD_UPPERCASE_REQUIRED: 'La contraseña debe incluir al menos una letra mayúscula.',
  PASSWORD_LOWERCASE_REQUIRED: 'La contraseña debe incluir al menos una letra minúscula.',
  PASSWORD_DIGIT_REQUIRED: 'La contraseña debe incluir al menos un número.',
  PASSWORD_SPECIAL_REQUIRED: 'La contraseña debe incluir al menos un caracter especial.',
  PASSWORD_CONTAINS_PERSONAL_DATA: 'La contraseña no debe incluir datos personales.',
  AUTH_AVATAR_FILE_REQUIRED: 'Debes seleccionar un archivo de imagen.',
  AUTH_AVATAR_TOO_LARGE: 'La imagen supera el tamaño máximo permitido.',
  AUTH_AVATAR_INVALID_TYPE: 'Solo se permiten archivos de imagen.',
  ADMISION_TIPO_DOCUMENTO_NOMBRE_REQUERIDO: 'El nombre del tipo de documento es obligatorio.',
  ADMISION_TIPO_DOCUMENTO_YA_EXISTE: 'Ya existe un tipo de documento con ese nombre.',
  ADMISION_TIPO_DOCUMENTO_NO_ENCONTRADO: 'El tipo de documento no existe o ya fue eliminado.',
  ADMISION_TIPO_DOCUMENTO_REQUEST_INVALIDO: 'La solicitud para tipo de documento es inválida.',
  ADMISION_TIPO_DOCUMENTO_EN_USO: 'No se puede eliminar este tipo de documento porque ya está en uso.',
  ANUNCIO_PAYLOAD_REQUIRED: 'Debes completar la información de la noticia.',
  ANUNCIO_TITLE_REQUIRED: 'El título de la noticia es obligatorio.',
  ANUNCIO_DESCRIPTION_REQUIRED: 'La descripción de la noticia es obligatoria.',
  ANUNCIO_NOT_FOUND: 'La noticia no existe o ya fue eliminada.',
  ANUNCIO_IMAGE_TOO_LARGE: 'La imagen supera el tamaño máximo permitido.',
  ANUNCIO_IMAGE_INVALID_TYPE: 'Solo se permiten archivos de imagen.',
  ANUNCIO_IMAGE_INVALID_NAME: 'El nombre del archivo es inválido.',
  ANUNCIO_IMAGE_SAVE_ERROR: 'No fue posible guardar la imagen.',
  ANUNCIO_IMAGE_READ_ERROR: 'No fue posible leer la imagen.',
  ANUNCIO_IMAGE_TYPE_ERROR: 'No fue posible determinar el tipo de imagen.',
  ANUNCIO_IMAGE_NOT_FOUND: 'La imagen de la noticia no existe.',
}

export function normalizeApiError(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) {
    return fallback
  }

  const payload = error.response?.data as { message?: string } | undefined
  const raw = payload?.message
  if (!raw) {
    return fallback
  }

  return API_MESSAGE_MAP[raw] ?? raw
}

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
        if (axios.isAxiosError(error) && error.response?.status === 401 && error.response?.data?.message === 'AUTH_SESSION_INVALID') {
          window.dispatchEvent(new CustomEvent('session-expired'))
        }
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

  useEffect(() => {
    const handleSessionExpired = () => {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      setAuthState(null)
      import('react-hot-toast').then(({ default: toast }) => {
        toast.error('Tu sesión fue cerrada porque iniciaste sesión en otro dispositivo.', {
          id: 'session-expired-toast',
          duration: 6000,
          icon: '🔒',
        })
      })
    }

    window.addEventListener('session-expired', handleSessionExpired)
    return () => window.removeEventListener('session-expired', handleSessionExpired)
  }, [])

  useEffect(() => {
    if (!authState?.token) return

    const interval = setInterval(() => {
      api.get('/auth/me', { headers: { Authorization: `Bearer ${authState.token}` } }).catch((error) => {
        if (axios.isAxiosError(error) && error.response?.status === 401 && error.response?.data?.message === 'AUTH_SESSION_INVALID') {
          window.dispatchEvent(new CustomEvent('session-expired'))
        }
      })
    }, 15000)

    return () => clearInterval(interval)
  }, [authState?.token])

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
      throw new Error(normalizeApiError(error, 'No fue posible iniciar sesión'))
    }
  }

  const refreshUser = async () => {
    if (!authState?.token) {
      throw new Error('Sesion no valida')
    }

    try {
      const response = await api.get<AuthUser>('/auth/me', {
        headers: {
          Authorization: `Bearer ${authState.token}`,
        },
      })

      const nextAuthState = {
        token: authState.token,
        user: response.data,
      }

      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextAuthState))
      setAuthState(nextAuthState)
      return response.data
    } catch (error) {
      throw new Error(normalizeApiError(error, 'No fue posible actualizar los datos de la sesión'))
    }
  }

  const logout = async () => {
    if (authState?.token) {
      try {
        await api.post('/auth/logout', {}, {
          headers: { Authorization: `Bearer ${authState.token}` }
        })
      } catch (error) {
        console.error('Error cerrando sesión en el servidor', error)
      }
    }
    localStorage.removeItem(AUTH_STORAGE_KEY)
    setAuthState(null)
  }

  const value = useMemo<AuthContextValue>(() => ({
    user: authState?.user ?? null,
    token: authState?.token ?? null,
    isAuthenticated: Boolean(authState),
    isReady,
    login,
    refreshUser,
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
