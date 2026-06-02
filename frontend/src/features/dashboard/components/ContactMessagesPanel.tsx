import { useEffect, useMemo, useState } from 'react'
import { LoaderCircle, Mail, RefreshCw, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { getContactMessage, listContactMessages, replyToContactMessage, type ContactMessage } from './contact-messages.api'

function formatDate(value?: number | null) {
  if (!value) return 'No registrada'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'No registrada'
  return new Intl.DateTimeFormat('es-NI', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function getSenderInfo(from?: string | null, replyTo?: string | null) {
  const sender = from || replyTo || 'Remitente desconocido'
  const match = sender.match(/^"?([^"]+)"?\s*<.*>$/) || sender.match(/^([^<]+)\s*<.*>$/)
  
  let name = match ? match[1].trim() : sender.replace(/<.*>/, '').trim() || sender
  if (name.includes('@')) {
    name = name.split('@')[0]
  }

  const parts = name.split(/[\s._]+/).filter(Boolean)
  let initials = '?'
  if (parts.length > 1) {
    initials = (parts[0][0] + parts[1][0]).toUpperCase()
  } else if (parts.length === 1 && parts[0].length > 0) {
    initials = parts[0].substring(0, 2).toUpperCase()
  }
  
  return { name, initials }
}

export function ContactMessagesPanel() {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null)
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)

  const selectedId = useMemo(() => selectedMessage?.id ?? selectedMessageId, [selectedMessage, selectedMessageId])

  const filteredMessages = useMemo(() => {
    let result = [...messages]
    
    result.sort((a, b) => {
      const dateA = a.internalDate || 0
      const dateB = b.internalDate || 0
      return dateB - dateA // Más recientes primero
    })

    return result
  }, [messages])

  const loadMessages = async (silent = false) => {
    if (silent) setRefreshing(true)
    else setLoading(true)

    try {
      const items = await listContactMessages()
      setMessages(items)
      if (!selectedMessageId && items.length > 0) {
        setSelectedMessageId(items[0].id)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudieron cargar los mensajes')
    } finally {
      if (silent) setRefreshing(false)
      else setLoading(false)
    }
  }

  useEffect(() => {
    void loadMessages(false)
  }, [])

  useEffect(() => {
    if (!selectedMessageId) {
      setSelectedMessage(null)
      return
    }

    let cancelled = false
    setLoadingDetail(true)

    void getContactMessage(selectedMessageId)
      .then((message) => {
        if (!cancelled) {
          setSelectedMessage(message)
        }
      })
      .catch((error) => {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : 'No se pudo leer el mensaje')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingDetail(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [selectedMessageId])

  const handleReply = async () => {
    if (!selectedId || !replyText.trim()) {
      toast.error('Escribe una respuesta antes de enviar')
      return
    }

    setSendingReply(true)
    try {
      await replyToContactMessage(selectedId, replyText.trim())
      setReplyText('')
      toast.success('Respuesta enviada al correo del remitente')
      await loadMessages(true)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo enviar la respuesta')
    } finally {
      setSendingReply(false)
    }
  }

  return (
    <section className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Mensajes</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Bandeja de contacto</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
            Los mensajes llegan desde Gmail al buzón interno y puedes responderlos desde aquí.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadMessages(true)}
          className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          {refreshing ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Actualizar
        </button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-teal-700" />
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-700">Mensajes recientes</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-10 text-slate-600">
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              Cargando bandeja...
            </div>
          ) : messages.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
              No hay mensajes nuevos en la bandeja.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMessages.map((message) => {
                const isSelected = message.id === selectedId
                const { name, initials } = getSenderInfo(message.from, message.replyTo)
                
                return (
                  <button
                    key={message.id}
                    type="button"
                    onClick={() => setSelectedMessageId(message.id)}
                    className={`group w-full rounded-2xl border p-4 text-left transition-all duration-200 ${isSelected ? 'border-teal-400 bg-teal-50 shadow-md ring-1 ring-teal-400/50 scale-[1.02]' : 'border-slate-200 bg-white hover:border-teal-300 hover:bg-slate-50 hover:shadow-sm'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold shadow-sm transition-colors ${isSelected ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 group-hover:bg-teal-100 group-hover:text-teal-700'}`}>
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`truncate text-sm font-bold ${isSelected ? 'text-teal-900' : 'text-slate-900'}`}>{name}</p>
                          <span className={`shrink-0 text-[11px] font-medium ${isSelected ? 'text-teal-700' : 'text-slate-500'}`}>{formatDate(message.internalDate)}</span>
                        </div>
                        <p className={`mt-0.5 truncate text-xs font-semibold ${isSelected ? 'text-teal-800' : 'text-slate-700'}`}>{message.subject || 'Sin asunto'}</p>
                        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-600">{message.snippet || 'Sin vista previa'}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-700">Detalle y respuesta</p>

          {loadingDetail && selectedMessage ? (
            <div className="mt-4 flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-10 text-slate-600">
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              Cargando detalle...
            </div>
          ) : selectedMessage ? (
            <div className="mt-4 space-y-4">
          {selectedMessage.body ? (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div 
                className="max-h-[500px] overflow-y-auto p-4 sm:p-6"
                dangerouslySetInnerHTML={{ __html: selectedMessage.body }}
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="grid gap-3 text-sm text-slate-700">
                <div>
                  <span className="font-semibold text-slate-900">Asunto: </span>
                  {selectedMessage.subject || 'Sin asunto'}
                </div>
                <div>
                  <span className="font-semibold text-slate-900">De: </span>
                  {selectedMessage.from || selectedMessage.replyTo || 'No disponible'}
                </div>
                <div>
                  <span className="font-semibold text-slate-900">Fecha: </span>
                  {formatDate(selectedMessage.internalDate)}
                </div>
              </div>
            </div>
          )}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Responder</label>
                <textarea
                  value={replyText}
                  onChange={(event) => setReplyText(event.target.value)}
                  rows={8}
                  placeholder="Escribe la respuesta que quieres enviar al remitente"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none ring-teal-300 placeholder:text-slate-400 focus:ring"
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setReplyText('')}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Limpiar
                </button>
                <button
                  type="button"
                  onClick={() => void handleReply()}
                  disabled={sendingReply}
                  className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-70"
                >
                  {sendingReply ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Enviar respuesta
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              Selecciona un mensaje para ver su contenido y responder.
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
