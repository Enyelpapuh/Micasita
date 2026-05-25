import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api'
const adminApi = axios.create({
  baseURL: API_BASE_URL,
})

function authHeaders(token: string | null) {
  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {}
}

export type GrupoItem = {
  id: number
  nombre: string
  codigoFuncion?: number | null
}

export type AsignaturaItem = {
  id: number
  nombre: string
  descripcion?: string | null
}

export type EstudianteItem = {
  id: number
  personaId?: number | null
  nombre?: string | null
  apellido?: string | null
}

export type EstudianteDetailTutorItem = {
  id: number
  nombre?: string | null
  apellido?: string | null
  correo?: string | null
  telefono?: string | null
}

export type EstudianteDetailGrupoItem = {
  id: number
  nombre?: string | null
  codigoFuncion?: number | null
  fechaInscripcion?: string | null
  profesorId?: number | null
  profesorNombre?: string | null
  profesorApellido?: string | null
}

export type EstudianteDetailItem = {
  id: number
  personaId?: number | null
  nombre?: string | null
  apellido?: string | null
  fechaNacimiento?: string | null
  telefono?: string | null
  correo?: string | null
  identificador?: string | null
  alergiasGraves?: string | null
  observacionMedicaCorta?: string | null
  tutores: EstudianteDetailTutorItem[]
  grupos: EstudianteDetailGrupoItem[]
}

export type ProfesorItem = {
  id: number
  nombre?: string | null
  apellido?: string | null
}

export type TutorItem = {
  id: number
  nombre?: string | null
  apellido?: string | null
  correo?: string | null
  telefono?: string | null
}

export type EstadoAsistenciaItem = {
  id: number
  nombre: string
}

export type AsistenciaRowItem = {
  estudianteId: number
  estudianteNombre?: string | null
  estudianteApellido?: string | null
  estudianteAsignaturaId?: number | null
  estadoAsistenciaId?: number | null
  observaciones?: string | null
  estudianteAlergiasGraves?: string | null
  estudianteObservacionMedicaCorta?: string | null
}

export type AsistenciaSheetResponse = {
  grupoId: number
  grupoNombre: string
  asignaturaId: number
  asignaturaNombre: string
  fecha: string
  estados: EstadoAsistenciaItem[]
  rows: AsistenciaRowItem[]
}

export type AsistenciaHistorialItem = {
  fecha: string
  grupoId: number
  grupoNombre: string
  asignaturaId: number
  asignaturaNombre: string
  presentes: number
  ausentes: number
  justificados: number
  total: number
  ultimaObservacion?: string | null
}

export type DocenteClaseEstudianteItem = {
  estudianteId: number
  nombre?: string | null
  apellido?: string | null
  alergiasGraves?: string | null
  observacionMedicaCorta?: string | null
}

export type DocenteClaseAsignaturaItem = {
  asignaturaId: number
  asignaturaNombre?: string | null
}

export type DocenteClaseItem = {
  grupoId: number
  grupoNombre?: string | null
  grupoCodigoFuncion?: number | null
  fechaInicio?: string | null
  asignaturas: DocenteClaseAsignaturaItem[]
  estudiantes: DocenteClaseEstudianteItem[]
}

export type EstudianteAsignaturaItem = {
  id: number
  estudianteId: number
  estudianteNombre?: string | null
  estudianteApellido?: string | null
  asignaturaId: number
  asignaturaNombre?: string | null
  periodo?: string | null
  notaFinal?: number | null
}

export async function listGrupos(token: string | null): Promise<GrupoItem[]> {
  const response = await adminApi.get<GrupoItem[]>('/academico/grupos', { headers: authHeaders(token) })
  return response.data
}

export async function createGrupo(token: string | null, payload: { nombre: string; codigoFuncion?: number | null }) {
  const response = await adminApi.post<GrupoItem>('/academico/grupos', payload, { headers: authHeaders(token) })
  return response.data
}

export async function listAsignaturas(token: string | null): Promise<AsignaturaItem[]> {
  const response = await adminApi.get<AsignaturaItem[]>('/academico/asignaturas', { headers: authHeaders(token) })
  return response.data
}

export async function createAsignatura(token: string | null, payload: { nombre: string; descripcion?: string | null }) {
  const response = await adminApi.post<AsignaturaItem>('/academico/asignaturas', payload, { headers: authHeaders(token) })
  return response.data
}

export async function listEstudiantes(token: string | null): Promise<EstudianteItem[]> {
  const response = await adminApi.get<EstudianteItem[]>('/academico/catalogos/estudiantes', { headers: authHeaders(token) })
  return response.data
}

export async function listEstudiantesActivos(token: string | null, anioLectivo?: string): Promise<EstudianteItem[]> {
  const response = await adminApi.get<EstudianteItem[]>('/academico/catalogos/estudiantes/activos', {
    headers: authHeaders(token),
    params: anioLectivo ? { anioLectivo } : undefined,
  })
  return response.data
}

export async function getEstudianteDetail(token: string | null, estudianteId: number): Promise<EstudianteDetailItem> {
  const response = await adminApi.get<EstudianteDetailItem>(`/academico/catalogos/estudiantes/${estudianteId}/detalle`, {
    headers: authHeaders(token),
  })
  return response.data
}

export async function updateEstudianteInformacionDocente(
  token: string | null,
  estudianteId: number,
  payload: { alergiasGraves: string | null; observacionMedicaCorta: string | null },
) {
  const response = await adminApi.put<EstudianteDetailItem>(`/academico/catalogos/estudiantes/${estudianteId}/informacion-docente`, payload, {
    headers: authHeaders(token),
  })
  return response.data
}

export async function listProfesores(token: string | null): Promise<ProfesorItem[]> {
  const response = await adminApi.get<ProfesorItem[]>('/academico/catalogos/profesores', { headers: authHeaders(token) })
  return response.data
}

export async function listTutores(token: string | null): Promise<TutorItem[]> {
  const response = await adminApi.get<TutorItem[]>('/academico/catalogos/tutores', { headers: authHeaders(token) })
  return response.data
}

export async function asignarProfesorGrupo(token: string | null, payload: { profesorId: number; grupoId: number; fechaInicio?: string | null }) {
  await adminApi.post('/academico/profesores-grupo', payload, { headers: authHeaders(token) })
}

export async function asignarGrupoAsignatura(token: string | null, payload: { grupoId: number; asignaturaId: number }) {
  await adminApi.post('/academico/grupos-asignatura', payload, { headers: authHeaders(token) })
}

export async function inscribirEstudianteGrupo(token: string | null, payload: { estudianteId: number; grupoId: number; fechaInscripcion?: string | null }) {
  await adminApi.post('/academico/inscripciones/grupo', payload, { headers: authHeaders(token) })
}

export async function inscribirEstudianteAsignatura(token: string | null, payload: { estudianteId: number; asignaturaId: number; periodo?: string | null }) {
  const response = await adminApi.post<EstudianteAsignaturaItem>('/academico/inscripciones/asignatura', payload, { headers: authHeaders(token) })
  return response.data
}

export async function vincularEstudianteTutor(token: string | null, payload: { estudianteId: number; tutorId: number }) {
  await adminApi.post('/academico/estudiante-tutor', payload, { headers: authHeaders(token) })
}

export async function listEstadosAsistencia(token: string | null): Promise<EstadoAsistenciaItem[]> {
  const response = await adminApi.get<EstadoAsistenciaItem[]>('/academico/catalogos/estados-asistencia', { headers: authHeaders(token) })
  return response.data
}

export async function getMisClasesDocente(token: string | null): Promise<DocenteClaseItem[]> {
  const response = await adminApi.get<DocenteClaseItem[]>('/academico/docente/mis-clases', { headers: authHeaders(token) })
  return response.data
}

export async function getAsistenciaSheet(token: string | null, params: { grupoId: number; asignaturaId: number; fecha: string }) {
  const response = await adminApi.get<AsistenciaSheetResponse>('/academico/asistencia/sheet', {
    headers: authHeaders(token),
    params,
  })
  return response.data
}

export async function registrarAsistenciaSheet(
  token: string | null,
  payload: {
    grupoId: number
    asignaturaId: number
    fecha: string
    registros: Array<{ estudianteId: number; estadoAsistenciaId: number; observaciones?: string | null }>
  },
) {
  await adminApi.post('/academico/asistencia/sheet', payload, { headers: authHeaders(token) })
}

export async function getAsistenciaHistorial(
  token: string | null,
  params: { grupoId: number; asignaturaId: number; limit?: number },
): Promise<AsistenciaHistorialItem[]> {
  const response = await adminApi.get<AsistenciaHistorialItem[]>('/academico/asistencia/historial', {
    headers: authHeaders(token),
    params,
  })
  return response.data
}

export async function registrarTrabajo(token: string | null, payload: { estudianteAsignaturaId: number; nota: number; fecha?: string | null }) {
  const response = await adminApi.post('/academico/trabajos', payload, { headers: authHeaders(token) })
  return response.data
}

export async function actualizarNotaFinal(token: string | null, estudianteAsignaturaId: number, notaFinal: number) {
  const response = await adminApi.put<EstudianteAsignaturaItem>(`/academico/estudiante-asignatura/${estudianteAsignaturaId}/nota-final`, {
    notaFinal,
  }, {
    headers: authHeaders(token),
  })
  return response.data
}
