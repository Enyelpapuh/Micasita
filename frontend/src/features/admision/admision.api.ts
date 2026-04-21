import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api'

const api = axios.create({
  baseURL: API_BASE_URL,
})

export type TipoDocumento = {
  id: number
  nombre: string
  obligatorio: boolean
}

export type LandingAdmisionConfig = {
  formularioActivo: boolean
  tiposDocumento: TipoDocumento[]
  maxFileBytes: number
  allowedMimeTypes: string[]
}

export type CreateSolicitudPayload = {
  nombrePostulante: string
  apellidoPostulante: string
  fechaNacimientoPostulante: string
  telefonoPostulante?: string | null
  nombreTutor: string
  parentescoTutor: string
  telefonoTutor?: string | null
  correoTutor?: string | null
  tutoresAdicionalesResumen?: string | null
}

export type EstadoSolicitud = {
  id: number
  nombre: string
}

export type DocumentoSolicitud = {
  id: number
  tipoDocumentoId: number
  tipoDocumento: string
  rutaArchivo: string
  fechaSubida: string
}

export type SolicitudAdmision = {
  id: number
  personaId: number
  nombrePostulante: string
  apellidoPostulante: string
  telefonoPostulante?: string | null
  correoPostulante?: string | null
  identificadorPostulante?: string | null
  nombreTutor?: string | null
  parentescoTutor?: string | null
  telefonoTutor?: string | null
  correoTutor?: string | null
  estadoSolicitudId: number
  estadoSolicitud: string
  fechaCreacion: string
  comentariosDirector?: string | null
  activo: boolean
  documentos: DocumentoSolicitud[]
}

function authHeaders(token: string | null) {
  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {}
}

export async function getLandingAdmisionConfig(): Promise<LandingAdmisionConfig> {
  const response = await api.get<LandingAdmisionConfig>('/admision/config')
  return response.data
}

export async function createSolicitudAdmision(
  payload: CreateSolicitudPayload,
  filesByTipo: Record<number, File | null>,
): Promise<void> {
  const formData = new FormData()
  formData.append('payload', new Blob([JSON.stringify(payload)], { type: 'application/json' }))

  Object.entries(filesByTipo).forEach(([tipoId, file]) => {
    if (file) {
      formData.append(`doc_${tipoId}`, file)
    }
  })

  await api.post('/admision/solicitudes', formData)
}

export async function getAdminSolicitudes(token: string | null): Promise<SolicitudAdmision[]> {
  const response = await api.get<SolicitudAdmision[]>('/admision/admin/solicitudes', {
    headers: authHeaders(token),
  })
  return response.data
}

export async function getAdminEstados(token: string | null): Promise<EstadoSolicitud[]> {
  const response = await api.get<EstadoSolicitud[]>('/admision/admin/estados', {
    headers: authHeaders(token),
  })
  return response.data
}

export async function getAdminTiposDocumento(token: string | null): Promise<TipoDocumento[]> {
  const response = await api.get<TipoDocumento[]>('/admision/admin/tipos-documento', {
    headers: authHeaders(token),
  })
  return response.data
}

export async function createAdminTipoDocumento(
  token: string | null,
  payload: { nombre: string; obligatorio: boolean },
): Promise<TipoDocumento> {
  const response = await api.post<TipoDocumento>('/admision/admin/tipos-documento', payload, {
    headers: authHeaders(token),
  })
  return response.data
}

export async function updateAdminTipoDocumento(
  token: string | null,
  tipoDocumentoId: number,
  payload: { nombre?: string | null; obligatorio?: boolean | null },
): Promise<TipoDocumento> {
  const response = await api.put<TipoDocumento>(`/admision/admin/tipos-documento/${tipoDocumentoId}`, payload, {
    headers: authHeaders(token),
  })
  return response.data
}

export async function deleteAdminTipoDocumento(token: string | null, tipoDocumentoId: number): Promise<void> {
  await api.delete(`/admision/admin/tipos-documento/${tipoDocumentoId}`, {
    headers: authHeaders(token),
  })
}

export async function updateAdminSolicitud(
  token: string | null,
  solicitudId: number,
  payload: { estadoSolicitudId?: number | null; comentariosDirector?: string | null; activo?: boolean | null },
): Promise<SolicitudAdmision> {
  const response = await api.put<SolicitudAdmision>(`/admision/admin/solicitudes/${solicitudId}`, payload, {
    headers: authHeaders(token),
  })
  return response.data
}

export async function updateFormularioAdmision(
  token: string | null,
  formularioActivo: boolean,
): Promise<boolean> {
  const response = await api.put<boolean>('/admision/admin/formulario', { formularioActivo }, {
    headers: authHeaders(token),
  })
  return response.data
}
