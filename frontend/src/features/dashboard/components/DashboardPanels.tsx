import type { ReactNode } from 'react'
import { BadgeCheck, Inbox, LayoutDashboard, Mail, Settings, ShieldCheck, Sparkles, Users } from 'lucide-react'
import type { AuthUser } from '../../auth/auth.types'
import type { DashboardView } from './DashboardSidebar'

type DashboardPanelProps = {
  user?: AuthUser | null
}

function PanelShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <section className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Dashboard</p>
        <h2 className="text-3xl font-semibold tracking-tight text-slate-900">{title}</h2>
        <p className="max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">{subtitle}</p>
      </div>
      <div className="mt-6">{children}</div>
    </section>
  )
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-sm text-slate-600">{detail}</p>
    </article>
  )
}

export function OverviewPanel({ user }: DashboardPanelProps) {
  return (
    <PanelShell
      title={`Bienvenido, ${user?.nombre ?? 'usuario'}`}
      subtitle="Desde aquí puedes entrar a cada módulo según tus permisos. Esta vista sirve como punto de entrada y resumen general del sistema."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Usuario activo" value={user?.email ?? 'sin correo'} detail="Sesión autenticada con JWT" />
        <MetricCard label="Roles" value={user?.roles.length?.toString() ?? '0'} detail="Roles cargados desde el backend" />
        <MetricCard label="Permisos" value={user?.permisos.length?.toString() ?? '0'} detail="Accesos visibles en la sidebar" />
      </div>

      <div className="mt-6 rounded-2xl border border-dashed border-teal-300 bg-[linear-gradient(135deg,_rgba(20,184,166,0.08),_rgba(2,132,199,0.05),_rgba(255,255,255,1))] p-5 text-sm leading-7 text-slate-600">
        El panel lateral centraliza el acceso a talleres, estudiantes, asistencia, matrículas, solicitudes y mensajes.
        Cuando conectes los CRUD reales, solo tienes que reemplazar el contenido de cada módulo.
      </div>
    </PanelShell>
  )
}

function GenericModulePanel({
  title,
  subtitle,
  icon: Icon,
  accent,
}: {
  title: string
  subtitle: string
  icon: typeof LayoutDashboard
  accent: string
}) {
  return (
    <PanelShell title={title} subtitle={subtitle}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Estado" value="Disponible" detail="Vista base preparada para integrar data real" />
        <MetricCard label="Prioridad" value="Alta" detail="Módulo visible por permisos" />
        <MetricCard label="Acción" value="Crear CRUD" detail="Puedes reemplazar esta plantilla" />
        <MetricCard label="Tipo" value="Panel" detail="Layout consistente con dashboard" />
      </div>

      <div className={`mt-6 rounded-[1.5rem] border border-slate-200 bg-gradient-to-r ${accent} p-6`}>
        <div className="flex items-center gap-3 text-slate-900">
          <span className="rounded-2xl bg-white/80 p-3 shadow-sm">
            <Icon className="h-6 w-6" />
          </span>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-700">Módulo activo</p>
            <p className="text-xl font-semibold text-slate-900">{title}</p>
          </div>
        </div>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-700">{subtitle}</p>
      </div>
    </PanelShell>
  )
}

export function WorkshopsPanel() {
  return (
    <GenericModulePanel
      title="Talleres"
      subtitle="Listado y gestión de talleres, cupos y calendario de actividades."
      icon={Sparkles}
      accent="from-amber-50 via-orange-50 to-white"
    />
  )
}

export function StudentsPanel() {
  return (
    <GenericModulePanel
      title="Estudiantes"
      subtitle="Registro, consulta y seguimiento de estudiantes matriculados."
      icon={Users}
      accent="from-sky-50 via-cyan-50 to-white"
    />
  )
}

export function PeoplePanel() {
  return (
    <GenericModulePanel
      title="Lista General"
      subtitle="Personas, usuarios, padres, tutores y demás registros compartidos."
      icon={Users}
      accent="from-violet-50 via-fuchsia-50 to-white"
    />
  )
}

export function AttendancePanel() {
  return (
    <GenericModulePanel
      title="Asistencia"
      subtitle="Control de asistencia por estudiante, estado y observaciones."
      icon={ShieldCheck}
      accent="from-emerald-50 via-teal-50 to-white"
    />
  )
}

export function TalleresPanel() {
  return (
    <GenericModulePanel
      title="Matrículas Talleres"
      subtitle="Cupos, matrículas, pagos y seguimiento financiero de talleres."
      icon={BadgeCheck}
      accent="from-indigo-50 via-blue-50 to-white"
    />
  )
}

export function RecepcionPanel() {
  return (
    <GenericModulePanel
      title="Bandeja de Solicitudes"
      subtitle="Solicitudes de admisión, revisión y estados del proceso."
      icon={Inbox}
      accent="from-rose-50 via-pink-50 to-white"
    />
  )
}

export function MensajesPanel() {
  return (
    <GenericModulePanel
      title="Mensajes"
      subtitle="Centro de comunicaciones y seguimiento de mensajes internos."
      icon={Mail}
      accent="from-cyan-50 via-sky-50 to-white"
    />
  )
}

export function SettingsPanel() {
  return (
    <GenericModulePanel
      title="Configuración"
      subtitle="Catálogos, parámetros y ajustes generales del sistema."
      icon={Settings}
      accent="from-slate-50 via-zinc-50 to-white"
    />
  )
}

export function getDashboardPanel(view: DashboardView, user?: AuthUser | null) {
  switch (view) {
    case 'overview':
      return <OverviewPanel user={user} />
    case 'workshops':
      return <WorkshopsPanel />
    case 'students':
      return <StudentsPanel />
    case 'people':
      return <PeoplePanel />
    case 'attendance':
      return <AttendancePanel />
    case 'talleres':
      return <TalleresPanel />
    case 'recepcion':
      return <RecepcionPanel />
    case 'mensajes':
      return <MensajesPanel />
    case 'settings':
      return <SettingsPanel />
    default:
      return <OverviewPanel user={user} />
  }
}
