import { useMemo } from 'react'
import {
  ClipboardList,
  Inbox,
  LayoutDashboard,
  Mail,
  Settings,
  ShieldCheck,
  Users,
  Zap,
  type LucideIcon,
  X,
} from 'lucide-react'
import { FiMenu } from 'react-icons/fi'
import logo from '../../../assets/MiCASITALOGO-cropped.svg'

export type DashboardView =
  | 'overview'
  | 'workshops'
  | 'students'
  | 'people'
  | 'attendance'
  | 'talleres'
  | 'recepcion'
  | 'mensajes'
  | 'settings'

export type DashboardMenuItem = {
  icon: LucideIcon
  label: string
  view: DashboardView
  permission?: string
}

type DashboardSidebarProps = {
  isOpen: boolean
  setIsOpen: (value: boolean) => void
  currentView: DashboardView
  onViewChange: (view: DashboardView) => void
  items: DashboardMenuItem[]
  userName?: string
}

const defaultGradientClasses =
  'group-hover:bg-clip-text group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-orange-500 group-hover:to-purple-600'

export function DashboardSidebar({
  isOpen,
  setIsOpen,
  currentView,
  onViewChange,
  items,
  userName,
}: DashboardSidebarProps) {
  const menuItems = useMemo(() => items, [items])

  const handleNavClick = (view: DashboardView) => {
    onViewChange(view)
    setIsOpen(false)
  }

  return (
    <>
      {isOpen ? (
        <button
          type="button"
          aria-label="Cerrar sidebar"
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-72 flex-col border-r border-white/10 bg-slate-950 text-white transition-transform duration-300 md:static md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="border-b border-white/10 p-6">
          <div
            className="mb-2 flex cursor-pointer items-center gap-3 transition-opacity hover:opacity-80"
            onClick={() => handleNavClick('overview')}
          >
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white/10">
              <img src={logo} alt="Micasita" className="h-8 w-8 object-contain" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Mi Casita</h2>
              <p className="text-xs text-white/60">Dashboard</p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-white/55">Sesión activa</p>
            <p className="mt-1 text-sm font-semibold text-white">{userName ?? 'Usuario'}</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-5">
          <div className="mb-4 px-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
            Menú principal
          </div>
          <div className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = currentView === item.view

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleNavClick(item.view)}
                  className={`group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors ${
                    isActive
                      ? 'bg-white text-slate-950 shadow-lg shadow-black/20'
                      : 'text-white/80 hover:bg-white/8'
                  }`}
                >
                  <span className={`rounded-xl p-2 ${isActive ? 'bg-slate-950/10' : 'bg-white/10'}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className={`text-sm font-medium ${isActive ? '' : defaultGradientClasses}`}>
                    {item.label}
                  </span>
                </button>
              )
            })}
          </div>
        </nav>

        <div className="border-t border-white/10 p-4 md:hidden">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white/90"
          >
            <X className="h-4 w-4" />
            Cerrar menú
          </button>
        </div>
      </aside>

      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed left-4 top-4 z-40 inline-flex items-center justify-center rounded-xl bg-slate-950 p-3 text-white shadow-lg shadow-black/20 md:hidden"
        aria-label="Abrir sidebar"
      >
        <FiMenu size={20} />
      </button>
    </>
  )
}

export const dashboardMenuConfig: DashboardMenuItem[] = [
  { icon: LayoutDashboard, label: 'Resumen', view: 'overview', permission: 'DASHBOARD_OVERVIEW' },
  { icon: Zap, label: 'Talleres', view: 'workshops', permission: 'DASHBOARD_ACADEMICO' },
  { icon: Users, label: 'Estudiantes', view: 'students', permission: 'DASHBOARD_ACADEMICO' },
  { icon: Users, label: 'Lista General', view: 'people', permission: 'DASHBOARD_USUARIOS' },
  { icon: ShieldCheck, label: 'Asistencia', view: 'attendance', permission: 'DASHBOARD_ACADEMICO' },
  { icon: ClipboardList, label: 'Matrículas Talleres', view: 'talleres', permission: 'DASHBOARD_FINANZAS' },
  { icon: Inbox, label: 'Bandeja de Solicitudes', view: 'recepcion', permission: 'DASHBOARD_ADMISION' },
  { icon: Mail, label: 'Mensajes', view: 'mensajes', permission: 'DASHBOARD_ADMISION' },
  { icon: Settings, label: 'Configuración', view: 'settings', permission: 'DASHBOARD_CONFIGURACION' },
]
