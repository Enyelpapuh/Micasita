import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'
import { LoaderCircle, MessageSquare, Save, X, Mail, Phone, Users, Search, Printer } from 'lucide-react'
import { normalizeApiError, useAuth } from '../../auth/AuthContext'
import {
  actualizarNotaFinal,
  asignarGrupoAsignatura,
  asignarProfesorGrupo,
  createAsignatura,
  createGrupo,
  getMisClasesDocente,
  getAsistenciaSheet,
  inscribirEstudianteAsignatura,
  inscribirEstudianteGrupo,
  listAsignaturas,
  getAsistenciaHistorial,
  listEstadosAsistencia,
  listEstudiantes,
  listGrupos,
  listProfesores,
  registrarAsistenciaSheet,
  registrarTrabajo,
  type AsistenciaRowItem,
  type AsistenciaHistorialItem,
  type AsistenciaSheetResponse,
  type AsignaturaItem,
  type DocenteClaseItem,
  type EstadoAsistenciaItem,
  type EstudianteItem,
  type GrupoItem,
  getEstudianteDetail,
  type EstudianteDetailItem,
} from './academico.api'

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm sm:p-6">
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
}) {
  const getEstadoMeta = (estadoId?: number | null) => {
    const estado = estados.find((item) => item.id === estadoId)
    const normalized = estado?.nombre?.trim().toUpperCase() ?? ''

    if (normalized === 'PRESENTE') {
      return { label: 'P', color: 'green', className: 'bg-green-50 border-green-200 text-green-900', button: 'bg-green-600 text-white border-green-600' }
    }

    if (normalized === 'AUSENTE' || normalized === 'INASISTENCIA') {
      return { label: 'I', color: 'red', className: 'bg-red-50 border-red-200 text-red-900', button: 'bg-red-600 text-white border-red-600' }
    }

    if (normalized === 'JUSTIFICADO') {
      return { label: 'J', color: 'amber', className: 'bg-amber-50 border-amber-200 text-amber-900', button: 'bg-amber-500 text-white border-amber-500' }
    }

    return { label: '?', color: 'slate', className: 'bg-slate-50 border-slate-200 text-slate-900', button: 'bg-slate-200 text-slate-800 border-slate-300' }
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
          <p className="text-sm font-semibold text-teal-900">Registro de Asistencia</p>
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
              <th className="px-4 py-3 text-center">Asistencia</th>
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
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${estadoMeta.button}`}>
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
                        const buttonClass = normalized === 'PRESENTE'
                          ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                          : normalized === 'AUSENTE' || normalized === 'INASISTENCIA'
                            ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                            : normalized === 'JUSTIFICADO'
                              ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                        const isSelected = row.selectedEstadoId === estado.id
                        
                        return (
                          <button
                            key={`${row.estudianteId}-${estado.id}`}
                            type="button"
                            title={estado.nombre}
                            onClick={() => onEstadoChange(row.estudianteId, estado.id)}
                            className={`inline-flex h-9 w-9 items-center justify-center rounded-full border text-xs font-bold transition ${isSelected ? `${buttonClass} ring-2 ring-offset-1 ring-current/20 scale-110 shadow-sm` : buttonClass}`}
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
                  <p className="mt-1 text-[11px] text-slate-500">Acumulado final de la asignatura.</p>
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

function ConfigGruposModal({ isOpen, onClose, grupos, profesores, token, reloadCatalogs }: { isOpen: boolean, onClose: () => void, grupos: GrupoItem[], profesores: Array<{id: number, nombre?: string | null, apellido?: string | null}>, token: string | null, reloadCatalogs: () => Promise<void> }) {
  const [nombre, setNombre] = useState('')
  const [profesorNew, setProfesorNew] = useState('')
  const [grupoExisting, setGrupoExisting] = useState('')
  const [profesorExisting, setProfesorExisting] = useState('')
  const [busy, setBusy] = useState(false)

  if (!isOpen) return null;

  const handleCrear = async () => {
    if (!nombre.trim()) { toast.error('El nombre del grupo es requerido'); return; }
    setBusy(true)
    try {
      const created = await createGrupo(token, { nombre })
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

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm sm:p-6">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <h2 className="text-xl font-bold text-slate-900">Configurar Grupos</h2>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5"/></button>
        </div>
        
        <div className="p-6 space-y-6">
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
        </div>
      </div>
    </div>
  , document.body)
}

function ConfigAsignaturasModal({ isOpen, onClose, grupos, asignaturas, token, reloadCatalogs }: { isOpen: boolean, onClose: () => void, grupos: GrupoItem[], asignaturas: AsignaturaItem[], token: string | null, reloadCatalogs: () => Promise<void> }) {
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [grupoId, setGrupoId] = useState('')
  const [asignaturaId, setAsignaturaId] = useState('')
  const [busy, setBusy] = useState(false)

  if (!isOpen) return null;

  const handleCrear = async () => {
    if (!nombre.trim()) { toast.error('El nombre es requerido'); return; }
    setBusy(true)
    try {
      await createAsignatura(token, { nombre, descripcion: descripcion || null })
      toast.success('Asignatura creada')
      setNombre(''); setDescripcion('');
      await reloadCatalogs()
      onClose()
    } catch (e) { toast.error(normalizeApiError(e, 'Error al crear asignatura')) } finally { setBusy(false) }
  }

  const handleVincular = async () => {
    if (!grupoId || !asignaturaId) { toast.error('Selecciona grupo y asignatura'); return; }
    setBusy(true)
    try {
      await asignarGrupoAsignatura(token, { grupoId: Number(grupoId), asignaturaId: Number(asignaturaId) })
      toast.success('Asignatura vinculada al grupo')
      setGrupoId(''); setAsignaturaId('');
      await reloadCatalogs()
      onClose()
    } catch (e) { toast.error(normalizeApiError(e, 'Error al vincular')) } finally { setBusy(false) }
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm sm:p-6">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <h2 className="text-xl font-bold text-slate-900">Configurar Asignaturas</h2>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5"/></button>
        </div>
        <div className="p-6 space-y-6">
          <section className="rounded-2xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 text-sm uppercase tracking-wide">Crear nueva asignatura</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Nombre de asignatura</label>
                <input value={nombre} onChange={e=>setNombre(e.target.value)} placeholder="Ej. Matemática" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Descripción</label>
                <input value={descripcion} onChange={e=>setDescripcion(e.target.value)} placeholder="Opcional" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none" />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={handleCrear} disabled={busy} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-70">
                {busy ? 'Guardando...' : 'Crear Asignatura'}
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 text-sm uppercase tracking-wide">Vincular asignatura a un grupo</h3>
            <p className="mt-1 text-xs text-slate-500">Esto habilita a la asignatura para que aparezca en la asistencia del grupo.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Grupo</label>
                <select value={grupoId} onChange={e=>setGrupoId(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none">
                  <option value="">Selecciona grupo</option>
                  {grupos.map(g=><option key={g.id} value={g.id}>{g.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Asignatura</label>
                <select value={asignaturaId} onChange={e=>setAsignaturaId(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none">
                  <option value="">Selecciona asignatura</option>
                  {asignaturas.map(a=><option key={a.id} value={a.id}>{a.nombre}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={handleVincular} disabled={busy} className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-70">
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

  const [isConfigGruposOpen, setIsConfigGruposOpen] = useState(false)
  const [isConfigAsignaturasOpen, setIsConfigAsignaturasOpen] = useState(false)
  const [studentToInscribe, setStudentToInscribe] = useState<EstudianteItem | null>(null)

  const filteredStudents = useMemo(() => {
    const term = studentsSearch.trim().toLocaleLowerCase('es-NI')
    if (!term) {
      return estudiantes
    }
    return estudiantes.filter((item) => {
      const name = `${item.nombre ?? ''} ${item.apellido ?? ''}`.toLocaleLowerCase('es-NI')
      const idText = String(item.id)
      return name.includes(term) || idText.includes(term)
    })
  }, [estudiantes, studentsSearch])

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

  return (
    <section className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Académico</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Matrículas y Alumnos</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
            Gestiona las inscripciones de los estudiantes a sus grupos, asignaturas y configura el catálogo académico.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <button onClick={() => setIsConfigGruposOpen(true)} className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700">Configurar Grupos</button>
          <button onClick={() => setIsConfigAsignaturasOpen(true)} className="inline-flex items-center justify-center rounded-xl border border-teal-200 bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-500 transition hover:-translate-y-[1px]">Configurar Asignaturas</button>
        </div>
      </div>

      {loading ? (
        <div className="mt-6 flex items-center text-slate-600">
          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          Cargando datos académicos...
        </div>
      ) : (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm">
            <Search className="h-5 w-5 text-slate-400" />
              <input
                value={studentsSearch}
                onChange={(event) => setStudentsSearch(event.target.value)}
                placeholder="Buscar estudiante por nombre o ID..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
          </div>

          <div className="mt-6 flex items-center justify-between px-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <span>Estudiantes ({filteredStudents.length})</span>
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
                             <span key={i} className="inline-flex rounded-md bg-sky-50 px-2 py-1 text-[10px] font-medium text-sky-700 ring-1 ring-inset ring-sky-600/20">{g}</span>
                           ))
                         ) : (
                           <span className="inline-flex rounded-md bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-600 ring-1 ring-inset ring-slate-500/20">Sin grupo asignado</span>
                         )}
                       </div>
                     </div>
                   </div>
                   <div className="flex items-center gap-2 sm:shrink-0">
                      <button onClick={() => setViewingStudentId(student.id)} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">Ver ficha</button>
                      <button onClick={() => setStudentToInscribe(student)} className="rounded-xl bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-700 transition hover:bg-teal-100">Inscribir</button>
                   </div>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                No hay estudiantes que coincidan con la búsqueda.
              </div>
            )}
          </div>
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
        token={token} 
        reloadCatalogs={reloadCatalogs} 
      />

      <ConfigAsignaturasModal 
        isOpen={isConfigAsignaturasOpen} 
        onClose={() => setIsConfigAsignaturasOpen(false)} 
        grupos={grupos} 
        asignaturas={asignaturas} 
        token={token} 
        reloadCatalogs={reloadCatalogs} 
      />

      {studentToInscribe ? createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm sm:p-6">
          <div className="absolute inset-0" onClick={() => setStudentToInscribe(null)} />
          <div className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Inscripciones y vinculación</h2>
                <p className="text-sm text-slate-500">{studentToInscribe.nombre} {studentToInscribe.apellido}</p>
              </div>
              <button onClick={() => setStudentToInscribe(null)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5"/></button>
            </div>
            <div className="p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <h3 className="font-semibold text-slate-900 text-sm">Inscribir a Grupo</h3>
                  <select id="selGrupo" className="mt-3 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none">
                    <option value="">Selecciona grupo</option>
                    {grupos.map(g=><option key={g.id} value={g.id}>{g.nombre}</option>)}
                  </select>
                  <button onClick={async () => {
                    const v = (document.getElementById('selGrupo') as HTMLSelectElement).value;
                    if(!v) { toast.error('Selecciona un grupo'); return; }
                    try { await inscribirEstudianteGrupo(token, { estudianteId: studentToInscribe.id, grupoId: Number(v) }); toast.success('Inscrito al grupo'); await reloadCatalogs(); setStudentToInscribe(null); } catch (e) { toast.error(normalizeApiError(e, 'Error al inscribir')) }
                  }} className="mt-3 w-full rounded-xl bg-teal-600 py-2 text-sm font-semibold text-white hover:bg-teal-500">Inscribir Grupo</button>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <h3 className="font-semibold text-slate-900 text-sm">Inscribir a Asignatura</h3>
                  <select id="selAsig" className="mt-3 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none">
                    <option value="">Selecciona asignatura</option>
                    {asignaturas.map(a=><option key={a.id} value={a.id}>{a.nombre}</option>)}
                  </select>
                  <button onClick={async () => {
                    const v = (document.getElementById('selAsig') as HTMLSelectElement).value;
                    if(!v) { toast.error('Selecciona asignatura'); return; }
                    try { await inscribirEstudianteAsignatura(token, { estudianteId: studentToInscribe.id, asignaturaId: Number(v) }); toast.success('Inscrito a asignatura'); await reloadCatalogs(); setStudentToInscribe(null); } catch (e) { toast.error(normalizeApiError(e, 'Error al inscribir')) }
                  }} className="mt-3 w-full rounded-xl bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-500">Inscribir Asignatura</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      , document.body) : null}
    </section>
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
  subtitle = 'Vista intuitiva para docentes: selecciona grupo, asignatura y fecha, marca estados rápidos y registra notas.',
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
  const [selectedFecha, setSelectedFecha] = useState<string>(new Date().toISOString().slice(0, 10))
  const [rows, setRows] = useState<AcademicoRowState[]>([])
  const [historial, setHistorial] = useState<AsistenciaHistorialItem[]>([])
  const [loadingSheet, setLoadingSheet] = useState(false)
  const [loadingHistorial, setLoadingHistorial] = useState(false)
  const [savingAttendance, setSavingAttendance] = useState(false)
  const sheetCacheRef = useRef<Map<string, AsistenciaSheetResponse>>(new Map())
  const [viewingStudentId, setViewingStudentId] = useState<number | null>(null)

  const isProfesor = useMemo(() => {
    const roles = user?.roles ?? []
    return roles.some((role) => ['PROFESOR', 'DOCENTE'].includes(role?.toUpperCase?.() ?? role))
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

  const printDocument = useCallback((title: string, subtitle: string, date: string, tableRows: string) => {
    const html = `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 30px; color: #333; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #0f766e; padding-bottom: 20px; }
          h1 { color: #0f766e; margin: 0 0 10px 0; font-size: 24px; text-transform: uppercase; }
          p { margin: 5px 0; font-size: 14px; color: #555; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
          th, td { border: 1px solid #cbd5e1; padding: 10px 12px; text-align: left; }
          th { background-color: #f8fafc; color: #334155; text-transform: uppercase; font-size: 12px; }
          .status { font-weight: bold; }
          .present { color: #15803d; }
          .absent { color: #b91c1c; }
          .justified { color: #b45309; }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Mi Casita</h1>
          <p><strong>${title}</strong></p>
          <p>${subtitle}</p>
          <p><strong>Fecha:</strong> ${date}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 50px;">#</th>
              <th>Estudiante</th>
              <th style="width: 150px;">Estado</th>
              <th>Observación / Alerta</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
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
    let estadoClass = ''
    const status = estadoNombre?.toUpperCase() || 'NO MARCADO'
    if (status === 'PRESENTE') estadoClass = 'present'
    else if (status === 'AUSENTE' || status === 'INASISTENCIA') estadoClass = 'absent'
    else if (status === 'JUSTIFICADO') estadoClass = 'justified'

    return `
      <tr>
        <td>${(i ?? 0) + 1}</td>
        <td>${estudianteNombre || ''} ${estudianteApellido || ''}</td>
        <td class="status ${estadoClass}">${status}</td>
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
    const asignatura = asignaturasVisibles.find(a => a.id === selectedAsignaturaId)?.nombre || 'Sin Asignatura'
    
    const tableRows = rows.map((row, i) => {
      const estadoNombre = estados.find(e => e.id === row.selectedEstadoId)?.nombre
      const nota = [row.observaciones, row.estudianteAlergiasGraves, row.estudianteObservacionMedicaCorta].filter(Boolean).join(' | ')
      return formatRowForPrint(row.estudianteNombre, row.estudianteApellido, estadoNombre, nota, i)
    }).join('')
    
    const dateStr = new Date(selectedFecha + 'T00:00:00').toLocaleDateString('es-NI')
    printDocument('Registro de Asistencia', `Grupo: ${grupo} | Asignatura: ${asignatura}`, dateStr, tableRows)
  }

  const handlePrintClassList = () => {
    const grupo = gruposVisibles.find(g => g.id === selectedGrupoId)?.nombre || 'Sin Grupo'
    const tableRows = estudiantesClaseSeleccionada.map((est, i) => {
      const nota = [est.alergiasGraves, est.observacionMedicaCorta].filter(Boolean).join(' | ')
      return formatRowForPrint(est.nombre, est.apellido, '-', nota, i)
    }).join('')
    printDocument('Listado de Estudiantes', `Grupo: ${grupo}`, new Date().toLocaleDateString('es-NI'), tableRows)
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
    printDocument('Histórico de Asistencia', `Grupo: ${item.grupoNombre} | Asignatura: ${item.asignaturaNombre}`, dateStr, tableRows)
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
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Contexto de clase</p>
            <p className="mb-3 text-xs text-slate-500">
              {isProfesor
                ? 'Se muestran solo tus clases asignadas. Selecciona clase y fecha para abrir asistencia.'
                : 'Primero selecciona el grupo, asignatura y fecha para abrir la hoja del día.'}
            </p>
            <div className="grid gap-2 md:grid-cols-4">
              <div className="grid gap-1">
                <label className="text-xs font-semibold text-slate-700">Grupo</label>
                <select value={selectedGrupoId ?? ''} onChange={(e) => setSelectedGrupoId(Number(e.target.value))} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
                  {gruposVisibles.map((g) => <option key={g.id} value={g.id}>{g.nombre}</option>)}
                </select>
              </div>

              <div className="grid gap-1">
                <label className="text-xs font-semibold text-slate-700">Asignatura</label>
                <select value={selectedAsignaturaId ?? ''} onChange={(e) => setSelectedAsignaturaId(Number(e.target.value))} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
                  {asignaturasVisibles.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                </select>
              </div>

              <div className="grid gap-1">
                <label className="text-xs font-semibold text-slate-700">Fecha de clase</label>
                <input type="date" value={selectedFecha} onChange={(e) => setSelectedFecha(e.target.value)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm" />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => loadSheet(selectedFecha, { forceRefresh: true })}
                  disabled={!canLoadSheet || loadingSheet}
                  className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-70"
                >
                  {loadingSheet ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Recargar hoja
                </button>
              </div>
            </div>

            {isProfesor ? (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Estudiantes asignados en esta clase</p>
                    <p className="text-xs text-slate-500">Vista rápida por grupo para preparar asistencia.</p>
                  </div>
                  <button type="button" onClick={handlePrintClassList} className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">
                    <Printer className="h-4 w-4" />
                    Imprimir listado
                  </button>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {estudiantesClaseSeleccionada.length > 0 ? estudiantesClaseSeleccionada.map((estudiante) => (
                    <article key={estudiante.estudianteId} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <button 
                        type="button"
                        onClick={() => setViewingStudentId(estudiante.estudianteId)}
                        className="text-sm font-semibold text-slate-900 hover:text-teal-600 hover:underline text-left"
                      >
                        {estudiante.nombre} {estudiante.apellido}
                      </button>
                      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">ID {estudiante.estudianteId}</p>
                      {estudiante.alergiasGraves || estudiante.observacionMedicaCorta ? (
                        <div className="mt-1.5">
                          <span 
                            className="inline-flex cursor-help items-center rounded-md bg-rose-50 px-2 py-1 text-[10px] font-medium text-rose-700 ring-1 ring-inset ring-rose-600/20" 
                            title={`${estudiante.alergiasGraves ? 'Alergia: ' + estudiante.alergiasGraves + '\n' : ''}${estudiante.observacionMedicaCorta ? 'Nota: ' + estudiante.observacionMedicaCorta : ''}`.trim()}
                          >
                            Alerta médica
                          </span>
                        </div>
                      ) : null}
                    </article>
                  )) : (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                      No hay estudiantes asignados para este grupo.
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {isProfesor && gruposVisibles.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                No tienes clases asignadas todavía. Solicita a administración que te vincule a un grupo y asignatura.
              </div>
            ) : null}
          </div>

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
              />

              <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Historial de asistencias</p>
                    <p className="text-xs text-slate-500">Últimas sesiones guardadas para este grupo y asignatura.</p>
                  </div>
                  {loadingHistorial ? <LoaderCircle className="h-4 w-4 animate-spin text-slate-500" /> : null}
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {historial.length > 0 ? historial.map((item) => (
                    <button
                      key={`${item.fecha}-${item.grupoId}-${item.asignaturaId}`}
                      type="button"
                      onClick={() => {
                        setSelectedFecha(item.fecha)
                        void loadSheet(item.fecha)
                      }}
                      className="text-left rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-teal-300 hover:bg-teal-50/60"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{new Date(item.fecha).toLocaleDateString('es-NI', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                          <p className="text-xs text-slate-500">{item.grupoNombre} · {item.asignaturaNombre}</p>
                        </div>
                        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600">{item.total} alumnos</span>
                      </div>

                      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                        <div className="rounded-xl bg-green-50 px-3 py-2 text-green-800">
                          <p className="font-semibold">Presentes</p>
                          <p>{item.presentes}</p>
                        </div>
                        <div className="rounded-xl bg-red-50 px-3 py-2 text-red-800">
                          <p className="font-semibold">Ausentes</p>
                          <p>{item.ausentes}</p>
                        </div>
                        <div className="rounded-xl bg-amber-50 px-3 py-2 text-amber-800">
                          <p className="font-semibold">Justificados</p>
                          <p>{item.justificados}</p>
                        </div>
                      </div>

                      {item.ultimaObservacion ? (
                        <p className="mt-3 line-clamp-2 text-xs text-slate-600">{item.ultimaObservacion}</p>
                      ) : null}

                      <div className="mt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            void handlePrintHistory(item)
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          <Printer className="h-3.5 w-3.5" /> Imprimir
                        </button>
                      </div>
                    </button>
                  )) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-500">
                      Aún no hay historial para esta combinación.
                    </div>
                  )}
                </div>
              </div>
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
    </section>
  )
}

export function AcademicoAsistenciaPanel() {
  return (
    <AcademicoAsistenciaNotasPanel
      initialSegment="asistencia"
      lockSegment
      title="Control de asistencia"
      subtitle="Vista exclusiva para pasar asistencia del día por grupo y asignatura."
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
