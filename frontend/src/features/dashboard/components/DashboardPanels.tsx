import { useEffect, useState, type ChangeEvent, type ReactNode } from 'react'
import toast from 'react-hot-toast'
import { Camera, Eye, EyeOff, LayoutDashboard, LoaderCircle, Mail } from 'lucide-react'
import { Bar, Line } from 'react-chartjs-2'
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js'
import type { AuthUser } from '../../auth/auth.types'
import type { DashboardView } from './DashboardSidebar'
import { TalleresView } from '../../talleres/components/TalleresView'
import { IdentityAccessPanel } from './IdentityAccessPanel'
import { AdmisionDashboardPanel } from '../../admision/components/AdmisionDashboardPanel'
import { AcademicoAsistenciaPanel, AcademicoGestionPanel, AcademicoNotasPanel } from './AcademicoPanels'
import { StudentDirectoryPanel } from './StudentDirectoryPanel'
import { useAuth } from '../../auth/AuthContext'
import { changeMyPassword, resolveMyAvatarUrl, updateMyProfile, uploadMyAvatar } from './settings.api'
import { CajaDashboardPanel } from './CajaDashboardPanel'
import { getCajaDashboard } from './caja.api'
import { AdminFinanzasPanel } from './AdminFinanzasPanel'

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

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

function formatMoney(value?: number | null) {
  const amount = Number(value ?? 0)
  return new Intl.NumberFormat('es-NI', { style: 'currency', currency: 'NIO' }).format(Number.isFinite(amount) ? amount : 0)
}

export function OverviewPanel({ user }: DashboardPanelProps) {
  const { token } = useAuth()
  const [cajaResumen, setCajaResumen] = useState<Awaited<ReturnType<typeof getCajaDashboard>> | null>(null)
  const [loadingResumen, setLoadingResumen] = useState(false)
  const [resumenError, setResumenError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const loadResumen = async () => {
      if (!token) {
        setCajaResumen(null)
        return
      }

      setLoadingResumen(true)
      setResumenError(null)

      try {
        const dashboard = await getCajaDashboard(token, 15)
        if (!cancelled) {
          setCajaResumen(dashboard)
        }
      } catch {
        if (!cancelled) {
          setResumenError('No se pudo cargar el resumen financiero.')
        }
      } finally {
        if (!cancelled) {
          setLoadingResumen(false)
        }
      }
    }

    void loadResumen()

    return () => {
      cancelled = true
    }
  }, [token])

  const totalTalleres = cajaResumen?.totalCobradoTalleres ?? 0
  const totalMatriculas = cajaResumen?.totalCobradoMatriculas ?? 0
  const totalMensualidades = cajaResumen?.totalCobradoMensualidades ?? 0
  const totalGeneral = cajaResumen?.totalCobradoGeneral ?? 0
  const permissions = user?.permisos ?? []
  const topPermissions = permissions.slice(0, 5)

  const areaChartData = {
    labels: ['Talleres', 'Matrícula', 'Mensualidad'],
    datasets: [
      {
        label: 'Recaudación',
        data: [totalTalleres, totalMatriculas, totalMensualidades],
        backgroundColor: ['#0f766e', '#0ea5e9', '#f59e0b'],
        borderRadius: 10,
      },
    ],
  }

  const trendChartData = {
    labels: ['Talleres', 'Matrícula', 'Mensualidad', 'Total'],
    datasets: [
      {
        label: 'Recaudación',
        data: [totalTalleres, totalMatriculas, totalMensualidades, totalGeneral],
        fill: true,
        borderColor: '#0f766e',
        backgroundColor: 'rgba(15, 118, 110, 0.12)',
        tension: 0.35,
        pointRadius: 3,
      },
    ],
  }

  return (
    <PanelShell
      title={`Bienvenido, ${user?.nombre ?? 'usuario'}`}
      subtitle="Resumen financiero de talleres, matrícula y mensualidad con importes reales de caja."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Recaudado talleres" value={formatMoney(totalTalleres)} detail="Pagos activos no anulados" />
        <MetricCard label="Recaudado matrícula" value={formatMoney(totalMatriculas)} detail="Pagos activos no anulados" />
        <MetricCard label="Recaudado mensualidad" value={formatMoney(totalMensualidades)} detail="Pagos activos no anulados" />
        <MetricCard label="Recaudado total" value={formatMoney(totalGeneral)} detail="Suma general de caja" />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Recaudación Por Concepto</p>
          <p className="mt-1 text-sm text-slate-600">Comparación directa entre talleres, matrícula y mensualidad.</p>
          <div className="mt-4 h-[280px]">
            <Bar
              data={areaChartData}
              options={{
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: (value) => formatMoney(Number(value)),
                    },
                  },
                  x: { grid: { display: false } },
                },
              }}
            />
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Estado del resumen</p>
          <p className="mt-1 text-sm text-slate-600">{loadingResumen ? 'Cargando movimientos de caja...' : 'Importes consolidados desde el endpoint financiero.'}</p>
          <div className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3">
              <span className="text-sm text-slate-600">Talleres</span>
              <span className="text-base font-semibold text-slate-900">{formatMoney(totalTalleres)}</span>
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3">
              <span className="text-sm text-slate-600">Matrícula</span>
              <span className="text-base font-semibold text-slate-900">{formatMoney(totalMatriculas)}</span>
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3">
              <span className="text-sm text-slate-600">Mensualidad</span>
              <span className="text-base font-semibold text-slate-900">{formatMoney(totalMensualidades)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-semibold text-slate-700">Total general</span>
              <span className="text-lg font-semibold text-teal-700">{formatMoney(totalGeneral)}</span>
            </div>
            {resumenError ? <p className="pt-2 text-sm text-rose-600">{resumenError}</p> : null}
          </div>
        </article>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Tendencia Operativa</p>
          <p className="mt-1 text-sm text-slate-600">Lectura rápida del peso financiero comparado entre conceptos.</p>
          <div className="mt-4 h-[220px]">
            <Line
              data={trendChartData}
              options={{
                maintainAspectRatio: false,
                plugins: { legend: { display: true, position: 'bottom' } },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: (value) => formatMoney(Number(value)),
                    },
                  },
                  x: { grid: { display: false } },
                },
              }}
            />
          </div>
        </article>

        <article className="rounded-2xl border border-dashed border-teal-300 bg-[linear-gradient(135deg,_rgba(20,184,166,0.08),_rgba(2,132,199,0.05),_rgba(255,255,255,1))] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">Permisos Prioritarios</p>
          <p className="mt-1 text-sm text-slate-600">Top de permisos detectados en la sesión actual.</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            {topPermissions.length > 0 ? (
              topPermissions.map((perm) => (
                <li key={perm} className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 font-medium">
                  {perm}
                </li>
              ))
            ) : (
              <li className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2">Sin permisos cargados</li>
            )}
          </ul>
        </article>
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
  return <TalleresView />
}

export function IdentityAccessDashboardPanel() {
  return <IdentityAccessPanel />
}

export function StudentsPanel() {
  return <AcademicoGestionPanel />
}

export function PeoplePanel() {
  return <StudentDirectoryPanel />
}

export function AttendancePanel() {
  return <AcademicoAsistenciaPanel />
}

export function GradesPanel() {
  return <AcademicoNotasPanel />
}

export function TalleresPanel() {
  return <CajaDashboardPanel />
}

export function CashierPanel() {
  return <CajaDashboardPanel />
}

export function RecepcionPanel() {
  return <AdmisionDashboardPanel />
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
  const { token, user, refreshUser } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [telefono, setTelefono] = useState(user?.telefono ?? '')
  const [identificador, setIdentificador] = useState(user?.identificador ?? '')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const canManageFinanzas = (user?.roles ?? []).some((role) => ['ADMIN', 'DEVELOPER'].includes(role))

  const validateStrongPassword = (password: string) => {
    if (password.length < 10 || password.length > 64) {
      return 'La contraseña debe tener entre 10 y 64 caracteres.'
    }
    if (!/[A-Z]/.test(password)) {
      return 'La contraseña debe incluir al menos una letra mayúscula.'
    }
    if (!/[a-z]/.test(password)) {
      return 'La contraseña debe incluir al menos una letra minúscula.'
    }
    if (!/\d/.test(password)) {
      return 'La contraseña debe incluir al menos un número.'
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      return 'La contraseña debe incluir al menos un caracter especial.'
    }
    return null
  }

  const submitPasswordChange = async () => {
    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      toast.error('Completa todos los campos de contraseña')
      return
    }

    const passwordValidation = validateStrongPassword(newPassword.trim())
    if (passwordValidation) {
      toast.error(passwordValidation)
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('La confirmación no coincide con la nueva contraseña')
      return
    }

    setIsSaving(true)
    try {
      await changeMyPassword(token, currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast.success('Contraseña actualizada correctamente')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar la contraseña')
    } finally {
      setIsSaving(false)
    }
  }

  const submitProfileUpdate = async () => {
    const nextTelefono = telefono.trim()
    const nextIdentificador = identificador.trim()

    if (nextTelefono && !/^\d{8}$/.test(nextTelefono)) {
      toast.error('El teléfono debe tener exactamente 8 dígitos.')
      return
    }

    if (nextIdentificador && !/^(\d{3}-\d{6}-\d{4}[A-Za-z]|\d{13}[A-Za-z])$/.test(nextIdentificador)) {
      toast.error('Cédula inválida. Usa formato nicaragüense ###-######-####L o sin guiones.')
      return
    }

    setIsSavingProfile(true)
    try {
      await updateMyProfile(token, {
        telefono: nextTelefono || null,
        identificador: nextIdentificador || null,
      })
      await refreshUser()
      toast.success('Perfil actualizado correctamente')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar el perfil')
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleUploadAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.currentTarget.value = ''
    if (!file) {
      return
    }

    setIsUploadingAvatar(true)
    try {
      await uploadMyAvatar(token, file)
      await refreshUser()
      toast.success('Avatar actualizado correctamente')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar el avatar')
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  return (
    <PanelShell
      title="Configuración"
      subtitle="Autogestión de datos sensibles de tu cuenta: teléfono, cédula, avatar y contraseña."
    >
      <div className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-5">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-slate-700">Seguridad de la cuenta</p>

        <div className="space-y-3">
          <div className="mb-3 flex items-center gap-3">
            {user?.pathAvatar ? (
              <img src={resolveMyAvatarUrl(user.pathAvatar)} alt="Avatar" className="h-14 w-14 rounded-full border border-slate-200 object-cover" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-sm font-semibold text-slate-700">
                {(user?.nombre?.[0] ?? 'U').toUpperCase()}
                {(user?.apellido?.[0] ?? '').toUpperCase()}
              </div>
            )}
            <label className="inline-flex cursor-pointer items-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100">
              {isUploadingAvatar ? <LoaderCircle className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Camera className="mr-2 h-3.5 w-3.5" />}
              Cambiar avatar
              <input type="file" accept="image/*" className="hidden" onChange={handleUploadAvatar} />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-sm text-slate-600">Teléfono</span>
            <input
              value={telefono}
              onChange={(event) => setTelefono(event.target.value)}
              placeholder="8 dígitos"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-slate-600">Cédula</span>
            <input
              value={identificador}
              onChange={(event) => setIdentificador(event.target.value)}
              placeholder="Ej. ###-######-####L o sin guiones"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none"
            />
          </label>

          <button
            type="button"
            onClick={submitProfileUpdate}
            disabled={isSavingProfile}
            className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-70"
          >
            {isSavingProfile ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
            Guardar perfil
          </button>

          <div className="my-3 h-px bg-slate-200" />

          <label className="block">
            <span className="mb-1 block text-sm text-slate-600">Contraseña actual</span>
            <div className="flex items-center rounded-xl border border-slate-300 px-3 py-2">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className="w-full text-sm outline-none"
                placeholder="Escribe tu contraseña actual"
              />
              <button type="button" onClick={() => setShowCurrentPassword((prev) => !prev)} className="text-slate-500 hover:text-slate-700">
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-slate-600">Nueva contraseña</span>
            <div className="flex items-center rounded-xl border border-slate-300 px-3 py-2">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="w-full text-sm outline-none"
                placeholder="10-64, mayúscula, minúscula, número y símbolo"
              />
              <button type="button" onClick={() => setShowNewPassword((prev) => !prev)} className="text-slate-500 hover:text-slate-700">
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-slate-600">Confirmar nueva contraseña</span>
            <div className="flex items-center rounded-xl border border-slate-300 px-3 py-2">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full text-sm outline-none"
                placeholder="Repite la nueva contraseña"
              />
              <button type="button" onClick={() => setShowConfirmPassword((prev) => !prev)} className="text-slate-500 hover:text-slate-700">
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>

          <button
            type="button"
            onClick={submitPasswordChange}
            disabled={isSaving}
            className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-70"
          >
            {isSaving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
            Guardar nueva contraseña
          </button>
        </div>
      </div>

      {canManageFinanzas ? (
        <div className="mt-6 max-w-4xl">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-700">Sistema</p>
              <p className="text-sm text-slate-600">Parámetros financieros visibles sólo para roles administradores.</p>
            </div>
          </div>
          <AdminFinanzasPanel />
        </div>
      ) : null}
    </PanelShell>
  )
}

export function FinanzasConfigPanel({ user }: { user?: AuthUser | null }) {
  const canManageFinanzas = (user?.roles ?? []).some((role) => ['ADMIN', 'DEVELOPER'].includes(role))

  return (
    <PanelShell
      title="Configuración de precios"
      subtitle="Define el precio de matrícula y mensualidad para el período activo."
    >
      {canManageFinanzas ? (
        <AdminFinanzasPanel />
      ) : (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          No tienes permisos para editar precios de matrícula y mensualidad.
        </div>
      )}
    </PanelShell>
  )
}

export function getDashboardPanel(view: DashboardView, user?: AuthUser | null) {
  switch (view) {
    case 'overview':
      return <OverviewPanel user={user} />
    case 'identityAccess':
      return <IdentityAccessDashboardPanel />
    case 'workshops':
      return <WorkshopsPanel />
    case 'students':
      return <StudentsPanel />
    case 'people':
      return <PeoplePanel />
    case 'attendance':
      return <AttendancePanel />
    case 'grades':
      return <GradesPanel />
    case 'cashier':
      return <CashierPanel />
    case 'finanzasConfig':
      return <FinanzasConfigPanel user={user} />
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
