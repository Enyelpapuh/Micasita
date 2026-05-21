import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { LogOut } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { DashboardSidebar, type DashboardView, dashboardMenuConfig, dashboardCategories } from './components/DashboardSidebar'
import { getDashboardPanel } from './components/DashboardPanels'
import { DashboardLayout } from './components/DashboardLayout'

export function DashboardPage() {
  const { user, logout } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const visibleMenuItems = useMemo(() => {
    const topRoles = ['ADMIN', 'DIRECTOR']
    const userRoles = (user?.roles ?? []).map((r) => r?.toUpperCase?.() ?? r)
    const isTopRank = userRoles.some((r) => topRoles.includes(r))

    return dashboardMenuConfig.filter((item) => {
      if (!item.permission) return true
      if (item.view === 'auditoria') {
        // Mostrar la pestaña de auditoría sólo a roles top
        return Boolean(isTopRank)
      }
      return Boolean(user?.permisos.includes(item.permission))
    })
  }, [user?.permisos, user?.roles])

  const [currentView, setCurrentView] = useState<DashboardView>(visibleMenuItems[0]?.view ?? 'overview')

  useEffect(() => {
    if (!visibleMenuItems.some((item) => item.view === currentView)) {
      // Si la vista actual ya no está permitida (por URL manual u otro cambio), avisar y volver a la vista disponible
      toast.error('No tienes permisos para acceder a la vista solicitada')
      setCurrentView(visibleMenuItems[0]?.view ?? 'overview')
    }
  }, [currentView, visibleMenuItems])

  const handleViewChange = (view: DashboardView) => {
    const topRoles = ['ADMIN', 'DIRECTOR']
    const userRoles = (user?.roles ?? []).map((r) => r?.toUpperCase?.() ?? r)
    const isTop = userRoles.some((r) => topRoles.includes(r))

    if (view === 'auditoria' && !isTop) {
      toast.error('No tienes permisos para ver Auditoría del sistema')
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
        currentView={currentView}
        onViewChange={handleViewChange}
        items={visibleMenuItems}
        userName={user?.nombre}
      />

      <div className="min-w-0 flex-1 px-4 py-6 pl-4 pr-4 sm:px-6 lg:px-8 lg:pl-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-teal-600">
                {currentCategoryMeta?.label ?? 'General'}
              </p>
              <h1 className="text-3xl font-semibold text-slate-900">{currentCategoryMeta?.description}</h1>
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
