import { useEffect, useState } from 'react'
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
  const [savingTipoId, setSavingTipoId] = useState<number | null>(null)
  const [deletingTipoId, setDeletingTipoId] = useState<number | null>(null)
  const [creatingTipo, setCreatingTipo] = useState(false)
  const [tipoDocumentoPanelOpen, setTipoDocumentoPanelOpen] = useState(false)
  const [newTipoNombre, setNewTipoNombre] = useState('')
  const [newTipoObligatorio, setNewTipoObligatorio] = useState(true)
  const [previewDoc, setPreviewDoc] = useState<DocumentoSolicitud | null>(null)
  const [selectedSolicitudId, setSelectedSolicitudId] = useState<number | null>(null)

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

  const saveTipoDocumento = async (tipo: TipoDocumento) => {
    const nombre = tipo.nombre.trim()
    if (!nombre) {
      toast.error('El nombre del tipo de documento es requerido')
      return
    }

    setSavingTipoId(tipo.id)
    try {
      const updated = await updateAdminTipoDocumento(token, tipo.id, {
        nombre,
        obligatorio: tipo.obligatorio,
      })
      setTiposDocumento((prev) => prev.map((item) => (item.id === tipo.id ? updated : item)))
      toast.success('Tipo de documento actualizado')
    } catch (error) {
      toast.error(normalizeApiError(error, 'No se pudo actualizar el tipo de documento'))
    } finally {
      setSavingTipoId(null)
    }
  }

  const removeTipoDocumento = async (tipo: TipoDocumento) => {
    if (!window.confirm(`¿Eliminar tipo de documento ${tipo.nombre}?`)) {
      return
    }

    setDeletingTipoId(tipo.id)
    try {
      await deleteAdminTipoDocumento(token, tipo.id)
      setTiposDocumento((prev) => prev.filter((item) => item.id !== tipo.id))
      toast.success('Tipo de documento eliminado')
    } catch (error) {
      toast.error(normalizeApiError(error, 'No se pudo eliminar el tipo de documento'))
    } finally {
      setDeletingTipoId(null)
    }
  }

  const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api'

  const getDocUrl = (rutaArchivo: string) => {
    if (rutaArchivo.startsWith('http://') || rutaArchivo.startsWith('https://')) {
      return rutaArchivo
    }
    return `${apiBaseUrl}${rutaArchivo}`
  }

  const isImageDoc = (rutaArchivo: string) => /\.(png|jpe?g|webp|gif)$/i.test(rutaArchivo)
  const isPdfDoc = (rutaArchivo: string) => /\.pdf$/i.test(rutaArchivo)
  const selectedSolicitud = solicitudes.find((item) => item.id === selectedSolicitudId) ?? null

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
      </div>

      {loading ? (
        <div className="mt-6 flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-10 text-slate-600">
          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          Cargando solicitudes...
        </div>
      ) : null}

      {!loading ? (
        <div className="mt-6 space-y-4">
          {solicitudes.map((solicitud) => (
            <article key={solicitud.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{solicitud.nombrePostulante} {solicitud.apellidoPostulante}</p>
                  <p className="text-xs text-slate-500">Tutor: {solicitud.nombreTutor || 'N/D'} ({solicitud.parentescoTutor || 'N/D'})</p>
                  <p className="text-xs text-slate-500">Estado: {solicitud.estadoSolicitud} • Creada: {new Date(solicitud.fechaCreacion).toLocaleString()}</p>
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

      {selectedSolicitud ? (
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
                  <p><span className="font-semibold">Tel. postulante:</span> {selectedSolicitud.telefonoPostulante || 'N/D'}</p>
                  <p><span className="font-semibold">Correo postulante:</span> {selectedSolicitud.correoPostulante || 'N/D'}</p>
                  <p><span className="font-semibold">Cédula:</span> {selectedSolicitud.identificadorPostulante || 'N/D'}</p>
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
      ) : null}

      {tipoDocumentoPanelOpen ? (
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
                        onClick={() => saveTipoDocumento(tipo)}
                        disabled={savingTipoId === tipo.id}
                        className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-70"
                      >
                        {savingTipoId === tipo.id ? <LoaderCircle className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
                        Guardar
                      </button>

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
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {previewDoc ? (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Vista de documento</p>
                <p className="text-xs text-slate-500">{previewDoc.tipoDocumento}</p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={getDocUrl(previewDoc.rutaArchivo)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
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
              {isImageDoc(previewDoc.rutaArchivo) ? (
                <img
                  src={getDocUrl(previewDoc.rutaArchivo)}
                  alt={previewDoc.tipoDocumento}
                  className="mx-auto max-h-[75vh] rounded-lg border border-slate-200 object-contain"
                />
              ) : null}

              {isPdfDoc(previewDoc.rutaArchivo) ? (
                <iframe
                  src={getDocUrl(previewDoc.rutaArchivo)}
                  title={previewDoc.tipoDocumento}
                  className="h-[75vh] w-full rounded-lg border border-slate-200 bg-white"
                />
              ) : null}

              {!isImageDoc(previewDoc.rutaArchivo) && !isPdfDoc(previewDoc.rutaArchivo) ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  No se puede previsualizar este formato aquí. Usa "Abrir aparte".
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
