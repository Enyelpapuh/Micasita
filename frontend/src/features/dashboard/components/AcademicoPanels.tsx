import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { LoaderCircle, MessageSquare, Save } from 'lucide-react'
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
  listTutores,
  registrarAsistenciaSheet,
  registrarTrabajo,
  vincularEstudianteTutor,
  type AsistenciaRowItem,
  type AsistenciaHistorialItem,
  type AsistenciaSheetResponse,
  type AsignaturaItem,
  type DocenteClaseItem,
  type EstadoAsistenciaItem,
  type EstudianteItem,
  type GrupoItem,
} from './academico.api'

function SectionCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-3">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
      {children}
    </article>
  )
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] text-slate-500">{children}</p>
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
}: {
  rows: AcademicoRowState[]
  estados: EstadoAsistenciaItem[]
  savingAttendance: boolean
  onEstadoChange: (estudianteId: number, estadoId: number) => void
  onObservacionChange: (estudianteId: number, observaciones: string) => void
  onToggleObservation: (estudianteId: number) => void
  onSave: () => void
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
      <div className="mt-4 rounded-2xl border border-teal-200 bg-teal-50 p-3">
        <p className="text-sm font-semibold text-teal-900">Segmento 1: Asistencia</p>
        <p className="text-xs text-teal-800">Marca estado por estudiante y guarda toda la asistencia del día en un solo paso.</p>
      </div>

      <div className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {rows.length > 0 ? rows.map((row) => {
          const estadoMeta = getEstadoMeta(row.selectedEstadoId)

          return (
            <article
              key={row.estudianteId}
              className={`flex h-full flex-col rounded-2xl border p-4 shadow-sm transition-all duration-200 ${estadoMeta.className}`}
            >
              <div className="flex items-start gap-3">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-sm font-bold ${estadoMeta.button}`}>
                  {initials(row.estudianteNombre, row.estudianteApellido)}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {row.estudianteNombre} {row.estudianteApellido}
                  </p>
                  <p className="text-[11px] uppercase tracking-[0.14em] opacity-70">ID {row.estudianteId}</p>
                  {row.estudianteAlergiasGraves || row.estudianteObservacionMedicaCorta ? (
                    <div className="mt-2 space-y-2">
                      {row.estudianteAlergiasGraves ? (
                        <p className="line-clamp-2 rounded-xl border border-rose-200/80 bg-rose-50/80 px-2.5 py-2 text-xs text-rose-900">
                          <span className="font-semibold uppercase tracking-[0.12em]">Alergia:</span> {row.estudianteAlergiasGraves}
                        </p>
                      ) : null}
                      {row.estudianteObservacionMedicaCorta ? (
                        <p className="line-clamp-3 rounded-xl border border-amber-200/80 bg-amber-50/80 px-2.5 py-2 text-xs text-amber-950">
                          <span className="font-semibold uppercase tracking-[0.12em]">Nota:</span> {row.estudianteObservacionMedicaCorta}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                {estados.map((estado) => {
                  const normalized = estado.nombre.trim().toUpperCase()
                  const buttonClass = normalized === 'PRESENTE'
                    ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                    : normalized === 'AUSENTE' || normalized === 'INASISTENCIA'
                      ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                      : normalized === 'JUSTIFICADO'
                        ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'

                  return (
                    <button
                      key={`${row.estudianteId}-${estado.id}`}
                      type="button"
                      title={estado.nombre}
                      onClick={() => onEstadoChange(row.estudianteId, estado.id)}
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-full border text-[11px] font-bold transition ${row.selectedEstadoId === estado.id ? `${buttonClass} ring-2 ring-offset-1 ring-current/20` : buttonClass}`}
                    >
                      {normalized === 'PRESENTE' ? 'P' : normalized === 'AUSENTE' || normalized === 'INASISTENCIA' ? 'I' : normalized === 'JUSTIFICADO' ? 'J' : estado.nombre.slice(0, 1).toUpperCase()}
                    </button>
                  )
                })}
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => onToggleObservation(row.estudianteId)}
                  className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-white"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Observación
                </button>
                <span className="rounded-full bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                  {estadoMeta.label}
                </span>
              </div>

              {row.observacionesOpen ? (
                <div className="mt-3">
                  <textarea
                    value={row.observaciones ?? ''}
                    onChange={(e) => onObservacionChange(row.estudianteId, e.target.value)}
                    rows={2}
                    placeholder="Motivo de tardanza, salud o aviso..."
                    className="w-full rounded-xl border border-white/60 bg-white/90 px-3 py-2 text-sm outline-none ring-0 placeholder:text-slate-400 focus:border-slate-300"
                  />
                </div>
              ) : row.observaciones ? (
                <p className="mt-3 line-clamp-2 rounded-xl border border-white/60 bg-white/60 px-3 py-2 text-xs text-slate-700">
                  {row.observaciones}
                </p>
              ) : null}
            </article>
          )
        }) : (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-sm text-slate-500">
            Carga una hoja para comenzar.
          </div>
        )}
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
}: {
  rows: AcademicoRowState[]
  onTrabajoChange: (estudianteId: number, value: string) => void
  onNotaFinalChange: (estudianteId: number, value: string) => void
  onSave: (row: AcademicoRowState) => void
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
                <td className="px-3 py-2">{row.estudianteNombre} {row.estudianteApellido}</td>
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

export function AcademicoGestionPanel() {
  const { token } = useAuth()
  const [loading, setLoading] = useState(true)
  const [grupos, setGrupos] = useState<GrupoItem[]>([])
  const [asignaturas, setAsignaturas] = useState<AsignaturaItem[]>([])
  const [estudiantes, setEstudiantes] = useState<EstudianteItem[]>([])
  const [profesores, setProfesores] = useState<Array<{ id: number; nombre?: string | null; apellido?: string | null }>>([])
  const [tutores, setTutores] = useState<Array<{ id: number; nombre?: string | null; apellido?: string | null }>>([])

  const [grupoNombre, setGrupoNombre] = useState('')
  const [asignaturaNombre, setAsignaturaNombre] = useState('')
  const [asignaturaDescripcion, setAsignaturaDescripcion] = useState('')

  const [selectedGrupoId, setSelectedGrupoId] = useState<number | null>(null)
  const [selectedAsignaturaId, setSelectedAsignaturaId] = useState<number | null>(null)
  const [selectedProfesorId, setSelectedProfesorId] = useState<number | null>(null)
  const [selectedEstudianteId, setSelectedEstudianteId] = useState<number | null>(null)
  const [selectedTutorId, setSelectedTutorId] = useState<number | null>(null)
  const [studentsSearch, setStudentsSearch] = useState('')
  const [savingAction, setSavingAction] = useState<string | null>(null)

  const filteredStudents = useMemo(() => {
    const term = studentsSearch.trim().toLocaleLowerCase('es-NI')
    if (!term) {
      return estudiantes
    }
    return estudiantes.filter((item) => {
      const name = `${item.nombre ?? ''} ${item.apellido ?? ''}`.toLocaleLowerCase('es-NI')
      return name.includes(term)
    })
  }, [estudiantes, studentsSearch])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const [g, a, e, p, t] = await Promise.all([
          listGrupos(token),
          listAsignaturas(token),
          listEstudiantes(token),
          listProfesores(token),
          listTutores(token),
        ])

        if (!cancelled) {
          setGrupos(g)
          setAsignaturas(a)
          setEstudiantes(e)
          setProfesores(p)
          setTutores(t)
          setSelectedGrupoId(g[0]?.id ?? null)
          setSelectedAsignaturaId(a[0]?.id ?? null)
          setSelectedProfesorId(p[0]?.id ?? null)
          setSelectedEstudianteId(e[0]?.id ?? null)
          setSelectedTutorId(t[0]?.id ?? null)
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
    const [g, a, e, p, t] = await Promise.all([
      listGrupos(token),
      listAsignaturas(token),
      listEstudiantes(token),
      listProfesores(token),
      listTutores(token),
    ])
    setGrupos(g)
    setAsignaturas(a)
    setEstudiantes(e)
    setProfesores(p)
    setTutores(t)
  }

  const runAction = async (key: string, action: () => Promise<void>, successMessage: string) => {
    setSavingAction(key)
    try {
      await action()
      await reloadCatalogs()
      toast.success(successMessage)
    } catch (error) {
      toast.error(normalizeApiError(error, 'No se pudo completar la operación'))
    } finally {
      setSavingAction(null)
    }
  }

  const hasValidId = (value: number | null) => Number.isFinite(value ?? NaN) && Number(value) > 0

  return (
    <section className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Académico</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Gestión académica</h2>
      <p className="mt-2 text-sm text-slate-600">Configura grupos, asignaturas y vínculos académicos principales.</p>

      {loading ? (
        <div className="mt-6 flex items-center text-slate-600">
          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          Cargando datos académicos...
        </div>
      ) : (
        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          <SectionCard title="Listado de estudiantes" subtitle="Vista separada para consulta rápida">
            <div className="grid gap-2">
              <input
                value={studentsSearch}
                onChange={(event) => setStudentsSearch(event.target.value)}
                placeholder="Buscar estudiante por nombre"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
              <FieldHint>
                Mostrando {filteredStudents.length} de {estudiantes.length} estudiantes cargados.
              </FieldHint>

              <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200">
                <ul className="divide-y divide-slate-100 text-sm">
                  {filteredStudents.map((item) => (
                    <li key={item.id} className="px-3 py-2">
                      <p className="font-semibold text-slate-800">{item.nombre} {item.apellido}</p>
                      <p className="text-xs text-slate-500">ID estudiante: {item.id}</p>
                    </li>
                  ))}
                  {filteredStudents.length === 0 ? (
                    <li className="px-3 py-6 text-center text-xs text-slate-500">
                      No hay estudiantes que coincidan con la búsqueda.
                    </li>
                  ) : null}
                </ul>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Crear grupo" subtitle="RF-AC-01">
            <div className="grid gap-2">
              <label className="text-xs font-semibold text-slate-700">Nombre del grupo</label>
              <input value={grupoNombre} onChange={(e) => setGrupoNombre(e.target.value)} placeholder="Ej. 5to A" className="rounded-xl border border-slate-300 px-3 py-2 text-sm" />
              <FieldHint>Este campo define cómo verá el profesor el grupo en asistencia e inscripciones.</FieldHint>
              <button
                type="button"
                onClick={() => runAction('crear-grupo', async () => {
                  if (!grupoNombre.trim()) {
                    toast.error('El nombre del grupo es requerido')
                    return
                  }
                  const created = await createGrupo(token, { nombre: grupoNombre })
                  setGrupoNombre('')
                  setSelectedGrupoId(created.id)
                }, 'Grupo creado')}
                disabled={savingAction === 'crear-grupo'}
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-70"
              >
                {savingAction === 'crear-grupo' ? <LoaderCircle className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
                Guardar grupo
              </button>
            </div>
          </SectionCard>

          <SectionCard title="Crear asignatura" subtitle="RF-AC-01">
            <div className="grid gap-2">
              <label className="text-xs font-semibold text-slate-700">Nombre de asignatura</label>
              <input value={asignaturaNombre} onChange={(e) => setAsignaturaNombre(e.target.value)} placeholder="Ej. Matemática" className="rounded-xl border border-slate-300 px-3 py-2 text-sm" />
              <label className="text-xs font-semibold text-slate-700">Descripción</label>
              <input value={asignaturaDescripcion} onChange={(e) => setAsignaturaDescripcion(e.target.value)} placeholder="Descripción" className="rounded-xl border border-slate-300 px-3 py-2 text-sm" />
              <FieldHint>La descripción ayuda a diferenciar asignaturas similares en la planificación.</FieldHint>
              <button
                type="button"
                onClick={() => runAction('crear-asignatura', async () => {
                  if (!asignaturaNombre.trim()) {
                    toast.error('El nombre de la asignatura es requerido')
                    return
                  }
                  const created = await createAsignatura(token, { nombre: asignaturaNombre, descripcion: asignaturaDescripcion || null })
                  setAsignaturaNombre('')
                  setAsignaturaDescripcion('')
                  setSelectedAsignaturaId(created.id)
                }, 'Asignatura creada')}
                disabled={savingAction === 'crear-asignatura'}
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-70"
              >
                {savingAction === 'crear-asignatura' ? <LoaderCircle className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
                Guardar asignatura
              </button>
            </div>
          </SectionCard>

          <SectionCard title="Asignar profesor a grupo" subtitle="RF-AC-02">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-1">
                <label className="text-xs font-semibold text-slate-700">Profesor</label>
              <select value={selectedProfesorId ?? ''} onChange={(e) => setSelectedProfesorId(Number(e.target.value))} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
                {profesores.map((p) => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
              </select>
              </div>
              <div className="grid gap-1">
                <label className="text-xs font-semibold text-slate-700">Grupo</label>
              <select value={selectedGrupoId ?? ''} onChange={(e) => setSelectedGrupoId(Number(e.target.value))} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
                {grupos.map((g) => <option key={g.id} value={g.id}>{g.nombre}</option>)}
              </select>
              </div>
            </div>
            <FieldHint>Esta acción define qué docente tomará asistencia y notas para el grupo.</FieldHint>
            <button
              type="button"
              onClick={() => runAction('profesor-grupo', async () => {
                  if (!hasValidId(selectedProfesorId) || !hasValidId(selectedGrupoId)) {
                    toast.error('Selecciona profesor y grupo para continuar')
                    return
                  }
                  const profesorId = Number(selectedProfesorId)
                  const grupoId = Number(selectedGrupoId)
                  await asignarProfesorGrupo(token, { profesorId, grupoId })
              }, 'Profesor asignado al grupo')}
              disabled={savingAction === 'profesor-grupo'}
              className="mt-2 inline-flex items-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-70"
            >
              {savingAction === 'profesor-grupo' ? <LoaderCircle className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
              Confirmar asignación
            </button>
          </SectionCard>

          <SectionCard title="Inscripciones y vínculos" subtitle="RF-AC-03 y RF-AC-06">
            <div className="grid gap-2">
              <label className="text-xs font-semibold text-slate-700">Estudiante</label>
              <select value={selectedEstudianteId ?? ''} onChange={(e) => setSelectedEstudianteId(Number(e.target.value))} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
                {estudiantes.map((e) => <option key={e.id} value={e.id}>{e.nombre} {e.apellido}</option>)}
              </select>
              <FieldHint>Selecciona el estudiante base para las operaciones de inscripción y tutoría.</FieldHint>

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-1">
                  <label className="text-xs font-semibold text-slate-700">Grupo a inscribir</label>
                <select value={selectedGrupoId ?? ''} onChange={(e) => setSelectedGrupoId(Number(e.target.value))} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
                  {grupos.map((g) => <option key={g.id} value={g.id}>{g.nombre}</option>)}
                </select>
                </div>
                <button
                  type="button"
                  onClick={() => runAction('inscribir-grupo', async () => {
                    if (!hasValidId(selectedEstudianteId) || !hasValidId(selectedGrupoId)) {
                      toast.error('Selecciona estudiante y grupo para inscribir')
                      return
                    }
                    const estudianteId = Number(selectedEstudianteId)
                    const grupoId = Number(selectedGrupoId)
                    await inscribirEstudianteGrupo(token, { estudianteId, grupoId })
                  }, 'Estudiante inscrito al grupo')}
                  disabled={savingAction === 'inscribir-grupo'}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-70"
                >
                  {savingAction === 'inscribir-grupo' ? <LoaderCircle className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
                  Inscribir a grupo
                </button>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-1">
                  <label className="text-xs font-semibold text-slate-700">Asignatura a inscribir</label>
                <select value={selectedAsignaturaId ?? ''} onChange={(e) => setSelectedAsignaturaId(Number(e.target.value))} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
                  {asignaturas.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                </select>
                </div>
                <button
                  type="button"
                  onClick={() => runAction('inscribir-asignatura', async () => {
                    if (!hasValidId(selectedEstudianteId) || !hasValidId(selectedAsignaturaId)) {
                      toast.error('Selecciona estudiante y asignatura para inscribir')
                      return
                    }
                    const estudianteId = Number(selectedEstudianteId)
                    const asignaturaId = Number(selectedAsignaturaId)
                    await inscribirEstudianteAsignatura(token, { estudianteId, asignaturaId })
                  }, 'Estudiante inscrito a asignatura')}
                  disabled={savingAction === 'inscribir-asignatura'}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-70"
                >
                  {savingAction === 'inscribir-asignatura' ? <LoaderCircle className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
                  Inscribir a asignatura
                </button>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-1">
                  <label className="text-xs font-semibold text-slate-700">Tutor</label>
                <select value={selectedTutorId ?? ''} onChange={(e) => setSelectedTutorId(Number(e.target.value))} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
                  {tutores.map((t) => <option key={t.id} value={t.id}>{t.nombre} {t.apellido}</option>)}
                </select>
                </div>
                <button
                  type="button"
                  onClick={() => runAction('vincular-tutor', async () => {
                    if (!hasValidId(selectedEstudianteId) || !hasValidId(selectedTutorId)) {
                      toast.error('Selecciona estudiante y tutor para vincular')
                      return
                    }
                    const estudianteId = Number(selectedEstudianteId)
                    const tutorId = Number(selectedTutorId)
                    await vincularEstudianteTutor(token, { estudianteId, tutorId })
                  }, 'Tutor vinculado al estudiante')}
                  disabled={savingAction === 'vincular-tutor'}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-70"
                >
                  {savingAction === 'vincular-tutor' ? <LoaderCircle className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
                  Vincular tutor
                </button>
              </div>

              <FieldHint>Vincular grupo y asignatura habilita la hoja de asistencia para esa combinación.</FieldHint>

              <button
                type="button"
                onClick={() => runAction('grupo-asignatura', async () => {
                  if (!hasValidId(selectedGrupoId) || !hasValidId(selectedAsignaturaId)) {
                    toast.error('Selecciona grupo y asignatura para vincular')
                    return
                  }
                  const grupoId = Number(selectedGrupoId)
                  const asignaturaId = Number(selectedAsignaturaId)
                  await asignarGrupoAsignatura(token, { grupoId, asignaturaId })
                }, 'Asignatura vinculada al grupo')}
                disabled={savingAction === 'grupo-asignatura'}
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-70"
              >
                {savingAction === 'grupo-asignatura' ? <LoaderCircle className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
                Vincular asignatura al grupo
              </button>
            </div>
          </SectionCard>
        </div>
      )}
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
                <p className="text-sm font-semibold text-slate-900">Estudiantes asignados en esta clase</p>
                <p className="text-xs text-slate-500">Vista rápida por grupo para preparar asistencia.</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {estudiantesClaseSeleccionada.length > 0 ? estudiantesClaseSeleccionada.map((estudiante) => (
                    <article key={estudiante.estudianteId} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-sm font-semibold text-slate-900">
                        {estudiante.nombre} {estudiante.apellido}
                      </p>
                      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">ID {estudiante.estudianteId}</p>
                      {estudiante.alergiasGraves ? (
                        <p className="mt-2 line-clamp-2 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-900">
                          Alergia: {estudiante.alergiasGraves}
                        </p>
                      ) : null}
                      {estudiante.observacionMedicaCorta ? (
                        <p className="mt-2 line-clamp-2 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-900">
                          Nota: {estudiante.observacionMedicaCorta}
                        </p>
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
            />
          )}
        </>
      )}
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
  return (
    <AcademicoAsistenciaNotasPanel
      initialSegment="notas"
      lockSegment
      title="Registro de notas"
      subtitle="Vista exclusiva para notas de trabajo y actualización de nota final por estudiante."
    />
  )
}
