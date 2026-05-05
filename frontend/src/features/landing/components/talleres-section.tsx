import { useState, useEffect } from 'react'
import { Clock, Users, ChevronLeft, ChevronRight, DollarSign, LoaderCircle, X } from 'lucide-react'
import heroImage from '../../../assets/hero.png'
import axios from 'axios'
import { getTalleres, inscribirEnTaller, resolveTallerImageUrl } from '../../talleres/talleres-view.api'
import type { Taller } from '../../talleres/talleres-view.types'

const colores = [
  'from-amber-400 to-orange-400',
  'from-rose-400 to-pink-400',
  'from-cyan-400 to-blue-400',
  'from-teal-400 to-emerald-500',
]

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
  identificador: string
}

const emptyInscripcionForm: InscripcionFormValues = {
  nombre: '',
  apellido: '',
  fechaNacimiento: '',
  telefono: '',
  correo: '',
  identificador: '',
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
  const [form, setForm] = useState<InscripcionFormValues>(emptyInscripcionForm)
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
    const size = Math.min(3, talleres.length)

    for (let i = 0; i < size; i += 1) {
      visible.push(talleres[(current + i) % talleres.length])
    }

    return visible
  }

  const abrirFormulario = (taller: Taller) => {
    setTallerSeleccionado(taller)
    setForm(emptyInscripcionForm)
    setSubmitError(null)
    setSubmitSuccess(null)
  }

  const cerrarFormulario = () => {
    setTallerSeleccionado(null)
    setForm(emptyInscripcionForm)
    setSubmitError(null)
    setSubmitSuccess(null)
    setIsSubmitting(false)
  }

  const validarFormulario = () => {
    if (!form.nombre.trim() || !form.apellido.trim()) {
      return 'Nombre y apellido son requeridos.'
    }

    const edadCalculada = calculateAgeFromBirthDate(form.fechaNacimiento)
    if (edadCalculada === null) {
      return 'La fecha de nacimiento debe ser valida.'
    }

    if (tallerSeleccionado && edadCalculada < tallerSeleccionado.edadMinima) {
      return `La edad minima permitida es ${tallerSeleccionado.edadMinima} anos.`
    }

    if (tallerSeleccionado && edadCalculada > tallerSeleccionado.edadMaxima) {
      return `La edad maxima permitida es ${tallerSeleccionado.edadMaxima} anos.`
    }

    if (form.identificador.trim() && !/^(\d{3}-\d{6}-\d{4}[A-Za-z]|\d{13}[A-Za-z])$/.test(form.identificador.trim())) {
      return 'La cedula es invalida. Usa formato nicaraguense ###-######-####L o sin guiones.'
    }

    return null
  }

  const enviarInscripcion = async () => {
    if (!tallerSeleccionado) {
      return
    }

    const validationError = validarFormulario()
    if (validationError) {
      setSubmitError(validationError)
      setSubmitSuccess(null)
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const result = await inscribirEnTaller(tallerSeleccionado.id, {
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        fechaNacimiento: form.fechaNacimiento,
        telefono: form.telefono.trim() || undefined,
        correo: form.correo.trim() || undefined,
        identificador: form.identificador.trim() || undefined,
      })

      setSubmitSuccess(result.mensaje)
      setSubmitError(null)
      setForm(emptyInscripcionForm)

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
    <section className="bg-gradient-to-b from-white via-teal-50/30 to-slate-50 py-16 md:py-20">
      <div className="container mx-auto px-4 md:px-8">
        <div className="mb-12">
          <h2 className="mb-2 text-4xl font-bold text-slate-900 md:text-5xl">Nuestros talleres</h2>
          <div className="h-1 w-20 rounded-full bg-teal-600"></div>
          <p className="mt-4 text-lg text-slate-600">
            Estos talleres son cargados directamente desde la base de datos
          </p>
        </div>

        {loading ? (
          <div className="mb-12 flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-16 text-slate-600">
            <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
            Cargando talleres...
          </div>
        ) : null}

        {!loading && talleres.length === 0 ? (
          <div className="mb-12 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-slate-600">
            Aun no hay talleres registrados.
          </div>
        ) : null}

        {!loading && talleres.length > 0 ? (
        <div 
          className="relative mb-12"
          onMouseEnter={() => setAutoPlay(false)}
          onMouseLeave={() => setAutoPlay(true)}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {getVisibleTalleres().map((taller) => (
              <div
                key={taller.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg transition-all duration-300 hover:shadow-2xl"
              >
                <div className={`h-40 bg-gradient-to-br ${colores[taller.id % colores.length]} relative overflow-hidden`}>
                  <img
                    src={resolveTallerImageUrl(taller.rutaImagen) || heroImage}
                    alt={taller.nombre}
                    onError={(event) => {
                      event.currentTarget.src = heroImage
                    }}
                    className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-300"
                  />
                </div>

                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="mb-2 text-xl font-bold text-slate-900">{taller.nombre}</h3>
                  <p className="mb-4 flex-grow text-sm leading-relaxed text-slate-600">
                    {taller.descripcion || 'Sin descripcion'}
                  </p>

                  <div className="mb-4 space-y-2 border-b border-slate-200 pb-4">
                    <div className="flex items-center gap-2 text-xs">
                      <Clock className="h-4 w-4 flex-shrink-0 text-teal-600" />
                      <span className="text-slate-600">
                        {formatDate(taller.fechaInicial)} - {formatDate(taller.fechaFinal)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Users className="h-4 w-4 flex-shrink-0 text-teal-600" />
                      <span className="text-slate-600">{taller.cupos.length}/{taller.cuposMaximos} cupos ocupados</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-teal-100 text-[10px] font-bold text-teal-700">
                        E
                      </span>
                      <span className="text-slate-600">Edad: {taller.edadMinima} - {taller.edadMaxima} anos</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="inline-flex rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-700">
                        {taller.tipoPublico || 'GENERAL'}
                      </span>
                    </div>
                  </div>

                  <div className="mb-4 rounded-lg border border-teal-200 bg-gradient-to-r from-teal-50 to-cyan-50 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-600">Costo del taller:</span>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-teal-700" />
                        <span className="text-lg font-bold text-teal-700">{formatCordobas(Number(taller.costo || 0))}</span>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-slate-600">ID taller: {taller.id}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => abrirFormulario(taller)}
                    disabled={taller.cupos.length >= taller.cuposMaximos}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 text-white bg-gradient-to-r ${colores[taller.id % colores.length]} hover:shadow-lg transform hover:scale-105`}
                  >
                    {taller.cupos.length >= taller.cuposMaximos ? 'Completo' : 'Inscribirse'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={prev}
            className="absolute -left-5 md:-left-6 top-1/2 -translate-y-1/2 z-10 bg-primary/80 hover:bg-primary text-white p-2 md:p-3 rounded-full transition-all duration-200 group hidden md:flex items-center justify-center"
          >
            <ChevronLeft className="w-6 h-6 md:w-7 md:h-7 group-hover:-translate-x-1 transition" />
          </button>

          <button
            onClick={next}
            className="absolute -right-5 md:-right-6 top-1/2 -translate-y-1/2 z-10 bg-primary/80 hover:bg-primary text-white p-2 md:p-3 rounded-full transition-all duration-200 group hidden md:flex items-center justify-center"
          >
            <ChevronRight className="w-6 h-6 md:w-7 md:h-7 group-hover:translate-x-1 transition" />
          </button>

          <div className="flex justify-center gap-2 mt-8">
            {talleres.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrent(index)
                  setAutoPlay(false)
                }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === current
                    ? 'bg-teal-600 w-8'
                    : 'bg-slate-300 w-2 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>
        </div>
        ) : null}

        {tallerSeleccionado ? (
          <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 px-4">
            <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Inscripcion</p>
                  <h3 className="mt-1 text-xl font-bold text-slate-900">{tallerSeleccionado.nombre}</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Rango edad: {tallerSeleccionado.edadMinima} - {tallerSeleccionado.edadMaxima} anos
                  </p>
                </div>
                <button
                  type="button"
                  onClick={cerrarFormulario}
                  className="rounded-full border border-slate-300 p-2 text-slate-600 hover:bg-slate-100"
                  aria-label="Cerrar formulario"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <input
                  value={form.nombre}
                  onChange={(event) => setForm((prev) => ({ ...prev, nombre: event.target.value }))}
                  placeholder="Nombre"
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-300 focus:ring"
                />
                <input
                  value={form.apellido}
                  onChange={(event) => setForm((prev) => ({ ...prev, apellido: event.target.value }))}
                  placeholder="Apellido"
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-300 focus:ring"
                />
                <input
                  type="date"
                  value={form.fechaNacimiento}
                  onChange={(event) => setForm((prev) => ({ ...prev, fechaNacimiento: event.target.value }))}
                  placeholder="Fecha de nacimiento"
                  max={new Date().toISOString().split('T')[0]}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-300 focus:ring"
                />
                <input
                  value={form.telefono}
                  onChange={(event) => setForm((prev) => ({ ...prev, telefono: event.target.value }))}
                  placeholder="Telefono (opcional)"
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-300 focus:ring"
                />
                <input
                  type="email"
                  value={form.correo}
                  onChange={(event) => setForm((prev) => ({ ...prev, correo: event.target.value }))}
                  placeholder="Correo (opcional)"
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-300 focus:ring"
                />
                <input
                  value={form.identificador}
                  onChange={(event) => setForm((prev) => ({ ...prev, identificador: event.target.value }))}
                  placeholder="Cedula ###-######-####L (opcional)"
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-300 focus:ring"
                />
              </div>

              {submitError ? (
                <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{submitError}</p>
              ) : null}

              {submitSuccess ? (
                <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {submitSuccess}
                </p>
              ) : null}

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={cerrarFormulario}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={enviarInscripcion}
                  disabled={isSubmitting}
                  className="inline-flex items-center rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Enviar inscripcion
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
