import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, X } from 'lucide-react'
import MatriculasSection from './matriculas-section'

const ADMISION_FORM_DRAFT_KEY = 'micasita.admision.formDraft'

export default function MatriculasCallToAction() {
  const [modalOpen, setModalOpen] = useState(false)
  const [hasDraft, setHasDraft] = useState(false)

  useEffect(() => {
    const refreshDraftState = () => {
      try {
        const raw = sessionStorage.getItem(ADMISION_FORM_DRAFT_KEY)
        setHasDraft(Boolean(raw))
      } catch {
        setHasDraft(false)
      }
    }

    refreshDraftState()

    const handleStorage = (event: StorageEvent) => {
      if (event.key === ADMISION_FORM_DRAFT_KEY) {
        refreshDraftState()
      }
    }

    window.addEventListener('storage', handleStorage)
    window.addEventListener('focus', refreshDraftState)

    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('focus', refreshDraftState)
    }
  }, [])

  return (
    <>
      <section className="bg-gradient-to-b from-slate-50 to-white px-4 py-16 md:px-6 md:py-24 relative overflow-hidden">
        {/* Playful background decorative shapes */}
        <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-cyan-500/10 blur-2xl" />
        <div className="absolute -right-10 top-0 h-48 w-48 rounded-full bg-amber-500/10 blur-2xl" />

        <div className="mx-auto max-w-6xl rounded-[2.5rem] border border-teal-500/20 bg-gradient-to-br from-teal-700 via-teal-600 to-cyan-600 p-8 shadow-xl shadow-teal-700/10 md:p-12 relative overflow-hidden">
          {/* Subtle overlay shapes inside the CTA */}
          <div className="absolute right-0 bottom-0 h-64 w-64 rounded-full bg-white/5 -mr-16 -mb-16 pointer-events-none" />
          <div className="absolute left-10 top-0 h-32 w-32 rounded-full bg-white/5 -ml-16 -mt-16 pointer-events-none" />

          <div className="relative z-10 flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <div className="space-y-3">
              <span className="inline-block rounded-full bg-white/10 border border-white/20 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-teal-100">
                Admisiones Abiertas
              </span>
              <h2 className="text-3xl font-extrabold text-white md:text-4xl tracking-tight">
                Inicia tu Solicitud de Matrícula 🎒
              </h2>
              <p className="max-w-2xl text-sm md:text-base text-teal-100/90 leading-relaxed">
                Únete a la familia de Mi casita. Completa tu solicitud en nuestra vista dedicada o continúa con un borrador guardado en solo unos minutos.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 w-full sm:w-auto shrink-0">
              <Link
                to="/admisiones/solicitud"
                className="inline-flex w-full sm:w-auto justify-center items-center rounded-2xl bg-amber-400 px-6 py-3.5 text-sm font-black text-slate-900 hover:bg-amber-300 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
              >
                Comenzar Solicitud
                <ArrowRight className="ml-2 h-4 w-4 stroke-[3px]" />
              </Link>
              
              {hasDraft ? (
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="inline-flex w-full sm:w-auto justify-center items-center rounded-2xl border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-bold text-white hover:bg-white/20 transition-all duration-200 hover:-translate-y-0.5"
                >
                  Continuar Borrador
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Formulario de Matrícula</p>
                <p className="text-xs text-slate-500">Completa y envía sin salir de la landing</p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[calc(92vh-68px)] overflow-auto px-3 py-3">
              <MatriculasSection embedded />
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
