import { useState } from 'react'
import { Mail, Phone, MapPin } from 'lucide-react'

export default function ContactForm() {
  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [asunto, setAsunto] = useState('')
  const [mensaje, setMensaje] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Vista: no enviamos al backend todavía. Podríamos validar o mostrar modal.
    // Por ahora solo limpiamos el formulario para simular envío.
    setNombre('')
    setCorreo('')
    setAsunto('')
    setMensaje('')
    alert('Formulario simulado: los datos se han limpiado (no hay envío).')
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-emerald-100 to-emerald-50 py-16">
      <section className="mx-auto w-full max-w-6xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Formulario */}
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Contacto</h1>
            <p className="mt-2 text-sm text-slate-600">Envía tus preguntas o comentarios. (Vista — no envía datos al servidor)</p>

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
                <div className="text-sm text-slate-600">Los campos no se envían en esta vista.</div>
                <div>
                  <button type="submit" className="rounded-md bg-teal-700 px-4 py-2 text-white hover:bg-teal-600">Enviar (simulado)</button>
                </div>
              </div>
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
                    <div className="text-slate-600">+505 1234 5678</div>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-teal-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Correo</div>
                    <div className="text-slate-600">info@micasita.example</div>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-teal-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Dirección</div>
                    <div className="text-slate-600">C. Principal 123, Managua</div>
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
