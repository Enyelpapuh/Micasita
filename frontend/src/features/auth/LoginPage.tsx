import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { useAuth } from './AuthContext'

export function LoginPage() {
  const navigate = useNavigate()
  const { login, isAuthenticated, isReady } = useAuth()
  const [email, setEmail] = useState('foo@gmail.com')
  const [password, setPassword] = useState('123')
  const [showPassword, setShowPassword] = useState(false)
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
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(13,148,136,0.18),_transparent_32%),linear-gradient(135deg,_#0f172a_0%,_#042f2e_45%,_#08111f_100%)] px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md">


        <section className="rounded-[2rem] border border-white/10 bg-slate-950/75 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-200">Inicio de sesion</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Entra al panel</h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">Ingresa tus credenciales para acceder al sistema del centro.</p>
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
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                  placeholder="Tu contraseña"
                  autoComplete="current-password"
                  required
                />
                <button type="button" onClick={() => setShowPassword((prev) => !prev)} className="text-teal-200 hover:text-white">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
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

          <div className="mt-6 text-center text-sm text-slate-400">
            ¿Olvidaste tu contraseña?{' '}
            <Link to="/recover-password" className="font-semibold text-teal-300 hover:text-teal-200 hover:underline">
              Recupérala aquí
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
