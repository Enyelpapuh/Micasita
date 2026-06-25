import { useState, type FormEvent } from 'react'
import { Mail, Phone, MapPin } from 'lucide-react'
import axios from 'axios'

const CONTACT_API_URL = import.meta.env.VITE_CONTACT_API_URL ?? 'http://localhost:4000/api'

export default function ContactForm() {
  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [asunto, setAsunto] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [statusType, setStatusType] = useState<'success' | 'error' | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    const nextNombre = nombre.trim()
    const nextCorreo = correo.trim()
    const nextAsunto = asunto.trim()
    const nextMensaje = mensaje.trim()

    if (!nextNombre || !nextCorreo || !nextAsunto || !nextMensaje) {
      setStatusType('error')
      setStatusMessage('Completa todos los campos antes de enviar.')
      return
    }

    setIsSubmitting(true)
    setStatusMessage(null)

    try {
      const response = await axios.post<{ message?: string }>(`${CONTACT_API_URL}/contact/messages`, {
        nombre: nextNombre,
        correo: nextCorreo,
        asunto: nextAsunto,
        mensaje: nextMensaje,
      })
      console.log('SUCCESS!', response.status, response.data)

      setNombre('')
      setCorreo('')
      setAsunto('')
      setMensaje('')
      setStatusType('success')
      setStatusMessage(response.data?.message || 'Mensaje enviado correctamente.')
    } catch (error: any) {
      console.log('FAILED...', error)
      setStatusType('error')
      setStatusMessage(error.response?.data?.message || error.message || 'No se pudo enviar el mensaje')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-emerald-100 to-emerald-50 py-16">
      <section className="mx-auto w-full max-w-6xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Formulario */}
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Contacto</h1>
            <p className="mt-2 text-sm text-slate-600">Envía tus preguntas o comentarios y nos pondremos en contacto contigo.</p>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-slate-700">Nombre</label>
                <input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
                  type="text"
                  placeholder="Tu nombre"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Correo</label>
                <input
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
                  type="email"
                  placeholder="tucorreo@ejemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Asunto</label>
                <input
                  value={asunto}
                  onChange={(e) => setAsunto(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
                  type="text"
                  placeholder="Consulta sobre horarios"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Mensaje</label>
                <textarea
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
                  rows={6}
                  placeholder="Escribe tu mensaje aquí"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">Los datos se envían al buzón interno de Micasita.</div>
                <div>
                  <button type="submit" disabled={isSubmitting} className="rounded-md bg-teal-700 px-4 py-2 text-white hover:bg-teal-600 disabled:opacity-70">
                    {isSubmitting ? 'Enviando...' : 'Enviar mensaje'}
                  </button>
                </div>
              </div>

              {statusMessage ? (
                <p className={`text-sm ${statusType === 'success' ? 'text-emerald-700' : 'text-rose-600'}`}>{statusMessage}</p>
              ) : null}
            </form>
          </div>

          {/* Panel lateral con información de contacto y resumen del formulario */}
          <aside className="space-y-6 rounded-lg border border-emerald-200 bg-emerald-100 p-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Información</h2>
              <p className="mt-2 text-sm text-slate-600">Teléfono, correo y dirección para contactarnos directamente.</p>

              <ul className="mt-4 space-y-3 text-sm text-slate-700">
                <li className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-teal-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Teléfono</div>
                    <a
                      href="tel:+50588887043"
                      className="text-slate-600 hover:text-teal-800 hover:underline transition-colors block mt-0.5"
                    >
                      8888 7043
                    </a>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-teal-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Correo</div>
                    <a
                      href="mailto:contacto@micasita.edu.ni"
                      className="text-slate-600 hover:text-teal-800 hover:underline transition-colors block mt-0.5"
                    >
                      contacto@micasita.edu.ni
                    </a>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-teal-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Dirección</div>
                    <a
                      href="https://maps.app.goo.gl/F5FDQNSmzigt4rWdA"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-600 hover:text-teal-800 hover:underline transition-colors block mt-0.5 leading-relaxed"
                    >
                      De la Gasolinera UNO 1 cuadra al sur, 2 cuadras al este. Diriamba, Carazo, Diriamba, Nicaragua
                    </a>
                  </div>
                </li>
              </ul>
            </div>

            {/* Resumen del formulario eliminado a petición del usuario */}

            <div>
              <h4 className="text-sm font-semibold text-slate-900">Sugerencias</h4>
              <p className="mt-2 text-sm text-slate-600">Incluye tu número y horario de contacto si deseas que respondamos por teléfono. Evita datos sensibles.</p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}
