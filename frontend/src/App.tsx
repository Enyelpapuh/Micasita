import { Route, Routes } from 'react-router-dom'
import { BaseLayout } from './components/layout/BaseLayout'
import PageWrapper from './components/ui/PageWrapper'
import { Suspense, lazy } from 'react'
import { RequireAuth } from './features/auth/RequireAuth'
import { DashboardPage } from './features/dashboard/DashboardPage.tsx'

const EquipoPage = lazy(() => import('./features/equipo/components/EquipoPage').then(m => ({ default: m.EquipoPage })))
const LandingPage = lazy(() => import('./features/landing/components/LandingPage').then(m => ({ default: m.LandingPage })))
const MatriculasSection = lazy(() => import('./features/landing/components/matriculas-section').then(m => ({ default: m.default })) )
const ContactForm = lazy(() => import('./features/landing/components/ContactForm').then(m => ({ default: m.default })) )
const TalleresView = lazy(() => import('./features/talleres/components/TalleresView').then(m => ({ default: m.TalleresView })) )
const LoginPage = lazy(() => import('./features/auth/LoginPage').then(m => ({ default: m.LoginPage })) )

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
      <Route
        path="/"
        element={
          <BaseLayout>
            <Suspense fallback={<div className="py-12">Cargando...</div>}>
              <PageWrapper>
                <LandingPage />
              </PageWrapper>
            </Suspense>
          </BaseLayout>
        }
      />
      <Route
        path="/equipo"
        element={
          <BaseLayout>
            <Suspense fallback={<div className="py-12">Cargando...</div>}>
              <PageWrapper>
                <EquipoPage />
              </PageWrapper>
            </Suspense>
          </BaseLayout>
        }
      />
      <Route
        path="/talleres"
        element={
          <BaseLayout>
            <Suspense fallback={<div className="py-12">Cargando...</div>}>
              <PageWrapper>
                <TalleresView />
              </PageWrapper>
            </Suspense>
          </BaseLayout>
        }
      />
      <Route
        path="/contacto"
        element={
          <BaseLayout>
            <Suspense fallback={<div className="py-12">Cargando...</div>}>
              <PageWrapper>
                <ContactForm />
              </PageWrapper>
            </Suspense>
          </BaseLayout>
        }
      />
      <Route
        path="/admisiones/solicitud"
        element={
          <BaseLayout>
            <Suspense fallback={<div className="py-12">Cargando...</div>}>
              <PageWrapper>
                <MatriculasSection />
              </PageWrapper>
            </Suspense>
          </BaseLayout>
        }
      />
      <Route
        path="/login"
        element={
          <BaseLayout>
            <Suspense fallback={<div className="py-12">Cargando...</div>}>
              <PageWrapper>
                <LoginPage />
              </PageWrapper>
            </Suspense>
          </BaseLayout>
        }
      />
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        }
      />
      <Route path="*" element={<BaseLayout><NotFoundPage /></BaseLayout>} />
    </Routes>
  )
}

export default App
