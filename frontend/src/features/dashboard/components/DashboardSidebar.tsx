import { useMemo } from 'react'
import {
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Inbox,
  LayoutDashboard,
  Mail,
  Settings,
  Database,
  ShieldCheck,
  Users,
  Zap,
  type LucideIcon,
  X,
} from 'lucide-react'
import { FiMenu } from 'react-icons/fi'
import logo from '../../../assets/MiCASITALOGO-cropped.svg'
import type { AuthUser } from '../../auth/auth.types'

export type DashboardView =
  | 'overview'
  | 'identityAccess'
  | 'workshops'
  | 'students'
  | 'people'
  | 'attendance'
  | 'grades'
  | 'cashier'
  | 'talleres'
  | 'auditoria'
  | 'noticias'
  | 'finanzasConfig'
  | 'recepcion'
  | 'mensajes'
  | 'backup'
  | 'settings'

export type DashboardMenuItem = {
  icon: LucideIcon
  label: string
  view: DashboardView
  category: DashboardCategoryKey
  permission?: string
  allowedRoles?: string[]
}

export type DashboardCategoryKey = 'operaciones' | 'estudiantes' | 'reportes' | 'ajustes'

type DashboardCategory = {
  key: DashboardCategoryKey
  label: string
  description: string
}

export const dashboardCategories: DashboardCategory[] = [
  { key: 'operaciones', label: 'Operaciones diarias', description: 'Caja, asistencia y notas' },
  { key: 'estudiantes', label: 'Gestión de estudiantes', description: 'Admisiones, matrículas y talleres' },
  { key: 'reportes', label: 'Reportes y dirección', description: 'Resumen, mensajes y avisos' },
  { key: 'ajustes', label: 'Ajustes y control', description: 'Precios, seguridad y auditoría' },
]

const normalizeRole = (role: string) => role?.toUpperCase?.() ?? role

const rolesMatch = (userRoles: string[], allowedRoles?: string[]) => {
  if (!allowedRoles || allowedRoles.length === 0) {
    return true
  }

  return userRoles.some((role) => allowedRoles.includes(role))
}

export function getVisibleDashboardMenuItems(user?: AuthUser | null): DashboardMenuItem[] {
  const permissions = new Set((user?.permisos ?? []).map((permission) => permission.toUpperCase()))
  const userRoles = (user?.roles ?? []).map(normalizeRole)

  return dashboardMenuConfig.filter((item) => {
    if (!rolesMatch(userRoles, item.allowedRoles)) {
      return false
    }

    if (!item.permission) {
      return true
    }

    return permissions.has(item.permission.toUpperCase())
  })
}

type DashboardSidebarProps = {
  isOpen: boolean
  setIsOpen: (value: boolean) => void
  isCollapsed: boolean
  setIsCollapsed: (value: boolean) => void
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
  isCollapsed,
  setIsCollapsed,
  currentView,
  onViewChange,
  items,
  userName,
}: DashboardSidebarProps) {
  const groupedMenuItems = useMemo(
    () =>
      dashboardCategories
        .map((category) => ({
          ...category,
          items: items.filter((item) => item.category === category.key),
        }))
        .filter((category) => category.items.length > 0),
    [items],
  )

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
        className={`fixed left-0 top-0 bottom-0 z-50 flex w-[300px] flex-col border-r border-white/10 bg-slate-950 text-white transition-all duration-300 md:sticky md:top-0 md:h-screen md:translate-x-0 ${
          isCollapsed ? 'md:w-24' : 'md:w-[320px] xl:w-[360px]'
        } ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Botón flotante para expandir/colapsar */}
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-4 top-8 z-[100] hidden h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-teal-500 text-slate-950 shadow-lg transition-all hover:scale-110 hover:bg-teal-400 active:scale-95 md:flex"
          aria-label={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
          title={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        >
          {isCollapsed ? <ChevronRight className="h-5 w-5 ml-0.5" /> : <ChevronLeft className="h-5 w-5 mr-0.5" />}
        </button>

        <div className="border-b border-white/10 p-4 md:p-5">
          <div className="flex items-center gap-3">
            <div
              className="flex cursor-pointer items-center gap-3 transition-opacity hover:opacity-80"
              onClick={() => handleNavClick('overview')}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/10">
                <img src={logo} alt="Micasita" className="h-8 w-8 object-contain" />
              </div>
              <div className={`flex flex-col justify-center overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[200px] opacity-100'}`}>
                <h2 className="truncate text-lg font-bold tracking-tight">Mi Casita</h2>
                <p className="truncate text-xs text-white/60">Dashboard operativo</p>
              </div>
            </div>
          </div>

          <div className={`mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition-all duration-300 ${isCollapsed ? 'p-2' : 'px-4 py-3'}`}>
            <p className={`truncate text-xs uppercase tracking-[0.18em] text-white/55 transition-all duration-300 ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-10 opacity-100'}`}>Sesión activa</p>
            <p className={`truncate text-sm font-semibold text-white transition-all duration-300 ${isCollapsed ? 'mt-0 text-center' : 'mt-1'}`}>
              {isCollapsed ? (userName?.[0]?.toUpperCase() ?? 'U') : userName ?? 'Usuario'}
            </p>
          </div>
        </div>

        <nav className="flex-1 overflow-x-hidden overflow-y-auto px-3 py-5 md:px-4">
          <div className={`overflow-hidden truncate px-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/50 transition-all duration-300 ${isCollapsed ? 'mb-0 max-h-0 opacity-0' : 'mb-4 max-h-10 opacity-100'}`}>
            Menú por tareas
          </div>

          <div className="space-y-4">
            {groupedMenuItems.map((category) => (
              <section key={category.key} className={`flex flex-col rounded-3xl border border-white/10 bg-white/5 transition-all duration-300 ${isCollapsed ? 'p-2' : 'p-3'}`}>
                <div className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-h-0 opacity-0' : 'mb-3 max-h-24 opacity-100 px-2'}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {category.label}
                      </p>
                      <p className="truncate text-xs text-white/55">{category.description}</p>
                    </div>
                    <span className="shrink-0 rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
                      {category.items.length}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  {category.items.map((item) => {
                    const Icon = item.icon
                    const isActive = currentView === item.view

                    return (
                      <button
                        key={item.label}
                        type="button"
                        title={item.label}
                        onClick={() => handleNavClick(item.view)}
                        className={`group flex w-full items-center rounded-2xl py-2.5 text-left transition-all duration-300 ${
                          isActive
                            ? 'bg-white text-slate-950 shadow-lg shadow-black/20 ring-1 ring-white/80'
                            : 'text-white/80 hover:-translate-y-[1px] hover:bg-white/10'
                        } ${isCollapsed ? 'justify-center px-0' : 'px-4'}`}
                      >
                        <div className="flex shrink-0 items-center justify-center">
                          <span className={`flex items-center justify-center rounded-xl p-2.5 transition-colors ${isActive ? 'bg-slate-950/10' : 'bg-white/10 group-hover:bg-white/20'}`}>
                            <Icon className="h-5 w-5" />
                          </span>
                        </div>
                        
                        <div className={`flex overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-w-0 opacity-0' : 'ml-3 max-w-[200px] flex-1 opacity-100'}`}>
                          <span className={`truncate text-sm font-medium ${isActive ? '' : defaultGradientClasses}`}>
                            {item.label}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </section>
            ))}
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
  {
    icon: LayoutDashboard, 
    label: 'Resumen Financiero', 
    view: 'overview', 
    category: 'reportes', 
    permission: 'DASHBOARD_OVERVIEW',
    allowedRoles: ['ADMIN', 'DIRECCION', 'ADMINISTRACION', 'CAJA'],
  },
  {
    icon: ClipboardList,
    label: 'Caja y Cobros',
    view: 'cashier',
    category: 'operaciones',
    permission: 'DASHBOARD_FINANZAS',
    allowedRoles: ['ADMIN', 'DIRECCION', 'ADMINISTRACION', 'CAJA'],
  },
  {
    icon: ShieldCheck,
    label: 'Asistencia y Notas',
    view: 'attendance',
    category: 'operaciones',
    permission: 'DASHBOARD_ACADEMICO',
    allowedRoles: ['ADMIN', 'DIRECCION', 'ADMINISTRACION', 'PROFESOR', 'DOCENTE'],
  },
  {
    icon: Users,
    label: 'Matrículas y Grupos',
    view: 'students',
    category: 'estudiantes',
    permission: 'DASHBOARD_ACADEMICO',
    allowedRoles: ['ADMIN', 'DIRECCION', 'ADMINISTRACION', 'PROFESOR', 'DOCENTE'],
  },
  {
    icon: Zap,
    label: 'Catálogo de Talleres',
    view: 'workshops',
    category: 'estudiantes',
    permission: 'TALLERES_VIEW',
    allowedRoles: ['ADMIN', 'DIRECCION', 'ADMINISTRACION', 'PROFESOR', 'DOCENTE'],
  },
  {
    icon: Inbox,
    label: 'Bandeja de Solicitudes',
    view: 'recepcion',
    category: 'estudiantes',
    permission: 'DASHBOARD_ADMISION',
    allowedRoles: ['ADMIN', 'DIRECCION', 'ADMINISTRACION'],
  },
  {
    icon: Users,
    label: 'Directorio de Alumnos',
    view: 'people',
    category: 'estudiantes',
    permission: 'DASHBOARD_ACADEMICO',
    allowedRoles: ['ADMIN', 'DIRECCION', 'ADMINISTRACION'],
  },
  {
    icon: Mail,
    label: 'Mensajes de Contacto',
    view: 'mensajes',
    category: 'reportes',
    permission: 'DASHBOARD_ADMISION',
    allowedRoles: ['ADMIN', 'DIRECCION', 'ADMINISTRACION'],
  },
  {
    icon: Settings,
    label: 'Config. de Precios',
    view: 'finanzasConfig',
    category: 'ajustes',
    permission: 'DASHBOARD_FINANZAS',
    allowedRoles: ['ADMIN', 'DIRECCION', 'ADMINISTRACION'],
  },
  {
    icon: ShieldCheck,
    label: 'Identidad y Accesos',
    view: 'identityAccess',
    category: 'ajustes',
    permission: 'USUARIOS_MANAGE',
    allowedRoles: ['ADMIN', 'DIRECCION'],
  },
  {
    icon: ShieldCheck,
    label: 'Registro de Auditoría',
    view: 'auditoria',
    category: 'ajustes',
    permission: 'DASHBOARD_AUDITORIA',
    allowedRoles: ['ADMIN', 'DIRECCION', 'ADMINISTRACION'],
  },
  {
    icon: Database,
    label: 'Copias de Seguridad',
    view: 'backup',
    category: 'ajustes',
    allowedRoles: ['ADMIN', 'DIRECCION'],
  },
  {
    icon: Settings,
    label: 'Mi Perfil (Ajustes)',
    view: 'settings',
    category: 'ajustes',
    // Sin restricciones: Disponible para TODOS los usuarios que inicien sesión
  },
]
