import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Calendar, LoaderCircle, Pencil, Plus, Printer, Users } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { appPermissions, useAuthorization } from '../../auth/authorization'
import { createTaller, getTalleres, resolveTallerImageUrl, updateTaller, uploadTallerImage, inscribirEnTaller, desinscribirDeTaller, getCuposPagadosTaller } from '../talleres-view.api'
import { emptyTallerForm, initialTalleres } from '../talleres-view.data'
import type { InscripcionTallerPayload, SaveTallerPayload, Taller, TallerFormValues } from '../talleres-view.types'
import { listEstudiantes, getEstudianteDetail, type EstudianteItem } from '../../dashboard/components/academico.api'

type EditingState = {
  mode: 'create' | 'edit'
  tallerId?: number
} | null

type TallerFormErrors = Partial<Record<keyof TallerFormValues | 'imagen', string>>

const MAX_IMAGE_BYTES = 5 * 1024 * 1024

function validateTallerForm(form: TallerFormValues, imageFile: File | null): TallerFormErrors {
  const errors: TallerFormErrors = {}

  if (!form.nombre.trim()) {
    errors.nombre = 'El nombre es requerido.'
  } else if (form.nombre.trim().length < 3) {
    errors.nombre = 'El nombre debe tener al menos 3 caracteres.'
  }

  if (!form.descripcion.trim()) {
    errors.descripcion = 'La descripcion es requerida.'
  } else if (form.descripcion.trim().length < 10) {
    errors.descripcion = 'La descripcion debe tener al menos 10 caracteres.'
  }

  if (!form.fechaInicial) {
    errors.fechaInicial = 'La fecha inicial es requerida.'
  }

  if (!form.fechaFinal) {
    errors.fechaFinal = 'La fecha final es requerida.'
  }

  if (form.fechaInicial && form.fechaFinal) {
    const initial = new Date(form.fechaInicial)
    const end = new Date(form.fechaFinal)
    if (!Number.isNaN(initial.getTime()) && !Number.isNaN(end.getTime()) && end < initial) {
      errors.fechaFinal = 'La fecha final no puede ser menor que la fecha inicial.'
    }
  }

  if (!Number.isFinite(form.costo) || form.costo <= 0) {
    errors.costo = 'El costo debe ser mayor que 0.'
  }

  if (!Number.isFinite(form.cuposMaximos) || form.cuposMaximos <= 0) {
    errors.cuposMaximos = 'Los cupos maximos deben ser mayores que 0.'
  }

  if (!Number.isFinite(form.edadMinima) || form.edadMinima < 0) {
    errors.edadMinima = 'La edad minima debe ser 0 o mayor.'
  }

  if (!Number.isFinite(form.edadMaxima) || form.edadMaxima < 0) {
    errors.edadMaxima = 'La edad maxima debe ser 0 o mayor.'
  }

  if (Number.isFinite(form.edadMinima) && Number.isFinite(form.edadMaxima) && form.edadMaxima < form.edadMinima) {
    errors.edadMaxima = 'La edad maxima no puede ser menor que la edad minima.'
  }

  if (imageFile) {
    if (!imageFile.type.startsWith('image/')) {
      errors.imagen = 'El archivo seleccionado debe ser una imagen.'
    } else if (imageFile.size > MAX_IMAGE_BYTES) {
      errors.imagen = 'La imagen no puede superar 5MB.'
    }
  }

  return errors
}

function formatCordobas(value?: number | null) {
  const amount = Number(value ?? 0)
  return new Intl.NumberFormat('es-NI', { style: 'currency', currency: 'NIO' }).format(Number.isFinite(amount) ? amount : 0)
}

function occupancyLabel(taller: Taller) {
  const ocupados = taller.cupos.length

  if (taller.cuposMaximos <= 0) {
    return {
      text: 'Sin cupos configurados',
      classes: 'bg-slate-200 text-slate-700',
    }
  }

  if (ocupados >= taller.cuposMaximos) {
    return {
      text: 'Completo',
      classes: 'bg-amber-100 text-amber-800',
    }
  }

  if (ocupados > 0) {
    return {
      text: 'Con inscripciones',
      classes: 'bg-emerald-100 text-emerald-800',
    }
  }

  return {
    text: 'Sin inscripciones',
    classes: 'bg-sky-100 text-sky-800',
  }
}

function utilizationRate(taller: Taller) {
  if (taller.cuposMaximos <= 0) {
    return 0
  }

  return Math.round((taller.cupos.length / taller.cuposMaximos) * 100)
}

function toFormValues(taller: Taller): TallerFormValues {
  return {
    nombre: taller.nombre,
    descripcion: taller.descripcion,
    fechaInicial: taller.fechaInicial,
    fechaFinal: taller.fechaFinal,
    costo: taller.costo,
    cuposMaximos: taller.cuposMaximos,
    edadMinima: taller.edadMinima,
    edadMaxima: taller.edadMaxima,
    activo: taller.activo,
    idTipoPublico: taller.idTipoPublico,
  }
}

export function TalleresView() {
  const { token } = useAuth()
  const { user, can, hasRole } = useAuthorization()
  const [talleres, setTalleres] = useState<Taller[]>(initialTalleres)
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(initialTalleres[0]?.id ?? null)
  const [inscritosTaller, setInscritosTaller] = useState<Taller | null>(null)
  const [editing, setEditing] = useState<EditingState>(null)
  const [form, setForm] = useState<TallerFormValues>(emptyTallerForm)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('')
  const [formErrors, setFormErrors] = useState<TallerFormErrors>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const imageInputRef = useRef<HTMLInputElement | null>(null)

  const [inscribirTaller, setInscribirTaller] = useState<Taller | null>(null)
  const [inscripcionMode, setInscripcionMode] = useState<'existing' | 'new'>('existing')
  const [inscripcionStudents, setInscripcionStudents] = useState<EstudianteItem[]>([])
  const [inscripcionSearch, setInscripcionSearch] = useState('')
  const [isLoadingStudents, setIsLoadingStudents] = useState(false)
  const [inscripcionForm, setInscripcionForm] = useState<InscripcionTallerPayload>({ nombre: '', apellido: '', fechaNacimiento: '', telefono: '', correo: '', identificador: '' })
  const [isInscribiendo, setIsInscribiendo] = useState(false)
  const [isDesinscribiendo, setIsDesinscribiendo] = useState(false)
  const [cuposPagados, setCuposPagados] = useState<Set<number>>(new Set())
  const [isLoadingPagados, setIsLoadingPagados] = useState(false)

  const canView =
    can(appPermissions.talleresView, ['ADMIN', 'COORDINADOR', 'DOCENTE', 'PROFESOR', 'DIRECCION', 'ADMINISTRACION']) ||
    can(appPermissions.dashboardAcademico)
  const canCreate = can(appPermissions.talleresCreate, ['ADMIN', 'COORDINADOR', 'DIRECCION', 'ADMINISTRACION'])
  const canEdit = can(appPermissions.talleresEdit, ['ADMIN', 'COORDINADOR', 'DIRECCION', 'ADMINISTRACION'])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setIsLoading(true)
      setFeedback(null)

      try {
        const response = await getTalleres(token)
        if (!cancelled) {
          setTalleres(response)
          setSelectedId(response[0]?.id ?? null)
        }
      } catch {
        if (!cancelled) {
          setTalleres([])
          setSelectedId(null)
          setFeedback('No se pudo obtener la lista de talleres desde la base de datos.')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [token])

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()

    return talleres.filter((taller) => {
      const matchesQuery =
        normalized.length === 0 ||
        taller.nombre.toLowerCase().includes(normalized) ||
        taller.descripcion.toLowerCase().includes(normalized)

      return matchesQuery
    })
  }, [query, talleres])

  const selectedTaller = useMemo(() => {
    return filtered.find((taller) => taller.id === selectedId) ?? filtered[0] ?? null
  }, [filtered, selectedId])

  const metrics = useMemo(() => {
    const total = talleres.length
    const totalCupos = talleres.reduce((acc, item) => acc + item.cuposMaximos, 0)
    const totalInscritos = talleres.reduce((acc, item) => acc + item.cupos.length, 0)
    const utilization = totalCupos === 0 ? 0 : Math.round((totalInscritos / totalCupos) * 100)
    const completos = talleres.filter((item) => item.cupos.length >= item.cuposMaximos && item.cuposMaximos > 0).length

    return {
      total,
      completos,
      utilization,
      totalCupos,
      totalInscritos,
    }
  }, [talleres])

  if (!canView) {
    return (
      <section className="rounded-[2rem] border border-red-200 bg-red-50/80 p-8 text-red-900">
        <p className="text-sm font-semibold uppercase tracking-[0.16em]">Sin acceso</p>
        <h2 className="mt-2 text-2xl font-semibold">No tienes permisos para ver Talleres</h2>
        <p className="mt-3 text-sm text-red-800">
          Solicita al administrador los permisos {appPermissions.talleresView} o {appPermissions.dashboardAcademico}.
        </p>
      </section>
    )
  }

  const openCreate = () => {
    setEditing({ mode: 'create' })
    setForm(emptyTallerForm)
    setImageFile(null)
    setImagePreviewUrl('')
    setFormErrors({})
  }

  const openEdit = (taller: Taller) => {
    setEditing({ mode: 'edit', tallerId: taller.id })
    setForm(toFormValues(taller))
    setImageFile(null)
    setImagePreviewUrl(resolveTallerImageUrl(taller.rutaImagen))
    setFormErrors({})
  }

  const openInscritos = (taller: Taller) => {
    setInscritosTaller(taller)
  }

  const closeEditor = () => {
    setEditing(null)
    setForm(emptyTallerForm)
    setImageFile(null)
    setImagePreviewUrl('')
    setFormErrors({})
  }

  const closeInscritos = () => {
    setInscritosTaller(null)
  }

  const openInscripcion = (taller: Taller) => {
    setInscribirTaller(taller)
    setInscripcionMode('existing')
    setInscripcionSearch('')
    setInscripcionForm({ nombre: '', apellido: '', fechaNacimiento: '', telefono: '', correo: '', identificador: '' })
    
    if (inscripcionStudents.length === 0) {
      setIsLoadingStudents(true)
      listEstudiantes(token)
        .then(setInscripcionStudents)
        .catch(() => toast.error('No se pudieron cargar los estudiantes'))
        .finally(() => setIsLoadingStudents(false))
    }
  }

  const closeInscripcion = () => {
    setInscribirTaller(null)
  }

  const handleSelectStudentForInscripcion = async (student: EstudianteItem) => {
    try {
      const detail = await getEstudianteDetail(token, student.id)
      setInscripcionForm({
        nombre: detail.nombre || '',
        apellido: detail.apellido || '',
        fechaNacimiento: detail.fechaNacimiento ? detail.fechaNacimiento.split('T')[0] : '',
        telefono: detail.telefono || '',
        correo: detail.correo || '',
        identificador: detail.identificador || ''
      })
      setInscripcionMode('new')
      toast.success('Datos del estudiante cargados')
    } catch {
      toast.error('No se pudo cargar el detalle del estudiante')
    }
  }

  const submitInscripcion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inscribirTaller) return
    
    if (!inscripcionForm.nombre.trim() || !inscripcionForm.apellido.trim() || !inscripcionForm.fechaNacimiento) {
      toast.error('Nombre, apellido y fecha de nacimiento son obligatorios')
      return
    }

    setIsInscribiendo(true)
    try {
      await inscribirEnTaller(inscribirTaller.id, inscripcionForm)
      toast.success('Inscripción realizada con éxito')
      const updatedTalleres = await getTalleres(token)
      setTalleres(updatedTalleres)
      closeInscripcion()
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || 'Error al inscribir al participante')
      } else {
        toast.error('Error al inscribir al participante')
      }
    } finally {
      setIsInscribiendo(false)
    }
  }

  const handleDesinscribir = async (tallerId: number, cupoId: number) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta inscripción? Si el participante ya pagó, deberás anular el recibo en Caja en lugar de eliminarlo por aquí.')) return;
    
    setIsDesinscribiendo(true)
    try {
      await desinscribirDeTaller(token, tallerId, cupoId)
      toast.success('Participante desinscrito con éxito')
      const updatedTalleres = await getTalleres(token)
      setTalleres(updatedTalleres)
      
      const updatedInscritosTaller = updatedTalleres.find(t => t.id === tallerId)
      if (updatedInscritosTaller) {
        setInscritosTaller(updatedInscritosTaller)
      } else {
        closeInscritos()
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || 'Error al desinscribir al participante')
      } else {
        toast.error('Error al desinscribir al participante')
      }
    } finally {
      setIsDesinscribiendo(false)
    }
  }

  const formatInscrito = (cupo: Taller['cupos'][number]) => {
    const nombre = [cupo.participanteNombre, cupo.participanteApellido].filter(Boolean).join(' ').trim()

    if (nombre) {
      return nombre
    }

    if (cupo.idParticipante) {
      return `Participante #${cupo.idParticipante}`
    }

    return 'Sin nombre'
  }

  useEffect(() => {
    if (!imageFile) {
      return
    }

    const objectUrl = URL.createObjectURL(imageFile)
    setImagePreviewUrl(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [imageFile])

  const saveForm = async () => {
    const errors = validateTallerForm(form, imageFile)
    setFormErrors(errors)

    if (Object.keys(errors).length > 0) {
      toast.error('Corrige los campos marcados antes de guardar.')
      return
    }

    setIsSaving(true)
    setFeedback(null)

    const payload: SaveTallerPayload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      fechaInicial: form.fechaInicial,
      fechaFinal: form.fechaFinal,
      costo: form.costo,
      cuposMaximos: form.cuposMaximos,
      edadMinima: form.edadMinima,
      edadMaxima: form.edadMaxima,
      activo: form.activo,
      idTipoPublico: form.idTipoPublico,
    }

    try {
      if (editing?.mode === 'edit' && editing.tallerId) {
        let updated = await updateTaller(token, editing.tallerId, payload)

        if (imageFile) {
          updated = await uploadTallerImage(token, editing.tallerId, imageFile)
        }

        setTalleres((prev) => prev.map((item) => (item.id === editing.tallerId ? updated : item)))
        toast.success('Taller actualizado con exito')
      } else {
        let created = await createTaller(token, payload)

        if (imageFile) {
          created = await uploadTallerImage(token, created.id, imageFile)
        }

        setTalleres((prev) => [created, ...prev])
        setSelectedId(created.id)
        toast.success('Taller creado con exito')
      }

      closeEditor()
    } catch (error) {
      toast.error('No se pudo subir o guardar el taller')

      if (axios.isAxiosError(error) && error.response?.status === 403) {
        setFeedback('No tienes permisos o tu sesion expiro. Vuelve a iniciar sesion.')
      } else {
        setFeedback('No fue posible sincronizar con backend. Revisa los datos e intenta nuevamente.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const imprimirListaInscritos = () => {
    if (!inscritosTaller) return

    const taller = inscritosTaller
    const html = `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Lista de Inscritos - ${taller.nombre}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
          .header { margin-bottom: 20px; border-bottom: 2px solid #0f766e; padding-bottom: 10px; display: flex; justify-content: space-between; align-items: flex-end; }
          h2 { margin: 0; color: #0f766e; font-size: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 14px; }
          th { background-color: #f8fafc; color: #334155; font-weight: bold; }
          .info { margin: 4px 0 0 0; font-size: 13px; color: #555; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h2>${taller.nombre}</h2>
            <p class="info">${taller.fechaInicial || 'Sin inicio'} al ${taller.fechaFinal || 'Sin cierre'} • ${taller.cupos.length}/${taller.cuposMaximos} cupos</p>
          </div>
          <div style="font-weight: bold; color: #333;">Lista de Inscritos</div>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 50px; text-align: center;">#</th>
              <th>Nombre del Participante</th>
              <th>Información de Contacto</th>
              <th>Fecha Inscripción</th>
            </tr>
          </thead>
          <tbody>
            ${taller.cupos.map((cupo, index) => {
              const contacto = [cupo.participanteTelefono, cupo.participanteCorreo].filter(Boolean).join(' • ') || 'Sin información';
              const isPagado = cuposPagados.has(cupo.id);
              const statusLabel = isPagado ? '<span style="color: #166534; font-weight: bold;">Pagado</span>' : '<span style="color: #92400e;">Pendiente</span>';
              return `
              <tr>
                <td style="text-align: center;">${index + 1}</td>
                <td>${formatInscrito(cupo)}</td>
                <td>${contacto}</td>
                <td>${cupo.fecha || 'Sin fecha'} - ${statusLabel}</td>
              </tr>
              `;
            }).join('')}
            ${taller.cupos.length === 0 ? '<tr><td colspan="4" style="text-align:center;">Sin inscritos</td></tr>' : ''}
          </tbody>
        </table>
        <footer style="margin-top: 30px; font-size: 12px; color: #64748b; text-align: center;">
          Generado desde Mi Casita • ${new Date().toLocaleString('es-NI')}
        </footer>
      </body>
      </html>
    `

    const w = window.open('', '_blank')
    if (!w) {
      toast.error('No se pudo abrir la ventana de impresión. Permite popups.')
      return
    }
    w.document.write(html)
    w.document.close()
    setTimeout(() => {
      try {
        w.focus()
        w.print()
      } catch (e) {
        // ignore
      }
    }, 300)
  }

  return (
    <section className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Modulo academico</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Talleres</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
            Gestiona la tabla Taller con las propiedades reales: nombre, descripcion, fechaInicial,
            fechaFinal, costo, cuposMaximos y rango de edad. Tambien visualiza cupos ocupados desde Cupo_taller.
          </p>
        </div>

        {canCreate ? (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            <Plus className="h-4 w-4" />
            Crear taller
          </button>
        ) : null}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Total talleres</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{metrics.total}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Talleres completos</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{metrics.completos}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Uso de cupos</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{metrics.utilization}%</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Capacidad total</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{metrics.totalInscritos} / {metrics.totalCupos}</p>
        </article>
      </div>

      {feedback ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {feedback}
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-6 lg:grid lg:grid-cols-[1.1fr_0.9fr] xl:grid-cols-[1.25fr_0.75fr]">
        <div className="order-2 flex flex-col rounded-2xl border border-slate-200 p-4 lg:order-1">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nombre o descripcion"
              className="min-w-[260px] flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-teal-300 focus:ring"
            />
          </div>

          <div className="space-y-3 overflow-y-auto pr-2 max-h-[60vh] lg:max-h-[calc(100vh-16rem)]">
            {isLoading ? (
              <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-10 text-slate-600">
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                Cargando talleres...
              </div>
            ) : null}

            {!isLoading && filtered.map((taller) => {
              const isSelected = selectedTaller?.id === taller.id
              const occupancy = occupancyLabel(taller)

              return (
                <button
                  key={taller.id}
                  type="button"
                  onClick={() => setSelectedId(taller.id)}
                  className={`w-full flex flex-col rounded-[1.5rem] border p-5 text-left transition-all duration-300 hover:-translate-y-1 ${
                    isSelected
                      ? 'border-teal-400 bg-teal-50/40 shadow-lg ring-1 ring-teal-400/50'
                      : 'border-slate-200 bg-white hover:border-teal-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex w-full items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className={`text-lg font-bold ${isSelected ? 'text-teal-900' : 'text-slate-900'}`}>{taller.nombre}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-600 leading-relaxed">{taller.descripcion || 'Sin descripcion'}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold shadow-sm ${occupancy.classes}`}>
                      {occupancy.text}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3 text-xs font-medium text-slate-500">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-slate-700">
                      <Calendar className="h-3.5 w-3.5" />
                      {taller.fechaInicial || 'Sin inicio'} - {taller.fechaFinal || 'Sin cierre'}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-slate-700">
                      <Users className="h-3.5 w-3.5" />
                      {taller.cupos.length}/{taller.cuposMaximos} cupos ({utilizationRate(taller)}%)
                    </span>
                  </div>

                  <div className="mt-5 flex w-full flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
                    <div
                      className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                        isSelected ? 'bg-teal-600 text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {isSelected ? 'Viendo detalle' : 'Ver detalle'}
                    </div>
                  </div>
                </button>
              )
            })}

            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
                No hay talleres que coincidan con tu filtro.
              </div>
            ) : null}
          </div>
        </div>

        <aside className="order-1 flex flex-col self-start overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl lg:sticky lg:top-6 lg:order-2">
          {selectedTaller ? (
            <>
              {selectedTaller.rutaImagen ? (
                <div className="relative h-48 w-full bg-slate-100">
                  <img
                    src={resolveTallerImageUrl(selectedTaller.rutaImagen)}
                    alt={selectedTaller.nombre}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="inline-block rounded-full bg-teal-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                      {selectedTaller.activo ? 'Activo' : 'Inactivo'}
                    </span>
                    <h3 className="mt-2 text-2xl font-bold text-white leading-tight">{selectedTaller.nombre}</h3>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 p-6 border-b border-slate-100">
                  <span className="inline-block rounded-full bg-teal-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-teal-800">
                    {selectedTaller.activo ? 'Activo' : 'Inactivo'}
                  </span>
                  <h3 className="mt-3 text-2xl font-bold text-slate-900 leading-tight">{selectedTaller.nombre}</h3>
                </div>
              )}

              <div className="p-6">
                <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Costo</p>
                    <p className="text-xl font-bold text-teal-700">{formatCordobas(selectedTaller.costo)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Cupos</p>
                    <p className="text-lg font-bold text-slate-900">{selectedTaller.cupos.length} <span className="text-sm font-medium text-slate-500">/ {selectedTaller.cuposMaximos}</span></p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Inicio</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">{selectedTaller.fechaInicial || 'Sin fecha'}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Fin</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">{selectedTaller.fechaFinal || 'Sin fecha'}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Edades</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">{selectedTaller.edadMinima} a {selectedTaller.edadMaxima} años</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Público</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">{selectedTaller.tipoPublico || 'GENERAL'}</p>
                  </div>
                </div>

                {selectedTaller.descripcion ? (
                  <div className="mb-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Descripción</p>
                    <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 rounded-xl p-4 border border-slate-100">
                      {selectedTaller.descripcion}
                    </p>
                  </div>
                ) : null}

                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => openInscripcion(selectedTaller)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-teal-700"
                  >
                    <Plus className="h-4 w-4" />
                    Inscribir Estudiante
                  </button>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => openInscritos(selectedTaller)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                      <Users className="h-4 w-4" />
                      Inscritos
                    </button>
                    {canEdit ? (
                      <button
                        type="button"
                        onClick={() => openEdit(selectedTaller)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                      >
                        <Pencil className="h-4 w-4" />
                        Editar
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <Calendar className="h-8 w-8" />
              </div>
              <p className="text-slate-500 font-medium">Selecciona un taller de la lista para ver todos sus detalles aquí.</p>
            </div>
          )}

          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600">
            Rol actual: {user?.roles.join(', ') || 'sin roles'}
            <br />
            Nivel gestion: {canEdit ? 'Gestión total' : 'Consulta e Inscripción'}
          </div>
        </aside>
      </div>

      {editing ? createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm transition-opacity" onClick={closeEditor} />
          <div className="relative flex max-h-[95vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="shrink-0 border-b border-slate-200 px-6 py-5">
              <h3 className="text-xl font-semibold text-slate-900">
                {editing.mode === 'create' ? 'Crear taller' : 'Editar taller'}
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Completa las propiedades de la tabla Taller y sincroniza por Axios al backend.
              </p>
            </div>

            <div className="overflow-y-auto px-6 py-5">
              <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">Nombre</label>
                <input
                  value={form.nombre}
                  onChange={(event) => {
                    setForm((prev) => ({ ...prev, nombre: event.target.value }))
                    setFormErrors((prev) => ({ ...prev, nombre: undefined }))
                  }}
                  placeholder="Nombre del taller"
                  className={`rounded-xl border px-3 py-2 text-sm outline-none ring-teal-300 focus:ring ${
                    formErrors.nombre ? 'border-red-400' : 'border-slate-300'
                  }`}
                />
                {formErrors.nombre ? <p className="text-xs text-red-600">{formErrors.nombre}</p> : null}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">Costo</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.costo}
                  onChange={(event) => {
                    setForm((prev) => ({ ...prev, costo: Number(event.target.value) || 0 }))
                    setFormErrors((prev) => ({ ...prev, costo: undefined }))
                  }}
                  placeholder="0.00"
                  className={`rounded-xl border px-3 py-2 text-sm outline-none ring-teal-300 focus:ring ${
                    formErrors.costo ? 'border-red-400' : 'border-slate-300'
                  }`}
                />
                {formErrors.costo ? <p className="text-xs text-red-600">{formErrors.costo}</p> : null}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">Fecha inicial</label>
                <input
                  type="date"
                  value={form.fechaInicial}
                  onChange={(event) => {
                    setForm((prev) => ({ ...prev, fechaInicial: event.target.value }))
                    setFormErrors((prev) => ({ ...prev, fechaInicial: undefined }))
                  }}
                  className={`rounded-xl border px-3 py-2 text-sm outline-none ring-teal-300 focus:ring ${
                    formErrors.fechaInicial ? 'border-red-400' : 'border-slate-300'
                  }`}
                />
                {formErrors.fechaInicial ? <p className="text-xs text-red-600">{formErrors.fechaInicial}</p> : null}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">Fecha final</label>
                <input
                  type="date"
                  value={form.fechaFinal}
                  onChange={(event) => {
                    setForm((prev) => ({ ...prev, fechaFinal: event.target.value }))
                    setFormErrors((prev) => ({ ...prev, fechaFinal: undefined }))
                  }}
                  className={`rounded-xl border px-3 py-2 text-sm outline-none ring-teal-300 focus:ring ${
                    formErrors.fechaFinal ? 'border-red-400' : 'border-slate-300'
                  }`}
                />
                {formErrors.fechaFinal ? <p className="text-xs text-red-600">{formErrors.fechaFinal}</p> : null}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">Cupos maximos</label>
                <input
                  type="number"
                  min={0}
                  value={form.cuposMaximos}
                  onChange={(event) => {
                    setForm((prev) => ({ ...prev, cuposMaximos: Number(event.target.value) || 0 }))
                    setFormErrors((prev) => ({ ...prev, cuposMaximos: undefined }))
                  }}
                  placeholder="0"
                  className={`rounded-xl border px-3 py-2 text-sm outline-none ring-teal-300 focus:ring ${
                    formErrors.cuposMaximos ? 'border-red-400' : 'border-slate-300'
                  }`}
                />
                {formErrors.cuposMaximos ? <p className="text-xs text-red-600">{formErrors.cuposMaximos}</p> : null}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">Edad minima</label>
                <input
                  type="number"
                  min={0}
                  value={form.edadMinima}
                  onChange={(event) => {
                    setForm((prev) => ({ ...prev, edadMinima: Number(event.target.value) || 0 }))
                    setFormErrors((prev) => ({ ...prev, edadMinima: undefined }))
                  }}
                  className={`rounded-xl border px-3 py-2 text-sm outline-none ring-teal-300 focus:ring ${
                    formErrors.edadMinima ? 'border-red-400' : 'border-slate-300'
                  }`}
                />
                {formErrors.edadMinima ? <p className="text-xs text-red-600">{formErrors.edadMinima}</p> : null}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">Edad maxima</label>
                <input
                  type="number"
                  min={0}
                  value={form.edadMaxima}
                  onChange={(event) => {
                    setForm((prev) => ({ ...prev, edadMaxima: Number(event.target.value) || 0 }))
                    setFormErrors((prev) => ({ ...prev, edadMaxima: undefined }))
                  }}
                  className={`rounded-xl border px-3 py-2 text-sm outline-none ring-teal-300 focus:ring ${
                    formErrors.edadMaxima ? 'border-red-400' : 'border-slate-300'
                  }`}
                />
                {formErrors.edadMaxima ? <p className="text-xs text-red-600">{formErrors.edadMaxima}</p> : null}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">Estado</label>
                <select
                  value={form.activo ? 'ACTIVO' : 'INACTIVO'}
                  onChange={(event) => setForm((prev) => ({ ...prev, activo: event.target.value === 'ACTIVO' }))}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-300 focus:ring"
                >
                  <option value="ACTIVO">Activo</option>
                  <option value="INACTIVO">Inactivo</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">Tipo publico</label>
                <select
                  value={form.idTipoPublico ?? ''}
                  onChange={(event) => {
                    const value = event.target.value
                    setForm((prev) => ({ ...prev, idTipoPublico: value ? Number(value) : null }))
                  }}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-300 focus:ring"
                >
                  <option value="">GENERAL (por defecto)</option>
                  <option value="1">NINO</option>
                  <option value="2">ADULTO</option>
                  <option value="3">GENERAL</option>
                </select>
              </div>

              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">Subir imagen de taller</label>
                {imagePreviewUrl ? (
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                    <img
                      src={imagePreviewUrl}
                      alt="Vista previa del taller"
                      className="h-48 w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                    Aun no hay imagen para este taller.
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    {imagePreviewUrl ? 'Cambiar foto' : 'Subir foto'}
                  </button>
                  {imageFile ? (
                    <span className="self-center text-xs text-slate-500">Nueva imagen seleccionada: {imageFile.name}</span>
                  ) : null}
                </div>

                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    setImageFile(event.target.files?.[0] ?? null)
                    setFormErrors((prev) => ({ ...prev, imagen: undefined }))
                  }}
                  className="hidden"
                />
                {formErrors.imagen ? <p className="text-xs text-red-600">{formErrors.imagen}</p> : null}
              </div>

              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">Descripcion</label>
                <textarea
                  value={form.descripcion}
                  onChange={(event) => {
                    setForm((prev) => ({ ...prev, descripcion: event.target.value }))
                    setFormErrors((prev) => ({ ...prev, descripcion: undefined }))
                  }}
                  placeholder="Descripcion del taller"
                  rows={3}
                  className={`rounded-xl border px-3 py-2 text-sm outline-none ring-teal-300 focus:ring ${
                    formErrors.descripcion ? 'border-red-400' : 'border-slate-300'
                  }`}
                />
                {formErrors.descripcion ? <p className="text-xs text-red-600">{formErrors.descripcion}</p> : null}
              </div>
            </div>
            </div>

            <div className="shrink-0 flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={closeEditor}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={saveForm}
                className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSaving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
                Guardar
              </button>
            </div>
          </div>
        </div>
      , document.body) : null}

      {inscritosTaller ? createPortal(
        <div className="fixed inset-0 z-[999] grid place-items-center bg-slate-950/50 px-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Inscritos</p>
                <h3 className="mt-1 text-xl font-semibold text-slate-900">{inscritosTaller.nombre}</h3>
                <p className="mt-1 text-sm text-slate-600">
                  {inscritosTaller.cupos.length} inscrito(s) de {inscritosTaller.cuposMaximos} cupos
                </p>
              </div>
              <button
                type="button"
                onClick={closeInscritos}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-4 rounded-xl bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800 mb-4">
              <strong>Nota sobre pagos:</strong> Los participantes marcados como pendientes pueden ser eliminados. Si ya pagaron, la anulación debe realizarse desde el módulo de <strong>Caja</strong>.
            </div>

            <div className="mt-4 max-h-[60vh] space-y-3 overflow-y-auto pr-2">
              {inscritosTaller.cupos.length > 0 ? (
                inscritosTaller.cupos.map((cupo) => {
                  const isPagado = cuposPagados.has(cupo.id)
                  
                  return (
                  <article key={cupo.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 transition-colors hover:bg-white hover:border-slate-300">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900 text-base">{formatInscrito(cupo)}</p>
                      <p className="text-sm text-slate-600 mt-0.5">
                        Contacto: {[cupo.participanteTelefono, cupo.participanteCorreo].filter(Boolean).join(' • ') || 'Sin información'}
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-xs">
                        <span className="rounded-md bg-slate-200 px-2 py-1 font-medium text-slate-700">Inscrito: {cupo.fecha || 'Sin fecha'}</span>
                        {isLoadingPagados ? (
                          <span className="rounded-md bg-slate-100 px-2 py-1 font-medium text-slate-500 animate-pulse">Verificando...</span>
                        ) : isPagado ? (
                          <span className="rounded-md bg-emerald-100 px-2 py-1 font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-200">Pagado</span>
                        ) : (
                          <span className="rounded-md bg-amber-100 px-2 py-1 font-semibold text-amber-800 ring-1 ring-inset ring-amber-200">Pendiente de pago</span>
                        )}
                      </div>
                    </div>
                    {canEdit ? (
                      <div className="flex shrink-0 items-center">
                        <button
                          type="button"
                          onClick={() => handleDesinscribir(inscritosTaller.id, cupo.id)}
                          disabled={isDesinscribiendo || isPagado || isLoadingPagados}
                          className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 shadow-sm transition hover:bg-rose-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          title={isPagado ? "No se puede eliminar un cupo pagado. Anule el recibo en Caja." : "Eliminar inscripción"}
                        >
                          Eliminar
                        </button>
                      </div>
                    ) : null}
                  </article>
                )})
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  Este taller todavía no tiene participantes inscritos.
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={imprimirListaInscritos}
                className="inline-flex items-center rounded-xl border border-teal-300 bg-white px-4 py-2 text-sm font-semibold text-teal-700 transition hover:bg-teal-50"
              >
                <Printer className="mr-2 h-4 w-4" />
                Imprimir lista
              </button>
              <button
                type="button"
                onClick={closeInscritos}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      , document.body) : null}

      {inscribirTaller ? createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm sm:p-6">
          <div className="absolute inset-0" onClick={closeInscripcion} />
          <div className="relative flex max-h-[95vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="shrink-0 border-b border-slate-200 px-6 py-5">
              <h3 className="text-xl font-semibold text-slate-900">Inscribir en {inscribirTaller.nombre}</h3>
              <p className="mt-1 text-sm text-slate-600">Busca un estudiante existente o registra uno nuevo.</p>
            </div>
            
            <div className="flex border-b border-slate-200 bg-slate-50 px-6">
              <button
                onClick={() => setInscripcionMode('existing')}
                className={`py-3 px-4 text-sm font-semibold transition-colors ${inscripcionMode === 'existing' ? 'border-b-2 border-teal-600 text-teal-800' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Buscar estudiante
              </button>
              <button
                onClick={() => setInscripcionMode('new')}
                className={`py-3 px-4 text-sm font-semibold transition-colors ${inscripcionMode === 'new' ? 'border-b-2 border-teal-600 text-teal-800' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Formulario de inscripción
              </button>
            </div>

            <div className="overflow-y-auto px-6 py-5">
              {inscripcionMode === 'existing' ? (
                <div className="flex flex-col gap-4 h-[400px]">
                  <input
                    type="search"
                    value={inscripcionSearch}
                    onChange={(e) => setInscripcionSearch(e.target.value)}
                    placeholder="Buscar por nombre..."
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                  <div className="flex-1 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50">
                    {isLoadingStudents ? (
                      <div className="flex h-full items-center justify-center text-slate-500">
                        <LoaderCircle className="h-6 w-6 animate-spin" />
                      </div>
                    ) : (
                      <ul className="divide-y divide-slate-100">
                        {inscripcionStudents
                          .filter(s => `${s.nombre} ${s.apellido}`.toLowerCase().includes(inscripcionSearch.toLowerCase()))
                          .map(s => (
                            <li key={s.id}>
                              <button
                                onClick={() => handleSelectStudentForInscripcion(s)}
                                className="flex w-full items-center justify-between p-3 text-left hover:bg-white transition-colors"
                              >
                                <div>
                                  <p className="font-semibold text-slate-900">{s.nombre} {s.apellido}</p>
                                  <p className="text-xs text-slate-500">ID: {s.id}</p>
                                </div>
                                <span className="rounded-lg bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">Seleccionar</span>
                              </button>
                            </li>
                          ))}
                        {inscripcionStudents.filter(s => `${s.nombre} ${s.apellido}`.toLowerCase().includes(inscripcionSearch.toLowerCase())).length === 0 && (
                          <li className="p-4 text-center text-sm text-slate-500">No se encontraron estudiantes.</li>
                        )}
                      </ul>
                    )}
                  </div>
                </div>
              ) : (
                <form id="inscripcion-form" onSubmit={submitInscripcion} className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">Nombre *</label>
                    <input
                      required
                      value={inscripcionForm.nombre}
                      onChange={e => setInscripcionForm(prev => ({...prev, nombre: e.target.value}))}
                      className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">Apellido *</label>
                    <input
                      required
                      value={inscripcionForm.apellido}
                      onChange={e => setInscripcionForm(prev => ({...prev, apellido: e.target.value}))}
                      className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">Fecha de Nacimiento *</label>
                    <input
                      required
                      type="date"
                      value={inscripcionForm.fechaNacimiento}
                      onChange={e => setInscripcionForm(prev => ({...prev, fechaNacimiento: e.target.value}))}
                      className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">Teléfono</label>
                    <input
                      value={inscripcionForm.telefono}
                      onChange={e => setInscripcionForm(prev => ({...prev, telefono: e.target.value}))}
                      className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">Correo</label>
                    <input
                      type="email"
                      value={inscripcionForm.correo}
                      onChange={e => setInscripcionForm(prev => ({...prev, correo: e.target.value}))}
                      className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">Identificador / Cédula</label>
                    <input
                      value={inscripcionForm.identificador}
                      onChange={e => setInscripcionForm(prev => ({...prev, identificador: e.target.value}))}
                      className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
                    />
                  </div>
                </form>
              )}
            </div>

            <div className="shrink-0 flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={closeInscripcion}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Cancelar
              </button>
              {inscripcionMode === 'new' && (
                <button
                  type="submit"
                  form="inscripcion-form"
                  disabled={isInscribiendo}
                  className="inline-flex items-center rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:opacity-70"
                >
                  {isInscribiendo ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Confirmar inscripción
                </button>
              )}
            </div>
          </div>
        </div>
      , document.body) : null}
    </section>
  )
}
