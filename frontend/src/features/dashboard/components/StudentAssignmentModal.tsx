import { useEffect, useMemo, useState } from 'react'
import { Check, ChevronsRight, GraduationCap, School, UserCircle2, X } from 'lucide-react'
import type { EstudianteDetailItem, GrupoItem, ProfesorItem } from './academico.api'

export type StudentAssignmentModalProps = {
  estudiante: EstudianteDetailItem
  gruposDisponibles: GrupoItem[]
  profesoresDisponibles: ProfesorItem[]
  onClose: () => void
  onGuardar: (estudianteId: number, grupoId: number, profesorId: number) => void | Promise<void>
}

function getInitials(nombre?: string | null, apellido?: string | null) {
  const first = nombre?.trim()?.[0] ?? 'E'
  const second = apellido?.trim()?.[0] ?? ''
  return `${first}${second}`.toUpperCase()
}

function getGroupLabel(grupo: { id: number; nombre?: string | null }) {
  return grupo.nombre?.trim() || `Grupo ${grupo.id}`
}

function getProfessorLabel(profesor: ProfesorItem) {
  const fullName = `${profesor.nombre ?? ''} ${profesor.apellido ?? ''}`.trim()
  return fullName || `Profesor ${profesor.id}`
}

export function StudentAssignmentModal({
  estudiante,
  gruposDisponibles,
  profesoresDisponibles,
  onClose,
  onGuardar,
}: StudentAssignmentModalProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [selectedGrupoId, setSelectedGrupoId] = useState<number | null>(null)
  const [selectedProfesorId, setSelectedProfesorId] = useState<number | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const currentGroup = useMemo(() => estudiante.grupos[0] ?? null, [estudiante.grupos])

  useEffect(() => {
    const nextGrupoId = currentGroup?.id ?? gruposDisponibles[0]?.id ?? null
    const nextProfesorId = currentGroup?.profesorId ?? profesoresDisponibles[0]?.id ?? null
    setSelectedGrupoId(nextGrupoId)
    setSelectedProfesorId(nextProfesorId)

    const frame = window.requestAnimationFrame(() => setIsVisible(true))
    return () => window.cancelAnimationFrame(frame)
  }, [currentGroup, gruposDisponibles, profesoresDisponibles])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = originalOverflow
    }
  }, [onClose])

  const canSave = Boolean(selectedGrupoId && selectedProfesorId)

  const handleSave = async () => {
    if (!selectedGrupoId || !selectedProfesorId) {
      return
    }

    setIsSaving(true)
    try {
      await onGuardar(estudiante.id, selectedGrupoId, selectedProfesorId)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="student-assignment-title"
        className={`relative z-10 w-full max-w-4xl overflow-hidden rounded-[2rem] border border-slate-700/60 bg-slate-950 text-slate-100 shadow-[0_30px_120px_rgba(15,23,42,0.6)] transition-all duration-300 ${isVisible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-4 scale-95 opacity-0'}`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),_transparent_42%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(15,23,42,0.92))]" />

        <div className="relative p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl border border-sky-400/20 bg-sky-500/15 text-lg font-bold text-sky-100 shadow-[0_0_0_1px_rgba(56,189,248,0.12)]">
                {getInitials(estudiante.nombre, estudiante.apellido)}
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">Asignación contextual</p>
                <h2 id="student-assignment-title" className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  {estudiante.nombre ?? 'Sin nombre'} {estudiante.apellido ?? ''}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-300">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">ID estudiante #{estudiante.id}</span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                    {currentGroup ? `Grupo actual: ${getGroupLabel(currentGroup)}` : 'Sin grupo actual'}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
              aria-label="Cerrar modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
            <section className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <School className="h-5 w-5 text-sky-300" />
                <div>
                  <p className="text-sm font-semibold text-white">Selecciona el grupo</p>
                  <p className="text-xs text-slate-400">Escoge una opción para mover o registrar al estudiante.</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {gruposDisponibles.map((grupo) => {
                  const isSelected = selectedGrupoId === grupo.id
                  return (
                    <button
                      key={grupo.id}
                      type="button"
                      onClick={() => setSelectedGrupoId(grupo.id)}
                      className={`group rounded-2xl border p-3 text-left transition-all duration-200 ${isSelected ? 'border-sky-400 bg-sky-500/15 shadow-[0_0_0_1px_rgba(56,189,248,0.25)]' : 'border-white/10 bg-white/5 hover:border-sky-400/40 hover:bg-white/10'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">{getGroupLabel(grupo)}</p>
                          <p className="mt-1 text-xs text-slate-400">Código función {grupo.codigoFuncion ?? 'N/D'}</p>
                        </div>
                        <span className={`mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full border ${isSelected ? 'border-sky-300 bg-sky-400 text-slate-950' : 'border-white/10 bg-white/5 text-transparent'}`}>
                          <Check className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </section>

            <section className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <GraduationCap className="h-5 w-5 text-cyan-300" />
                <div>
                  <p className="text-sm font-semibold text-white">Selecciona el profesor</p>
                  <p className="text-xs text-slate-400">Selección única con un clic para la asignación final.</p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {profesoresDisponibles.map((profesor) => {
                  const isSelected = selectedProfesorId === profesor.id
                  const fullName = getProfessorLabel(profesor)
                  return (
                    <button
                      key={profesor.id}
                      type="button"
                      onClick={() => setSelectedProfesorId(profesor.id)}
                      className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all duration-200 ${isSelected ? 'border-cyan-400 bg-cyan-500/15 shadow-[0_0_0_1px_rgba(34,211,238,0.25)]' : 'border-white/10 bg-white/5 hover:border-cyan-400/40 hover:bg-white/10'}`}
                    >
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${isSelected ? 'border-cyan-200 bg-cyan-400 text-slate-950' : 'border-white/10 bg-slate-800 text-cyan-100'}`}>
                        {getInitials(profesor.nombre, profesor.apellido)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">{fullName}</p>
                        <p className="mt-1 text-xs text-slate-400">Nivel académico / especialidad no registrado</p>
                      </div>

                      {isSelected ? <Check className="h-4 w-4 shrink-0 text-cyan-300" /> : <UserCircle2 className="h-4 w-4 shrink-0 text-slate-500" />}
                    </button>
                  )
                })}
              </div>
            </section>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={!canSave || isSaving}
              className="inline-flex items-center justify-center rounded-2xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? 'Guardando...' : 'Guardar Asignación'}
              <ChevronsRight className="ml-2 h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
