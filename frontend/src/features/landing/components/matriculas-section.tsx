import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import toast from 'react-hot-toast'
import { LoaderCircle, Plus, Trash2 } from 'lucide-react'
import { createSolicitudAdmision, getLandingAdmisionConfig, type LandingAdmisionConfig, type TipoDocumento } from '../../admision/admision.api'

const ADMISION_FORM_DRAFT_KEY = 'micasita.admision.formDraft'

type FormState = {
  nombrePostulante: string
  apellidoPostulante: string
  fechaNacimientoPostulante: string
  telefonoPostulante: string
}

type TutorFormState = {
  nombreTutor: string
  parentescoTutor: string
  telefonoTutor: string
  correoTutor: string
}

type MatriculasSectionProps = {
  embedded?: boolean
}

const initialForm: FormState = {
  nombrePostulante: '',
  apellidoPostulante: '',
  fechaNacimientoPostulante: '',
  telefonoPostulante: '',
}

const initialTutor: TutorFormState = {
  nombreTutor: '',
  parentescoTutor: '',
  telefonoTutor: '',
  correoTutor: '',
}

export default function MatriculasSection({ embedded = false }: MatriculasSectionProps) {
  const [config, setConfig] = useState<LandingAdmisionConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<FormState>(initialForm)
  const [tutores, setTutores] = useState<TutorFormState[]>([initialTutor])
  const [filesByTipo, setFilesByTipo] = useState<Record<number, File | null>>({})
  const maxBirthDate = new Date().toISOString().split('T')[0]

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(ADMISION_FORM_DRAFT_KEY)
      if (!raw) {
        return
      }
      const draft = JSON.parse(raw) as { form?: Partial<FormState>; tutores?: TutorFormState[] }
      if (draft.form) {
        setForm((prev) => ({ ...prev, ...draft.form }))
      }
      if (Array.isArray(draft.tutores) && draft.tutores.length > 0) {
        setTutores(draft.tutores)
      }
    } catch {
      sessionStorage.removeItem(ADMISION_FORM_DRAFT_KEY)
    }
  }, [])

  useEffect(() => {
    sessionStorage.setItem(ADMISION_FORM_DRAFT_KEY, JSON.stringify({ form, tutores }))
  }, [form, tutores])

  useEffect(() => {
    let cancelled = false

    const loadConfig = async () => {
      setLoading(true)
      try {
        const next = await getLandingAdmisionConfig()
        if (!cancelled) {
          setConfig(next)
        }
      } catch {
        if (!cancelled) {
          toast.error('No se pudo cargar la configuración de admisión')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadConfig()

    return () => {
      cancelled = true
    }
  }, [])

  const requiredDocs = useMemo(
    () => (config?.tiposDocumento ?? []).filter((tipo) => tipo.obligatorio),
    [config?.tiposDocumento],
  )

  const updateForm = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const updateTutor = (index: number, key: keyof TutorFormState, value: string) => {
    setTutores((prev) => prev.map((item, currentIndex) => (currentIndex === index ? { ...item, [key]: value } : item)))
  }

  const addTutor = () => {
    setTutores((prev) => [...prev, { ...initialTutor }])
  }

  const removeTutor = (index: number) => {
    setTutores((prev) => {
      if (prev.length === 1) {
        return prev
      }
      return prev.filter((_, currentIndex) => currentIndex !== index)
    })
  }

  const onFileChange = (tipo: TipoDocumento, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    event.currentTarget.value = ''
    if (!file || !config) {
      return
    }

    const mime = (file.type || '').toLowerCase()
    if (!config.allowedMimeTypes.map((m) => m.toLowerCase()).includes(mime)) {
      toast.error('Tipo de archivo no permitido. Usa PDF o imagen.')
      return
    }

    if (file.size > config.maxFileBytes) {
      toast.error(`El archivo supera el tamaño máximo (${Math.round(config.maxFileBytes / 1024 / 1024)}MB).`)
      return
    }

    setFilesByTipo((prev) => ({ ...prev, [tipo.id]: file }))
  }

  const submitSolicitud = async (event: FormEvent) => {
    event.preventDefault()
    if (!config) {
      return
    }

    if (!config.formularioActivo) {
      toast.error('El formulario de admisión está desactivado temporalmente.')
      return
    }

    if (!form.nombrePostulante.trim() || !form.apellidoPostulante.trim() || !form.fechaNacimientoPostulante) {
      toast.error('Completa los datos obligatorios del postulante.')
      return
    }

    if (tutores.length === 0) {
      toast.error('Debes agregar al menos un padre, madre o tutor.')
      return
    }

    if (form.telefonoPostulante.trim() && !/^\d{8}$/.test(form.telefonoPostulante.trim())) {
      toast.error('El teléfono del postulante debe tener 8 dígitos.')
      return
    }

    for (let index = 0; index < tutores.length; index += 1) {
      const tutor = tutores[index]
      if (!tutor.nombreTutor.trim() || !tutor.parentescoTutor.trim()) {
        toast.error(`Completa nombre y parentesco del tutor ${index + 1}.`)
        return
      }

      if (tutor.telefonoTutor.trim() && !/^\d{8}$/.test(tutor.telefonoTutor.trim())) {
        toast.error(`El teléfono del tutor ${index + 1} debe tener 8 dígitos.`)
        return
      }

      if (tutor.correoTutor.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tutor.correoTutor.trim())) {
        toast.error(`El correo del tutor ${index + 1} no tiene formato válido.`)
        return
      }
    }

    const missingRequired = requiredDocs.filter((tipo) => !filesByTipo[tipo.id])
    if (missingRequired.length > 0) {
      toast.error(`Faltan documentos obligatorios: ${missingRequired.map((d) => d.nombre).join(', ')}`)
      return
    }

    const [tutorPrincipal, ...tutoresAdicionales] = tutores
    const tutoresAdicionalesResumen = tutoresAdicionales.length > 0
      ? tutoresAdicionales
          .map((tutor, index) => `${index + 2}) ${tutor.nombreTutor.trim()} | ${tutor.parentescoTutor.trim()} | Tel: ${tutor.telefonoTutor.trim() || 'N/D'} | Correo: ${tutor.correoTutor.trim() || 'N/D'}`)
          .join('\n')
      : null

    setSubmitting(true)
    try {
      await createSolicitudAdmision(
        {
          nombrePostulante: form.nombrePostulante.trim(),
          apellidoPostulante: form.apellidoPostulante.trim(),
          fechaNacimientoPostulante: form.fechaNacimientoPostulante,
          telefonoPostulante: form.telefonoPostulante.trim() || null,
          nombreTutor: tutorPrincipal.nombreTutor.trim(),
          parentescoTutor: tutorPrincipal.parentescoTutor.trim(),
          telefonoTutor: tutorPrincipal.telefonoTutor.trim() || null,
          correoTutor: tutorPrincipal.correoTutor.trim() || null,
          tutoresAdicionalesResumen,
        },
        filesByTipo,
      )
      setForm(initialForm)
      setTutores([initialTutor])
      setFilesByTipo({})
      sessionStorage.removeItem(ADMISION_FORM_DRAFT_KEY)
      toast.success('Solicitud enviada correctamente. Dirección revisará tus documentos.')
    } catch {
      toast.error('No fue posible enviar la solicitud de admisión. Tus datos del formulario se mantuvieron para corregir y reenviar.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className={embedded ? 'px-1 py-1' : 'bg-gradient-to-b from-slate-100 to-white px-4 py-16 md:px-6 md:py-24'}>
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <h2 className="mb-3 text-3xl font-bold text-slate-900 md:text-4xl">Solicitud de Matrícula</h2>
          <p className="mx-auto max-w-3xl text-base text-slate-600 md:text-lg">
            Completa un único formulario con datos del postulante, tutor responsable y documentos requeridos.
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-slate-600">
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              Cargando configuración de admisión...
            </div>
          ) : null}

          {!loading && config && !config.formularioActivo ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
              El formulario de solicitud está temporalmente desactivado. Intenta más tarde o comunícate con administración.
            </div>
          ) : null}

          {!loading && config && config.formularioActivo ? (
            <form className="space-y-6" onSubmit={submitSolicitud}>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Datos del postulante</h3>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <input value={form.nombrePostulante} onChange={(e) => updateForm('nombrePostulante', e.target.value)} placeholder="Nombre" required className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none" />
                  <input value={form.apellidoPostulante} onChange={(e) => updateForm('apellidoPostulante', e.target.value)} placeholder="Apellido" required className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none" />
                  <input type="date" value={form.fechaNacimientoPostulante} onChange={(e) => updateForm('fechaNacimientoPostulante', e.target.value)} max={maxBirthDate} required className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none" />
                  <input value={form.telefonoPostulante} onChange={(e) => updateForm('telefonoPostulante', e.target.value)} placeholder="Teléfono (8 dígitos)" inputMode="numeric" pattern="[0-9]{8}" className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-slate-900">Datos del padre, madre o tutor</h3>
                  <button
                    type="button"
                    onClick={addTutor}
                    className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Agregar tutor
                  </button>
                </div>

                <div className="mt-3 space-y-3">
                  {tutores.map((tutor, index) => (
                    <div key={`tutor-${index}`} className="rounded-xl border border-slate-200 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">Tutor {index + 1}</p>
                        {tutores.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => removeTutor(index)}
                            className="inline-flex items-center rounded-lg border border-rose-300 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                          >
                            <Trash2 className="mr-1 h-3 w-3" />
                            Quitar
                          </button>
                        ) : null}
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <input value={tutor.nombreTutor} onChange={(e) => updateTutor(index, 'nombreTutor', e.target.value)} placeholder="Nombre del tutor" required className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none" />
                        <input value={tutor.parentescoTutor} onChange={(e) => updateTutor(index, 'parentescoTutor', e.target.value)} placeholder="Parentesco" required className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none" />
                        <input value={tutor.telefonoTutor} onChange={(e) => updateTutor(index, 'telefonoTutor', e.target.value)} placeholder="Teléfono tutor (8 dígitos)" inputMode="numeric" pattern="[0-9]{8}" className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none" />
                        <input type="email" value={tutor.correoTutor} onChange={(e) => updateTutor(index, 'correoTutor', e.target.value)} placeholder="Correo tutor" className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900">Documentos</h3>
                <p className="mt-1 text-sm text-slate-600">Se permiten PDF e imágenes (JPG, PNG, WEBP).</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {config.tiposDocumento.map((tipo) => (
                    <label key={tipo.id} className="rounded-xl border border-slate-300 px-3 py-3 text-sm text-slate-700">
                      <span className="mb-2 block font-semibold text-slate-900">
                        {tipo.nombre} {tipo.obligatorio ? '(Obligatorio)' : '(Opcional)'}
                      </span>
                      <input type="file" accept="application/pdf,image/png,image/jpeg,image/webp" onChange={(event) => onFileChange(tipo, event)} className="w-full text-xs" />
                      {filesByTipo[tipo.id] ? <span className="mt-2 block text-xs text-emerald-700">Adjuntado: {filesByTipo[tipo.id]?.name}</span> : null}
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-70"
              >
                {submitting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
                Enviar solicitud
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </section>
  )
}
