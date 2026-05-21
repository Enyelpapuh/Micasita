import axios from 'axios'
import type {
  InscripcionTallerPayload,
  InscripcionTallerResponse,
  SaveTallerPayload,
  Taller,
} from './talleres-view.types'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api'
const API_ORIGIN = new URL(API_BASE_URL).origin
const AUTH_STORAGE_KEY = 'micasita.auth'

const talleresApi = axios.create({
  baseURL: API_BASE_URL,
})

type ApiCupoTaller = {
  id: number
  fecha?: string | null
  costo?: number | null
  participante?: {
    id: number
  } | null
  participanteNombre?: string | null
  participanteApellido?: string | null
}

type ApiTaller = {
  id: number
  nombre?: string | null
  descripcion?: string | null
  rutaImagen?: string | null
  fechaInicial?: string | null
  fechaFinal?: string | null
  costo?: number | null
  cuposMaximos?: number | null
  edadMinima?: number | null
  edadMaxima?: number | null
  activo?: boolean | null
  idTipoPublico?: number | null
  tipoPublico?: string | null
  cupos?: ApiCupoTaller[] | null
}

type ApiInscripcionTallerResponse = {
  tallerId: number
  cupoId: number
  participanteId: number
  personaId: number
  mensaje: string
}

function authHeaders(token: string | null) {
  const nextToken = token ?? getStoredToken()

  if (!nextToken) {
    return {}
  }

  return {
    Authorization: `Bearer ${nextToken}`,
  }
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

function ensureToken(token: string | null) {
  const nextToken = token ?? getStoredToken()
  if (!nextToken) {
    throw new Error('No hay una sesion activa. Vuelve a iniciar sesion.')
  }

  return nextToken
}

function toTallerModel(input: ApiTaller): Taller {
  return {
    id: input.id,
    nombre: input.nombre ?? '',
    descripcion: input.descripcion ?? '',
    rutaImagen: input.rutaImagen ?? '',
    fechaInicial: input.fechaInicial ?? '',
    fechaFinal: input.fechaFinal ?? '',
    costo: input.costo ?? 0,
    cuposMaximos: input.cuposMaximos ?? 0,
    edadMinima: input.edadMinima ?? 0,
    edadMaxima: input.edadMaxima ?? 0,
    activo: input.activo ?? true,
    idTipoPublico: input.idTipoPublico ?? null,
    tipoPublico: input.tipoPublico ?? 'GENERAL',
    cupos: (input.cupos ?? []).map((cupo) => ({
      id: cupo.id,
      fecha: cupo.fecha ?? '',
      costo: cupo.costo ?? 0,
      idParticipante: cupo.participante?.id,
      participanteNombre: cupo.participanteNombre ?? null,
      participanteApellido: cupo.participanteApellido ?? null,
    })),
  }
}

export async function getTalleres(token: string | null): Promise<Taller[]> {
  console.log('[Talleres API] GET /talleres', {
    hasToken: Boolean(token ?? getStoredToken()),
  })

  const response = await talleresApi.get<ApiTaller[]>('/talleres', {
    headers: authHeaders(token),
  })

  return response.data.map(toTallerModel)
}

export async function createTaller(token: string | null, payload: SaveTallerPayload): Promise<Taller> {
  console.log('[Talleres API] POST /talleres', {
    hasToken: Boolean(token ?? getStoredToken()),
    payload,
  })

  ensureToken(token)

  const response = await talleresApi.post<ApiTaller>('/talleres', payload, {
    headers: authHeaders(token),
  })

  return toTallerModel(response.data)
}

export async function updateTaller(
  token: string | null,
  tallerId: number,
  payload: SaveTallerPayload,
): Promise<Taller> {
  console.log(`[Talleres API] PUT /talleres/${tallerId}`, {
    hasToken: Boolean(token ?? getStoredToken()),
    payload,
  })

  ensureToken(token)

  const response = await talleresApi.put<ApiTaller>(`/talleres/${tallerId}`, payload, {
    headers: authHeaders(token),
  })

  return toTallerModel(response.data)
}

export async function uploadTallerImage(token: string | null, tallerId: number, file: File): Promise<Taller> {
  console.log(`[Talleres API] POST /talleres/${tallerId}/imagen`, {
    hasToken: Boolean(token ?? getStoredToken()),
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
  })

  ensureToken(token)

  const formData = new FormData()
  formData.append('file', file)

  const response = await talleresApi.post<ApiTaller>(`/talleres/${tallerId}/imagen`, formData, {
    headers: {
      ...authHeaders(token),
      'Content-Type': 'multipart/form-data',
    },
  })

  return toTallerModel(response.data)
}

export function resolveTallerImageUrl(rutaImagen?: string | null): string {
  if (!rutaImagen) {
    return ''
  }

  if (rutaImagen.startsWith('http://') || rutaImagen.startsWith('https://')) {
    return rutaImagen
  }

  if (rutaImagen.startsWith('/api/')) {
    return `${API_ORIGIN}${rutaImagen}`
  }

  if (rutaImagen.startsWith('/')) {
    return `${API_ORIGIN}${rutaImagen}`
  }

  return new URL(rutaImagen, API_ORIGIN).toString()
}

export async function inscribirEnTaller(
  tallerId: number,
  payload: InscripcionTallerPayload,
): Promise<InscripcionTallerResponse> {
  const response = await talleresApi.post<ApiInscripcionTallerResponse>(`/talleres/${tallerId}/inscripciones`, payload)

  return {
    tallerId: response.data.tallerId,
    cupoId: response.data.cupoId,
    participanteId: response.data.participanteId,
    personaId: response.data.personaId,
    mensaje: response.data.mensaje,
  }
}
