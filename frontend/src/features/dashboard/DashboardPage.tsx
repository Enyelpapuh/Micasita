import { useEffect, useMemo, useState } from 'react'
import { LogOut } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { DashboardSidebar, type DashboardView, dashboardMenuConfig } from './components/DashboardSidebar'
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

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-[radial-gradient(circle_at_top_left,_rgba(13,148,136,0.14),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#edf8f7_45%,_#f8fafc_100%)]">
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
    </main>
  )
}
