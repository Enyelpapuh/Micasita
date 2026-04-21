import { Route, Routes } from 'react-router-dom'
import { BaseLayout } from './components/layout/BaseLayout'
import { EquipoPage } from './features/equipo/components/EquipoPage'
import { LandingPage } from './features/landing/components/LandingPage'
import MatriculasSection from './features/landing/components/matriculas-section'
import { LoginPage } from './features/auth/LoginPage'
import { RequireAuth } from './features/auth/RequireAuth'
import { DashboardPage } from './features/dashboard/DashboardPage.tsx'

function NotFoundPage() {
  return (
    <section className="mx-auto flex min-h-[70vh] w-full max-w-6xl flex-col items-center justify-center px-4 text-center sm:px-6 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-[0.12em] text-teal-700">404</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">Pagina no encontrada</h1>
      <p className="mt-4 max-w-xl text-slate-600">La ruta que intentas visitar no existe o fue movida.</p>
    </section>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<BaseLayout><LandingPage /></BaseLayout>} />
      <Route path="/equipo" element={<BaseLayout><EquipoPage /></BaseLayout>} />
      <Route path="/admisiones/solicitud" element={<BaseLayout><MatriculasSection /></BaseLayout>} />
      <Route path="/login" element={<BaseLayout><LoginPage /></BaseLayout>} />
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <BaseLayout>
              <DashboardPage />
            </BaseLayout>
          </RequireAuth>
        }
      />
      <Route path="*" element={<BaseLayout><NotFoundPage /></BaseLayout>} />
    </Routes>
  )
}

export default App
