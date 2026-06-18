import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { LoaderCircle, Mail, RefreshCw, Send, X } from 'lucide-react'
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
  const [isModalOpen, setIsModalOpen] = useState(false)

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
    if (!selectedMessageId || !isModalOpen) {
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
  }, [selectedMessageId, isModalOpen])

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
      setIsModalOpen(false)
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

      <div className="mt-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-teal-700" />
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-700">Bandeja de entrada ({filteredMessages.length})</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-10 text-slate-600">
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              Cargando bandeja...
            </div>
          ) : messages.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              No hay mensajes nuevos en la bandeja.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredMessages.map((message) => {
                const { name, initials } = getSenderInfo(message.from, message.replyTo)
                
                return (
                  <button
                    key={message.id}
                    type="button"
                    onClick={() => {
                      setSelectedMessageId(message.id)
                      setIsModalOpen(true)
                    }}
                    className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-left transition-all hover:border-teal-300 hover:bg-white hover:shadow-md"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700 font-bold shadow-sm transition-colors group-hover:bg-teal-600 group-hover:text-white">
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-bold text-slate-900">{name}</p>
                        <p className="truncate text-sm font-semibold text-teal-800">{message.subject || 'Sin asunto'}</p>
                        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-600">{message.snippet || 'Sin vista previa'}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <span className="text-xs font-medium text-slate-500">{formatDate(message.internalDate)}</span>
                      <span className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition group-hover:bg-slate-50">
                        Ver y responder
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && selectedMessageId ? createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
               <div>
                  <h2 className="text-xl font-bold text-slate-900">Detalle del mensaje</h2>
                  <p className="text-sm text-slate-500">De: {selectedMessage?.from || 'Cargando...'}</p>
               </div>
               <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
                  <X className="h-6 w-6" />
               </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                {loadingDetail && !selectedMessage ? (
                    <div className="flex items-center justify-center py-10 text-slate-500">
                        <LoaderCircle className="mr-2 h-6 w-6 animate-spin" />
                        Cargando contenido del mensaje...
                    </div>
                ) : selectedMessage ? (
                    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] xl:grid-cols-[1.5fr_1fr]">
                        <div className="space-y-4">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div className="grid gap-2 text-sm text-slate-700">
                                    <div><span className="font-semibold text-slate-900">Asunto: </span>{selectedMessage.subject || 'Sin asunto'}</div>
                                    <div><span className="font-semibold text-slate-900">De: </span>{selectedMessage.from || selectedMessage.replyTo || 'No disponible'}</div>
                                    <div><span className="font-semibold text-slate-900">Fecha: </span>{formatDate(selectedMessage.internalDate)}</div>
                                </div>
                            </div>
                            {selectedMessage.body ? (
                                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                                <div 
                                    className="max-h-[500px] overflow-y-auto p-4 sm:p-6"
                                    dangerouslySetInnerHTML={{ __html: selectedMessage.body }}
                                />
                                </div>
                            ) : null}
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="flex-1 rounded-2xl border border-teal-100 bg-teal-50 p-5">
                                <label className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-teal-800">
                                    <Send className="h-5 w-5" />
                                    Responder mensaje
                                </label>
                                <textarea
                                    value={replyText}
                                    onChange={(event) => setReplyText(event.target.value)}
                                    rows={12}
                                    placeholder="Escribe la respuesta..."
                                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-teal-300 placeholder:text-slate-400 focus:ring"
                                />
                                <div className="mt-4 flex flex-col gap-2">
                                    <button
                                        type="button"
                                        onClick={() => void handleReply()}
                                        disabled={sendingReply || !replyText.trim()}
                                        className="inline-flex w-full items-center justify-center rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 disabled:opacity-70"
                                    >
                                        {sendingReply ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        {sendingReply ? 'Enviando...' : 'Enviar respuesta'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                    >
                                        Cerrar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-10 text-slate-500">Mensaje no disponible.</div>
                )}
            </div>
          </div>
        </div>
      , document.body) : null}
    </section>
  )
}
