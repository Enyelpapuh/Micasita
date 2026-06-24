import { useState, useEffect } from 'react'
import { Clock, Users, ChevronLeft, ChevronRight, LoaderCircle, X } from 'lucide-react'
import { createPortal } from 'react-dom'
import heroImage from '../../../assets/hero.png'
import axios from 'axios'
import { getTalleres, inscribirEnTaller, resolveTallerImageUrl } from '../../talleres/talleres-view.api'
import type { Taller } from '../../talleres/talleres-view.types'
import { useForm } from 'react-hook-form'


function formatDate(value: string) {
  if (!value) {
    return 'Sin fecha'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString('es-DO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatCordobas(value: number) {
  return new Intl.NumberFormat('es-NI', { style: 'currency', currency: 'NIO' }).format(Number.isFinite(value) ? value : 0)
}

type InscripcionFormValues = {
  nombre: string
  apellido: string
  fechaNacimiento: string
  telefono: string
  correo: string
}

function calculateAgeFromBirthDate(value: string): number | null {
  if (!value) {
    return null
  }

  const [yearText, monthText, dayText] = value.split('-')
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null
  }

  const birthDate = new Date(year, month - 1, day)
  if (
    birthDate.getFullYear() !== year ||
    birthDate.getMonth() !== month - 1 ||
    birthDate.getDate() !== day
  ) {
    return null
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (birthDate > today) {
    return null
  }

  let age = today.getFullYear() - year
  const hasHadBirthdayThisYear =
    today.getMonth() > month - 1 || (today.getMonth() === month - 1 && today.getDate() >= day)

  if (!hasHadBirthdayThisYear) {
    age -= 1
  }

  return age
}

export default function TalleresSection() {
  const [current, setCurrent] = useState(0)
  const [autoPlay, setAutoPlay] = useState(true)
  const [talleres, setTalleres] = useState<Taller[]>([])
  const [loading, setLoading] = useState(true)
  const [tallerSeleccionado, setTallerSeleccionado] = useState<Taller | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InscripcionFormValues>()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const response = await getTalleres(null)
        if (!cancelled) {
          setTalleres(response.filter((item) => item.activo))
        }
      } catch {
        if (!cancelled) {
          setTalleres([])
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
  }, [])

  useEffect(() => {
    if (!autoPlay || talleres.length <= 1) return

    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % talleres.length)
    }, 6000)

    return () => clearInterval(timer)
  }, [autoPlay, talleres.length])

  useEffect(() => {
    if (current >= talleres.length && talleres.length > 0) {
      setCurrent(0)
    }
  }, [current, talleres.length])

  const next = () => {
    if (talleres.length === 0) return
    setCurrent((prev) => (prev + 1) % talleres.length)
    setAutoPlay(false)
  }

  const prev = () => {
    if (talleres.length === 0) return
    setCurrent((prev) => (prev - 1 + talleres.length) % talleres.length)
    setAutoPlay(false)
  }

  const getVisibleTalleres = () => {
    const visible: Taller[] = []
    const count = isMobile ? 1 : Math.min(3, talleres.length)

    for (let i = 0; i < count; i += 1) {
      visible.push(talleres[(current + i) % talleres.length])
    }

    return visible
  }

  const abrirFormulario = (taller: Taller) => {
    setTallerSeleccionado(taller)
    reset({ nombre: '', apellido: '', fechaNacimiento: '', telefono: '', correo: '' })
    setSubmitError(null)
    setSubmitSuccess(null)
  }

  const cerrarFormulario = () => {
    setTallerSeleccionado(null)
    reset()
    setSubmitError(null)
    setSubmitSuccess(null)
    setIsSubmitting(false)
  }

  const enviarInscripcion = async (data: InscripcionFormValues) => {
    if (!tallerSeleccionado) {
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const result = await inscribirEnTaller(tallerSeleccionado.id, {
        nombre: data.nombre.trim(),
        apellido: data.apellido.trim(),
        fechaNacimiento: data.fechaNacimiento,
        telefono: data.telefono.trim(),
        correo: data.correo.trim() || undefined,
      })

      setSubmitSuccess(result.mensaje)
      setSubmitError(null)
      reset()

      const refreshed = await getTalleres(null)
      const activos = refreshed.filter((item) => item.activo)
      setTalleres(activos)
      setTallerSeleccionado(activos.find((item) => item.id === tallerSeleccionado.id) ?? null)
    } catch (error) {
      let message = 'No se pudo completar la inscripcion.'

      if (axios.isAxiosError(error)) {
        message = error.response?.data?.message || message
      }

      setSubmitError(message)
      setSubmitSuccess(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="talleres" className="bg-gradient-to-b from-white via-teal-50/20 to-slate-50/50 py-16 md:py-24 relative">
      {/* Background decoration */}
      <div className="absolute left-0 bottom-0 top-0 w-full overflow-hidden pointer-events-none opacity-40">
        <div className="absolute right-10 top-20 h-72 w-72 rounded-full bg-cyan-100/40 blur-3xl" />
        <div className="absolute left-5 bottom-10 h-80 w-80 rounded-full bg-amber-100/30 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        {/* Section Header */}
        <div className="mb-16 text-center md:text-left max-w-3xl">
          <span className="text-xs uppercase tracking-[0.2em] font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-full">Actividades Creativas</span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Nuestros Talleres Especiales</h2>
          <div className="mt-4 h-1.5 w-16 bg-teal-600 rounded-full" />
          <p className="mt-4 text-base md:text-lg text-slate-600">
            Talleres dinámicos cargados directamente de nuestro catálogo activo para estimular la curiosidad y desarrollo de los pequeños.
          </p>
        </div>

        {loading ? (
          <div className="mb-12 flex items-center justify-center rounded-[2rem] border border-slate-200 bg-white px-6 py-20 text-slate-600 shadow-sm">
            <LoaderCircle className="mr-3 h-6 w-6 animate-spin text-teal-600" />
            Cargando talleres activos...
          </div>
        ) : null}

        {!loading && talleres.length === 0 ? (
          <div className="mb-12 rounded-[2rem] border-2 border-dashed border-slate-200 bg-white px-6 py-20 text-center text-slate-500">
            🌳 Aún no hay talleres registrados en esta temporada. ¡Vuelve pronto!
          </div>
        ) : null}

        {!loading && talleres.length > 0 ? (
        <div 
          className="relative mb-12 px-2"
          onMouseEnter={() => setAutoPlay(false)}
          onMouseLeave={() => setAutoPlay(true)}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {getVisibleTalleres().map((taller) => (
              <div
                key={taller.id}
                className="group flex h-full flex-col overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-2"
              >
                {/* Polaroid Frame Image Container */}
                <div className="h-48 relative overflow-hidden bg-slate-50">
                  <img
                    src={resolveTallerImageUrl(taller.rutaImagen) || heroImage}
                    alt={taller.nombre}
                    onError={(event) => {
                      event.currentTarget.src = heroImage
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-95"
                  />
                  {/* Floating Age Tag */}
                  <div className="absolute top-4 left-4 z-10 rounded-2xl bg-amber-400 border border-amber-500/20 px-3 py-1.5 text-xs font-black text-slate-800 shadow-sm flex items-center gap-1.5">
                    <span>👶</span>
                    <span>Edad: {taller.edadMinima} - {taller.edadMaxima} años</span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="flex flex-grow flex-col p-6 md:p-8">
                  <div className="mb-5 flex-grow">
                    <h3 className="mb-2.5 line-clamp-2 min-h-[3rem] text-xl font-extrabold text-slate-900 group-hover:text-teal-700 transition-colors">
                      {taller.nombre}
                    </h3>
                    <p className="line-clamp-3 text-sm leading-relaxed text-slate-600">
                      {taller.descripcion || 'Sin descripción detallada disponible en este momento.'}
                    </p>
                  </div>

                  {/* Info Badges Stack */}
                  <div className="mb-5 space-y-2 border-t border-slate-100 pt-4">
                    <div className="flex items-center gap-2.5 text-xs text-slate-600 rounded-xl bg-teal-50/50 border border-teal-100/60 px-3 py-2">
                      <Clock className="h-4 w-4 shrink-0 text-teal-600" />
                      <span className="truncate">
                        {formatDate(taller.fechaInicial)} - {formatDate(taller.fechaFinal)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between gap-2.5 text-xs text-slate-600 rounded-xl bg-rose-50/50 border border-rose-100/60 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 shrink-0 text-rose-500" />
                        <span>{taller.cupos.length}/{taller.cuposMaximos} cupos ocupados</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        taller.cupos.length >= taller.cuposMaximos
                          ? 'bg-rose-200 text-rose-800'
                          : 'bg-teal-200 text-teal-800'
                      }`}>
                        {taller.cupos.length >= taller.cuposMaximos ? 'Lleno' : 'Libre'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 text-xs text-indigo-700 font-bold uppercase tracking-wider rounded-xl bg-indigo-50/50 border border-indigo-100/60 px-3 py-2">
                      <span className="inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-indigo-500"></span>
                      <span>Público: {taller.tipoPublico || 'GENERAL'}</span>
                    </div>
                  </div>

                  {/* Cost Container */}
                  <div className="mb-5 rounded-2xl border border-teal-100/70 bg-gradient-to-r from-teal-50/70 to-cyan-50/30 p-3.5 flex items-center justify-between shadow-inner">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Costo:</span>
                    <span className="text-xl font-black text-teal-700">{formatCordobas(Number(taller.costo || 0))}</span>
                  </div>

                  {/* CTA Button */}
                  <button
                    type="button"
                    onClick={() => abrirFormulario(taller)}
                    disabled={taller.cupos.length >= taller.cuposMaximos}
                    className={`w-full py-3.5 px-4 rounded-2xl font-bold uppercase tracking-wider text-xs transition-all duration-200 text-white shadow-md hover:shadow-lg ${
                      taller.cupos.length >= taller.cuposMaximos
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                        : 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 shadow-teal-600/10 hover:-translate-y-0.5'
                    }`}
                  >
                    {taller.cupos.length >= taller.cuposMaximos ? 'Completo' : 'Inscribirse al taller'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Slider Arrows */}
          <button
            onClick={prev}
            className="absolute -left-6 md:-left-12 top-1/2 -translate-y-1/2 z-10 bg-teal-600 hover:bg-teal-500 text-white p-3 rounded-full shadow-lg transition-all duration-200 group hidden md:flex items-center justify-center hover:-translate-x-1"
            aria-label="Taller anterior"
          >
            <ChevronLeft className="w-6 h-6 md:w-7 md:h-7" />
          </button>

          <button
            onClick={next}
            className="absolute -right-6 md:-right-12 top-1/2 -translate-y-1/2 z-10 bg-teal-600 hover:bg-teal-500 text-white p-3 rounded-full shadow-lg transition-all duration-200 group hidden md:flex items-center justify-center hover:translate-x-1"
            aria-label="Siguiente taller"
          >
            <ChevronRight className="w-6 h-6 md:w-7 md:h-7" />
          </button>

          {/* Mobile navigation controls below the slider */}
          <div className="flex items-center justify-center gap-4 mt-6 md:hidden">
            <button
              onClick={prev}
              className="bg-teal-600 active:bg-teal-700 text-white p-2 rounded-full shadow-md"
              aria-label="Taller anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-xs text-slate-500 font-bold">
              {current + 1} / {talleres.length}
            </span>
            <button
              onClick={next}
              className="bg-teal-600 active:bg-teal-700 text-white p-2 rounded-full shadow-md"
              aria-label="Siguiente taller"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Slider Navigation Dots */}
          <div className="flex justify-center gap-2 mt-10">
            {talleres.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrent(index)
                  setAutoPlay(false)
                }}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  index === current
                    ? 'bg-teal-600 w-8'
                    : 'bg-slate-300 w-2.5 hover:bg-slate-400'
                }`}
                aria-label={`Ir al taller grupo ${index + 1}`}
              />
            ))}
          </div>
        </div>
        ) : null}

        {tallerSeleccionado ? createPortal(
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity" onClick={cerrarFormulario} />
            <div className="relative flex max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl md:flex-row">
              <button
                type="button"
                onClick={cerrarFormulario}
                className="absolute right-4 top-4 z-10 rounded-full bg-white/80 p-2 text-slate-600 backdrop-blur hover:bg-white md:right-6 md:top-6"
                aria-label="Cerrar formulario"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-6 md:w-2/5 md:p-8 lg:p-10 flex flex-col justify-between overflow-y-auto">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Inscripción</p>
                  <h3 className="mt-2 text-2xl font-bold text-slate-900">{tallerSeleccionado.nombre}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    {tallerSeleccionado.descripcion || 'Sin descripción detallada.'}
                  </p>

                  <div className="mt-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-teal-600 shadow-sm">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Duración</p>
                        <p className="text-sm font-semibold text-slate-900">
                          {formatDate(tallerSeleccionado.fechaInicial)} - {formatDate(tallerSeleccionado.fechaFinal)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-teal-600 shadow-sm">
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Edades</p>
                        <p className="text-sm font-semibold text-slate-900">
                          {tallerSeleccionado.edadMinima} a {tallerSeleccionado.edadMaxima} años
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 rounded-xl bg-white p-4 shadow-sm">
                  <p className="text-xs text-slate-500">Costo del taller</p>
                  <p className="mt-1 text-2xl font-bold text-teal-700">{formatCordobas(Number(tallerSeleccionado.costo || 0))}</p>
                </div>
              </div>

              <div className="p-6 md:w-3/5 md:p-8 lg:p-10 overflow-y-auto">
                <h4 className="text-lg font-semibold text-slate-900">Completa tus datos</h4>
                <p className="mt-1 text-sm text-slate-600">Llena este formulario para reservar tu cupo.</p>

                <form className="mt-6" onSubmit={handleSubmit(enviarInscripcion)} noValidate>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-1 block text-sm font-medium text-slate-700">Nombre</span>
                      <input
                        {...register('nombre', { required: 'El nombre es obligatorio.' })}
                        placeholder="Ej. Juan"
                        className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition focus:ring-2 ${errors.nombre ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-300 focus:border-teal-500 focus:ring-teal-100'}`}
                      />
                      {errors.nombre && <span className="mt-1 block text-xs text-rose-600">{errors.nombre.message}</span>}
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-sm font-medium text-slate-700">Apellido</span>
                      <input
                        {...register('apellido', { required: 'El apellido es obligatorio.' })}
                        placeholder="Ej. Pérez"
                        className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition focus:ring-2 ${errors.apellido ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-300 focus:border-teal-500 focus:ring-teal-100'}`}
                      />
                      {errors.apellido && <span className="mt-1 block text-xs text-rose-600">{errors.apellido.message}</span>}
                    </label>
                    <label className="block md:col-span-2">
                      <span className="mb-1 block text-sm font-medium text-slate-700">Fecha de nacimiento</span>
                      <input
                        type="date"
                        {...register('fechaNacimiento', {
                          required: 'La fecha de nacimiento es obligatoria.',
                          validate: (value) => {
                            const edadCalculada = calculateAgeFromBirthDate(value)
                            if (edadCalculada === null) return 'La fecha debe ser válida y anterior a hoy.'
                            if (tallerSeleccionado && edadCalculada < tallerSeleccionado.edadMinima) return `La edad mínima permitida es ${tallerSeleccionado.edadMinima} años.`
                            if (tallerSeleccionado && edadCalculada > tallerSeleccionado.edadMaxima) return `La edad máxima permitida es ${tallerSeleccionado.edadMaxima} años.`
                            return true
                          }
                        })}
                        max={new Date().toISOString().split('T')[0]}
                        className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition focus:ring-2 ${errors.fechaNacimiento ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-300 focus:border-teal-500 focus:ring-teal-100'}`}
                      />
                      {errors.fechaNacimiento && <span className="mt-1 block text-xs text-rose-600">{errors.fechaNacimiento.message}</span>}
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-sm font-medium text-slate-700">Teléfono</span>
                      <input
                        {...register('telefono', {
                          required: 'El teléfono es obligatorio.',
                          pattern: { value: /^\d{8}$/, message: 'Debe tener exactamente 8 dígitos.' }
                        })}
                        placeholder="Ej. 88888888"
                        className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition focus:ring-2 ${errors.telefono ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-300 focus:border-teal-500 focus:ring-teal-100'}`}
                      />
                      {errors.telefono && <span className="mt-1 block text-xs text-rose-600">{errors.telefono.message}</span>}
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-sm font-medium text-slate-700">Correo (Opcional)</span>
                      <input
                        type="email"
                        {...register('correo', {
                          pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'El correo no tiene un formato válido.' }
                        })}
                        placeholder="correo@ejemplo.com"
                        className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition focus:ring-2 ${errors.correo ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-300 focus:border-teal-500 focus:ring-teal-100'}`}
                      />
                      {errors.correo && <span className="mt-1 block text-xs text-rose-600">{errors.correo.message}</span>}
                    </label>
                  </div>

                  {submitError ? (
                    <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {submitError}
                    </div>
                  ) : null}

                  {submitSuccess ? (
                    <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                      {submitSuccess}
                    </div>
                  ) : null}

                  <div className="mt-8 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={cerrarFormulario}
                      className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center rounded-xl bg-teal-700 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-teal-800 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSubmitting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Enviar inscripción
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        , document.body) : null}
      </div>
    </section>
  )
}
