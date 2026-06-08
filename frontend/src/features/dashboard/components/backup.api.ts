import axios from 'axios'
import { normalizeApiError } from '../../auth/AuthContext'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api'

export type BackupResponse = {
  mensaje?: string
  ruta?: string
  fecha?: string
  error?: string
}

export type BackupFile = {
  fileName: string
  size: number
  lastModified: string
}

export async function triggerManualBackup(token: string | null): Promise<BackupResponse> {
  if (!token) throw new Error('Sesión no válida')
  
  try {
    const response = await axios.post<BackupResponse>(`${API_BASE_URL}/admin/backup/generar`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  } catch (error) {
    throw new Error(normalizeApiError(error, 'No se pudo generar la copia de seguridad en el servidor'))
  }
}

export async function listBackups(token: string | null): Promise<BackupFile[]> {
  if (!token) throw new Error('Sesión no válida')
  
  try {
    const response = await axios.get<BackupFile[]>(`${API_BASE_URL}/admin/backup/list`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  } catch (error) {
    throw new Error(normalizeApiError(error, 'No se pudo obtener la lista de respaldos'))
  }
}

export async function downloadBackup(fileName: string, token: string | null): Promise<void> {
  if (!token) throw new Error('Sesión no válida')
  const response = await axios.get(`${API_BASE_URL}/admin/backup/download/${encodeURIComponent(fileName)}`, {
    headers: { Authorization: `Bearer ${token}` },
    responseType: 'blob'
  })
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', fileName)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}