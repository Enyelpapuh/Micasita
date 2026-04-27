import type { PropsWithChildren } from 'react'
import { Toaster } from 'react-hot-toast'
import { Navbar } from './Navbar'

export function BaseLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 2800,
          style: {
            borderRadius: '0.75rem',
            background: '#0f172a',
            color: '#f8fafc',
          },
        }}
      />
      <Navbar />
      <div>{children}</div>
    </div>
  )
}
