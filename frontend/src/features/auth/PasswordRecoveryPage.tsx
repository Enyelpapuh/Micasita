import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, KeyRound, CheckCircle2 } from 'lucide-react'
import axios from 'axios'
import { normalizeApiError } from './AuthContext'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api'

export function PasswordRecoveryPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2>(1)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleRequestCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await axios.post(`${API_URL}/auth/recover-password/request`, { email: email.trim() })
      setStep(2)
      setSuccess('Código enviado al correo. Revisa tu bandeja de entrada o la carpeta de spam.')
    } catch (err) {
      setError(normalizeApiError(err, 'No se pudo enviar el código de recuperación.'))
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await axios.post(`${API_URL}/auth/recover-password/reset`, {
        email: email.trim(),
        codigo: code.trim(),
        newPassword: newPassword
      })
      setSuccess(response.data.message || 'Contraseña cambiada con éxito.')
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      setError(normalizeApiError(err, 'El código es inválido o ha expirado.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(13,148,136,0.18),_transparent_32%),linear-gradient(135deg,_#0f172a_0%,_#042f2e_45%,_#08111f_100%)] px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md">
        <section className="rounded-[2rem] border border-white/10 bg-slate-950/75 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-200">
              {step === 1 ? 'Paso 1 de 2' : 'Paso 2 de 2'}
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Recuperar cuenta</h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              {step === 1
                ? 'Ingresa tu correo y te enviaremos un código de 6 dígitos que expira en 5 minutos.'
                : `Ingresa el código que enviamos a ${email} y tu nueva contraseña.`}
            </p>
          </div>

          {step === 1 ? (
            <form className="space-y-4" onSubmit={handleRequestCode}>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-300">Correo registrado</span>
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 focus-within:border-teal-400/60">
                  <Mail className="h-5 w-5 text-teal-200" />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                    placeholder="correo@dominio.com"
                    required
                  />
                </div>
              </label>

              {error && <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>}

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="group mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 px-4 py-3 text-sm font-semibold text-white transition hover:from-teal-400 hover:to-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? 'Enviando correo...' : 'Solicitar código'}
                {!loading && <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />}
              </button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={handleResetPassword}>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-300">Código de 6 dígitos</span>
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 focus-within:border-teal-400/60">
                  <KeyRound className="h-5 w-5 text-teal-200" />
                  <input
                    type="text"
                    maxLength={6}
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))} // Solo permite números
                    className="w-full bg-transparent text-lg tracking-[0.5em] text-white outline-none placeholder:text-slate-500 placeholder:tracking-normal font-mono"
                    placeholder="123456"
                    required
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-300">Nueva contraseña</span>
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 focus-within:border-teal-400/60">
                  <LockKeyhole className="h-5 w-5 text-teal-200" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                    placeholder="Tu nueva contraseña"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword((prev) => !prev)} className="text-teal-200 hover:text-white">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-300">Confirmar nueva contraseña</span>
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 focus-within:border-teal-400/60">
                  <LockKeyhole className="h-5 w-5 text-teal-200" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                    placeholder="Repite la nueva contraseña"
                    required
                  />
                </div>
              </label>

              {error && <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>}
              
              {success && (
                <div className="flex items-center gap-2 rounded-2xl border border-teal-400/30 bg-teal-500/10 px-4 py-3 text-sm text-teal-200">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !code.trim() || !newPassword.trim() || !confirmPassword.trim() || success.includes('éxito')}
                className="group mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 px-4 py-3 text-sm font-semibold text-white transition hover:from-teal-400 hover:to-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? 'Verificando...' : 'Cambiar contraseña'}
                {!loading && <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />}
              </button>
            </form>
          )}

          <div className="mt-6 text-center text-sm text-slate-400">
            ¿Ya la recordaste?{' '}
            <Link to="/login" className="font-semibold text-teal-300 hover:text-teal-200 hover:underline">
              Volver al inicio de sesión
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}