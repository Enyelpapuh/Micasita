import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, LockKeyhole, Mail } from 'lucide-react'
import { useAuth } from './AuthContext'

export function LoginPage() {
  const navigate = useNavigate()
  const { login, isAuthenticated, isReady } = useAuth()
  const [email, setEmail] = useState('foo@gmail.com')
  const [password, setPassword] = useState('123')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isReady && isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, isReady, navigate])

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-slate-300">
          Restaurando sesión...
        </div>
      </div>
    )
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      await login(email.trim(), password)
      navigate('/dashboard', { replace: true })
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'No fue posible iniciar sesion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(13,148,136,0.18),_transparent_32%),linear-gradient(135deg,_#0f172a_0%,_#042f2e_45%,_#08111f_100%)] px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <section className="rounded-[2rem] border border-white/10 bg-white/8 p-8 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-200">Micasita Dashboard</p>
          <h1 className="mt-4 max-w-xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Accede al sistema con una sola sesion y controla tus modulos por permisos.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
            El acceso se mantiene con JWT, por lo que puedes navegar al dashboard sin perder tu sesion mientras el token siga vigente.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <article className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <p className="text-sm text-teal-200">Usuario demo</p>
              <p className="mt-1 text-lg font-semibold text-white">foo@gmail.com</p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <p className="text-sm text-teal-200">Clave demo</p>
              <p className="mt-1 text-lg font-semibold text-white">123</p>
            </article>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-slate-950/75 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-200">Inicio de sesion</p>
            <h2 className="mt-2 text-3xl font-semibold text-white">Entra al panel</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">Ingresa tus credenciales para obtener el token y abrir el dashboard.</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">Correo</span>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 focus-within:border-teal-400/60">
                <Mail className="h-5 w-5 text-teal-200" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                  placeholder="correo@dominio.com"
                  autoComplete="email"
                  required
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">Contraseña</span>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 focus-within:border-teal-400/60">
                <LockKeyhole className="h-5 w-5 text-teal-200" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                  placeholder="Tu contraseña"
                  autoComplete="current-password"
                  required
                />
              </div>
            </label>

            {error ? (
              <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 px-4 py-3 text-sm font-semibold text-white transition hover:from-teal-400 hover:to-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Validando acceso...' : 'Entrar al sistema'}
              {!loading ? <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" /> : null}
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
