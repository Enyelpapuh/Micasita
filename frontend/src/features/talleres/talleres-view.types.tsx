export type CupoTaller = {
  id: number
  fecha: string
  costo: number
  idParticipante?: number
}

export type Taller = {
  id: number
  nombre: string
  descripcion: string
  rutaImagen: string
  fechaInicial: string
  fechaFinal: string
  costo: number
  cuposMaximos: number
  edadMinima: number
  edadMaxima: number
  activo: boolean
  idTipoPublico: number | null
  tipoPublico: string
  cupos: CupoTaller[]
}

export type TallerFormValues = {
  nombre: string
  descripcion: string
  fechaInicial: string
  fechaFinal: string
  costo: number
  cuposMaximos: number
  edadMinima: number
  edadMaxima: number
  activo: boolean
  idTipoPublico: number | null
}

export type SaveTallerPayload = TallerFormValues

export type InscripcionTallerPayload = {
  nombre: string
  apellido: string
  edad: number
  telefono?: string
  correo?: string
  identificador?: string
}

export type InscripcionTallerResponse = {
  tallerId: number
  cupoId: number
  participanteId: number
  personaId: number
  mensaje: string
}
