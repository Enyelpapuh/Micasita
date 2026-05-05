import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Layers, X } from 'lucide-react'
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
      <section className="bg-gradient-to-b from-slate-100 to-white px-4 py-16 md:px-6 md:py-24">
        <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-center">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">Solicitud de Matrícula</h2>
              <p className="mt-2 max-w-3xl text-base text-slate-600 md:text-lg">
                Puedes completar tu solicitud en una vista dedicada o abrir un formulario flotante sin salir de la landing.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">

              <Link
                to="/admisiones/solicitud"
                className="inline-flex items-center rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
              >
                Ir al formulario
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
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
