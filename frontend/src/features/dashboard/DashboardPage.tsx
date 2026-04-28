import { useEffect, useMemo, useState } from 'react'
import { LogOut } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { DashboardSidebar, type DashboardView, dashboardCategories, dashboardMenuConfig } from './components/DashboardSidebar'
import { getDashboardPanel } from './components/DashboardPanels'

export function DashboardPage() {
  const { user, logout } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const visibleMenuItems = useMemo(
    () => dashboardMenuConfig.filter((item) => !item.permission || user?.permisos.includes(item.permission)),
    [user?.permisos],
  )

  const [currentView, setCurrentView] = useState<DashboardView>(visibleMenuItems[0]?.view ?? 'overview')

  useEffect(() => {
    if (!visibleMenuItems.some((item) => item.view === currentView)) {
      setCurrentView(visibleMenuItems[0]?.view ?? 'overview')
    }
  }, [currentView, visibleMenuItems])

  const handleViewChange = (view: DashboardView) => {
    setCurrentView(view)
    setIsSidebarOpen(false)
  }

  const currentCategory = useMemo(
    () =>
      dashboardMenuConfig.find((item) => item.view === currentView)?.category ?? 'general',
    [currentView],
  )

  const currentCategoryMeta = dashboardCategories.find((category) => category.key === currentCategory)

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-[radial-gradient(circle_at_top_left,_rgba(13,148,136,0.18),_transparent_28%),radial-gradient(circle_at_right,_rgba(14,165,233,0.10),_transparent_22%),linear-gradient(180deg,_#f8fafc_0%,_#eef8f7_38%,_#f8fafc_100%)]">
      <div className="flex min-h-[calc(100vh-5rem)]">
        <DashboardSidebar
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
          currentView={currentView}
          onViewChange={handleViewChange}
          items={visibleMenuItems}
          userName={user?.nombre}
        />

        <div className="min-w-0 flex-1 px-4 py-6 pl-4 pr-4 sm:px-6 lg:px-8 lg:pl-8">
          <div className="mx-auto max-w-7xl">
            <section className="mb-6 rounded-[2rem] border border-white/70 bg-white/75 px-5 py-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur sm:px-7">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">Dashboard categorizado</p>
                  <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                    {currentCategoryMeta?.label ?? 'General'}
                  </h1>
                  <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
                    {currentCategoryMeta?.description ?? 'Acceso rápido a los módulos principales del sistema.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {dashboardCategories.map((category) => {
                    const isActive = category.key === currentCategory
                    return (
                      <button
                        key={category.key}
                        type="button"
                        onClick={() => {
                          const firstView = dashboardMenuConfig.find((item) => item.category === category.key && (!item.permission || user?.permisos.includes(item.permission)))?.view
                          if (firstView) {
                            setCurrentView(firstView)
                          }
                        }}
                        className={`rounded-2xl border px-4 py-3 text-left transition-all duration-200 ${
                          isActive
                            ? 'border-teal-200 bg-teal-50 shadow-sm'
                            : 'border-slate-200 bg-white hover:-translate-y-[1px] hover:border-teal-200 hover:bg-teal-50/60'
                        }`}
                      >
                        <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${isActive ? 'text-teal-700' : 'text-slate-500'}`}>
                          {category.label}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-600">{category.description}</p>
                      </button>
                    )
                  })}
                </div>
              </div>
            </section>

            <div className="mx-auto max-w-7xl">{getDashboardPanel(currentView, user)}</div>

            <div className="mt-6 mx-auto max-w-7xl">
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
