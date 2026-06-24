import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'
import { LoaderCircle, MessageSquare, Save, X, Mail, Phone, Users, Search, Printer, Calendar } from 'lucide-react'
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import logoSvg from '../../../assets/MiCASITALOGO-cropped.svg?raw'
import { normalizeApiError, useAuth } from '../../auth/AuthContext'
import {
  actualizarNotaFinal,
  asignarGrupoAsignatura,
  asignarProfesorGrupo,
  createAsignatura,
  createGrupo,
  getMisClasesDocente,
  getAsistenciaSheet,
  //inscribirEstudianteAsignatura,
  inscribirEstudianteGrupo,
  listAsignaturas,
  getAsistenciaHistorial,
  listEstadosAsistencia,
  listEstudiantes,
  listGrupos,
  listProfesores,
  registrarAsistenciaSheet,
  registrarTrabajo,
  getAsistenciaMetrics,
  type AsistenciaRowItem,
  type AsistenciaHistorialItem,
  type AsistenciaSheetResponse,
  type AsistenciaEstudianteMetricaItem,
  type AsignaturaItem,
  type DocenteClaseItem,
  type EstadoAsistenciaItem,
  type EstudianteItem,
  type GrupoItem,
  getEstudianteDetail,
  type EstudianteDetailItem,
} from './academico.api'

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const toLocalYYYYMMDD = (d: Date) => {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function StudentProfileModal({
  estudianteId,
  onClose,
}: {
  estudianteId: number
  onClose: () => void
}) {
  const { token } = useAuth()
  const [detail, setDetail] = useState<EstudianteDetailItem | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getEstudianteDetail(token, estudianteId)
      .then((data) => {
        if (!cancelled) setDetail(data)
      })
      .catch(() => {
        if (!cancelled) toast.error('No se pudo cargar la ficha del estudiante')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [estudianteId, token])

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm sm:p-6">
      <div 
        className="absolute inset-0"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <h2 className="text-xl font-bold text-slate-900">Ficha personal</h2>
          <button 
            type="button"
            onClick={onClose} 
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6">
          {loading ? (
             <div className="flex items-center justify-center py-10 text-slate-500">
               <LoaderCircle className="h-6 w-6 animate-spin mr-2" /> Cargando ficha...
             </div>
          ) : detail ? (
             <div className="space-y-6">
               <div className="flex items-center gap-4">
                 <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-100 text-xl font-bold text-teal-700">
                   {(detail.nombre?.[0] ?? 'U').toUpperCase()}{(detail.apellido?.[0] ?? '').toUpperCase()}
                 </div>
                 <div>
                   <h3 className="text-2xl font-bold text-slate-900">{detail.nombre} {detail.apellido}</h3>
                   <p className="text-sm text-slate-500">ID Estudiante: {detail.id}</p>
                 </div>
               </div>

               <div className="grid gap-4 sm:grid-cols-2">
                 <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                   <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Contacto</p>
                   <div className="mt-2 space-y-2 text-sm text-slate-700">
                     <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-slate-400" /> {detail.correo || 'Sin correo'}</p>
                     <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-slate-400" /> {detail.telefono || 'Sin teléfono'}</p>
                   </div>
                 </div>
                 <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                   <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Información Médica</p>
                   <div className="mt-2 space-y-2 text-sm text-slate-700">
                     {detail.alergiasGraves ? <p className="text-rose-700"><span className="font-semibold">Alergias:</span> {detail.alergiasGraves}</p> : null}
                     {detail.observacionMedicaCorta ? <p className="text-amber-700"><span className="font-semibold">Nota:</span> {detail.observacionMedicaCorta}</p> : null}
                     {!detail.alergiasGraves && !detail.observacionMedicaCorta ? <p className="text-slate-500">Sin observaciones médicas</p> : null}
                   </div>
                 </div>
               </div>

               <div className="rounded-2xl border border-slate-200 p-4">
                 <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Tutores / Padres</p>
                 <div className="space-y-3">
                   {detail.tutores.length > 0 ? detail.tutores.map(tutor => (
                     <div key={tutor.id} className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
                       <Users className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
                       <div>
                         <p className="font-semibold text-slate-900">{tutor.nombre} {tutor.apellido}</p>
                         <p className="text-sm text-slate-600">{tutor.correo || 'Sin correo'} • {tutor.telefono || 'Sin teléfono'}</p>
                       </div>
                     </div>
                   )) : <p className="text-sm text-slate-500">No hay tutores vinculados.</p>}
                 </div>
               </div>
             </div>
          ) : (
             <div className="py-10 text-center text-sm text-slate-500">No se encontró la información del estudiante.</div>
          )}
        </div>
      </div>
    </div>
  , document.body)
}

function AsistenciaHistorialModal({
  item,
  onClose,
  token,
  estados,
  onPrint,
}: {
  item: AsistenciaHistorialItem
  onClose: () => void
  token: string | null
  estados: EstadoAsistenciaItem[]
  onPrint: (item: AsistenciaHistorialItem) => void
}) {
  const [loading, setLoading] = useState(true)
  const [sheet, setSheet] = useState<AsistenciaSheetResponse | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getAsistenciaSheet(token, {
      grupoId: item.grupoId,
      asignaturaId: item.asignaturaId,
      fecha: item.fecha,
    })
      .then((data) => {
        if (!cancelled) setSheet(data)
      })
      .catch(() => {
        if (!cancelled) toast.error('No se pudo cargar el detalle de la sesión')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [item, token])

  const getEstadoBadge = (estadoId: number | null) => {
    const estado = estados.find((e) => e.id === estadoId)
    const name = estado?.nombre?.trim().toUpperCase() || 'NO MARCADO'
    if (name === 'PRESENTE') {
      return (
        <span className="inline-flex items-center justify-center rounded-full bg-teal-50 border border-teal-200 px-2.5 py-0.5 text-xs font-semibold text-teal-800">
          Presente
        </span>
      )
    }
    if (name === 'AUSENTE' || name === 'INASISTENCIA') {
      return (
        <span className="inline-flex items-center justify-center rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-xs font-semibold text-rose-800">
          Ausente
        </span>
      )
    }
    if (name === 'JUSTIFICADO') {
      return (
        <span className="inline-flex items-center justify-center rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
          Justificado
        </span>
      )
    }
    return (
      <span className="inline-flex items-center justify-center rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
        No marcado
      </span>
    )
  }

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm sm:p-6">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] bg-white shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Detalle de Asistencia</h2>
            <p className="text-xs text-slate-500">
              {new Date(item.fecha + 'T00:00:00').toLocaleDateString('es-NI', { day: '2-digit', month: 'long', year: 'numeric' })} — {item.grupoNombre}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-500">
              <LoaderCircle className="h-6 w-6 animate-spin mr-2" /> Cargando detalle...
            </div>
          ) : sheet ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="text-sm text-slate-700 space-y-1">
                  <p><strong>Grupo:</strong> {item.grupoNombre}</p>
                  <p><strong>Docente:</strong> {sheet.docenteNombre || item.docenteNombre || 'No especificado'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onPrint(item)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 shadow-sm shrink-0 self-start sm:self-center"
                >
                  <Printer className="h-4 w-4 text-slate-500" />
                  Imprimir Reporte
                </button>
              </div>

              <div className="rounded-2xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-600">
                      <tr>
                        <th className="px-4 py-3 text-left">Estudiante</th>
                        <th className="px-4 py-3 text-center" style={{ width: '120px' }}>Estado</th>
                        <th className="px-4 py-3 text-left">Observaciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {sheet.rows.map((row) => (
                        <tr key={row.estudianteId} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {row.estudianteNombre} {row.estudianteApellido}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {getEstadoBadge(row.estadoAsistenciaId ?? null)}
                          </td>
                          <td className="px-4 py-3 text-slate-600 text-xs">
                            {row.observaciones || <span className="text-slate-400 font-light">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-slate-500">
              No se pudo obtener el detalle de la sesión.
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

type AcademicoRowState = AsistenciaRowItem & {
  selectedEstadoId?: number | null
  noteTrabajo?: string
  notaFinal?: string
  observacionesOpen?: boolean
}

function AcademicoAsistenciaSegment({
  rows,
  estados,
  savingAttendance,
  onEstadoChange,
  onObservacionChange,
  onToggleObservation,
  onSave,
  onViewProfile,
  onPrint,
  docenteNombre,
  onMarkAllPresent,
}: {
  rows: AcademicoRowState[]
  estados: EstadoAsistenciaItem[]
  savingAttendance: boolean
  onEstadoChange: (estudianteId: number, estadoId: number) => void
  onObservacionChange: (estudianteId: number, observaciones: string) => void
  onToggleObservation: (estudianteId: number) => void
  onSave: () => void
  onViewProfile: (estudianteId: number) => void
  onPrint: () => void
  docenteNombre?: string | null
  onMarkAllPresent: () => void
}) {
  const getEstadoMeta = (estadoId?: number | null) => {
    const estado = estados.find((item) => item.id === estadoId)
    const normalized = estado?.nombre?.trim().toUpperCase() ?? ''

    if (normalized === 'PRESENTE') {
      return { label: 'P', color: 'green', className: 'bg-green-50 border-green-200 text-green-900', button: 'bg-teal-600 text-white border-teal-600' }
    }

    if (normalized === 'AUSENTE' || normalized === 'INASISTENCIA') {
      return { label: 'I', color: 'red', className: 'bg-red-50 border-red-200 text-red-900', button: 'bg-rose-600 text-white border-rose-600' }
    }

    if (normalized === 'JUSTIFICADO') {
      return { label: 'J', color: 'amber', className: 'bg-amber-50 border-amber-200 text-amber-900', button: 'bg-amber-500 text-white border-amber-500' }
    }

    return { label: '?', color: 'slate', className: 'bg-slate-50 border-slate-200 text-slate-900', button: 'bg-slate-100 text-slate-500 border-slate-200' }
  }

  const initials = (name?: string | null, lastName?: string | null) => {
    const first = name?.trim()?.[0] ?? 'U'
    const second = lastName?.trim()?.[0] ?? ''
    return `${first}${second}`.toUpperCase()
  }

  return (
    <>
      <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-teal-200 bg-teal-50 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-teal-900">
            Registro de Asistencia {docenteNombre ? `· Registrado por: ${docenteNombre}` : ''}
          </p>
          <p className="text-xs text-teal-800">Marca el estado por estudiante y guarda toda la asistencia del día.</p>
        </div>
        <button
          type="button"
          onClick={onPrint}
          className="inline-flex items-center justify-center rounded-xl border border-teal-200 bg-white px-3 py-2 text-xs font-semibold text-teal-700 shadow-sm transition hover:bg-teal-50"
        >
          <Printer className="mr-2 h-4 w-4" />
          Imprimir hoja de asistencia
        </button>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.08em] text-slate-600">
            <tr>
              <th className="px-4 py-3 text-left">Estudiante</th>
              <th className="px-4 py-3 text-center">
                <div className="flex flex-col items-center gap-1.5 py-1">
                  <span>Asistencia</span>
                  {rows.length > 0 ? (
                    <button
                      type="button"
                      onClick={onMarkAllPresent}
                      className="rounded-lg bg-teal-50 border border-teal-200 px-2 py-0.5 text-[10px] font-semibold text-teal-700 hover:bg-teal-100 hover:text-teal-800 transition shadow-sm"
                    >
                      Marcar todos P
                    </button>
                  ) : null}
                </div>
              </th>
              <th className="px-4 py-3 text-left">Observaciones / Notas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.length > 0 ? rows.map((row) => {
              const estadoMeta = getEstadoMeta(row.selectedEstadoId)

              return (
                <tr key={row.estudianteId} className="transition-colors hover:bg-slate-50/50">
                  <td className="px-4 py-4 align-top">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-bold transition-all ${estadoMeta.button}`}>
                        {initials(row.estudianteNombre, row.estudianteApellido)}
                      </div>
                      <div className="min-w-0">
                        <button 
                          type="button"
                          onClick={() => onViewProfile(row.estudianteId)}
                          className="truncate text-sm font-semibold hover:text-teal-600 hover:underline text-left"
                        >
                          {row.estudianteNombre} {row.estudianteApellido}
                        </button>
                        <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">ID {row.estudianteId}</p>
                        {row.estudianteAlergiasGraves || row.estudianteObservacionMedicaCorta ? (
                          <div className="mt-1">
                            <span 
                              className="inline-flex cursor-help items-center rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-700 ring-1 ring-inset ring-rose-600/20" 
                              title={`${row.estudianteAlergiasGraves ? 'Alergia: ' + row.estudianteAlergiasGraves + '\n' : ''}${row.estudianteObservacionMedicaCorta ? 'Nota: ' + row.estudianteObservacionMedicaCorta : ''}`.trim()}
                            >
                              Alerta médica
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {estados.map((estado) => {
                        const normalized = estado.nombre.trim().toUpperCase()
                        const isSelected = row.selectedEstadoId === estado.id
                        const buttonClass = isSelected
                          ? normalized === 'PRESENTE'
                            ? 'bg-teal-600 border-teal-600 text-white shadow-sm font-semibold scale-105'
                            : normalized === 'AUSENTE' || normalized === 'INASISTENCIA'
                              ? 'bg-rose-600 border-rose-600 text-white shadow-sm font-semibold scale-105'
                              : normalized === 'JUSTIFICADO'
                                ? 'bg-amber-500 border-amber-500 text-white shadow-sm font-semibold scale-105'
                                : 'bg-slate-600 border-slate-600 text-white shadow-sm font-semibold scale-105'
                          : 'border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-600 hover:border-slate-300'
                        
                        return (
                          <button
                            key={`${row.estudianteId}-${estado.id}`}
                            type="button"
                            title={estado.nombre}
                            onClick={() => onEstadoChange(row.estudianteId, estado.id)}
                            className={`inline-flex h-9 w-9 items-center justify-center rounded-full border text-xs transition-all ${buttonClass}`}
                          >
                            {normalized === 'PRESENTE' ? 'P' : normalized === 'AUSENTE' || normalized === 'INASISTENCIA' ? 'I' : normalized === 'JUSTIFICADO' ? 'J' : estado.nombre.slice(0, 1).toUpperCase()}
                          </button>
                        )
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => onToggleObservation(row.estudianteId)}
                        className={`inline-flex items-center self-start gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${row.observacionesOpen || row.observaciones ? 'bg-slate-200 text-slate-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      >
                        <MessageSquare className="h-3 w-3" />
                        {row.observaciones ? 'Ver / Editar nota' : 'Agregar nota'}
                      </button>
                      {row.observacionesOpen ? (
                        <textarea
                          value={row.observaciones ?? ''}
                          onChange={(e) => onObservacionChange(row.estudianteId, e.target.value)}
                          rows={2}
                          placeholder="Motivo de tardanza, salud o aviso..."
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-teal-500"
                        />
                      ) : row.observaciones ? (
                        <p className="line-clamp-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                          {row.observaciones}
                        </p>
                      ) : null}
                    </div>
                  </td>
                </tr>
              )
            }) : (
              <tr>
                <td colSpan={3} className="px-6 py-16 text-center text-sm text-slate-500">
                  <p>Carga una hoja para comenzar a tomar asistencia.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={onSave}
          disabled={savingAttendance || rows.length === 0}
          className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-70"
        >
          {savingAttendance ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Guardar asistencia
        </button>
      </div>
    </>
  )
}

function AcademicoNotasSegment({
  rows,
  onTrabajoChange,
  onNotaFinalChange,
  onSave,
  onViewProfile,
}: {
  rows: AcademicoRowState[]
  onTrabajoChange: (estudianteId: number, value: string) => void
  onNotaFinalChange: (estudianteId: number, value: string) => void
  onSave: (row: AcademicoRowState) => void
  onViewProfile: (estudianteId: number) => void
}) {
  return (
    <>
      <div className="mt-6 rounded-2xl border border-indigo-200 bg-indigo-50 p-3">
        <p className="text-sm font-semibold text-indigo-900">Segmento 2: Notas de trabajo y nota final</p>
        <p className="text-xs text-indigo-800">Este bloque es independiente de asistencia: registra nota de trabajo puntual y/o actualiza la nota final.</p>
      </div>

      <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.08em] text-slate-600">
            <tr>
              <th className="px-3 py-2 text-left">Estudiante</th>
              <th className="px-3 py-2 text-left">Nota de trabajo</th>
              <th className="px-3 py-2 text-left">Nota final</th>
              <th className="px-3 py-2 text-left">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.map((row) => (
              <tr key={`notas-${row.estudianteId}`}>
                <td className="px-3 py-2">
                  <button 
                    type="button"
                    onClick={() => onViewProfile(row.estudianteId)}
                    className="font-semibold text-slate-800 hover:text-teal-600 hover:underline text-left"
                  >
                    {row.estudianteNombre} {row.estudianteApellido}
                  </button>
                </td>
                <td className="px-3 py-2">
                  <input
                    value={row.noteTrabajo ?? ''}
                    onChange={(e) => onTrabajoChange(row.estudianteId, e.target.value)}
                    placeholder="0-100"
                    className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-xs"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">Calificación puntual del trabajo del día.</p>
                </td>
                <td className="px-3 py-2">
                  <input
                    value={row.notaFinal ?? ''}
                    onChange={(e) => onNotaFinalChange(row.estudianteId, e.target.value)}
                    placeholder="0-100"
                    className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-xs"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">Acumulado final del grupo.</p>
                </td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => onSave(row)}
                    className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    <Save className="mr-1 h-3.5 w-3.5" />
                    Guardar notas
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-xs text-slate-500">Carga una hoja para habilitar registro de notas.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </>
  )
}

function ConfigGruposModal({ isOpen, onClose, grupos, profesores, asignaturas, token, reloadCatalogs }: { isOpen: boolean, onClose: () => void, grupos: GrupoItem[], profesores: Array<{id: number, nombre?: string | null, apellido?: string | null}>, asignaturas: AsignaturaItem[], token: string | null, reloadCatalogs: () => Promise<void> }) {
  const [nombre, setNombre] = useState('')
  const [profesorNew, setProfesorNew] = useState('')
  const [grupoExisting, setGrupoExisting] = useState('')
  const [profesorExisting, setProfesorExisting] = useState('')
  const [grupoAsignatura, setGrupoAsignatura] = useState('')
  const [asignaturaExisting, setAsignaturaExisting] = useState('')
  const [nombreAsignatura, setNombreAsignatura] = useState('')
  const [busy, setBusy] = useState(false)

  if (!isOpen) return null;

  const handleCrear = async () => {
    if (!nombre.trim()) { toast.error('El nombre del grupo es requerido'); return; }
    setBusy(true)
    try {
      const created = await createGrupo(token, { nombre })
      
      // MAGIA BACKEND: Vincular automáticamente la asignatura genérica (asistencia diaria) para ocultarlo del usuario
      if (asignaturas && asignaturas.length > 0) {
        try {
          await asignarGrupoAsignatura(token, { grupoId: created.id, asignaturaId: asignaturas[0].id })
        } catch (e) {
          console.warn('Auto-vinculacion asignatura fallida', e)
        }
      }

      if (profesorNew) {
        await asignarProfesorGrupo(token, { profesorId: Number(profesorNew), grupoId: created.id })
      }
      toast.success('Grupo creado' + (profesorNew ? ' y profesor asignado' : ''))
      setNombre('')
      setProfesorNew('')
      await reloadCatalogs()
      onClose()
    } catch (e) {
      toast.error(normalizeApiError(e, 'Error al crear grupo'))
    } finally { setBusy(false) }
  }

  const handleAsignar = async () => {
    if (!grupoExisting || !profesorExisting) { toast.error('Selecciona un grupo y un profesor'); return; }
    setBusy(true)
    try {
      await asignarProfesorGrupo(token, { profesorId: Number(profesorExisting), grupoId: Number(grupoExisting) })
      toast.success('Profesor asignado al grupo')
      setGrupoExisting('')
      setProfesorExisting('')
      await reloadCatalogs()
      onClose()
    } catch (e) {
      toast.error(normalizeApiError(e, 'Error al asignar profesor'))
    } finally { setBusy(false) }
  }

  const handleAsignarAsignatura = async () => {
    if (!grupoAsignatura || !asignaturaExisting) { toast.error('Selecciona un grupo y una asignatura'); return; }
    setBusy(true)
    try {
      await asignarGrupoAsignatura(token, { grupoId: Number(grupoAsignatura), asignaturaId: Number(asignaturaExisting) })
      toast.success('Asignatura vinculada al grupo correctamente')
      setGrupoAsignatura('')
      setAsignaturaExisting('')
      await reloadCatalogs()
      onClose()
    } catch (e) {
      toast.error(normalizeApiError(e, 'Error al vincular asignatura'))
    } finally { setBusy(false) }
  }

  const handleCrearAsignatura = async () => {
    if (!nombreAsignatura.trim()) { toast.error('El nombre de la asignatura es requerido'); return; }
    setBusy(true)
    try {
      await createAsignatura(token, { nombre: nombreAsignatura })
      toast.success('Asignatura creada con éxito')
      setNombreAsignatura('')
      await reloadCatalogs()
    } catch (e) {
      toast.error(normalizeApiError(e, 'Error al crear asignatura'))
    } finally { setBusy(false) }
  }

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm sm:p-6">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <h2 className="text-xl font-bold text-slate-900">Configurar Grupos</h2>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5"/></button>
        </div>
        
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          <section className="rounded-2xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 text-sm uppercase tracking-wide">Crear un nuevo grupo</h3>
            <p className="mt-1 text-sm text-slate-500">Puedes crear el grupo y asignarle de inmediato un profesor titular.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Nombre del grupo</label>
                <input value={nombre} onChange={e=>setNombre(e.target.value)} placeholder="Ej. 5to A" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Profesor (Opcional)</label>
                <select value={profesorNew} onChange={e=>setProfesorNew(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none">
                  <option value="">Sin profesor</option>
                  {profesores.map(p=><option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={handleCrear} disabled={busy} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-70">
                {busy ? 'Guardando...' : 'Crear Grupo'}
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 text-sm uppercase tracking-wide">Asignar profesor a grupo existente</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Grupo</label>
                <select value={grupoExisting} onChange={e=>setGrupoExisting(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none">
                  <option value="">Selecciona grupo</option>
                  {grupos.map(g=><option key={g.id} value={g.id}>{g.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Profesor</label>
                <select value={profesorExisting} onChange={e=>setProfesorExisting(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none">
                  <option value="">Selecciona profesor</option>
                  {profesores.map(p=><option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={handleAsignar} disabled={busy} className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-70">
                {busy ? 'Asignando...' : 'Asignar Profesor'}
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 text-sm uppercase tracking-wide">Crear nueva asignatura</h3>
            <p className="mt-1 text-sm text-slate-500">Crea una asignatura (ej. Asistencia Diaria) para luego vincularla a un grupo.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Nombre de la asignatura</label>
                <input value={nombreAsignatura} onChange={e=>setNombreAsignatura(e.target.value)} placeholder="Ej. Asistencia Diaria" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none" />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={handleCrearAsignatura} disabled={busy} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-70">
                {busy ? 'Creando...' : 'Crear Asignatura'}
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 text-sm uppercase tracking-wide">Vincular asignatura a grupo existente</h3>
            <p className="mt-1 text-sm text-slate-500">Es necesario que el grupo tenga asignaturas vinculadas para poder cargar la hoja de asistencia.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Grupo</label>
                <select value={grupoAsignatura} onChange={e=>setGrupoAsignatura(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none">
                  <option value="">Selecciona grupo</option>
                  {grupos.map(g=><option key={g.id} value={g.id}>{g.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Asignatura</label>
                <select value={asignaturaExisting} onChange={e=>setAsignaturaExisting(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none">
                  <option value="">Selecciona asignatura</option>
                  {asignaturas.map(a=><option key={a.id} value={a.id}>{a.nombre}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={handleAsignarAsignatura} disabled={busy} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-70">
                {busy ? 'Vinculando...' : 'Vincular Asignatura'}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  , document.body)
}

export function AcademicoGestionPanel() {
  const { token } = useAuth()
  const [loading, setLoading] = useState(true)
  const [grupos, setGrupos] = useState<GrupoItem[]>([])
  const [asignaturas, setAsignaturas] = useState<AsignaturaItem[]>([])
  const [estudiantes, setEstudiantes] = useState<EstudianteItem[]>([])
  const [profesores, setProfesores] = useState<Array<{ id: number; nombre?: string | null; apellido?: string | null }>>([])

  const [studentsSearch, setStudentsSearch] = useState('')
  const [viewingStudentId, setViewingStudentId] = useState<number | null>(null)

  const [activeTab, setActiveTab] = useState<'estudiantes' | 'grupos'>('estudiantes')
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('')
  const [isConfigGruposOpen, setIsConfigGruposOpen] = useState(false)
  const [newGroupIdForStudent, setNewGroupIdForStudent] = useState('')
  const [studentToChangeGroup, setStudentToChangeGroup] = useState<EstudianteItem | null>(null)

  const filteredStudents = useMemo(() => {
    let result = estudiantes

    if (selectedGroupFilter) {
      if (selectedGroupFilter === 'SIN_GRUPO') {
        result = result.filter(student => !student.grupos || student.grupos.length === 0)
      } else {
        result = result.filter(student => student.grupos?.includes(selectedGroupFilter))
      }
    }

    const term = studentsSearch.trim().toLocaleLowerCase('es-NI')
    if (!term) {
      return result
    }
    return result.filter((item) => {
      const name = `${item.nombre ?? ''} ${item.apellido ?? ''}`.toLocaleLowerCase('es-NI')
      const idText = String(item.id)
      return name.includes(term) || idText.includes(term)
    })
  }, [estudiantes, studentsSearch, selectedGroupFilter])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const [g, a, e, p] = await Promise.all([
          listGrupos(token),
          listAsignaturas(token),
          listEstudiantes(token),
          listProfesores(token),
        ])

        if (!cancelled) {
          setGrupos(g)
          setAsignaturas(a)
          setEstudiantes(e)
          setProfesores(p)
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(normalizeApiError(error, 'No se pudo cargar el módulo académico'))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [token])

  const reloadCatalogs = async () => {
    const [g, a, e, p] = await Promise.all([
      listGrupos(token),
      listAsignaturas(token),
      listEstudiantes(token),
      listProfesores(token),
    ])
    setGrupos(g)
    setAsignaturas(a)
    setEstudiantes(e)
    setProfesores(p)
  }

  const handlePrintFilteredList = () => {
    if (filteredStudents.length === 0) {
      toast.error('No hay estudiantes en la lista para imprimir')
      return
    }

    const logoHtml = `<div style="width: 150px; margin: 0 auto 10px;">${logoSvg}</div>`
    const groupName = selectedGroupFilter === 'SIN_GRUPO' ? 'Sin grupo asignado' : (selectedGroupFilter || 'Todos los estudiantes')

    const grupoSeleccionado = grupos.find(g => g.nombre === selectedGroupFilter)
    const profesorDelGrupo = grupoSeleccionado 
      ? `${grupoSeleccionado.profesorNombre || ''} ${grupoSeleccionado.profesorApellido || ''}`.trim()
      : null

    const profesorInfoHtml = profesorDelGrupo ? `<p><strong>Profesor Titular:</strong> ${profesorDelGrupo}</p>` : ''

    const html = `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Directorio de Estudiantes - ${groupName}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>
          @page { size: A4; margin: 20mm 15mm; }
          body { font-family: 'Inter', system-ui, sans-serif; color: #0f172a; background-color: #fff; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .header-container { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #0f766e; padding-bottom: 20px; margin-bottom: 25px; }
          .logo-wrapper { max-width: 140px; }
          .header-info { text-align: right; }
          h1 { color: #0f766e; font-size: 20px; font-weight: 700; text-transform: uppercase; margin: 0 0 8px 0; letter-spacing: 0.5px; }
          .meta-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 1px; }
          .meta-value { font-size: 14px; font-weight: 500; color: #1e293b; margin: 2px 0 10px 0; }
          .info-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 15px; margin-bottom: 25px; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
          .info-item { font-size: 13px; color: #475569; }
          .info-item strong { color: #0f172a; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
          th { background-color: #0f172a; color: #ffffff; text-transform: uppercase; font-size: 10px; font-weight: 600; letter-spacing: 1px; padding: 12px 14px; text-align: left; }
          td { border-bottom: 1px solid #e2e8f0; padding: 12px 14px; color: #334155; }
          tr:nth-child(even) { background-color: #f8fafc; }
          tr { page-break-inside: avoid; }
          .footer { text-align: center; font-size: 11px; color: #94a3b8; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="header-container">
          <div class="logo-wrapper">${logoHtml}</div>
          <div class="header-info">
            <h1>Directorio de Estudiantes</h1>
            <div class="meta-label">Fecha de Reporte</div>
            <div class="meta-value">${new Date().toLocaleDateString('es-NI', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
        </div>
        
        <div class="info-grid">
          <div class="info-item"><strong>Filtro aplicado:</strong> ${groupName}</div>
          ${profesorInfoHtml ? `<div class="info-item">${profesorInfoHtml}</div>` : '<div class="info-item"><strong>Profesor Titular:</strong> No asignado</div>'}
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 50px; border-top-left-radius: 6px; border-bottom-left-radius: 6px;">#</th>
              <th>Nombre del Estudiante</th>
              <th style="width: 100px;">ID</th>
              <th style="border-top-right-radius: 6px; border-bottom-right-radius: 6px;">Grupo(s)</th>
            </tr>
          </thead>
          <tbody>
            ${filteredStudents.map((student, i) => `
              <tr>
                <td style="font-weight: 600; color: #64748b;">${i + 1}</td>
                <td style="font-weight: 600; color: #0f172a;">${student.nombre} ${student.apellido}</td>
                <td>${student.id}</td>
                <td>${student.grupos && student.grupos.length > 0 ? student.grupos.join(', ') : 'Sin grupo'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          Centro Integral de Estimulación Temprana "Mi Casita" · Reporte Oficial
        </div>
      </body>
      </html>
    `
    const w = window.open('', '_blank')
    if (!w) { toast.error('Permite las ventanas emergentes (popups) para poder imprimir'); return }
    w.document.write(html)
    w.document.close()
    setTimeout(() => { w.focus(); w.print() }, 300)
  }

  return (
    <section className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Académico</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Matrículas y Alumnos</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
            Gestiona las inscripciones de los estudiantes a sus grupos y profesores titulares.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <button onClick={() => setIsConfigGruposOpen(true)} className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700">Configurar Grupos / Profesores</button>
        </div>
      </div>

      {loading ? (
        <div className="mt-6 flex items-center text-slate-600">
          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          Cargando datos académicos...
        </div>
      ) : (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-6 flex gap-4 border-b border-slate-200 pb-px">
            <button
              onClick={() => setActiveTab('estudiantes')}
              className={`pb-3 text-sm font-semibold transition-colors ${activeTab === 'estudiantes' ? 'border-b-2 border-teal-600 text-teal-800' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Directorio de Estudiantes
            </button>
            <button
              onClick={() => setActiveTab('grupos')}
              className={`pb-3 text-sm font-semibold transition-colors ${activeTab === 'grupos' ? 'border-b-2 border-teal-600 text-teal-800' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Gestión de Grupos
            </button>
          </div>

          {activeTab === 'estudiantes' ? (
            <>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm">
                  <Search className="h-5 w-5 text-slate-400" />
                    <input
                      value={studentsSearch}
                      onChange={(event) => setStudentsSearch(event.target.value)}
                      placeholder="Buscar estudiante por nombre o ID..."
                      className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                    />
                </div>
                <select
                  value={selectedGroupFilter}
                  onChange={(e) => setSelectedGroupFilter(e.target.value)}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none shadow-sm focus:border-teal-500 sm:w-64"
                >
                  <option value="">Todos los grupos</option>
                  <option value="SIN_GRUPO">Sin grupo asignado</option>
                  {grupos.map(g => (
                    <option key={g.id} value={g.nombre || ''}>{g.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="mt-6 flex items-center justify-between px-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <span>Estudiantes ({filteredStudents.length})</span>
                <button
                  type="button"
                  onClick={handlePrintFilteredList}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <Printer className="h-4 w-4" />
                  Imprimir lista
                </button>
              </div>

              <div className="mt-4 flex flex-col gap-3">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map(student => (
                    <article key={student.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 transition-all hover:border-teal-300 hover:shadow-md">
                       <div className="flex items-center gap-4">
                         <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600 transition-colors">
                           {(student.nombre?.[0] ?? 'U').toUpperCase()}{(student.apellido?.[0] ?? '').toUpperCase()}
                         </div>
                         <div className="min-w-0">
                           <p className="truncate font-semibold text-slate-900">{student.nombre} {student.apellido}</p>
                           <p className="text-xs text-slate-500">ID estudiante: {student.id}</p>
                           <div className="mt-2 flex flex-wrap gap-2">
                             {student.grupos && student.grupos.length > 0 ? (
                               student.grupos.map((g, i) => (
                                 <span key={i} className="inline-flex rounded-md bg-sky-50 px-2 py-1 text-[10px] font-medium text-sky-700 ring-1 ring-inset ring-sky-600/20">Grupo: {g}</span>
                               ))
                             ) : (
                               <span className="inline-flex rounded-md bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-600 ring-1 ring-inset ring-slate-500/20">Sin grupo asignado</span>
                             )}
                           </div>
                         </div>
                       </div>
                       <div className="flex items-center gap-2 sm:shrink-0">
                          <button onClick={() => setViewingStudentId(student.id)} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">Ver ficha</button>
                          <button onClick={() => { setStudentToChangeGroup(student); setNewGroupIdForStudent(''); }} className="rounded-xl bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-700 transition hover:bg-teal-100">Cambiar Grupo</button>
                       </div>
                    </article>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                    No hay estudiantes que coincidan con la búsqueda.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {grupos.map(grupo => {
                const teacherName = grupo.profesorNombre ? `${grupo.profesorNombre} ${grupo.profesorApellido || ''}` : null;
                
                return (
                  <article key={grupo.id} className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-900">{grupo.nombre}</h3>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 ring-1 ring-inset ring-slate-200/50">Grupo</span>
                      </div>
                      <p className="mt-3 text-sm text-slate-600">
                        <span className="font-semibold">Profesor titular:</span><br/> {teacherName || 'Sin profesor asignado'}
                      </p>
                    </div>
                    <div className="mt-5 flex gap-2">
                      <button 
                        onClick={() => {
                          setSelectedGroupFilter(grupo.nombre ?? '')
                          setActiveTab('estudiantes')
                        }}
                        className="w-full rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-700 transition hover:bg-teal-100"
                      >
                        Ver Estudiantes
                      </button>
                      <button 
                        onClick={() => setIsConfigGruposOpen(true)} 
                        className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        Asignar Profesor Titular
                      </button>
                    </div>
                  </article>
                )
              })}
              {grupos.length === 0 && (
                <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                  No hay grupos creados todavía.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {viewingStudentId !== null ? (
        <StudentProfileModal 
          estudianteId={viewingStudentId} 
          onClose={() => setViewingStudentId(null)} 
        />
      ) : null}

      <ConfigGruposModal 
        isOpen={isConfigGruposOpen} 
        onClose={() => setIsConfigGruposOpen(false)} 
        grupos={grupos} 
        profesores={profesores} 
        asignaturas={asignaturas}
        token={token} 
        reloadCatalogs={reloadCatalogs} 
      />
      {studentToChangeGroup ? createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm sm:p-6">
          <div className="absolute inset-0" onClick={() => setStudentToChangeGroup(null)} />
          <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Asignar a Grupo</h2>
                <p className="text-sm text-slate-500">{studentToChangeGroup.nombre} {studentToChangeGroup.apellido}</p>
              </div>
              <button onClick={() => setStudentToChangeGroup(null)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5"/></button>
            </div>
            <div className="p-6">
              <label className="block text-sm font-semibold text-slate-700">Selecciona el nuevo grupo</label>
              <select value={newGroupIdForStudent} onChange={(e) => setNewGroupIdForStudent(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500">
                <option value="">Seleccione...</option>
                {grupos.map(g=><option key={g.id} value={g.id}>{g.nombre}</option>)}
              </select>
              
              <div className="mt-4 rounded-xl border border-sky-100 bg-sky-50 p-3 text-xs leading-relaxed text-sky-800">
                <strong>Nota:</strong> Al asignar un grupo, el estudiante pasará automáticamente a estar a cargo del profesor titular de ese grupo. No es necesario inscribirlo manualmente a asignaturas para preescolar.
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setStudentToChangeGroup(null)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancelar</button>
                <button onClick={async () => {
                  const v = newGroupIdForStudent;
                  if(!v) { toast.error('Selecciona un grupo'); return; }
                  try { 
                    await inscribirEstudianteGrupo(token, { estudianteId: studentToChangeGroup.id, grupoId: Number(v) }); 
                    toast.success('Estudiante asignado al grupo con éxito'); 
                    await reloadCatalogs(); 
                    setStudentToChangeGroup(null); 
                    setNewGroupIdForStudent('');
                  } catch (e) { 
                    toast.error(normalizeApiError(e, 'Error al cambiar de grupo')) 
                  }
                }} className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-500">Guardar Asignación</button>
              </div>
            </div>
          </div>
        </div>
      , document.body) : null}
    </section>
  )
}

function AcademicoAsistenciaMetricsSegment({
  grupoId,
  asignaturaId,
  token,
}: {
  grupoId: number | null
  asignaturaId: number | null
  token: string | null
}) {
  const [periodFilter, setPeriodFilter] = useState<'7' | '15' | '30' | 'all' | 'custom'>('30')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [metrics, setMetrics] = useState<AsistenciaEstudianteMetricaItem[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'nombre' | 'compliance'>('nombre')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const getFilterDates = (filter: string) => {
    const end = new Date()
    const start = new Date()
    if (filter === '7') {
      start.setDate(end.getDate() - 7)
      end.setDate(end.getDate() + 1)
    } else if (filter === '15') {
      start.setDate(end.getDate() - 15)
      end.setDate(end.getDate() + 1)
    } else if (filter === '30') {
      start.setDate(end.getDate() - 30)
      end.setDate(end.getDate() + 1)
    } else if (filter === 'all') {
      start.setFullYear(2020, 0, 1)
      end.setFullYear(end.getFullYear() + 10)
    }
    return {
      from: toLocalYYYYMMDD(start),
      to: toLocalYYYYMMDD(end),
    }
  }

  useEffect(() => {
    if (periodFilter !== 'custom') {
      const dates = getFilterDates(periodFilter)
      setDateFrom(dates.from)
      setDateTo(dates.to)
    }
  }, [periodFilter])

  useEffect(() => {
    if (!grupoId || !asignaturaId || !dateFrom || !dateTo) {
      setMetrics([])
      return
    }

    let cancelled = false
    setLoading(true)

    getAsistenciaMetrics(token, {
      grupoId,
      asignaturaId,
      fechaInicio: dateFrom,
      fechaFin: dateTo,
    })
      .then((data) => {
        if (!cancelled) {
          setMetrics(data)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(normalizeApiError(err, 'No se pudieron cargar las métricas de asistencia'))
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [grupoId, asignaturaId, dateFrom, dateTo, token])

  const stats = useMemo(() => {
    let totalPresentes = 0
    let totalAusentes = 0
    let totalJustificados = 0
    let totalTotal = 0
    
    if (metrics) {
      metrics.forEach((m) => {
        totalPresentes += m.presentes
        totalAusentes += m.ausentes
        totalJustificados += m.justificados
        totalTotal += m.total
      })
    }
    
    const maxSessions = metrics && metrics.length > 0 ? Math.max(...metrics.map((m) => m.total)) : 0
    const totalStudents = metrics ? metrics.length : 0
    const attendanceRate = totalTotal > 0 ? (totalPresentes / totalTotal) * 100 : 0
    const absenceRate = totalTotal > 0 ? (totalAusentes / totalTotal) * 100 : 0
    const justifiedRate = totalTotal > 0 ? (totalJustificados / totalTotal) * 100 : 0
    
    return {
      totalPresentes,
      totalAusentes,
      totalJustificados,
      totalTotal,
      maxSessions,
      totalStudents,
      attendanceRate,
      absenceRate,
      justifiedRate,
    }
  }, [metrics])

  const filteredAndSortedMetrics = useMemo(() => {
    if (!metrics) return []
    let result = metrics.filter((m) => {
      const fullName = `${m.nombre ?? ''} ${m.apellido ?? ''}`.toLowerCase()
      return fullName.includes(searchTerm.toLowerCase())
    })

    result.sort((a, b) => {
      if (sortBy === 'nombre') {
        const nameA = `${a.nombre ?? ''} ${a.apellido ?? ''}`.toLowerCase()
        const nameB = `${b.nombre ?? ''} ${b.apellido ?? ''}`.toLowerCase()
        return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA)
      } else {
        const compA = a.total > 0 ? (a.presentes / a.total) * 100 : 0
        const compB = b.total > 0 ? (b.presentes / b.total) * 100 : 0
        return sortOrder === 'asc' ? compA - compB : compB - compA
      }
    })

    return result
  }, [metrics, searchTerm, sortBy, sortOrder])

  const doughnutData = {
    labels: ['Presentes', 'Ausentes', 'Justificados'],
    datasets: [
      {
        data: [stats.totalPresentes, stats.totalAusentes, stats.totalJustificados],
        backgroundColor: ['#0f766e', '#e11d48', '#f59e0b'],
        borderColor: ['#ffffff', '#ffffff', '#ffffff'],
        borderWidth: 2,
      },
    ],
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          boxWidth: 12,
          font: {
            size: 11,
            family: "'Inter', sans-serif",
          },
        },
      },
    },
  }

  if (!grupoId || !asignaturaId) {
    return (
      <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
        Por favor selecciona un grupo y asignatura para visualizar las métricas.
      </div>
    )
  }

  return (
    <div className="mt-4 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div>
          <p className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-teal-600" />
            Periodo de Métricas
          </p>
          <p className="text-xs text-slate-500">Filtra las estadísticas según el rango de fecha seleccionado.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-700">Desde:</label>
            <input
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(e) => {
                setDateFrom(e.target.value)
                setPeriodFilter('custom')
              }}
              className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs outline-none focus:border-teal-500 bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-700">Hasta:</label>
            <input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => {
                setDateTo(e.target.value)
                setPeriodFilter('custom')
              }}
              className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs outline-none focus:border-teal-500 bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-700">Filtro rápido:</label>
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value as any)}
              className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs outline-none focus:border-teal-500 bg-white"
            >
              <option value="7">Últimos 7 días</option>
              <option value="15">Últimos 15 días</option>
              <option value="30">Últimos 30 días</option>
              <option value="all">Histórico Completo</option>
              <option value="custom" className="hidden">Personalizado</option>
            </select>
          </div>
        </div>
      </div>

      {loading && !metrics ? (
        <div className="flex items-center justify-center py-20 text-slate-500">
          <LoaderCircle className="h-8 w-8 animate-spin mr-3 text-teal-600" />
          <span>Cargando estadísticas de asistencia...</span>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-4">
            <div className="md:col-span-3 grid gap-4 grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Asistencia Promedio</p>
                <p className={`mt-3 text-3xl font-bold ${stats.attendanceRate >= 90 ? 'text-teal-700' : stats.attendanceRate >= 75 ? 'text-amber-600' : 'text-rose-600'}`}>
                  {stats.totalTotal > 0 ? `${stats.attendanceRate.toFixed(1)}%` : '0%'}
                </p>
                <div className="mt-2 flex items-center text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">{stats.totalPresentes}</span>&nbsp;asistencias registradas
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tasa de Ausentismo</p>
                <p className="mt-3 text-3xl font-bold text-rose-600">
                  {stats.totalTotal > 0 ? `${stats.absenceRate.toFixed(1)}%` : '0%'}
                </p>
                <div className="mt-2 flex items-center text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">{stats.totalAusentes}</span>&nbsp;inasistencias
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Justificaciones</p>
                <p className="mt-3 text-3xl font-bold text-amber-500">
                  {stats.totalTotal > 0 ? `${stats.justifiedRate.toFixed(1)}%` : '0%'}
                </p>
                <div className="mt-2 flex items-center text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">{stats.totalJustificados}</span>&nbsp;casos justificados
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Sesiones y Alumnos</p>
                <p className="mt-3 text-3xl font-bold text-slate-900">
                  {stats.maxSessions} <span className="text-sm font-normal text-slate-500">sesiones</span>
                </p>
                <div className="mt-2 flex items-center text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">{stats.totalStudents}</span>&nbsp;estudiantes activos
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between min-h-[220px]">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 text-center mb-2">Distribución general</p>
              <div className="relative flex-1 h-36">
                {stats.totalTotal > 0 ? (
                  <Doughnut data={doughnutData} options={doughnutOptions} />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-400">Sin datos</div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4 gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Reporte de Asistencia por Estudiante</p>
                <p className="text-xs text-slate-500">Desglose de asistencia y cumplimiento individual.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar estudiante..."
                    className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-1.5 text-xs outline-none focus:border-teal-500 bg-white"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="rounded-xl border border-slate-300 px-2.5 py-1.5 text-xs outline-none bg-white"
                  >
                    <option value="nombre">Ordenar por Nombre</option>
                    <option value="compliance">Ordenar por % Cumplimiento</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
                    className="rounded-xl border border-slate-300 p-1.5 text-slate-600 transition hover:bg-slate-50 bg-white text-xs font-semibold"
                  >
                    {sortOrder === 'asc' ? '▲' : '▼'}
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-[0.08em] text-slate-600">
                  <tr>
                    <th className="px-6 py-3 text-left">Estudiante</th>
                    <th className="px-6 py-3 text-center">Clases Registradas</th>
                    <th className="px-6 py-3 text-center">Presente (P)</th>
                    <th className="px-6 py-3 text-center">Ausente (I)</th>
                    <th className="px-6 py-3 text-center">Justificado (J)</th>
                    <th className="px-6 py-3 text-right">Cumplimiento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredAndSortedMetrics.length > 0 ? (
                    filteredAndSortedMetrics.map((item) => {
                      const compliance = item.total > 0 ? (item.presentes / item.total) * 100 : 0
                      return (
                        <tr key={item.estudianteId} className="transition-colors hover:bg-slate-50/30">
                          <td className="px-6 py-4 font-semibold text-slate-900 whitespace-nowrap">
                            {item.nombre} {item.apellido}
                          </td>
                          <td className="px-6 py-4 text-center font-medium text-slate-600">{item.total}</td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center justify-center rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-800">
                              {item.presentes}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center justify-center rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-800">
                              {item.ausentes}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center justify-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                              {item.justificados}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className={`font-bold ${compliance >= 90 ? 'text-teal-700' : compliance >= 75 ? 'text-amber-600' : 'text-rose-600'}`}>
                                {compliance.toFixed(1)}%
                              </span>
                              <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                                <div
                                  className={`h-full ${compliance >= 90 ? 'bg-teal-600' : compliance >= 75 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                  style={{ width: `${Math.min(compliance, 100)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                        {searchTerm ? 'No se encontraron estudiantes con ese nombre.' : 'No hay datos de asistencia para el periodo seleccionado.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

type AcademicoAsistenciaNotasPanelProps = {
  initialSegment?: 'asistencia' | 'notas'
  lockSegment?: boolean
  title?: string
  subtitle?: string
}

export function AcademicoAsistenciaNotasPanel({
  initialSegment = 'asistencia',
  lockSegment = false,
  title = 'Asistencia y notas',
  subtitle = 'Vista intuitiva para docentes: selecciona grupo y fecha, marca estados rápidos y guarda la asistencia.',
}: AcademicoAsistenciaNotasPanelProps = {}) {
  const { token, user } = useAuth()
  const [activeSegment, setActiveSegment] = useState<'asistencia' | 'notas'>(initialSegment)
  const [loading, setLoading] = useState(true)
  const [grupos, setGrupos] = useState<GrupoItem[]>([])
  const [asignaturas, setAsignaturas] = useState<AsignaturaItem[]>([])
  const [estados, setEstados] = useState<EstadoAsistenciaItem[]>([])
  const [misClasesDocente, setMisClasesDocente] = useState<DocenteClaseItem[]>([])

  const [selectedGrupoId, setSelectedGrupoId] = useState<number | null>(null)
  const [selectedAsignaturaId, setSelectedAsignaturaId] = useState<number | null>(null)
  const [selectedFecha, setSelectedFecha] = useState<string>(toLocalYYYYMMDD(new Date()))
  const [rows, setRows] = useState<AcademicoRowState[]>([])
  const [historial, setHistorial] = useState<AsistenciaHistorialItem[]>([])
  const [loadingSheet, setLoadingSheet] = useState(false)
  const [loadingHistorial, setLoadingHistorial] = useState(false)
  const [savingAttendance, setSavingAttendance] = useState(false)
  const sheetCacheRef = useRef<Map<string, AsistenciaSheetResponse>>(new Map())
  const [viewingStudentId, setViewingStudentId] = useState<number | null>(null)
  const [viewingHistorialItem, setViewingHistorialItem] = useState<AsistenciaHistorialItem | null>(null)
  const [currentSheet, setCurrentSheet] = useState<AsistenciaSheetResponse | null>(null)
  const [asistenciaTab, setAsistenciaTab] = useState<'registro' | 'metricas'>('registro')
  const [showQuickList, setShowQuickList] = useState(false)

  const isProfesor = useMemo(() => {
    const roles = (user?.roles ?? []).map((r) => r.toUpperCase())
    const hasAdminRole = roles.some((role) =>
      ['ADMIN', 'DEVELOPER', 'ADMINISTRACION', 'ADMIN_DIRECCION', 'DIRECTOR'].includes(role)
    )
    if (hasAdminRole) {
      return false
    }
    return roles.some((role) => ['PROFESOR', 'DOCENTE'].includes(role))
  }, [user])

  const gruposVisibles = useMemo(() => {
    if (!isProfesor) {
      return grupos
    }

    const unique = new Map<number, GrupoItem>()
    misClasesDocente.forEach((clase) => {
      if (!clase.grupoId || unique.has(clase.grupoId)) {
        return
      }
      unique.set(clase.grupoId, {
        id: clase.grupoId,
        nombre: clase.grupoNombre ?? `Grupo ${clase.grupoId}`,
        codigoFuncion: clase.grupoCodigoFuncion ?? null,
      })
    })

    return Array.from(unique.values())
  }, [grupos, isProfesor, misClasesDocente])

  const asignaturasVisibles = useMemo(() => {
    if (!isProfesor) {
      return asignaturas
    }

    const unique = new Map<number, AsignaturaItem>()
    misClasesDocente
      .filter((clase) => clase.grupoId === selectedGrupoId)
      .forEach((clase) => {
        clase.asignaturas.forEach((asignatura) => {
          if (!asignatura.asignaturaId || unique.has(asignatura.asignaturaId)) {
            return
          }
          unique.set(asignatura.asignaturaId, {
            id: asignatura.asignaturaId,
            nombre: asignatura.asignaturaNombre ?? `Asignatura ${asignatura.asignaturaId}`,
            descripcion: null,
          })
        })
      })

    if (unique.size === 0 && asignaturas.length > 0) {
      return asignaturas
    }

    return Array.from(unique.values())
  }, [asignaturas, isProfesor, misClasesDocente, selectedGrupoId])

  const estudiantesClaseSeleccionada = useMemo(() => {
    if (!isProfesor || !selectedGrupoId) {
      return []
    }

    const clase = misClasesDocente.find((item) => item.grupoId === selectedGrupoId)
    return clase?.estudiantes ?? []
  }, [isProfesor, misClasesDocente, selectedGrupoId])

  const getPresentEstadoId = () => estados.find((estado) => estado.nombre.trim().toUpperCase() === 'PRESENTE')?.id ?? null

  const buildSheetCacheKey = useCallback((grupoId: number, asignaturaId: number, fecha: string) => {
    return `${grupoId}::${asignaturaId}::${fecha}`
  }, [])

  const applySheetRows = useCallback((response: AsistenciaSheetResponse) => {
    const presentEstadoId = getPresentEstadoId()
    setCurrentSheet(response)

    setRows(response.rows.map((row) => ({
      ...row,
      selectedEstadoId: row.estadoAsistenciaId ?? presentEstadoId ?? undefined,
      noteTrabajo: '',
      notaFinal: '',
      observacionesOpen: Boolean(row.observaciones),
    })))
  }, [estados])

  const loadHistory = useCallback(async (grupoId?: number | null, asignaturaId?: number | null) => {
    if (!grupoId || !asignaturaId) {
      setHistorial([])
      return
    }

    setLoadingHistorial(true)
    try {
      const response = await getAsistenciaHistorial(token, { grupoId, asignaturaId, limit: 8 })
      setHistorial(response)
    } catch (error) {
      toast.error(normalizeApiError(error, 'No se pudo cargar el historial de asistencia'))
      setHistorial([])
    } finally {
      setLoadingHistorial(false)
    }
  }, [token])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const [g, a, e, misClases] = await Promise.all([
          listGrupos(token),
          listAsignaturas(token),
          listEstadosAsistencia(token),
          isProfesor ? getMisClasesDocente(token) : Promise.resolve([]),
        ])

        const misClasesProfesor = (misClases as DocenteClaseItem[])
        if (!cancelled) {
          setGrupos(g)
          setAsignaturas(a)
          setEstados(e)
          setMisClasesDocente(misClasesProfesor)

          if (isProfesor) {
            const primerGrupo = misClasesProfesor[0]?.grupoId ?? null
            const primeraAsignatura = misClasesProfesor[0]?.asignaturas?.[0]?.asignaturaId ?? null
            setSelectedGrupoId(primerGrupo)
            setSelectedAsignaturaId(primeraAsignatura)
          } else {
            setSelectedGrupoId(g[0]?.id ?? null)
            setSelectedAsignaturaId(a[0]?.id ?? null)
          }
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(normalizeApiError(error, 'No se pudieron cargar los catálogos académicos'))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [isProfesor, token])

  useEffect(() => {
    if (!isProfesor) {
      return
    }

    if (gruposVisibles.length === 0) {
      setSelectedGrupoId(null)
      setSelectedAsignaturaId(null)
      return
    }

    if (!selectedGrupoId || !gruposVisibles.some((item) => item.id === selectedGrupoId)) {
      setSelectedGrupoId(gruposVisibles[0].id)
      return
    }

    if (asignaturasVisibles.length === 0) {
      setSelectedAsignaturaId(null)
      return
    }

    if (!selectedAsignaturaId || !asignaturasVisibles.some((item) => item.id === selectedAsignaturaId)) {
      setSelectedAsignaturaId(asignaturasVisibles[0].id)
    }
  }, [asignaturasVisibles, gruposVisibles, isProfesor, selectedAsignaturaId, selectedGrupoId])

  useEffect(() => {
    void loadHistory(selectedGrupoId, selectedAsignaturaId)
  }, [loadHistory, selectedGrupoId, selectedAsignaturaId])

  const canLoadSheet = useMemo(() => Boolean(selectedGrupoId && selectedAsignaturaId && selectedFecha), [selectedGrupoId, selectedAsignaturaId, selectedFecha])

  const loadSheet = useCallback(async (
    fecha = selectedFecha,
    options?: { forceRefresh?: boolean },
  ) => {
    if (!selectedGrupoId || !selectedAsignaturaId) {
      return
    }

    const cacheKey = buildSheetCacheKey(selectedGrupoId, selectedAsignaturaId, fecha)
    if (!options?.forceRefresh) {
      const cached = sheetCacheRef.current.get(cacheKey)
      if (cached) {
        applySheetRows(cached)
        await loadHistory(selectedGrupoId, selectedAsignaturaId)
        return
      }
    }

    setLoadingSheet(true)
    try {
      const response = await getAsistenciaSheet(token, {
        grupoId: selectedGrupoId,
        asignaturaId: selectedAsignaturaId,
        fecha,
      })

      sheetCacheRef.current.set(cacheKey, response)
      applySheetRows(response)
      await loadHistory(selectedGrupoId, selectedAsignaturaId)
    } catch (error) {
      toast.error(normalizeApiError(error, 'No se pudo cargar la hoja de asistencia'))
    } finally {
      setLoadingSheet(false)
    }
  }, [applySheetRows, buildSheetCacheKey, loadHistory, selectedAsignaturaId, selectedFecha, selectedGrupoId, token])

  useEffect(() => {
    if (!canLoadSheet || loading) {
      return
    }

    const debounceId = window.setTimeout(() => {
      void loadSheet(selectedFecha)
    }, 250)

    return () => {
      window.clearTimeout(debounceId)
    }
  }, [canLoadSheet, loadSheet, loading, selectedAsignaturaId, selectedFecha, selectedGrupoId])

  const saveAttendance = async () => {
    if (!selectedGrupoId || !selectedAsignaturaId) {
      return
    }

    const registros = rows
      .filter((row) => row.selectedEstadoId)
      .map((row) => ({
        estudianteId: row.estudianteId,
        estadoAsistenciaId: Number(row.selectedEstadoId),
        observaciones: row.observaciones ?? null,
      }))

    if (registros.length === 0) {
      toast.error('Debes seleccionar al menos un estado de asistencia')
      return
    }

    setSavingAttendance(true)
    try {
      await registrarAsistenciaSheet(token, {
        grupoId: selectedGrupoId,
        asignaturaId: selectedAsignaturaId,
        fecha: selectedFecha,
        registros,
      })
      toast.success('Asistencia guardada correctamente')
      await loadSheet(selectedFecha, { forceRefresh: true })
    } catch (error) {
      toast.error(normalizeApiError(error, 'No se pudo guardar la asistencia'))
    } finally {
      setSavingAttendance(false)
    }
  }

  const saveTrabajoAndNota = async (row: AsistenciaRowItem & { noteTrabajo?: string; notaFinal?: string }) => {
    if (!row.estudianteAsignaturaId) {
      toast.error('Primero guarda asistencia para generar la inscripción de asignatura')
      return
    }

    try {
      const hasTrabajo = (row.noteTrabajo ?? '').trim().length > 0
      const hasNotaFinal = (row.notaFinal ?? '').trim().length > 0

      if (!hasTrabajo && !hasNotaFinal) {
        toast.error('Ingresa nota de trabajo o nota final para guardar')
        return
      }

      if (hasTrabajo && Number.isNaN(Number(row.noteTrabajo))) {
        toast.error('La nota de trabajo debe ser numérica')
        return
      }

      if (hasNotaFinal && Number.isNaN(Number(row.notaFinal))) {
        toast.error('La nota final debe ser numérica')
        return
      }

      if (hasTrabajo && (Number(row.noteTrabajo) < 0 || Number(row.noteTrabajo) > 100)) {
        toast.error('La nota de trabajo debe estar entre 0 y 100')
        return
      }

      if (hasNotaFinal && (Number(row.notaFinal) < 0 || Number(row.notaFinal) > 100)) {
        toast.error('La nota final debe estar entre 0 y 100')
        return
      }

      if (hasTrabajo) {
        await registrarTrabajo(token, {
          estudianteAsignaturaId: row.estudianteAsignaturaId,
          nota: Number(row.noteTrabajo),
          fecha: selectedFecha,
        })
      }

      if (hasNotaFinal) {
        await actualizarNotaFinal(token, row.estudianteAsignaturaId, Number(row.notaFinal))
      }

      toast.success('Notas guardadas')
      await loadSheet(selectedFecha, { forceRefresh: true })
    } catch (error) {
      toast.error(normalizeApiError(error, 'No se pudieron guardar las notas'))
    }
  }

  const logoHtml = `<div style="width: 150px; margin: 0 auto 10px;">${logoSvg}</div>`

  const printDocument = useCallback((title: string, subtitle: string, date: string, tableRows: string, docenteNombre?: string | null) => {
    const html = `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>
          @page { size: A4; margin: 20mm 15mm; }
          body { font-family: 'Inter', system-ui, sans-serif; color: #0f172a; background-color: #fff; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .header-container { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #0f766e; padding-bottom: 20px; margin-bottom: 25px; }
          .logo-wrapper { max-width: 140px; }
          .header-info { text-align: right; }
          h1 { color: #0f766e; font-size: 20px; font-weight: 700; text-transform: uppercase; margin: 0 0 8px 0; letter-spacing: 0.5px; }
          .meta-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 1px; }
          .meta-value { font-size: 14px; font-weight: 500; color: #1e293b; margin: 2px 0 10px 0; }
          .info-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 15px; margin-bottom: 25px; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
          .info-item { font-size: 13px; color: #475569; line-height: 1.5; }
          .info-item strong { color: #0f172a; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
          th { background-color: #0f172a; color: #ffffff; text-transform: uppercase; font-size: 10px; font-weight: 600; letter-spacing: 1px; padding: 12px 14px; text-align: left; }
          td { border-bottom: 1px solid #e2e8f0; padding: 12px 14px; color: #334155; }
          tr:nth-child(even) { background-color: #f8fafc; }
          tr { page-break-inside: avoid; }
          .status-badge { display: inline-block; padding: 4px 8px; border-radius: 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; }
          .status-presente { background-color: #dcfce7; color: #15803d; }
          .status-ausente { background-color: #fee2e2; color: #b91c1c; }
          .status-justificado { background-color: #fef3c7; color: #b45309; }
          .status-no-marcado { background-color: #f1f5f9; color: #475569; }
          .footer { text-align: center; font-size: 11px; color: #94a3b8; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="header-container">
          <div class="logo-wrapper">${logoHtml}</div>
          <div class="header-info">
            <h1>Control de Asistencia</h1>
            <div class="meta-label">Fecha de Sesión</div>
            <div class="meta-value">${date}</div>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-item">
            <strong>Reporte:</strong> ${title}<br>
            <strong>Detalle:</strong> ${subtitle}
          </div>
          <div class="info-item">
            <strong>Fecha de Sesión:</strong> ${date}<br>
            <strong>Docente:</strong> ${docenteNombre || 'No especificado'}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 50px; border-top-left-radius: 6px; border-bottom-left-radius: 6px;">#</th>
              <th>Nombre del Estudiante</th>
              <th style="width: 150px;">Estado</th>
              <th style="border-top-right-radius: 6px; border-bottom-right-radius: 6px;">Observación / Alerta</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <div class="footer">
          Centro Integral de Estimulación Temprana "Mi Casita" · Reporte Oficial
        </div>
      </body>
      </html>
    `
    const w = window.open('', '_blank')
    if (!w) {
      toast.error('Permite las ventanas emergentes (popups) para poder imprimir')
      return
    }
    w.document.write(html)
    w.document.close()
    setTimeout(() => {
      w.focus()
      w.print()
    }, 300)
  }, [])

  const formatRowForPrint = (estudianteNombre?: string | null, estudianteApellido?: string | null, estadoNombre?: string, nota?: string, i?: number) => {
    let estadoClass = 'status-no-marcado'
    const status = estadoNombre?.toUpperCase() || 'NO MARCADO'
    if (status === 'PRESENTE') estadoClass = 'status-presente'
    else if (status === 'AUSENTE' || status === 'INASISTENCIA') estadoClass = 'status-ausente'
    else if (status === 'JUSTIFICADO') estadoClass = 'status-justificado'

    return `
      <tr>
        <td style="font-weight: 600; color: #64748b;">${(i ?? 0) + 1}</td>
        <td style="font-weight: 600; color: #0f172a;">${estudianteNombre || ''} ${estudianteApellido || ''}</td>
        <td><span class="status-badge ${estadoClass}">${estadoNombre || 'No marcado'}</span></td>
        <td>${nota || ''}</td>
      </tr>
    `
  }

  const handlePrintCurrentAttendance = () => {
    if (rows.length === 0) {
      toast.error('No hay estudiantes en la lista para imprimir')
      return
    }
    const grupo = gruposVisibles.find(g => g.id === selectedGrupoId)?.nombre || 'Sin Grupo'
    
    const tableRows = rows.map((row, i) => {
      const estadoNombre = estados.find(e => e.id === row.selectedEstadoId)?.nombre
      const nota = [row.observaciones, row.estudianteAlergiasGraves, row.estudianteObservacionMedicaCorta].filter(Boolean).join(' | ')
      return formatRowForPrint(row.estudianteNombre, row.estudianteApellido, estadoNombre, nota, i)
    }).join('')
    
    const dateStr = new Date(selectedFecha + 'T00:00:00').toLocaleDateString('es-NI')
    printDocument('Registro de Asistencia', `Grupo: ${grupo}`, dateStr, tableRows, currentSheet?.docenteNombre)
  }

  const handleMarkAllPresent = useCallback(() => {
    const presentEstado = estados.find((e) => e.nombre.trim().toUpperCase() === 'PRESENTE')
    if (!presentEstado) {
      toast.error('No se encontró el estado PRESENTE')
      return
    }
    setRows((prev) =>
      prev.map((item) => ({
        ...item,
        selectedEstadoId: presentEstado.id,
      }))
    )
  }, [estados])

  const handlePrintClassList = () => {
    const grupo = gruposVisibles.find(g => g.id === selectedGrupoId)?.nombre || 'Sin Grupo'
    const tableRows = estudiantesClaseSeleccionada.map((est, i) => {
      const nota = [est.alergiasGraves, est.observacionMedicaCorta].filter(Boolean).join(' | ')
      return formatRowForPrint(est.nombre, est.apellido, '-', nota, i)
    }).join('')
    printDocument('Listado de Estudiantes', `Grupo: ${grupo}`, new Date().toLocaleDateString('es-NI'), tableRows, null)
  }

  const handlePrintHistory = async (item: AsistenciaHistorialItem) => {
    const cacheKey = buildSheetCacheKey(item.grupoId, item.asignaturaId, item.fecha)
    let sheet = sheetCacheRef.current.get(cacheKey)
    
    if (!sheet) {
      try {
        const loadingToast = toast.loading('Obteniendo datos...')
        sheet = await getAsistenciaSheet(token, {
          grupoId: item.grupoId,
          asignaturaId: item.asignaturaId,
          fecha: item.fecha,
        })
        sheetCacheRef.current.set(cacheKey, sheet)
        toast.dismiss(loadingToast)
      } catch (error) {
        toast.error('No se pudo cargar la asistencia para imprimir')
        return
      }
    }

    const tableRows = sheet.rows.map((row, i) => {
      const estadoNombre = estados.find(e => e.id === row.estadoAsistenciaId)?.nombre
      const nota = [row.observaciones, row.estudianteAlergiasGraves, row.estudianteObservacionMedicaCorta].filter(Boolean).join(' | ')
      return formatRowForPrint(row.estudianteNombre, row.estudianteApellido, estadoNombre, nota, i)
    }).join('')
    
    const dateStr = new Date(item.fecha + 'T00:00:00').toLocaleDateString('es-NI')
    printDocument('Histórico de Asistencia', `Grupo: ${item.grupoNombre}`, dateStr, tableRows, sheet?.docenteNombre || item.docenteNombre)
  }

  return (
    <section className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Académico</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{title}</h2>
      <p className="mt-2 text-sm text-slate-600">{subtitle}</p>

      {loading ? (
        <div className="mt-6 flex items-center text-slate-600">
          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          Cargando catálogo...
        </div>
      ) : (
        <>
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Grupo:</span>
                <select value={selectedGrupoId ?? ''} onChange={(e) => setSelectedGrupoId(Number(e.target.value))} className="rounded-xl border border-slate-300 px-3 py-1.5 text-sm bg-white outline-none focus:border-teal-500">
                  {gruposVisibles.map((g) => <option key={g.id} value={g.id}>{g.nombre}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Asignatura:</span>
                <select value={selectedAsignaturaId ?? ''} onChange={(e) => setSelectedAsignaturaId(Number(e.target.value))} className="rounded-xl border border-slate-300 px-3 py-1.5 text-sm bg-white outline-none focus:border-teal-500">
                  {asignaturasVisibles.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Fecha:</span>
                <input type="date" value={selectedFecha} onChange={(e) => setSelectedFecha(e.target.value)} className="rounded-xl border border-slate-300 px-3 py-1.5 text-sm bg-white outline-none focus:border-teal-500" />
              </div>
            </div>

            <button
              type="button"
              onClick={() => loadSheet(selectedFecha, { forceRefresh: true })}
              disabled={!canLoadSheet || loadingSheet}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-70 transition shrink-0"
            >
              {loadingSheet ? <LoaderCircle className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
              Recargar hoja
            </button>
          </div>

          {asignaturas.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
              <strong>¡Atención!</strong> No hay ninguna Asignatura creada en el sistema. Solicita a administración que cree al menos una (ej. "Asistencia Diaria") para poder registrar asistencia.
            </div>
          ) : null}

          {isProfesor ? (
            <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowQuickList(prev => !prev)}
                  className="text-xs font-semibold text-slate-800 flex items-center gap-2 hover:text-teal-600 transition outline-none"
                >
                  <span className="uppercase tracking-wider text-slate-500 text-[10px]">Listado de alumnos inscritos</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700 font-bold">
                    {estudiantesClaseSeleccionada.length} alumnos
                  </span>
                  <span className="text-[10px] text-teal-600 font-bold hover:underline">
                    {showQuickList ? '▲ Ocultar listado' : '▼ Mostrar listado'}
                  </span>
                </button>
                {showQuickList ? (
                  <button
                    type="button"
                    onClick={handlePrintClassList}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Imprimir listado
                  </button>
                ) : null}
              </div>

              {showQuickList ? (
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 border-t border-slate-100 pt-3">
                  {estudiantesClaseSeleccionada.length > 0 ? estudiantesClaseSeleccionada.map((estudiante) => (
                    <article key={estudiante.estudianteId} className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                      <button 
                        type="button"
                        onClick={() => setViewingStudentId(estudiante.estudianteId)}
                        className="text-sm font-semibold text-slate-900 hover:text-teal-600 hover:underline text-left"
                      >
                        {estudiante.nombre} {estudiante.apellido}
                      </button>
                      <p className="text-[10px] uppercase tracking-[0.14em] text-slate-400">ID {estudiante.estudianteId}</p>
                      {estudiante.alergiasGraves || estudiante.observacionMedicaCorta ? (
                        <div className="mt-1">
                          <span 
                            className="inline-flex cursor-help items-center rounded-md bg-rose-50 px-1.5 py-0.5 text-[9px] font-medium text-rose-700 ring-1 ring-inset ring-rose-600/20" 
                            title={`${estudiante.alergiasGraves ? 'Alergia: ' + estudiante.alergiasGraves + '\n' : ''}${estudiante.observacionMedicaCorta ? 'Nota: ' + estudiante.observacionMedicaCorta : ''}`.trim()}
                          >
                            Alerta médica
                          </span>
                        </div>
                      ) : null}
                    </article>
                  )) : (
                    <div className="col-span-full rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500 text-center">
                      No hay estudiantes asignados para este grupo.
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          ) : null}

            {isProfesor && gruposVisibles.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                No tienes clases asignadas todavía. Solicita a administración que te vincule a un grupo.
              </div>
            ) : null}

          {!lockSegment ? (
            <div className="mt-4 inline-flex rounded-xl border border-slate-200 bg-white p-1">
              <button
                type="button"
                onClick={() => setActiveSegment('asistencia')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${activeSegment === 'asistencia' ? 'bg-teal-600 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
              >
                Segmento: Asistencia
              </button>
              <button
                type="button"
                onClick={() => setActiveSegment('notas')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${activeSegment === 'notas' ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
              >
                Segmento: Notas
              </button>
            </div>
          ) : null}

          {activeSegment === 'asistencia' ? (
            <>
              {!isProfesor ? (
                <div className="flex gap-4 border-b border-slate-100 mb-6 mt-4">
                  <button
                    type="button"
                    onClick={() => setAsistenciaTab('registro')}
                    className={`pb-3 text-sm font-semibold transition-colors ${asistenciaTab === 'registro' ? 'border-b-2 border-teal-600 text-teal-800' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Registro Diario
                  </button>
                  <button
                    type="button"
                    onClick={() => setAsistenciaTab('metricas')}
                    className={`pb-3 text-sm font-semibold transition-colors ${asistenciaTab === 'metricas' ? 'border-b-2 border-teal-600 text-teal-800' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Métricas y Reportes
                  </button>
                </div>
              ) : null}

              {isProfesor || asistenciaTab === 'registro' ? (
                <>
                  <AcademicoAsistenciaSegment
                    rows={rows}
                    estados={estados}
                    savingAttendance={savingAttendance}
                    onEstadoChange={(estudianteId, estadoId) => {
                      setRows((prev) => prev.map((item) => item.estudianteId === estudianteId ? { ...item, selectedEstadoId: estadoId } : item))
                    }}
                    onObservacionChange={(estudianteId, observaciones) => {
                      setRows((prev) => prev.map((item) => item.estudianteId === estudianteId ? { ...item, observaciones } : item))
                    }}
                    onToggleObservation={(estudianteId) => {
                      setRows((prev) => prev.map((item) => item.estudianteId === estudianteId ? { ...item, observacionesOpen: !item.observacionesOpen } : item))
                    }}
                    onSave={saveAttendance}
                    onViewProfile={setViewingStudentId}
                    onPrint={handlePrintCurrentAttendance}
                    docenteNombre={currentSheet?.docenteNombre}
                    onMarkAllPresent={handleMarkAllPresent}
                  />

                  <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Historial de asistencias</p>
                        <p className="text-xs text-slate-500">Últimas sesiones guardadas para este grupo.</p>
                      </div>
                      {loadingHistorial ? <LoaderCircle className="h-4 w-4 animate-spin text-slate-500" /> : null}
                    </div>

                    <div className="mt-4 space-y-2.5">
                      {historial.length > 0 ? historial.map((item) => (
                        <div
                          key={`${item.fecha}-${item.grupoId}-${item.asignaturaId}`}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-teal-300 hover:bg-teal-50/30"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center gap-4 min-w-0 flex-wrap">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {new Date(item.fecha + 'T00:00:00').toLocaleDateString('es-NI', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </p>
                              <p className="text-[11px] text-slate-500">{item.grupoNombre}</p>
                            </div>
                            
                            <span className="shrink-0 rounded-full bg-white border border-slate-200 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 w-fit">
                              {item.total} alumnos
                            </span>

                            <div className="flex gap-2 text-[11px] font-semibold flex-wrap">
                              <span className="text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded-md">P: {item.presentes}</span>
                              <span className="text-rose-700 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md">I: {item.ausentes}</span>
                              <span className="text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md">J: {item.justificados}</span>
                            </div>

                            {item.docenteNombre ? (
                              <p className="text-[11px] font-medium text-teal-700 truncate">
                                Registrado por: <span className="font-semibold">{item.docenteNombre}</span>
                              </p>
                            ) : null}
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                            <button
                              type="button"
                              onClick={() => setViewingHistorialItem(item)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-white px-3 py-1.5 text-xs font-semibold text-teal-700 transition hover:bg-teal-50 shadow-sm"
                            >
                              Ver más
                            </button>
                            <button
                              type="button"
                              onClick={() => void handlePrintHistory(item)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 shadow-sm"
                            >
                              <Printer className="h-3.5 w-3.5" /> Imprimir
                            </button>
                          </div>
                        </div>
                      )) : (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-500 text-center">
                          Aún no hay historial para esta combinación.
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <AcademicoAsistenciaMetricsSegment
                  grupoId={selectedGrupoId}
                  asignaturaId={selectedAsignaturaId}
                  token={token}
                />
              )}
            </>
          ) : (
            <AcademicoNotasSegment
              rows={rows}
              onTrabajoChange={(estudianteId, value) => {
                setRows((prev) => prev.map((item) => item.estudianteId === estudianteId ? { ...item, noteTrabajo: value } : item))
              }}
              onNotaFinalChange={(estudianteId, value) => {
                setRows((prev) => prev.map((item) => item.estudianteId === estudianteId ? { ...item, notaFinal: value } : item))
              }}
              onSave={saveTrabajoAndNota}
              onViewProfile={setViewingStudentId}
            />
          )}
        </>
      )}

      {viewingStudentId !== null ? (
        <StudentProfileModal 
          estudianteId={viewingStudentId} 
          onClose={() => setViewingStudentId(null)} 
        />
      ) : null}

      {viewingHistorialItem !== null ? (
        <AsistenciaHistorialModal
          item={viewingHistorialItem}
          onClose={() => setViewingHistorialItem(null)}
          token={token}
          estados={estados}
          onPrint={handlePrintHistory}
        />
      ) : null}
    </section>
  )
}

export function AcademicoAsistenciaPanel() {
  return (
    <AcademicoAsistenciaNotasPanel
      initialSegment="asistencia"
      lockSegment
      title="Control de asistencia"
      subtitle="Vista exclusiva para pasar asistencia del día por grupo."
    />
  )
}

export function AcademicoNotasPanel() {
  // Procedencia del cambio: módulo de notas desactivado a solicitud del usuario para todos los roles.
  return (
    <section className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Dashboard</p>
        <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Registro de notas</h2>
        <p className="max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">Módulo deshabilitado temporalmente para todos los roles.</p>
      </div>
      <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
        El registro de notas ha sido desactivado.
      </div>
    </section>
  )
}
