import type { Taller, TallerFormValues } from './talleres-view.types'

export const initialTalleres: Taller[] = []

export const emptyTallerForm: TallerFormValues = {
  nombre: '',
  descripcion: '',
  fechaInicial: '',
  fechaFinal: '',
  costo: 0,
  cuposMaximos: 12,
  edadMinima: 2,
  edadMaxima: 12,
  activo: true,
  idTipoPublico: null,
}
