import axios from 'axios'
import { normalizeApiError } from '../../auth/AuthContext'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api'
const API_ORIGIN = new URL(API_BASE_URL).origin

const api = axios.create({
  baseURL: API_BASE_URL,
})

export type NewsAnnouncement = {
  id: number
  titulo: string
  descripcion: string
  rutaImagen?: string | null
  fechaPublicacion?: string | null
  fechaExpiracion?: string | null
  activo?: boolean | null
  usuarioId?: number | null
}

export type SaveNewsPayload = {
  titulo: string
  descripcion: string
  fechaExpiracion?: string | null
}

export type UpdateNewsPayload = SaveNewsPayload

function authHeaders(token: string | null) {
  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {}
}

function ensureToken(token: string | null) {
  if (!token) {
    throw new Error('Sesión no válida')
  }
}

export function resolveNewsImageUrl(rutaImagen?: string | null): string {
  if (!rutaImagen) {
    return ''
  }

  if (rutaImagen.startsWith('http://') || rutaImagen.startsWith('https://')) {
    return rutaImagen
  }

  return new URL(rutaImagen, API_ORIGIN).toString()
}

export async function getPublicNews(): Promise<NewsAnnouncement[]> {
  try {
    const response = await api.get<NewsAnnouncement[]>('/noticias')
    return response.data
  } catch (error) {
    throw new Error(normalizeApiError(error, 'No fue posible cargar las noticias'))
  }
}

export async function getAdminNews(token: string | null): Promise<NewsAnnouncement[]> {
  ensureToken(token)

  try {
    const response = await api.get<NewsAnnouncement[]>('/noticias/admin', {
      headers: authHeaders(token),
    })
    return response.data
  } catch (error) {
    throw new Error(normalizeApiError(error, 'No fue posible cargar las noticias'))
  }
}

export async function createNews(
  token: string | null,
  payload: SaveNewsPayload,
): Promise<NewsAnnouncement> {
  ensureToken(token)

  try {
    const response = await api.post<NewsAnnouncement>('/noticias', payload, {
      headers: authHeaders(token),
    })
    return response.data
  } catch (error) {
    throw new Error(normalizeApiError(error, 'No fue posible crear la noticia'))
  }
}

export async function updateNews(
  token: string | null,
  anuncioId: number,
  payload: UpdateNewsPayload,
): Promise<NewsAnnouncement> {
  ensureToken(token)

  try {
    const response = await api.put<NewsAnnouncement>(`/noticias/${anuncioId}`, payload, {
      headers: authHeaders(token),
    })
    return response.data
  } catch (error) {
    throw new Error(normalizeApiError(error, 'No fue posible actualizar la noticia'))
  }
}

export async function uploadNewsImage(
  token: string | null,
  anuncioId: number,
  file: File,
): Promise<NewsAnnouncement> {
  ensureToken(token)

  const formData = new FormData()
  formData.append('file', file)

  try {
    const response = await api.post<NewsAnnouncement>(`/noticias/${anuncioId}/imagen`, formData, {
      headers: authHeaders(token),
    })
    return response.data
  } catch (error) {
    throw new Error(normalizeApiError(error, 'No fue posible subir la imagen de la noticia'))
  }
}

export async function deleteNews(token: string | null, anuncioId: number): Promise<void> {
  ensureToken(token)

  try {
    await api.delete(`/noticias/${anuncioId}`, {
      headers: authHeaders(token),
    })
  } catch (error) {
    throw new Error(normalizeApiError(error, 'No fue posible eliminar la noticia'))
  }
}