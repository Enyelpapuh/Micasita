import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { createPortal } from 'react-dom'
import { CalendarDays, Check, Edit2, ImagePlus, LoaderCircle, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../auth/AuthContext'
import {
  createNews,
  deleteNews,
  getAdminNews,
  resolveNewsImageUrl,
  uploadNewsImage,
  updateNews,
  type NewsAnnouncement,
} from '../../landing/components/news.api'

function formatDate(value?: string | null) {
  if (!value) {
    return '-'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString('es-NI', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  })
}

function summarize(text: string, maxLength = 180) {
  const clean = text.trim().replace(/\s+/g, ' ')
  if (clean.length <= maxLength) {
    return clean
  }
  return `${clean.slice(0, maxLength).trim()}...`
}

function statusLabel(item: NewsAnnouncement) {
  if (item.activo === false) {
    return 'Inactiva'
  }

  if (item.fechaExpiracion && new Date(item.fechaExpiracion as string).getTime() < new Date().setHours(0, 0, 0, 0)) {
    return 'Expirada'
  }

  return 'Activa'
}

export default function NoticiasPanel() {
  const { token, user } = useAuth()
  const [news, setNews] = useState<NewsAnnouncement[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [fechaExpiracion, setFechaExpiracion] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<NewsAnnouncement | null>(null)

  const canManageNews = useMemo(
    () => (user?.roles ?? []).some((role) => ['ADMIN', 'ADMIN_DIRECCION', 'DEVELOPER'].includes(role?.toUpperCase?.() ?? role)),
    [user?.roles],
  )

  const loadNews = async () => {
    if (!token) {
      setError('No hay sesión válida')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = await getAdminNews(token)
      setNews(data)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'No se pudo cargar las noticias'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadNews()
  }, [token])

  const resetForm = () => {
    setTitulo('')
    setDescripcion('')
    setFechaExpiracion('')
    setFile(null)
    setEditingId(null)
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] ?? null)
  }

  const handleCreate = async () => {
    if (!canManageNews) {
      toast.error('No tienes permisos para administrar noticias')
      return
    }

    if (!titulo.trim() || !descripcion.trim()) {
      toast.error('Completa el título y la descripción')
      return
    }

    setBusy(true)
    try {
      const payload = {
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        fechaExpiracion: fechaExpiracion || null,
      }

      if (editingId !== null) {
        const updated = await updateNews(token, editingId, payload)
        if (file) {
          await uploadNewsImage(token, updated.id, file)
        }
        toast.success('Noticia actualizada correctamente')
      } else {
        const created = await createNews(token, payload)
        if (file) {
          await uploadNewsImage(token, created.id, file)
        }
        toast.success('Noticia publicada correctamente')
      }

      resetForm()
      await loadNews()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : editingId !== null ? 'No fue posible actualizar la noticia' : 'No fue posible publicar la noticia')
    } finally {
      setBusy(false)
    }
  }

  const handleEdit = (item: NewsAnnouncement) => {
    setEditingId(item.id)
    setTitulo(item.titulo)
    setDescripcion(item.descripcion)
    setFechaExpiracion(item.fechaExpiracion ? item.fechaExpiracion.slice(0, 10) : '')
    setFile(null)
  }

  const handleDelete = async () => {
    if (!canManageNews) {
      toast.error('No tienes permisos para administrar noticias')
      return
    }

    if (!deleteTarget) {
      return
    }

    setBusy(true)
    try {
      await deleteNews(token, deleteTarget.id)
      toast.success('Noticia eliminada correctamente')
      setDeleteTarget(null)
      await loadNews()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No fue posible eliminar la noticia')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Dashboard</p>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Noticias del sitio</h2>
        <p className="max-w-3xl text-sm leading-6 text-slate-600">
          Publica anuncios para el carrusel de la portada y controla su vigencia desde un solo lugar.
        </p>
      </div>

      {canManageNews ? (
        <div className="mt-6 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <article className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <span className="rounded-2xl bg-teal-600/10 p-3 text-teal-700">
                <ImagePlus className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
                  {editingId !== null ? 'Editar noticia' : 'Publicar noticia'}
                </p>
                <p className="text-sm text-slate-500">
                  {editingId !== null ? 'Modifica el contenido visible en la portada.' : 'Los anuncios activos aparecen en la portada.'}
                </p>
              </div>
            </div>

            {editingId !== null ? (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Estás editando una noticia existente. Si no eliges una imagen nueva, se conservará la actual.
              </div>
            ) : null}

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">Título</span>
                <input
                  value={titulo}
                  onChange={(event) => setTitulo(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-teal-300 focus:ring"
                  placeholder="Ej. Nueva jornada de inscripción"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">Descripción</span>
                <textarea
                  value={descripcion}
                  onChange={(event) => setDescripcion(event.target.value)}
                  rows={6}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-teal-300 focus:ring"
                  placeholder="Escribe aquí la noticia completa que verá la comunidad."
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">Fecha de expiración</span>
                <input
                  type="date"
                  value={fechaExpiracion}
                  onChange={(event) => setFechaExpiracion(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-teal-300 focus:ring"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">Imagen opcional</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full rounded-xl border border-dashed border-slate-300 bg-white px-3 py-2 text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-teal-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-teal-700"
                />
                {file ? <p className="mt-2 text-xs text-slate-500">Archivo seleccionado: {file.name}</p> : null}
              </label>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                  {editingId !== null ? 'Guardar cambios' : 'Publicar noticia'}
                </button>

                {editingId !== null ? (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    <X className="h-4 w-4" />
                    Cancelar edición
                  </button>
                ) : null}
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">Noticias registradas</p>
                <p className="text-sm text-slate-500">Controla el contenido visible en el carrusel.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{news.length} items</span>
            </div>

            {loading ? (
              <div className="mt-5 rounded-xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-600">
                Cargando noticias...
              </div>
            ) : error ? (
              <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : news.length === 0 ? (
              <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
                Todavía no hay noticias creadas.
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                {news.map((item) => (
                  <article key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <div className="grid gap-0 lg:grid-cols-[220px_1fr]">
                      <div className="min-h-44 bg-slate-200">
                        <img
                          src={resolveNewsImageUrl(item.rutaImagen) || '/src/assets/hero.png'}
                          alt={item.titulo}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="p-4 sm:p-5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-teal-600/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-700">
                            {statusLabel(item)}
                          </span>
                          <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-700">
                            {formatDate(item.fechaPublicacion)}
                          </span>
                          {item.fechaExpiracion ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-800">
                              <CalendarDays className="h-3.5 w-3.5" />
                              {formatDate(item.fechaExpiracion)}
                            </span>
                          ) : null}
                        </div>

                        <h3 className="mt-3 text-lg font-semibold text-slate-900">{item.titulo}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{summarize(item.descripcion)}</p>

                        <div className="mt-4 flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => handleEdit(item)}
                            disabled={busy}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100 disabled:opacity-70"
                          >
                            <Edit2 className="h-4 w-4" />
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(item)}
                            disabled={busy}
                            className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-70"
                          >
                            <Trash2 className="h-4 w-4" />
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </article>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          No tienes permisos para administrar noticias.
        </div>
      )}

      {deleteTarget ? createPortal(
        <div className="fixed inset-0 z-[200] grid place-items-center bg-slate-950/50 px-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-600">Confirmar eliminación</p>
                <h3 className="mt-1 text-xl font-semibold text-slate-900">Eliminar noticia</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Confirma si quieres retirar esta noticia del carrusel y desactivar su publicación.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Título</p>
              <p className="mt-1 text-sm font-medium text-slate-900">{deleteTarget.titulo}</p>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={busy}
                className="inline-flex items-center rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {busy ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      , document.body) : null}
    </section>
  )
}