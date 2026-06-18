import { useEffect, useState, useMemo, type ChangeEvent, type ReactNode } from 'react'
import toast from 'react-hot-toast'
import {
  Camera,
  Eye,
  EyeOff,
  LoaderCircle,
  Printer,
  PlusCircle,
  Pencil,
  Trash2,
  LogIn,
  AlertTriangle,
  Search,
  History,
} from 'lucide-react'
import type { AuthUser } from '../../auth/auth.types'
import type { DashboardView } from './DashboardSidebar'
import { TalleresView } from '../../talleres/components/TalleresView'
import { IdentityAccessPanel } from './IdentityAccessPanel'
import { AdmisionDashboardPanel } from '../../admision/components/AdmisionDashboardPanel'
import { AcademicoAsistenciaPanel, AcademicoGestionPanel, AcademicoNotasPanel } from './AcademicoPanels'
import { StudentDirectoryPanel } from './StudentDirectoryPanel'
import { useAuth } from '../../auth/AuthContext'
import axios from 'axios'
import { changeMyPassword, resolveMyAvatarUrl, updateMyProfile, uploadMyAvatar } from './settings.api'
import { CajaDashboardPanel } from './CajaDashboardPanel'
import { AdminFinanzasPanel } from './AdminFinanzasPanel'
import { ContactMessagesPanel } from './ContactMessagesPanel'
import { AuditoriaPanel } from './AuditoriaPanel'
import { BackupPanel } from './BackupPanel'
import { OverviewPanel } from './OverviewPanel'

type DashboardPanelProps = {
  user?: AuthUser | null
}

export function PanelShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
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

export function formatMoney(value?: number | null) {
  const amount = Number(value ?? 0)
  return new Intl.NumberFormat('es-NI', { style: 'currency', currency: 'NIO' }).format(Number.isFinite(amount) ? amount : 0)
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
  return <TalleresView />
}

export function CashierPanel() {
  return <CajaDashboardPanel />
}

export function RecepcionPanel() {
  return <AdmisionDashboardPanel />
}

export function MensajesPanel() {
  return <ContactMessagesPanel />
}

// export function AvisosPanel() {
//   return <NoticiasPanel />
// }

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
  

  const validateStrongPassword = (password: string) => {
    if (password.length < 8 || password.length > 64) {
      return 'La contraseña debe tener entre 8 y 64 caracteres.'
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
                placeholder="8-64, mayúscula, minúscula, número y símbolo"
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

      {/* Removed embedded AdminFinanzasPanel: financial system config moved to its own panel */}
    </PanelShell>
  )
}

export function FinanzasConfigPanel({ user }: { user?: AuthUser | null }) {
  const canEditFinanzas = (user?.roles ?? []).some((role) => ['ADMIN', 'ADMINISTRACION', 'DIRECCION'].includes(role?.toUpperCase?.() ?? role))

  // Debug: información para validar acceso
  console.log('=== FinanzasConfigPanel Debug ===')
  console.log('Usuario completo:', user)
  console.log('Roles del usuario:', user?.roles)
  console.log('Permisos del usuario:', user?.permisos)
  console.log('Email del usuario:', user?.email)
  console.log('Roles en mayúscula:', user?.roles?.map(r => r?.toUpperCase?.() ?? r))
  console.log('¿Puede editar finanzas?:', canEditFinanzas)
  console.log('Roles permitidos: ADMIN, ADMINISTRACION, DIRECCION')
  console.log('================================')

  return (
    <PanelShell
      title="Configuración de precios"
      subtitle="Define el precio de matrícula y mensualidad para el período activo."
    >
      {canEditFinanzas ? (
        <AdminFinanzasPanel />
      ) : (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          No tienes permisos para editar precios de matrícula y mensualidad. Contacta a administración.
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
    // case 'noticias':
    //   return <AvisosPanel />
    case 'settings':
      return <SettingsPanel />
    case 'auditoria':
      return <AuditoriaPanel />
    case 'backup':
      return <BackupPanel />
    default:
      return <OverviewPanel user={user} />
  }
}
