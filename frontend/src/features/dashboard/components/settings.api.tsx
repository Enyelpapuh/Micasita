import axios from 'axios'
import { normalizeApiError } from '../../auth/AuthContext'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api'

const api = axios.create({
  baseURL: API_BASE_URL,
})

export async function changeMyPassword(token: string | null, currentPassword: string, newPassword: string): Promise<void> {
  if (!token) {
    throw new Error('Sesión no válida')
  }

  try {
    await api.post(
      '/auth/change-password',
      { currentPassword, newPassword },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )
  } catch (error) {
    throw new Error(normalizeApiError(error, 'No fue posible actualizar la contraseña'))
  }
}

export type MyProfilePayload = {
  telefono?: string | null
  identificador?: string | null
}

export type MyProfileResponse = {
  id: number
  personaId: number
  email: string
  nombre: string
  apellido: string
  telefono?: string | null
  identificador?: string | null
  pathAvatar?: string | null
  activo?: boolean
  roles: string[]
  permisos: string[]
}

const API_BASE_ORIGIN = new URL(API_BASE_URL).origin

export function resolveMyAvatarUrl(pathAvatar?: string | null): string {
  if (!pathAvatar) {
    return ''
  }
  if (pathAvatar.startsWith('http://') || pathAvatar.startsWith('https://')) {
    return pathAvatar
  }
  return new URL(pathAvatar, API_BASE_ORIGIN).toString()
}

export async function updateMyProfile(token: string | null, payload: MyProfilePayload): Promise<MyProfileResponse> {
  if (!token) {
    throw new Error('Sesión no válida')
  }

  try {
    const response = await api.put<MyProfileResponse>('/auth/me/profile', payload, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  } catch (error) {
    throw new Error(normalizeApiError(error, 'No fue posible actualizar el perfil'))
  }
}

export async function uploadMyAvatar(token: string | null, file: File): Promise<MyProfileResponse> {
  if (!token) {
    throw new Error('Sesión no válida')
  }

  const formData = new FormData()
  formData.append('file', file)

  try {
    const response = await api.post<MyProfileResponse>('/auth/me/avatar', formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  } catch (error) {
    throw new Error(normalizeApiError(error, 'No fue posible actualizar el avatar'))
  }
}
