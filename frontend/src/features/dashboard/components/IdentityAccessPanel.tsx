import { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Eye, EyeOff, LoaderCircle, ShieldCheck, UserPlus, Users } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import {
  createAdminUsuario,
  getAdminRoles,
  getAdminUsuarios,
  resolveAdminAvatarUrl,
  type AdminRol,
  type AdminUsuario,
  uploadAdminUsuarioAvatar,
  updateAdminUsuarioEstado,
  updateAdminUsuarioRoles,
} from './identity-access.api'

type FormState = {
  nombre: string
  apellido: string
  email: string
  password: string
  telefono: string
  identificador: string
  fechaNacimiento: string
  activo: boolean
  roles: string[]
}

const initialForm: FormState = {
  nombre: '',
  apellido: '',
  email: '',
  password: '',
  telefono: '',
  identificador: '',
  fechaNacimiento: '',
  activo: true,
  roles: ['ADMINISTRACION'],
}

export function IdentityAccessPanel() {
  const { token } = useAuth()
  const [usuarios, setUsuarios] = useState<AdminUsuario[]>([])
  const [rolesDisponibles, setRolesDisponibles] = useState<AdminRol[]>([])
  const [editableRolesByUser, setEditableRolesByUser] = useState<Record<number, string[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [updatingEstadoUserId, setUpdatingEstadoUserId] = useState<number | null>(null)
  const [showCreatePassword, setShowCreatePassword] = useState(false)
  const [uploadingUserId, setUploadingUserId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(initialForm)
  const avatarInputRefs = useRef<Record<number, HTMLInputElement | null>>({})

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setIsLoading(true)
      try {
        const [usuariosData, rolesData] = await Promise.all([
          getAdminUsuarios(token),
          getAdminRoles(token),
        ])

        if (!cancelled) {
          setUsuarios(usuariosData)
          setRolesDisponibles(rolesData)
          setEditableRolesByUser(
            usuariosData.reduce<Record<number, string[]>>((acc, usuario) => {
              acc[usuario.usuarioId] = usuario.roles
              return acc
            }, {}),
          )
        }
      } catch {
        if (!cancelled) {
          toast.error('No se pudo cargar el modulo de identidad y acceso')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [token])

  const roleOptions = useMemo(() => rolesDisponibles.map((r) => r.nombre), [rolesDisponibles])

  const toggleRole = (role: string) => {
    setForm((prev) => {
      const exists = prev.roles.includes(role)
      if (exists) {
        const next = prev.roles.filter((r) => r !== role)
        return { ...prev, roles: next.length > 0 ? next : prev.roles }
      }
      return { ...prev, roles: [...prev.roles, role] }
    })
  }

  const submitCreate = async () => {
    const telefono = form.telefono.trim()
    const identificador = form.identificador.trim()

    if (!form.nombre.trim() || !form.apellido.trim() || !form.email.trim() || !form.password.trim()) {
      toast.error('Nombre, apellido, email y password son requeridos')
      return
    }

    if (telefono && !/^\d{8}$/.test(telefono)) {
      toast.error('Telefono debe tener exactamente 8 digitos')
      return
    }

    if (identificador && !/^(\d{3}-\d{6}-\d{4}[A-Za-z]|\d{13}[A-Za-z])$/.test(identificador)) {
      toast.error('Cedula invalida. Usa formato nicaraguense ###-######-####L o sin guiones')
      return
    }

    if (form.roles.length === 0) {
      toast.error('Selecciona al menos un rol')
      return
    }

    if (form.password.length < 10 || form.password.length > 64) {
      toast.error('La contraseña debe tener entre 10 y 64 caracteres')
      return
    }

    if (!/[A-Z]/.test(form.password) || !/[a-z]/.test(form.password) || !/\d/.test(form.password) || !/[^A-Za-z0-9]/.test(form.password)) {
      toast.error('La contraseña debe incluir mayúscula, minúscula, número y caracter especial')
      return
    }

    setIsSaving(true)
    try {
      const created = await createAdminUsuario(token, {
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        email: form.email.trim(),
        password: form.password,
        telefono: telefono || null,
        identificador: identificador || null,
        fechaNacimiento: form.fechaNacimiento || null,
        activo: form.activo,
        roles: form.roles,
      })

      setUsuarios((prev) => [created, ...prev])
      setForm(initialForm)
      toast.success('Usuario creado correctamente')
    } catch {
      toast.error('No se pudo crear el usuario')
    } finally {
      setIsSaving(false)
    }
  }

  const updateRoles = async (usuarioId: number) => {
    const roles = (editableRolesByUser[usuarioId] ?? []).map((r) => r.trim().toUpperCase()).filter(Boolean)

    if (roles.length === 0) {
      toast.error('Debes indicar al menos un rol')
      return
    }

    try {
      const updated = await updateAdminUsuarioRoles(token, usuarioId, roles)
      setUsuarios((prev) => prev.map((u) => (u.usuarioId === usuarioId ? updated : u)))
      setEditableRolesByUser((prev) => ({ ...prev, [usuarioId]: updated.roles }))
      toast.success('Roles actualizados')
    } catch {
      toast.error('No se pudieron actualizar los roles')
    }
  }

  const toggleUserRole = (usuarioId: number, role: string) => {
    setEditableRolesByUser((prev) => {
      const current = prev[usuarioId] ?? []
      const exists = current.includes(role)

      if (exists) {
        const next = current.filter((r) => r !== role)
        return { ...prev, [usuarioId]: next.length > 0 ? next : current }
      }

      return { ...prev, [usuarioId]: [...current, role] }
    })
  }

  const uploadAvatar = async (usuarioId: number, file: File | null) => {
    if (!file) {
      return
    }

    if (!file.type.startsWith('image/')) {
      toast.error('El archivo debe ser una imagen')
      return
    }

    setUploadingUserId(usuarioId)
    try {
      const updated = await uploadAdminUsuarioAvatar(token, usuarioId, file)
      setUsuarios((prev) => prev.map((u) => (u.usuarioId === usuarioId ? updated : u)))
      toast.success('Avatar actualizado')
    } catch {
      toast.error('No se pudo subir el avatar')
    } finally {
      setUploadingUserId(null)
    }
  }

  const toggleEstadoUsuario = async (usuario: AdminUsuario) => {
    setUpdatingEstadoUserId(usuario.usuarioId)
    try {
      const updated = await updateAdminUsuarioEstado(token, usuario.usuarioId, !usuario.activo)
      setUsuarios((prev) => prev.map((u) => (u.usuarioId === usuario.usuarioId ? updated : u)))
      toast.success(updated.activo ? 'Usuario activado' : 'Usuario desactivado')
    } catch {
      toast.error('No se pudo actualizar el estado del usuario')
    } finally {
      setUpdatingEstadoUserId(null)
    }
  }

  return (
    <section className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Seguridad</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Identidad y Acceso</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
            Crea usuarios del sistema y administra la asignacion de roles para la fase operativa.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Usuarios registrados</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{usuarios.length}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Roles disponibles</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{rolesDisponibles.length}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Modulo</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">Activo</p>
        </article>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <div className="rounded-2xl border border-slate-200 p-4">
          <div className="mb-3 flex items-center gap-2 text-slate-900">
            <UserPlus className="h-4 w-4" />
            <p className="text-sm font-semibold uppercase tracking-[0.12em]">Crear usuario</p>
          </div>

          <div className="grid gap-3">
            <input value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} placeholder="Nombre" className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-300 focus:ring" />
            <input value={form.apellido} onChange={(e) => setForm((p) => ({ ...p, apellido: e.target.value }))} placeholder="Apellido" className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-300 focus:ring" />
            <input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="Email" className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-300 focus:ring" />
            <div className="flex items-center rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-300 focus-within:ring">
              <input
                type={showCreatePassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="10-64, mayúscula, minúscula, número y símbolo"
                className="w-full bg-transparent text-sm outline-none"
              />
              <button type="button" onClick={() => setShowCreatePassword((prev) => !prev)} className="text-slate-500 hover:text-slate-700">
                {showCreatePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <input value={form.telefono} onChange={(e) => setForm((p) => ({ ...p, telefono: e.target.value }))} placeholder="Telefono (opcional)" className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-300 focus:ring" />
            <input value={form.identificador} onChange={(e) => setForm((p) => ({ ...p, identificador: e.target.value }))} placeholder="Cedula ej. ###-######-####L (opcional)" className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-300 focus:ring" />
            <input type="date" value={form.fechaNacimiento} onChange={(e) => setForm((p) => ({ ...p, fechaNacimiento: e.target.value }))} className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-300 focus:ring" />

            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={form.activo} onChange={(e) => setForm((p) => ({ ...p, activo: e.target.checked }))} />
              Usuario activo
            </label>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-600">Roles</p>
              <div className="flex flex-wrap gap-2">
                {roleOptions.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => toggleRole(role)}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${form.roles.includes(role) ? 'border-teal-500 bg-teal-100 text-teal-800' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'}`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={submitCreate}
              disabled={isSaving}
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-70"
            >
              {isSaving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
              Crear usuario
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 p-4">
          <div className="mb-3 flex items-center gap-2 text-slate-900">
            <ShieldCheck className="h-4 w-4" />
            <p className="text-sm font-semibold uppercase tracking-[0.12em]">Gestion de roles</p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-10 text-slate-600">
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              Cargando usuarios...
            </div>
          ) : null}

          {!isLoading ? (
            <div className="space-y-3">
              {usuarios.map((usuario) => (
                <div key={usuario.usuarioId} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      {usuario.pathAvatar ? (
                        <img
                          src={resolveAdminAvatarUrl(usuario.pathAvatar)}
                          alt={`${usuario.nombre} ${usuario.apellido}`}
                          className="h-12 w-12 rounded-full border border-slate-200 object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-xs font-semibold text-slate-700">
                          {(usuario.nombre?.[0] ?? 'U').toUpperCase()}
                          {(usuario.apellido?.[0] ?? '').toUpperCase()}
                        </div>
                      )}

                      <div>
                        <p className="text-sm font-semibold text-slate-900">{usuario.nombre} {usuario.apellido}</p>
                        <p className="text-xs text-slate-500">{usuario.email}</p>
                      </div>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${usuario.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                      {usuario.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>

                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    {roleOptions.map((role) => (
                      <button
                        key={`${usuario.usuarioId}-${role}`}
                        type="button"
                        onClick={() => toggleUserRole(usuario.usuarioId, role)}
                        className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${(editableRolesByUser[usuario.usuarioId] ?? []).includes(role) ? 'border-teal-500 bg-teal-100 text-teal-800' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'}`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => updateRoles(usuario.usuarioId)}
                      className="inline-flex items-center rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700"
                    >
                      Guardar roles
                    </button>

                    <button
                      type="button"
                      onClick={() => avatarInputRefs.current[usuario.usuarioId]?.click()}
                      disabled={uploadingUserId === usuario.usuarioId}
                      className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-70"
                    >
                      {uploadingUserId === usuario.usuarioId ? <LoaderCircle className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
                      Subir imagen
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleEstadoUsuario(usuario)}
                      disabled={updatingEstadoUserId === usuario.usuarioId}
                      className={`inline-flex items-center rounded-xl px-3 py-2 text-xs font-semibold text-white disabled:opacity-70 ${usuario.activo ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                    >
                      {updatingEstadoUserId === usuario.usuarioId ? <LoaderCircle className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
                      {usuario.activo ? 'Desactivar' : 'Activar'}
                    </button>

                    <input
                      ref={(el) => {
                        avatarInputRefs.current[usuario.usuarioId] = el
                      }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0] ?? null
                        uploadAvatar(usuario.usuarioId, file)
                        event.currentTarget.value = ''
                      }}
                    />

                    <span className="inline-flex items-center rounded-xl bg-slate-100 px-3 text-xs text-slate-600">
                      <Users className="mr-1 h-3.5 w-3.5" />
                      {(editableRolesByUser[usuario.usuarioId] ?? usuario.roles).length}
                    </span>
                  </div>
                </div>
              ))}

              {usuarios.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  No hay usuarios para mostrar.
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
