import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'
import { ExternalLink, Eye, LoaderCircle, X } from 'lucide-react'
import { normalizeApiError, useAuth } from '../../auth/AuthContext'
import {
  createAdminTipoDocumento,
  deleteAdminTipoDocumento,
  type DocumentoSolicitud,
  getAdminEstados,
  getAdminSolicitudes,
  getAdminTiposDocumento,
  getLandingAdmisionConfig,
  type TipoDocumento,
  type SolicitudAdmision,
  updateAdminTipoDocumento,
  updateAdminSolicitud,
  updateFormularioAdmision,
} from '../admision.api'

export function AdmisionDashboardPanel() {
  const TUTORES_MARKER = 'Tutores adicionales:'

  const { token } = useAuth()
  const [loading, setLoading] = useState(true)
  const [solicitudes, setSolicitudes] = useState<SolicitudAdmision[]>([])
  const [estados, setEstados] = useState<Array<{ id: number; nombre: string }>>([])
  const [tiposDocumento, setTiposDocumento] = useState<TipoDocumento[]>([])
  const [formularioActivo, setFormularioActivo] = useState(true)
  const [savingId, setSavingId] = useState<number | null>(null)
  const [savingConfig, setSavingConfig] = useState(false)
  const [deletingTipoId, setDeletingTipoId] = useState<number | null>(null)
  const [creatingTipo, setCreatingTipo] = useState(false)
  const [tipoDocumentoPanelOpen, setTipoDocumentoPanelOpen] = useState(false)
  const [newTipoNombre, setNewTipoNombre] = useState('')
  const [newTipoObligatorio, setNewTipoObligatorio] = useState(true)
  const [previewDoc, setPreviewDoc] = useState<DocumentoSolicitud | null>(null)
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null)
  const [previewDocLoading, setPreviewDocLoading] = useState(false)
  const [selectedSolicitudId, setSelectedSolicitudId] = useState<number | null>(null)
  const [filterMode, setFilterMode] = useState<'all' | 'pendiente' | 'procesado'>('all')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [showConfirmSaveTipos, setShowConfirmSaveTipos] = useState(false)
  const [savingAllTipos, setSavingAllTipos] = useState(false)
  const [tipoToDelete, setTipoToDelete] = useState<TipoDocumento | null>(null)
  const [deletingTipoProcessing, setDeletingTipoProcessing] = useState(false)

  useEffect(() => {
    let cancelled = false

    const loadData = async () => {
      setLoading(true)
      try {
        const [solicitudesData, estadosData, configData, tiposData] = await Promise.all([
          getAdminSolicitudes(token),
          getAdminEstados(token),
          getLandingAdmisionConfig(),
          getAdminTiposDocumento(token),
        ])

        if (!cancelled) {
          setSolicitudes(solicitudesData)
          setEstados(estadosData)
          setFormularioActivo(configData.formularioActivo)
          setTiposDocumento(tiposData)
        }
      } catch {
        if (!cancelled) {
          toast.error('No se pudo cargar la bandeja de admisión')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadData()
    return () => {
      cancelled = true
    }
  }, [token])

  const saveSolicitud = async (solicitud: SolicitudAdmision) => {
    setSavingId(solicitud.id)
    try {
      const updated = await updateAdminSolicitud(token, solicitud.id, {
        estadoSolicitudId: solicitud.estadoSolicitudId,
        comentariosDirector: solicitud.comentariosDirector ?? null,
        activo: solicitud.activo,
      })
      setSolicitudes((prev) => prev.map((s) => (s.id === solicitud.id ? updated : s)))
      toast.success('Solicitud actualizada')
    } catch {
      toast.error('No se pudo actualizar la solicitud')
    } finally {
      setSavingId(null)
    }
  }

  const toggleFormulario = async () => {
    setSavingConfig(true)
    try {
      const next = await updateFormularioAdmision(token, !formularioActivo)
      setFormularioActivo(next)
      toast.success(next ? 'Formulario de admisión activado' : 'Formulario de admisión desactivado')
    } catch {
      toast.error('No se pudo actualizar el estado del formulario')
    } finally {
      setSavingConfig(false)
    }
  }

  const createTipoDocumento = async () => {
    const nombre = newTipoNombre.trim()
    if (!nombre) {
      toast.error('Debes indicar el nombre del tipo de documento')
      return
    }

    setCreatingTipo(true)
    try {
      const created = await createAdminTipoDocumento(token, {
        nombre,
        obligatorio: newTipoObligatorio,
      })
      setTiposDocumento((prev) => [...prev, created])
      setNewTipoNombre('')
      setNewTipoObligatorio(true)
      toast.success('Tipo de documento creado')
    } catch (error) {
      toast.error(normalizeApiError(error, 'No se pudo crear el tipo de documento'))
    } finally {
      setCreatingTipo(false)
    }
  }

  const removeTipoDocumento = (tipo: TipoDocumento) => {
    // Open confirmation modal instead of immediate window.confirm
    setTipoToDelete(tipo)
  }

  const confirmDeleteTipo = async () => {
    if (!tipoToDelete) return
    const tipo = tipoToDelete
    setDeletingTipoProcessing(true)
    setDeletingTipoId(tipo.id)
    try {
      await deleteAdminTipoDocumento(token, tipo.id)
      setTiposDocumento((prev) => prev.filter((item) => item.id !== tipo.id))
      toast.success('Tipo de documento eliminado')
    } catch (error) {
      toast.error(normalizeApiError(error, 'No se pudo eliminar el tipo de documento'))
    } finally {
      setDeletingTipoId(null)
      setDeletingTipoProcessing(false)
      setTipoToDelete(null)
    }
  }

  const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api'

  const getDocUrl = (rutaArchivo: string) => {
    if (rutaArchivo.startsWith('http://') || rutaArchivo.startsWith('https://')) {
      return rutaArchivo
    }
    const baseUrl = apiBaseUrl.replace('/api', '')
    const normalizedPath = rutaArchivo.replace(/\\/g, '/')
    return `${baseUrl}/${normalizedPath.startsWith('/') ? normalizedPath.slice(1) : normalizedPath}`
  }

  const isImageDoc = (rutaArchivo: string) => /\.(png|jpe?g|webp|gif)$/i.test(rutaArchivo)
  const isPdfDoc = (rutaArchivo: string) => /\.pdf$/i.test(rutaArchivo)
  const selectedSolicitud = solicitudes.find((item) => item.id === selectedSolicitudId) ?? null

  const filteredAndSortedSolicitudes = (() => {
    const q = (searchTerm ?? '').trim().toLowerCase()

    const matchesSearch = (s: SolicitudAdmision) => {
      if (!q) return true
      const haystack = `${s.nombrePostulante ?? ''} ${s.apellidoPostulante ?? ''} ${s.nombreTutor ?? ''} ${s.identificadorPostulante ?? ''}`.toLowerCase()
      return haystack.includes(q)
    }

    const isPendiente = (s: SolicitudAdmision) => (s.estadoSolicitud ?? '').toLowerCase() === 'pendiente'

    const filtered = solicitudes.filter((s) => {
      if (!matchesSearch(s)) return false
      if (filterMode === 'pendiente') return isPendiente(s)
      if (filterMode === 'procesado') return !isPendiente(s)
      return true
    })

    return [...filtered].sort((a, b) => {
      const nameA = `${a.nombrePostulante ?? ''} ${a.apellidoPostulante ?? ''}`.localeCompare(`${b.nombrePostulante ?? ''} ${b.apellidoPostulante ?? ''}`)
      if (nameA !== 0) return nameA
      return new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
    })
  })()

  const splitComentarios = (comentarios?: string | null) => {
    const base = (comentarios ?? '').trim()
    if (!base) {
      return { comentariosDirector: '', tutoresAdicionales: [] as string[] }
    }

    const markerIndex = base.indexOf(TUTORES_MARKER)
    if (markerIndex < 0) {
      return { comentariosDirector: base, tutoresAdicionales: [] as string[] }
    }

    const comentariosDirector = base.substring(0, markerIndex).trim()
    const rawTutores = base.substring(markerIndex + TUTORES_MARKER.length).trim()
    const tutoresAdicionales = rawTutores
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)

    return { comentariosDirector, tutoresAdicionales }
  }

  const joinComentarios = (comentariosDirector: string, tutoresAdicionales: string[]) => {
    const comments = comentariosDirector.trim()
    if (tutoresAdicionales.length === 0) {
      return comments || null
    }
    const tutoresText = `${TUTORES_MARKER}\n${tutoresAdicionales.join('\n')}`
    return comments ? `${comments}\n\n${tutoresText}` : tutoresText
  }

  const getBirthYear = (value?: string | null) => {
    if (!value) {
      return 'N/D'
    }

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return value || 'N/D'
    }

    return date.toLocaleDateString()
  }

  useEffect(() => {
    if (!previewDoc) return

    let cancelled = false
    let objectUrl: string | null = null

    setPreviewDocLoading(true)

    const fetchDoc = async () => {
      try {
        const targetUrl = getDocUrl(previewDoc.rutaArchivo)
        const response = await fetch(targetUrl, {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        if (!response.ok) throw new Error('No se pudo cargar el documento')
        
        const blob = await response.blob()
        objectUrl = URL.createObjectURL(blob)
        
        if (!cancelled) setPreviewDocUrl(objectUrl)
      } catch (err) {
        if (!cancelled) toast.error('No se pudo descargar el documento seguro.')
      } finally {
        if (!cancelled) setPreviewDocLoading(false)
      }
    }

    void fetchDoc()

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      setPreviewDocUrl(null)
    }
  }, [previewDoc, token])

  return (
    <section className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Admisión</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Bandeja de Solicitudes</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
            Dirección puede revisar documentos, cambiar estado del proceso y activar/desactivar el formulario de matrícula en landing.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTipoDocumentoPanelOpen(true)}
            className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Tipos de documento
          </button>

          <button
            type="button"
            onClick={toggleFormulario}
            disabled={savingConfig}
            className={`inline-flex items-center rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-70 ${formularioActivo ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
          >
            {savingConfig ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
            {formularioActivo ? 'Desactivar formulario' : 'Activar formulario'}
          </button>
        </div>
      
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col items-start gap-1">
            <span className="text-sm font-medium text-slate-700">Buscar por estudiante</span>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, apellido o identificador..."
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none w-[320px]"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`rounded-xl px-3 py-2 text-sm font-semibold ${filterMode === 'all' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-300 text-slate-700'}`}
            >
              Todos
            </button>

            <button
              type="button"
              onClick={() => setFilterMode('pendiente')}
              className={`rounded-xl px-3 py-2 text-sm font-semibold ${filterMode === 'pendiente' ? 'bg-amber-500 text-white' : 'bg-white border border-slate-300 text-slate-700'}`}
            >
              En espera
            </button>

            <button
              type="button"
              onClick={() => setFilterMode('procesado')}
              className={`rounded-xl px-3 py-2 text-sm font-semibold ${filterMode === 'procesado' ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-300 text-slate-700'}`}
            >
              Procesados
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="mt-6 flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-10 text-slate-600">
          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          Cargando solicitudes...
        </div>
      ) : null}

      {!loading ? (
        <div className="mt-6 space-y-4">
          {filteredAndSortedSolicitudes.map((solicitud) => (
            <article key={solicitud.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{solicitud.nombrePostulante} {solicitud.apellidoPostulante}</p>
                  <p className="text-xs text-slate-500">Tutor: {solicitud.nombreTutor || 'N/D'} ({solicitud.parentescoTutor || 'N/D'})</p>
                  <p className="text-xs text-slate-500">Creada: {new Date(solicitud.fechaCreacion).toLocaleString()}</p>
                  <p className="text-xs text-slate-500">Documentos: {solicitud.documentos.length}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${solicitud.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                    {solicitud.activo ? 'Activa' : 'Inactiva'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedSolicitudId(solicitud.id)}
                    className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                    Ver detalle
                  </button>
                </div>
              </div>
            </article>
          ))}

          {solicitudes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              No hay solicitudes registradas.
            </div>
          ) : null}
        </div>
      ) : null}

      {selectedSolicitud ? createPortal(
        <div className="fixed inset-0 z-[500] grid place-items-center bg-slate-950/60 px-4">
          <div className="w-full max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Detalle de solicitud #{selectedSolicitud.id}</p>
                <p className="text-xs text-slate-500">{selectedSolicitud.nombrePostulante} {selectedSolicitud.apellidoPostulante}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSolicitudId(null)}
                className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[75vh] overflow-auto pt-4">
              {(() => {
                const parsed = splitComentarios(selectedSolicitud.comentariosDirector)
                return (
                  <>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                  <p><span className="font-semibold">Postulante:</span> {selectedSolicitud.nombrePostulante} {selectedSolicitud.apellidoPostulante}</p>
                  <p><span className="font-semibold">Fecha de nacimiento:</span> {getBirthYear(selectedSolicitud.fechaNacimientoPostulante)}</p>
                  <p><span className="font-semibold">Fecha de solicitud:</span> {new Date(selectedSolicitud.fechaCreacion).toLocaleString()}</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                  <p><span className="font-semibold">Tutor principal:</span> {selectedSolicitud.nombreTutor || 'N/D'}</p>
                  <p><span className="font-semibold">Parentesco:</span> {selectedSolicitud.parentescoTutor || 'N/D'}</p>
                  <p><span className="font-semibold">Tel. tutor:</span> {selectedSolicitud.telefonoTutor || 'N/D'}</p>
                  <p><span className="font-semibold">Correo tutor:</span> {selectedSolicitud.correoTutor || 'N/D'}</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 md:col-span-2">
                  <p className="font-semibold">Tutores adicionales</p>
                  {parsed.tutoresAdicionales.length > 0 ? (
                    <div className="mt-1 space-y-1">
                      {parsed.tutoresAdicionales.map((line, index) => (
                        <p key={`extra-tutor-${index}`}>{line}</p>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1 text-slate-500">No se registraron tutores adicionales.</p>
                  )}
                </div>

                <div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900 md:col-span-2">
                  Información recibida en la solicitud: solo lectura. Usa la sección "Decisión de dirección" para aprobar, rechazar o dejar en revisión.
                </div>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <p className="text-sm font-semibold text-slate-900 md:col-span-2">Decisión de dirección</p>

                <label className="text-sm text-slate-700">
                  Estado
                  <select
                    value={selectedSolicitud.estadoSolicitudId}
                    onChange={(event) => {
                      const next = Number(event.target.value)
                      const label = estados.find((e) => e.id === next)?.nombre ?? selectedSolicitud.estadoSolicitud
                      setSolicitudes((prev) => prev.map((s) => (s.id === selectedSolicitud.id ? { ...s, estadoSolicitudId: next, estadoSolicitud: label } : s)))
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none"
                  >
                    {estados.map((estado) => (
                      <option key={estado.id} value={estado.id}>{estado.nombre}</option>
                    ))}
                  </select>
                </label>

                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                  <p className="font-semibold">Estado actual</p>
                  <p className="mt-1">{selectedSolicitud.estadoSolicitud}</p>
                </div>
              </div>

              <label className="mt-3 block text-sm text-slate-700">
                Comentarios dirección
                <textarea
                  value={parsed.comentariosDirector}
                  onChange={(event) => setSolicitudes((prev) => prev.map((s) => {
                    if (s.id !== selectedSolicitud.id) {
                      return s
                    }
                    return {
                      ...s,
                      comentariosDirector: joinComentarios(event.target.value, parsed.tutoresAdicionales),
                    }
                  }))}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none"
                  placeholder="Escribe observaciones del proceso..."
                />
              </label>

              <div className="mt-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-600">Documentos del postulante</p>
                <div className="flex flex-wrap gap-2">
                  {selectedSolicitud.documentos.map((doc) => (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => setPreviewDoc(doc)}
                      className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      {doc.tipoDocumento}
                    </button>
                  ))}
                  {selectedSolicitud.documentos.length === 0 ? <span className="text-xs text-slate-500">Sin documentos</span> : null}
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => saveSolicitud(selectedSolicitud)}
                  disabled={savingId === selectedSolicitud.id}
                  className="inline-flex items-center rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-70"
                >
                  {savingId === selectedSolicitud.id ? <LoaderCircle className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
                  Guardar decisión
                </button>
              </div>
                  </>
                )
              })()}
            </div>
          </div>
        </div>
      , document.body) : null}

      {tipoDocumentoPanelOpen ? createPortal(
        <div className="fixed inset-0 z-[200] grid place-items-center bg-slate-950/60 px-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Tipos de documento</p>
                <p className="text-xs text-slate-500">Ventana centrada para administrar el catálogo</p>
              </div>
              <button
                type="button"
                onClick={() => setTipoDocumentoPanelOpen(false)}
                className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[75vh] overflow-auto pt-4">
              <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1fr_auto_auto]">
                <input
                  value={newTipoNombre}
                  onChange={(event) => setNewTipoNombre(event.target.value)}
                  placeholder="Nombre del tipo"
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none"
                />
                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={newTipoObligatorio}
                    onChange={(event) => setNewTipoObligatorio(event.target.checked)}
                  />
                  Obligatorio
                </label>
                <button
                  type="button"
                  onClick={createTipoDocumento}
                  disabled={creatingTipo}
                  className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-70"
                >
                  {creatingTipo ? <LoaderCircle className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
                  Crear
                </button>
              </div>

              <div className="mt-3 space-y-2">
                {tiposDocumento.map((tipo) => (
                  <div key={tipo.id} className="grid gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1fr_auto_auto]">
                    <input
                      value={tipo.nombre}
                      onChange={(event) => {
                        const nombre = event.target.value
                        setTiposDocumento((prev) => prev.map((item) => (item.id === tipo.id ? { ...item, nombre } : item)))
                      }}
                      className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none"
                    />

                    <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={tipo.obligatorio}
                        onChange={(event) => {
                          const obligatorio = event.target.checked
                          setTiposDocumento((prev) => prev.map((item) => (item.id === tipo.id ? { ...item, obligatorio } : item)))
                        }}
                      />
                      Obligatorio
                    </label>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => removeTipoDocumento(tipo)}
                        disabled={deletingTipoId === tipo.id}
                        className="inline-flex flex-1 items-center justify-center rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-70"
                      >
                        {deletingTipoId === tipo.id ? <LoaderCircle className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}

                {tiposDocumento.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-center text-xs text-slate-500">
                    No hay tipos documentales configurados.
                  </p>
                ) : null}

                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowConfirmSaveTipos(true)}
                    disabled={savingAllTipos}
                    className="inline-flex items-center rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-70"
                  >
                    {savingAllTipos ? <LoaderCircle className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
                    Guardar cambios
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      , document.body) : null}

      {showConfirmSaveTipos ? createPortal(
        <div className="fixed inset-0 z-[300] grid place-items-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <p className="text-sm font-semibold text-slate-900">Confirmar guardado</p>
            <p className="mt-2 text-sm text-slate-600">¿Deseas guardar los cambios realizados en los tipos de documento?</p>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmSaveTipos(false)}
                className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={async () => {
                  setSavingAllTipos(true)
                  try {
                    const updates = await Promise.all(tiposDocumento.map((tipo) => updateAdminTipoDocumento(token, tipo.id, { nombre: tipo.nombre, obligatorio: tipo.obligatorio })))
                    setTiposDocumento(updates)
                    toast.success('Tipos de documento actualizados')
                    setShowConfirmSaveTipos(false)
                  } catch (error) {
                    toast.error(normalizeApiError(error, 'No se pudieron guardar los tipos'))
                  } finally {
                    setSavingAllTipos(false)
                  }
                }}
                disabled={savingAllTipos}
                className="inline-flex items-center rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-70"
              >
                {savingAllTipos ? <LoaderCircle className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
                Confirmar y guardar
              </button>
            </div>
          </div>
        </div>
      , document.body) : null}

      {tipoToDelete ? createPortal(
        <div className="fixed inset-0 z-[310] grid place-items-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <p className="text-sm font-semibold text-slate-900">Confirmar eliminación</p>
            <p className="mt-2 text-sm text-slate-600">¿Eliminar "{tipoToDelete.nombre}"? Esta acción no se puede deshacer.</p>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setTipoToDelete(null)}
                className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmDeleteTipo}
                disabled={deletingTipoProcessing}
                className="inline-flex items-center rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-70"
              >
                {deletingTipoProcessing ? <LoaderCircle className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
                Confirmar eliminación
              </button>
            </div>
          </div>
        </div>
      , document.body) : null}

      {previewDoc ? createPortal(
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Vista de documento</p>
                <p className="text-xs text-slate-500">{previewDoc.tipoDocumento}</p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewDocUrl || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex items-center rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 ${!previewDocUrl ? 'pointer-events-none opacity-50' : ''}`}
                >
                  <ExternalLink className="mr-1 h-3.5 w-3.5" />
                  Abrir aparte
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="max-h-[calc(90vh-64px)] overflow-auto bg-slate-50 p-3">
              {previewDocLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                  <LoaderCircle className="mb-2 h-8 w-8 animate-spin" />
                  <p className="text-sm">Descargando documento seguro...</p>
                </div>
              ) : previewDocUrl ? (
                <>
                  {isImageDoc(previewDoc.rutaArchivo) ? (
                    <img
                      src={previewDocUrl}
                      alt={previewDoc.tipoDocumento}
                      className="mx-auto max-h-[75vh] rounded-lg border border-slate-200 object-contain"
                    />
                  ) : null}

                  {isPdfDoc(previewDoc.rutaArchivo) ? (
                    <iframe
                      src={previewDocUrl}
                      title={previewDoc.tipoDocumento}
                      className="h-[75vh] w-full rounded-lg border border-slate-200 bg-white"
                    />
                  ) : null}

                  {!isImageDoc(previewDoc.rutaArchivo) && !isPdfDoc(previewDoc.rutaArchivo) ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      No se puede previsualizar este formato aquí. Usa "Abrir aparte".
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                  Hubo un problema cargando el archivo.
                </div>
              )}
            </div>
          </div>
        </div>
      , document.body) : null}
    </section>
  )
}
