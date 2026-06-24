import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { LogOut, Menu } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import {
  DashboardSidebar,
  type DashboardView,
  dashboardMenuConfig,
  dashboardCategories,
  getVisibleDashboardMenuItems,
} from './components/DashboardSidebar'
import { getDashboardPanel } from './components/DashboardPanels'
import { DashboardLayout } from './components/DashboardLayout'

export function DashboardPage() {
  const { user, logout } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('micasita.dashboard.sidebarCollapsed') === '1'
    } catch {
      return false
    }
  })

  const visibleMenuItems = useMemo(() => {
    return getVisibleDashboardMenuItems(user)
  }, [user])

  const [currentView, setCurrentView] = useState<DashboardView>(visibleMenuItems[0]?.view ?? 'overview')

  useEffect(() => {
    try {
      localStorage.setItem('micasita.dashboard.sidebarCollapsed', isSidebarCollapsed ? '1' : '0')
    } catch {
      // ignore storage errors
    }
  }, [isSidebarCollapsed])

  useEffect(() => {
    if (!visibleMenuItems.some((item) => item.view === currentView)) {
      // Si la vista actual ya no está permitida (por URL manual u otro cambio), avisar y volver a la vista disponible
      toast.error('No tienes permisos para acceder a la vista solicitada')
      setCurrentView(visibleMenuItems[0]?.view ?? 'overview')
    }
  }, [currentView, visibleMenuItems])

  const handleViewChange = (view: DashboardView) => {
    const allowed = visibleMenuItems.some((item) => item.view === view)

    if (!allowed) {
      toast.error('No tienes permisos para ver esa sección')
      setIsSidebarOpen(false)
      return
    }

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
    <DashboardLayout>
      <DashboardSidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        currentView={currentView}
        onViewChange={handleViewChange}
        items={visibleMenuItems}
        userName={user?.nombre}
      />

      <div className="min-w-0 flex-1 px-4 py-6 pl-4 pr-4 sm:px-6 lg:px-8 lg:pl-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300 md:hidden mt-1 shadow-sm border border-slate-200"
                aria-label="Abrir panel de navegación"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-teal-600">
                  {currentCategoryMeta?.label ?? 'General'}
                </p>
                <h1 className="text-3xl font-semibold text-slate-900 leading-none">{currentCategoryMeta?.description}</h1>
                <p className="mt-1 text-sm text-slate-500">Navegación enfocada en tareas diarias según tu rol.</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 rounded-full bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-300"
            >
              <LogOut className="h-4 w-4" />
              <span>Cerrar sesión</span>
            </button>
          </div>
          {getDashboardPanel(currentView, user)}
        </div>
      </div>
    </DashboardLayout>
  )
}
