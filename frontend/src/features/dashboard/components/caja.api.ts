import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api'

const api = axios.create({
  baseURL: API_BASE_URL,
})

function authHeaders(token: string | null) {
  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {}
}

export type CajaMetricas = {
  talleresPendientesPago: number
  matriculasPendientes: number
  pagosMatriculaPendientes: number
  mensualidadesPendientes: number
  registrosTaller: number
  registrosMatricula: number
  registrosMensualidad: number
}

export type CajaTallerPendienteItem = {
  cupoId: number
  tallerId: number
  taller: string
  participante: string
  montoEsperado?: number | null
  fechaInscripcion?: string | null
  estado: string
}

export type CajaMatriculaPendienteItem = {
  matriculaId: number
  estudiante: string
  anioLectivo: string
  fechaMatricula?: string | null
  estado: string
}

export type CajaPagoTallerItem = {
  pagoCupoId: number
  cupoId: number
  taller: string
  participante: string
  numeroRecibo: string
  monto?: number | null
  fechaPago?: string | null
  estado: string
  metodoPago: string
  anulado: boolean
}

export type CajaPagoMatriculaItem = {
  pagoMatriculaId: number
  matriculaId: number
  estudiante: string
  monto?: number | null
  fechaPago?: string | null
  estado: string
  metodoPago: string
  detalle: string
  anulado: boolean
}

export type CajaMensualidadItem = {
  mensualidadId: number
  estudiante: string
  mes: string
  monto?: number | null
  fechaPago?: string | null
  estado: string
  metodoPago: string
  detalle: string
  anulado: boolean
}

export type CajaDashboardResponse = {
  metricas: CajaMetricas
  talleresPendientes: CajaTallerPendienteItem[]
  matriculasPendientes: CajaMatriculaPendienteItem[]
  pagosTaller: CajaPagoTallerItem[]
  pagosMatricula: CajaPagoMatriculaItem[]
  mensualidades: CajaMensualidadItem[]
}

export type CajaSessionInfo = {
  id: number
  codigo: string
  estado: string
  saldoInicial?: number | null
  saldoCierre?: number | null
  fechaApertura?: string | null
  fechaCierre?: string | null
  observacionApertura?: string | null
  observacionCierre?: string | null
}

export type CajaOperacionResult = {
  id: number
  codigo: string
  estado: string
  mensaje: string
}

export type OpenCajaRequest = {
  saldoInicial?: number | null
  observacion?: string | null
}

export type CloseCajaRequest = {
  saldoCierre?: number | null
  observacion?: string | null
}

export type MatriculaPaymentRequest = {
  matriculaId: number
  monto: number
  metodoPagoId: number
  detalle?: string | null
}

export type TallerPaymentRequest = {
  cupoId: number
  monto?: number | null
  metodoPagoId: number
  detalle?: string | null
}

export type MensualidadPaymentRequest = {
  estudianteId: number
  mesDePago: number
  montoBase: number
  montoMora?: number | null
  metodoPagoId: number
  detalle?: string | null
}

export type MetodoPagoOption = {
  id: number
  nombre: string
}

export type AnulacionRequest = {
  motivo: string
}

export async function getCajaDashboard(token: string | null, limit = 25): Promise<CajaDashboardResponse> {
  const response = await api.get<CajaDashboardResponse>('/finanzas/caja/dashboard', {
    headers: authHeaders(token),
    params: { limit },
  })
  return response.data
}

export async function getActiveCajaSession(token: string | null): Promise<CajaSessionInfo | null> {
  const response = await api.get<CajaSessionInfo | null>('/finanzas/caja/session/active', {
    headers: authHeaders(token),
  })
  return response.data
}

export async function getMetodosPago(token: string | null): Promise<MetodoPagoOption[]> {
  const response = await api.get<MetodoPagoOption[]>('/finanzas/caja/metodos-pago', {
    headers: authHeaders(token),
  })
  return response.data
}

export async function openCajaSession(token: string | null, body: OpenCajaRequest): Promise<CajaOperacionResult> {
  const response = await api.post<CajaOperacionResult>('/finanzas/caja/session/open', body, {
    headers: authHeaders(token),
  })
  return response.data
}

export async function closeCajaSession(token: string | null, body: CloseCajaRequest): Promise<CajaOperacionResult> {
  const response = await api.post<CajaOperacionResult>('/finanzas/caja/session/close', body, {
    headers: authHeaders(token),
  })
  return response.data
}

export async function payMatricula(token: string | null, body: MatriculaPaymentRequest): Promise<CajaOperacionResult> {
  const response = await api.post<CajaOperacionResult>('/finanzas/caja/payments/matricula', body, {
    headers: authHeaders(token),
  })
  return response.data
}

export async function payTaller(token: string | null, body: TallerPaymentRequest): Promise<CajaOperacionResult> {
  const response = await api.post<CajaOperacionResult>('/finanzas/caja/payments/taller', body, {
    headers: authHeaders(token),
  })
  return response.data
}

export async function payMensualidad(token: string | null, body: MensualidadPaymentRequest): Promise<CajaOperacionResult> {
  const response = await api.post<CajaOperacionResult>('/finanzas/caja/payments/mensualidad', body, {
    headers: authHeaders(token),
  })
  return response.data
}

export async function annulPagoMatricula(token: string | null, pagoMatriculaId: number, body: AnulacionRequest): Promise<CajaOperacionResult> {
  const response = await api.post<CajaOperacionResult>(`/finanzas/caja/payments/matricula/${pagoMatriculaId}/annul`, body, {
    headers: authHeaders(token),
  })
  return response.data
}

export async function annulPagoTaller(token: string | null, pagoCupoId: number, body: AnulacionRequest): Promise<CajaOperacionResult> {
  const response = await api.post<CajaOperacionResult>(`/finanzas/caja/payments/taller/${pagoCupoId}/annul`, body, {
    headers: authHeaders(token),
  })
  return response.data
}

export async function annulPagoMensualidad(token: string | null, mensualidadId: number, body: AnulacionRequest): Promise<CajaOperacionResult> {
  const response = await api.post<CajaOperacionResult>(`/finanzas/caja/payments/mensualidad/${mensualidadId}/annul`, body, {
    headers: authHeaders(token),
  })
  return response.data
}
