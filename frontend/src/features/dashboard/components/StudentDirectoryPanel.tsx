import { useEffect, useMemo, useState } from 'react'
import { BookOpen, CalendarDays, ChevronRight, Mail, Phone, Search, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { normalizeApiError, useAuth } from '../../auth/AuthContext'
import {
  asignarProfesorGrupo,
  getEstudianteDetail,
  inscribirEstudianteGrupo,
  listEstudiantes,
  listGrupos,
  listProfesores,
  listTutores,
  updateEstudianteInformacionDocente,
  vincularEstudianteTutor,
  type EstudianteDetailItem,
  type EstudianteItem,
  type GrupoItem,
  type ProfesorItem,
  type TutorItem,
} from './academico.api'
import { StudentAssignmentModal } from './StudentAssignmentModal'

function formatDate(value?: string | null) {
  if (!value) {
    return 'No disponible'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('es-NI', { year: 'numeric', month: 'short', day: '2-digit' }).format(date)
}

function StudentMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-900">{value}</p>
    </div>
  )
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="text-xs text-slate-500">{subtitle}</p>
    </div>
  )
}

export function StudentDirectoryPanel() {
  const { token, user } = useAuth()
  const [students, setStudents] = useState<EstudianteItem[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<EstudianteDetailItem | null>(null)
  const [gruposDisponibles, setGruposDisponibles] = useState<GrupoItem[]>([])
  const [profesoresDisponibles, setProfesoresDisponibles] = useState<ProfesorItem[]>([])
  const [tutoresDisponibles, setTutoresDisponibles] = useState<TutorItem[]>([])
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false)
  const [studentAlergiasDraft, setStudentAlergiasDraft] = useState('')
  const [studentObservacionDraft, setStudentObservacionDraft] = useState('')
  const [selectedTutorId, setSelectedTutorId] = useState<number | null>(null)
  const [savingStudentDescription, setSavingStudentDescription] = useState(false)
  const [savingTutorLink, setSavingTutorLink] = useState(false)
  const [loadingList, setLoadingList] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [search, setSearch] = useState('')

  const canEditStudentNotes = useMemo(
    () => (user?.roles ?? []).some((role) => ['ADMIN', 'DEVELOPER', 'ADMINISTRACION', 'ADMIN_DIRECCION'].includes(role?.toUpperCase?.() ?? role)),
    [user?.roles],
  )

  const filteredStudents = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('es-NI')
    if (!term) {
      return students
    }

    return students.filter((student) => {
      const fullName = `${student.nombre ?? ''} ${student.apellido ?? ''}`.toLocaleLowerCase('es-NI')
      const idText = `${student.id}`
      return fullName.includes(term) || idText.includes(term)
    })
  }, [search, students])

  useEffect(() => {
    let cancelled = false

    const loadData = async () => {
      setLoadingList(true)
      try {
        const [studentsResult, gruposResult, profesoresResult, tutoresResult] = await Promise.all([
          listEstudiantes(token),
          listGrupos(token),
          listProfesores(token),
          listTutores(token),
        ])
        if (cancelled) {
          return
        }

        setStudents(studentsResult)
        setGruposDisponibles(gruposResult)
        setProfesoresDisponibles(profesoresResult)
        setTutoresDisponibles(tutoresResult)
        setSelectedStudentId((current) => current ?? studentsResult[0]?.id ?? null)
      } catch (error) {
        if (!cancelled) {
          toast.error(normalizeApiError(error, 'No se pudo cargar la lista de estudiantes'))
        }
      } finally {
        if (!cancelled) {
          setLoadingList(false)
        }
      }
    }

    loadData()
    return () => {
      cancelled = true
    }
  }, [token])

  useEffect(() => {
    if (!selectedStudentId) {
      setSelectedStudent(null)
      return
    }

    let cancelled = false

    const loadDetail = async () => {
      setLoadingDetail(true)
      try {
        const detail = await getEstudianteDetail(token, selectedStudentId)
        if (!cancelled) {
          setSelectedStudent(detail)
          setStudentAlergiasDraft(detail.alergiasGraves ?? '')
          setStudentObservacionDraft(detail.observacionMedicaCorta ?? '')
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(normalizeApiError(error, 'No se pudo cargar el detalle del estudiante'))
        }
      } finally {
        if (!cancelled) {
          setLoadingDetail(false)
        }
      }
    }

    loadDetail()
    return () => {
      cancelled = true
    }
  }, [selectedStudentId, token])

  useEffect(() => {
    if (selectedStudent) {
      setStudentAlergiasDraft(selectedStudent.alergiasGraves ?? '')
      setStudentObservacionDraft(selectedStudent.observacionMedicaCorta ?? '')
    }
  }, [selectedStudent])

  useEffect(() => {
    setSelectedTutorId(tutoresDisponibles[0]?.id ?? null)
  }, [tutoresDisponibles])

  const handleGuardarAsignacion = async (estudianteId: number, grupoId: number, profesorId: number) => {
    try {
      await inscribirEstudianteGrupo(token, { estudianteId, grupoId })
      await asignarProfesorGrupo(token, { profesorId, grupoId })

      if (selectedStudentId === estudianteId) {
        const detail = await getEstudianteDetail(token, estudianteId)
        setSelectedStudent(detail)
      }

      setIsAssignmentModalOpen(false)
      toast.success('Asignación guardada correctamente')
    } catch (error) {
      toast.error(normalizeApiError(error, 'No se pudo guardar la asignación'))
    }
  }

  const handleGuardarInformacionDocente = async () => {
    if (!selectedStudent) {
      return
    }

    setSavingStudentDescription(true)
    try {
      const updated = await updateEstudianteInformacionDocente(token, selectedStudent.id, {
        alergiasGraves: studentAlergiasDraft,
        observacionMedicaCorta: studentObservacionDraft,
      })
      setSelectedStudent(updated)
      setStudentAlergiasDraft(updated.alergiasGraves ?? '')
      setStudentObservacionDraft(updated.observacionMedicaCorta ?? '')
      toast.success('La información del estudiante se actualizó')
    } catch (error) {
      toast.error(normalizeApiError(error, 'No se pudo actualizar la información del estudiante'))
    } finally {
      setSavingStudentDescription(false)
    }
  }

  const handleVincularTutor = async () => {
    if (!selectedStudent || !selectedTutorId) {
      toast.error('Selecciona un tutor para vincular')
      return
    }

    setSavingTutorLink(true)
    try {
      await vincularEstudianteTutor(token, { estudianteId: selectedStudent.id, tutorId: selectedTutorId })
      const detail = await getEstudianteDetail(token, selectedStudent.id)
      setSelectedStudent(detail)
      toast.success('Tutor vinculado al estudiante')
    } catch (error) {
      toast.error(normalizeApiError(error, 'No se pudo vincular el tutor'))
    } finally {
      setSavingTutorLink(false)
    }
  }

  const selectedSummary = selectedStudent ?? null

  return (
    <section className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Lista General</p>
        <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Estudiantes y vínculos familiares</h2>
        <p className="max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
          Consulta todos los estudiantes, abre su ficha y revisa sus tutores, grupo asignado y datos de contacto.
        </p>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <aside className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
          <div className="flex items-center gap-3 rounded-2xl border border-white bg-white px-4 py-3 shadow-sm">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre o ID"
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="mt-4 flex items-center justify-between px-1 text-xs text-slate-500">
            <span>Estudiantes cargados</span>
            <span>{filteredStudents.length}</span>
          </div>

          <div className="mt-3 max-h-[32rem] space-y-2 overflow-y-auto pr-1">
            {loadingList ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">
                Cargando estudiantes...
              </div>
            ) : filteredStudents.length > 0 ? (
              filteredStudents.map((student) => {
                const isActive = student.id === selectedStudentId
                return (
                  <button
                    key={student.id}
                    type="button"
                    onClick={() => setSelectedStudentId(student.id)}
                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all duration-200 ${
                      isActive
                        ? 'border-teal-200 bg-teal-50 shadow-sm'
                        : 'border-white bg-white hover:-translate-y-[1px] hover:border-teal-200 hover:bg-teal-50/50'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {student.nombre ?? 'Sin nombre'} {student.apellido ?? ''}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">ID estudiante: {student.id}</p>
                    </div>
                    <ChevronRight className={`h-4 w-4 ${isActive ? 'text-teal-700' : 'text-slate-300'}`} />
                  </button>
                )
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">
                No hay estudiantes que coincidan con la búsqueda.
              </div>
            )}
          </div>
        </aside>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          {loadingDetail ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-teal-600" />
              Cargando detalle del estudiante...
            </div>
          ) : selectedSummary ? (
            <div className="space-y-6">
              <div className="rounded-[1.5rem] bg-[linear-gradient(135deg,_rgba(13,148,136,0.10),_rgba(14,165,233,0.08),_rgba(255,255,255,1))] p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Ficha del estudiante</p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                      {selectedSummary.nombre ?? 'Sin nombre'} {selectedSummary.apellido ?? ''}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">ID interno {selectedSummary.id}</p>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <div className="rounded-2xl border border-white bg-white/90 px-4 py-3 shadow-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Identificador</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{selectedSummary.identificador ?? 'No registrado'}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAssignmentModalOpen(true)}
                      className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-[1px] hover:bg-teal-500"
                    >
                      Asignar grupo / profesor
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <StudentMeta label="Fecha de nacimiento" value={formatDate(selectedSummary.fechaNacimiento)} />
                  <StudentMeta label="Teléfono" value={selectedSummary.telefono ?? 'No registrado'} />
                  <StudentMeta label="Correo" value={selectedSummary.correo ?? 'No registrado'} />
                  <StudentMeta label="Persona" value={selectedSummary.personaId ? `#${selectedSummary.personaId}` : 'Sin persona'} />
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <SectionTitle title="Tutores / Padres" subtitle="Relaciones registradas para este estudiante" />
                  <div className="mt-4 space-y-3">
                    {selectedSummary.tutores.length > 0 ? (
                      selectedSummary.tutores.map((tutor) => (
                        <article key={tutor.id} className="rounded-2xl border border-white bg-white p-4 shadow-sm">
                          <div className="flex items-start gap-3">
                            <div className="rounded-2xl bg-teal-50 p-3 text-teal-700">
                              <Users className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-slate-900">
                                {tutor.nombre ?? 'Sin nombre'} {tutor.apellido ?? ''}
                              </p>
                              <div className="mt-2 grid gap-2 text-sm text-slate-600">
                                <p className="inline-flex items-center gap-2"><Mail className="h-4 w-4 text-slate-400" />{tutor.correo ?? 'Sin correo'}</p>
                                <p className="inline-flex items-center gap-2"><Phone className="h-4 w-4 text-slate-400" />{tutor.telefono ?? 'Sin teléfono'}</p>
                              </div>
                            </div>
                          </div>
                        </article>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-5 text-sm text-slate-500">
                        No hay tutores vinculados.
                      </div>
                    )}
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <SectionTitle title="Grupos" subtitle="Grupos donde aparece inscrito y su docente asignado" />
                  <div className="mt-4 space-y-3">
                    {selectedSummary.grupos.length > 0 ? (
                      selectedSummary.grupos.map((grupo) => (
                        <article key={grupo.id} className="rounded-2xl border border-white bg-white p-4 shadow-sm">
                          <div className="flex items-start gap-3">
                            <div className="rounded-2xl bg-sky-50 p-3 text-sky-700">
                              <BookOpen className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-slate-900">{grupo.nombre ?? 'Sin nombre'}</p>
                              <div className="mt-2 grid gap-2 text-sm text-slate-600">
                                <p className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-slate-400" />Inscrito: {formatDate(grupo.fechaInscripcion)}</p>
                                <p>Código función: {grupo.codigoFuncion ?? 'No definido'}</p>
                                <p>
                                  Profesor:{' '}
                                  {grupo.profesorNombre || grupo.profesorApellido
                                    ? `${grupo.profesorNombre ?? ''} ${grupo.profesorApellido ?? ''}`.trim()
                                    : 'Sin profesor asignado'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </article>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-5 text-sm text-slate-500">
                        No hay grupos asociados.
                      </div>
                    )}
                  </div>
                </section>
              </div>

              <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <SectionTitle title="Información visible para docentes" subtitle="Alergias graves y observación médica para la hoja de asistencia" />
                  {canEditStudentNotes ? (
                    <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">Editable por admin</span>
                  ) : (
                    <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Solo lectura</span>
                  )}
                </div>

                <div className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                  <div className="rounded-2xl border border-white bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Alergias y observación médica</p>
                    <p className="mt-1 text-sm text-slate-600">Se mostrará en asistencia y en la ficha del estudiante para que el docente tenga contexto.</p>
                    <div className="mt-3 grid gap-3">
                      <textarea
                        value={studentAlergiasDraft}
                        onChange={(event) => setStudentAlergiasDraft(event.target.value)}
                        disabled={!canEditStudentNotes}
                        rows={2}
                        placeholder="Ej. Alergia grave al maní / penicilina"
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100"
                      />
                      <textarea
                        value={studentObservacionDraft}
                        onChange={(event) => setStudentObservacionDraft(event.target.value)}
                        disabled={!canEditStudentNotes}
                        rows={4}
                        placeholder="Ej. Requiere supervisión al salir, avisar a tutor si presenta malestar..."
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100"
                      />
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="text-xs text-slate-500">Escribe notas breves. El profesor las verá en asistencia, pero solo admin podrá editarlas.</p>
                      {canEditStudentNotes ? (
                        <button
                          type="button"
                          onClick={handleGuardarInformacionDocente}
                          disabled={savingStudentDescription}
                          className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-70"
                        >
                          {savingStudentDescription ? 'Guardando...' : 'Guardar nota'}
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Vincular tutor</p>
                    <p className="mt-1 text-sm text-slate-600">Agrega un tutor adicional al estudiante desde esta misma ficha.</p>

                    <div className="mt-3 grid gap-3">
                      <select
                        value={selectedTutorId ?? ''}
                        onChange={(event) => setSelectedTutorId(Number(event.target.value))}
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900"
                      >
                        {tutoresDisponibles.map((tutor) => (
                          <option key={tutor.id} value={tutor.id}>
                            {tutor.nombre ?? 'Sin nombre'} {tutor.apellido ?? ''}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={handleVincularTutor}
                        disabled={savingTutorLink || tutoresDisponibles.length === 0}
                        className="inline-flex items-center justify-center rounded-xl border border-teal-200 bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-70"
                      >
                        {savingTutorLink ? 'Vinculando...' : 'Vincular tutor'}
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500">
              Selecciona un estudiante para ver su información completa.
            </div>
          )}
        </article>
      </div>

      {selectedSummary && isAssignmentModalOpen ? (
        <StudentAssignmentModal
          estudiante={selectedSummary}
          gruposDisponibles={gruposDisponibles}
          profesoresDisponibles={profesoresDisponibles}
          onClose={() => setIsAssignmentModalOpen(false)}
          onGuardar={handleGuardarAsignacion}
        />
      ) : null}
    </section>
  )
}