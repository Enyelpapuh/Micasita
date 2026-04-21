import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { LoaderCircle, Save } from 'lucide-react'
import { normalizeApiError, useAuth } from '../../auth/AuthContext'
import {
  actualizarNotaFinal,
  asignarGrupoAsignatura,
  asignarProfesorGrupo,
  createAsignatura,
  createGrupo,
  getAsistenciaSheet,
  inscribirEstudianteAsignatura,
  inscribirEstudianteGrupo,
  listAsignaturas,
  listEstadosAsistencia,
  listEstudiantes,
  listGrupos,
  listProfesores,
  listTutores,
  registrarAsistenciaSheet,
  registrarTrabajo,
  vincularEstudianteTutor,
  type AsistenciaRowItem,
  type AsignaturaItem,
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
}

function AcademicoAsistenciaSegment({
  rows,
  estados,
  savingAttendance,
  onEstadoChange,
  onObservacionChange,
  onSave,
}: {
  rows: AcademicoRowState[]
  estados: EstadoAsistenciaItem[]
  savingAttendance: boolean
  onEstadoChange: (estudianteId: number, estadoId: number) => void
  onObservacionChange: (estudianteId: number, observaciones: string) => void
  onSave: () => void
}) {
  return (
    <>
      <div className="mt-4 rounded-2xl border border-teal-200 bg-teal-50 p-3">
        <p className="text-sm font-semibold text-teal-900">Segmento 1: Asistencia</p>
        <p className="text-xs text-teal-800">Marca estado por estudiante y guarda toda la asistencia del día en un solo paso.</p>
      </div>

      <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.08em] text-slate-600">
            <tr>
              <th className="px-3 py-2 text-left">Estudiante</th>
              <th className="px-3 py-2 text-left">Asistencia</th>
              <th className="px-3 py-2 text-left">Observaciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.map((row) => (
              <tr key={row.estudianteId}>
                <td className="px-3 py-2">{row.estudianteNombre} {row.estudianteApellido}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-2">
                    {estados.map((estado) => (
                      <button
                        key={`${row.estudianteId}-${estado.id}`}
                        type="button"
                        onClick={() => onEstadoChange(row.estudianteId, estado.id)}
                        className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${row.selectedEstadoId === estado.id ? 'border-teal-600 bg-teal-600 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'}`}
                      >
                        {estado.nombre}
                      </button>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <input
                    value={row.observaciones ?? ''}
                    onChange={(e) => onObservacionChange(row.estudianteId, e.target.value)}
                    placeholder="Observación de asistencia (opcional)"
                    className="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs"
                  />
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-3 py-6 text-center text-xs text-slate-500">Carga una hoja para comenzar.</td>
              </tr>
            ) : null}
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
  const [savingAction, setSavingAction] = useState<string | null>(null)

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

export function AcademicoAsistenciaNotasPanel() {
  const { token } = useAuth()
  const [activeSegment, setActiveSegment] = useState<'asistencia' | 'notas'>('asistencia')
  const [loading, setLoading] = useState(true)
  const [grupos, setGrupos] = useState<GrupoItem[]>([])
  const [asignaturas, setAsignaturas] = useState<AsignaturaItem[]>([])
  const [estados, setEstados] = useState<EstadoAsistenciaItem[]>([])

  const [selectedGrupoId, setSelectedGrupoId] = useState<number | null>(null)
  const [selectedAsignaturaId, setSelectedAsignaturaId] = useState<number | null>(null)
  const [selectedFecha, setSelectedFecha] = useState<string>(new Date().toISOString().slice(0, 10))
  const [rows, setRows] = useState<AcademicoRowState[]>([])
  const [loadingSheet, setLoadingSheet] = useState(false)
  const [savingAttendance, setSavingAttendance] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const [g, a, e] = await Promise.all([listGrupos(token), listAsignaturas(token), listEstadosAsistencia(token)])
        if (!cancelled) {
          setGrupos(g)
          setAsignaturas(a)
          setEstados(e)
          setSelectedGrupoId(g[0]?.id ?? null)
          setSelectedAsignaturaId(a[0]?.id ?? null)
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
  }, [token])

  const canLoadSheet = useMemo(() => Boolean(selectedGrupoId && selectedAsignaturaId && selectedFecha), [selectedGrupoId, selectedAsignaturaId, selectedFecha])

  const loadSheet = async () => {
    if (!selectedGrupoId || !selectedAsignaturaId) {
      return
    }

    setLoadingSheet(true)
    try {
      const response = await getAsistenciaSheet(token, {
        grupoId: selectedGrupoId,
        asignaturaId: selectedAsignaturaId,
        fecha: selectedFecha,
      })

      setRows(response.rows.map((row) => ({
        ...row,
        selectedEstadoId: row.estadoAsistenciaId ?? undefined,
        noteTrabajo: '',
        notaFinal: '',
      })))
    } catch (error) {
      toast.error(normalizeApiError(error, 'No se pudo cargar la hoja de asistencia'))
    } finally {
      setLoadingSheet(false)
    }
  }

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
      await loadSheet()
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
      await loadSheet()
    } catch (error) {
      toast.error(normalizeApiError(error, 'No se pudieron guardar las notas'))
    }
  }

  return (
    <section className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Académico</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Asistencia y notas</h2>
      <p className="mt-2 text-sm text-slate-600">Vista intuitiva para docentes: selecciona grupo, asignatura y fecha, marca estados rápidos y registra notas.</p>

      {loading ? (
        <div className="mt-6 flex items-center text-slate-600">
          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          Cargando catálogo...
        </div>
      ) : (
        <>
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Contexto de clase</p>
            <p className="mb-3 text-xs text-slate-500">Primero selecciona el grupo, asignatura y fecha para abrir la hoja del día.</p>
            <div className="grid gap-2 md:grid-cols-4">
              <div className="grid gap-1">
                <label className="text-xs font-semibold text-slate-700">Grupo</label>
                <select value={selectedGrupoId ?? ''} onChange={(e) => setSelectedGrupoId(Number(e.target.value))} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
                  {grupos.map((g) => <option key={g.id} value={g.id}>{g.nombre}</option>)}
                </select>
              </div>

              <div className="grid gap-1">
                <label className="text-xs font-semibold text-slate-700">Asignatura</label>
                <select value={selectedAsignaturaId ?? ''} onChange={(e) => setSelectedAsignaturaId(Number(e.target.value))} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
                  {asignaturas.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                </select>
              </div>

              <div className="grid gap-1">
                <label className="text-xs font-semibold text-slate-700">Fecha de clase</label>
                <input type="date" value={selectedFecha} onChange={(e) => setSelectedFecha(e.target.value)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm" />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={loadSheet}
                  disabled={!canLoadSheet || loadingSheet}
                  className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-70"
                >
                  {loadingSheet ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Cargar hoja
                </button>
              </div>
            </div>
          </div>

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

          {activeSegment === 'asistencia' ? (
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
              onSave={saveAttendance}
            />
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
