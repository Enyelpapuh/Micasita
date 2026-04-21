import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api'
const API_ORIGIN = new URL(API_BASE_URL).origin
const AUTH_STORAGE_KEY = 'micasita.auth'

const adminApi = axios.create({
  baseURL: API_BASE_URL,
})

export type AdminUsuario = {
  usuarioId: number
  personaId: number
  nombre: string
  apellido: string
  fechaNacimiento?: string | null
  telefono?: string | null
  identificador?: string | null
  email: string
  pathAvatar?: string | null
  activo: boolean
  roles: string[]
}

export type AdminRol = {
  id: number
  nombre: string
}

export type CreateAdminUsuarioPayload = {
  nombre: string
  apellido: string
  fechaNacimiento?: string | null
  telefono?: string | null
  identificador?: string | null
  email: string
  password: string
  activo: boolean
  roles: string[]
}

function getStoredToken() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) {
      return null
    }
    const parsed = JSON.parse(raw) as { token?: string }
    return parsed.token ?? null
  } catch {
    return null
  }
}

function authHeaders(token: string | null) {
  const next = token ?? getStoredToken()
  if (!next) {
    return {}
  }

  return {
    Authorization: `Bearer ${next}`,
  }
}

export async function getAdminUsuarios(token: string | null): Promise<AdminUsuario[]> {
  const response = await adminApi.get<AdminUsuario[]>('/admin/usuarios', {
    headers: authHeaders(token),
  })
  return response.data
}

export async function getAdminRoles(token: string | null): Promise<AdminRol[]> {
  const response = await adminApi.get<AdminRol[]>('/admin/usuarios/roles', {
    headers: authHeaders(token),
  })
  return response.data
}

export async function createAdminUsuario(
  token: string | null,
  payload: CreateAdminUsuarioPayload,
): Promise<AdminUsuario> {
  const response = await adminApi.post<AdminUsuario>('/admin/usuarios', payload, {
    headers: authHeaders(token),
  })
  return response.data
}

export async function updateAdminUsuarioRoles(
  token: string | null,
  usuarioId: number,
  roles: string[],
): Promise<AdminUsuario> {
  const response = await adminApi.put<AdminUsuario>(`/admin/usuarios/${usuarioId}/roles`, { roles }, {
    headers: authHeaders(token),
  })
  return response.data
}

export async function updateAdminUsuarioEstado(
  token: string | null,
  usuarioId: number,
  activo: boolean,
): Promise<AdminUsuario> {
  const response = await adminApi.put<AdminUsuario>(`/admin/usuarios/${usuarioId}/estado`, { activo }, {
    headers: authHeaders(token),
  })
  return response.data
}

export async function uploadAdminUsuarioAvatar(
  token: string | null,
  usuarioId: number,
  file: File,
): Promise<AdminUsuario> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await adminApi.post<AdminUsuario>(`/admin/usuarios/${usuarioId}/avatar`, formData, {
    headers: {
      ...authHeaders(token),
      'Content-Type': 'multipart/form-data',
    },
  })

  return response.data
}

export function resolveAdminAvatarUrl(pathAvatar?: string | null): string {
  if (!pathAvatar) {
    return ''
  }

  if (pathAvatar.startsWith('http://') || pathAvatar.startsWith('https://')) {
    return pathAvatar
  }

  return new URL(pathAvatar, API_ORIGIN).toString()
}
