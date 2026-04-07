import { Navigate, useLocation } from 'react-router-dom'
import type { PropsWithChildren } from 'react'
import { useAuth } from './AuthContext'

export function RequireAuth({ children }: PropsWithChildren) {
  const { isAuthenticated, isReady } = useAuth()
  const location = useLocation()

  if (!isReady) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-slate-300">
          Restaurando sesión...
        </div>
      </main>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}
