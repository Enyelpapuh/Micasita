import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Eye, EyeOff, LoaderCircle, Search, ShieldCheck, UserPlus, Users, X } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import {
  createAdminUsuario,
  getAdminRoles,
  getAdminUsuarios,
  resolveAdminAvatarUrl,
  type AdminRol,
  type AdminUsuario,
  updateAdminUsuarioRoles,
  updateAdminUsuarioEstado,
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

function formatDateLabel(value?: string | null) {
  if (!value) {
    return 'No registrada'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('es-NI', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

function getUserInitials(usuario: AdminUsuario) {
  const first = usuario.nombre?.trim()?.[0] ?? 'U'
  const second = usuario.apellido?.trim()?.[0] ?? ''
  return `${first}${second}`.toUpperCase()
}

function getDisplayIdentifier(usuario: AdminUsuario) {
  return usuario.identificador?.trim() || 'Sin identificador'
}

export function IdentityAccessPanel() {
  const { token } = useAuth()
  const [usuarios, setUsuarios] = useState<AdminUsuario[]>([])
  const [rolesDisponibles, setRolesDisponibles] = useState<AdminRol[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreatePassword, setShowCreatePassword] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterActivo, setFilterActivo] = useState<'all' | 'active' | 'inactive'>('all')
  const [modalMode, setModalMode] = useState<'create' | 'view' | null>(null)
  const [selectedUsuarioId, setSelectedUsuarioId] = useState<number | null>(null)
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isModalSaving, setIsModalSaving] = useState(false)
  const closeTimerRef = useRef<number | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<FormState>({
    defaultValues: initialForm,
    mode: 'onTouched',
  })

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

  useEffect(() => {
    if (modalMode === null) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeModal()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = originalOverflow
    }
  }, [modalMode])

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current)
      }
    }
  }, [])

  const roleOptions = useMemo(() => rolesDisponibles.map((r) => r.nombre), [rolesDisponibles])
  const selectedUsuario = useMemo(() => {
    if (modalMode !== 'view' || selectedUsuarioId === null) {
      return null
    }

    return usuarios.find((usuario) => usuario.usuarioId === selectedUsuarioId) ?? null
  }, [modalMode, selectedUsuarioId, usuarios])
  const filteredUsuarios = useMemo(() => {
    const term = searchTerm.trim().toLocaleLowerCase('es-NI')
    const sortByName = (list: AdminUsuario[]) =>
      [...list].sort((a, b) => {
        const aKey = `${(a.apellido ?? '').trim()} ${(a.nombre ?? '').trim()}`.toLocaleLowerCase('es-NI')
        const bKey = `${(b.apellido ?? '').trim()} ${(b.nombre ?? '').trim()}`.toLocaleLowerCase('es-NI')
        return aKey.localeCompare(bKey, 'es-NI')
      })

    const applyFilters = (list: AdminUsuario[]) => {
      let next = list
      if (filterActivo === 'active') next = next.filter((u) => u.activo)
      if (filterActivo === 'inactive') next = next.filter((u) => !u.activo)
      return sortByName(next)
    }

    if (!term) {
      return applyFilters(usuarios)
    }

    const filtered = usuarios.filter((usuario) => {
      return [
        `${usuario.nombre} ${usuario.apellido}`,
        usuario.nombre,
        usuario.apellido,
        usuario.identificador,
        usuario.email,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase('es-NI').includes(term))
    })

    return applyFilters(filtered)
  }, [searchTerm, usuarios, filterActivo])


  const createValues = watch()

  const syncCreateRoles = async (nextRoles: string[]) => {
    setValue('roles', nextRoles, { shouldDirty: true, shouldValidate: true })
    await trigger('roles')
  }

  const toggleRole = (role: string) => {
    const current = createValues.roles ?? []
    const exists = current.includes(role)

    if (exists) {
      const next = current.filter((item) => item !== role)
      void syncCreateRoles(next.length > 0 ? next : current)
      return
    }

    void syncCreateRoles([...current, role])
  }

  const submitCreate = async (data: FormState) => {
    try {
      const created = await createAdminUsuario(token, {
        nombre: data.nombre.trim(),
        apellido: data.apellido.trim(),
        email: data.email.trim(),
        password: data.password,
        telefono: data.telefono.trim() || null,
        identificador: data.identificador.trim() || null,
        fechaNacimiento: data.fechaNacimiento || null,
        activo: data.activo,
        roles: data.roles,
      })

      setUsuarios((prev) => [created, ...prev])
      reset(initialForm)
      setShowCreatePassword(false)
      toast.success('Usuario creado correctamente')
      closeModal()
    } catch {
      toast.error('No se pudo crear el usuario')
    }
  }

  const openModal = (usuario: AdminUsuario) => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }

    setModalMode('view')
    setSelectedUsuarioId(usuario.usuarioId)
    setSelectedRoles([...usuario.roles])
    setIsModalOpen(true)
  }

  const openCreateModal = () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }

    reset(initialForm)
    setShowCreatePassword(false)
    setModalMode('create')
    setSelectedUsuarioId(null)
    setSelectedRoles([])
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)

    closeTimerRef.current = window.setTimeout(() => {
      setModalMode(null)
      setSelectedUsuarioId(null)
      setSelectedRoles([])
      reset(initialForm)
      setShowCreatePassword(false)
      closeTimerRef.current = null
    }, 180)
  }

  const toggleSelectedRole = (role: string) => {
    setSelectedRoles((prev) => {
      const exists = prev.includes(role)
      if (exists) {
        const next = prev.filter((item) => item !== role)
        return next.length > 0 ? next : prev
      }

      return [...prev, role]
    })
  }

  const saveSelectedRoles = async () => {
    if (modalMode !== 'view' || !selectedUsuario || selectedUsuarioId === null) {
      return
    }

    const roles = selectedRoles.map((role) => role.trim().toUpperCase()).filter(Boolean)

    if (roles.length === 0) {
      toast.error('Debes indicar al menos un rol')
      return
    }

    setIsModalSaving(true)
    try {
      const updated = await updateAdminUsuarioRoles(token, selectedUsuarioId, roles)
      setUsuarios((prev) => prev.map((u) => (u.usuarioId === selectedUsuarioId ? updated : u)))
      setSelectedRoles(updated.roles)
      toast.success('Roles actualizados')
    } catch {
      toast.error('No se pudieron actualizar los roles')
    } finally {
      setIsModalSaving(false)
    }
  }

  const toggleUsuarioEstado = async (activo: boolean) => {
    if (modalMode !== 'view' || selectedUsuarioId === null) return
    setIsModalSaving(true)
    try {
      const updated = await updateAdminUsuarioEstado(token, selectedUsuarioId, activo)
      setUsuarios((prev) => prev.map((u) => (u.usuarioId === selectedUsuarioId ? updated : u)))
      setSelectedRoles(updated.roles)
      toast.success(`Usuario ${updated.activo ? 'activado' : 'desactivado'}`)
    } catch (err) {
      toast.error('No se pudo actualizar el estado del usuario')
    } finally {
      setIsModalSaving(false)
    }
  }

  const renderCreateFields = () => (
    <section className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <UserPlus className="h-5 w-5 text-teal-300" />
        <div>
          <p className="text-sm font-semibold text-white">Crear nuevo usuario</p>
          <p className="text-xs text-slate-400">Completa los datos y asigna roles iniciales.</p>
        </div>
      </div>

      <form className="mt-4 grid gap-3" onSubmit={handleSubmit(submitCreate)} noValidate>
        <div>
          <input
            {...register('nombre', {
              required: 'El nombre es obligatorio',
              minLength: { value: 2, message: 'El nombre debe tener al menos 2 caracteres' },
            })}
            placeholder="Nombre"
            className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none ring-teal-300 placeholder:text-slate-500 focus:ring"
          />
          {errors.nombre ? <p className="mt-1 text-xs text-rose-300">{errors.nombre.message}</p> : null}
        </div>

        <div>
          <input
            {...register('apellido', {
              required: 'El apellido es obligatorio',
              minLength: { value: 2, message: 'El apellido debe tener al menos 2 caracteres' },
            })}
            placeholder="Apellido"
            className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none ring-teal-300 placeholder:text-slate-500 focus:ring"
          />
          {errors.apellido ? <p className="mt-1 text-xs text-rose-300">{errors.apellido.message}</p> : null}
        </div>

        <div>
          <input
            {...register('email', {
              required: 'El correo es obligatorio',
              pattern: {
                value: /^\S+@\S+\.\S+$/,
                message: 'Ingresa un correo válido',
              },
            })}
            placeholder="Email"
            className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none ring-teal-300 placeholder:text-slate-500 focus:ring"
          />
          {errors.email ? <p className="mt-1 text-xs text-rose-300">{errors.email.message}</p> : null}
        </div>

        <div>
          <div className="flex items-center rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm outline-none ring-teal-300 focus-within:ring">
            <input
              {...register('password', {
                required: 'La contraseña es obligatoria',
                minLength: { value: 8, message: 'La contraseña debe tener al menos 8 caracteres' },
                maxLength: { value: 64, message: 'La contraseña no puede superar 64 caracteres' },
                validate: (value) => {
                  if (!/[A-Z]/.test(value)) return 'Debe incluir una mayúscula'
                  if (!/[a-z]/.test(value)) return 'Debe incluir una minúscula'
                  if (!/\d/.test(value)) return 'Debe incluir un número'
                  if (!/[^A-Za-z0-9]/.test(value)) return 'Debe incluir un caracter especial'
                  return true
                },
              })}
              type={showCreatePassword ? 'text' : 'password'}
              placeholder="8-64, mayúscula, minúscula, número y símbolo"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
            />
            <button type="button" onClick={() => setShowCreatePassword((prev) => !prev)} className="text-slate-400 hover:text-white">
              {showCreatePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password ? <p className="mt-1 text-xs text-rose-300">{errors.password.message}</p> : null}
        </div>

        <div>
          <input
            {...register('telefono', {
              validate: (value) => {
                const trimmed = value.trim()
                if (!trimmed) return true
                return /^\d{8}$/.test(trimmed) || 'El teléfono debe tener exactamente 8 dígitos'
              },
            })}
            placeholder="Telefono (opcional)"
            className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none ring-teal-300 placeholder:text-slate-500 focus:ring"
          />
          {errors.telefono ? <p className="mt-1 text-xs text-rose-300">{errors.telefono.message}</p> : null}
        </div>

        <div>
          <input
            {...register('identificador', {
              validate: (value) => {
                const trimmed = value.trim()
                if (!trimmed) return true
                return /^(\d{3}-\d{6}-\d{4}[A-Za-z]|\d{13}[A-Za-z])$/.test(trimmed) || 'Cédula inválida'
              },
            })}
            placeholder="Cedula ej. ###-######-####L (opcional)"
            className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none ring-teal-300 placeholder:text-slate-500 focus:ring"
          />
          {errors.identificador ? <p className="mt-1 text-xs text-rose-300">{errors.identificador.message}</p> : null}
        </div>

        <input
          {...register('fechaNacimiento')}
          type="date"
          className="rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none ring-teal-300 focus:ring"
        />

        <label className="inline-flex items-center gap-2 text-sm text-slate-200">
          <input
            {...register('activo')}
            type="checkbox"
            className="h-4 w-4 rounded border-white/20 bg-slate-950/40 text-teal-500"
          />
          Usuario activo
        </label>

        <div className="rounded-xl border border-white/10 bg-slate-950/30 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">Roles</p>
          <input
            type="hidden"
            {...register('roles', {
              validate: (value) => value.length > 0 || 'Selecciona al menos un rol',
            })}
          />
          <div className="flex flex-wrap gap-2">
            {roleOptions.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => toggleRole(role)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${createValues.roles.includes(role) ? 'border-teal-300 bg-teal-400/20 text-teal-100' : 'border-white/10 bg-white/5 text-slate-300 hover:border-teal-300/40 hover:bg-white/10'}`}
              >
                {role}
              </button>
            ))}
          </div>
          {errors.roles ? <p className="mt-2 text-xs text-rose-300">{errors.roles.message}</p> : null}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-xl bg-teal-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-teal-300 disabled:opacity-70"
        >
          {isSubmitting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
          Crear usuario
        </button>
      </form>
    </section>
  )

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

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.25fr]">
        <div className="rounded-2xl border border-slate-200 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-slate-900">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              <p className="text-sm font-semibold uppercase tracking-[0.12em]">Buscador y listado</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                <Users className="mr-2 h-3.5 w-3.5 text-slate-400" />
                {filteredUsuarios.length} de {usuarios.length}
              </div>
                <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white/5 px-2 py-1 text-xs text-slate-300">
                  <button
                    type="button"
                    onClick={() => setFilterActivo('all')}
                    className={`px-2 ${filterActivo === 'all' ? 'font-semibold text-teal-300' : 'text-slate-400'}`}
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterActivo('active')}
                    className={`px-2 ${filterActivo === 'active' ? 'font-semibold text-teal-300' : 'text-slate-400'}`}
                  >
                    Activos
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterActivo('inactive')}
                    className={`px-2 ${filterActivo === 'inactive' ? 'font-semibold text-teal-300' : 'text-slate-400'}`}
                  >
                    Inactivos
                  </button>
                </div>
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center rounded-xl bg-teal-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-teal-700"
              >
                <UserPlus className="mr-2 h-3.5 w-3.5" />
                Agregar nuevo usuario
              </button>
            </div>
          </div>

          <div className="mb-4 flex items-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm ring-teal-300 focus-within:ring">
            <Search className="mr-2 h-4 w-4 shrink-0 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por nombre, apellido, email o identificador"
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
            {searchTerm ? (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="ml-2 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Limpiar busqueda"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-10 text-slate-600">
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              Cargando usuarios...
            </div>
          ) : null}

          {!isLoading ? (
            <div className="space-y-3">
              {filteredUsuarios.map((usuario) => (
                <article key={usuario.usuarioId} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-teal-200 hover:shadow-md">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      {usuario.pathAvatar ? (
                        <img
                          src={resolveAdminAvatarUrl(usuario.pathAvatar)}
                          alt={`${usuario.nombre} ${usuario.apellido}`}
                          className="h-12 w-12 rounded-full border border-slate-200 object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-gradient-to-br from-teal-100 to-sky-100 text-sm font-semibold text-slate-700">
                          {getUserInitials(usuario)}
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {usuario.nombre} {usuario.apellido}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">ID: {getDisplayIdentifier(usuario)}</p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">{usuario.email}</p>
                      </div>
                    </div>

                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${usuario.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                      {usuario.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="rounded-full bg-slate-100 px-3 py-1">Usuario #{usuario.usuarioId}</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1">Roles: {usuario.roles.length}</span>
                  </div>

                  <div className="mt-4 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => openModal(usuario)}
                      className="inline-flex items-center rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-700"
                    >
                      Ver
                    </button>
                  </div>
                </article>
              ))}

              {filteredUsuarios.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  No hay usuarios para mostrar con ese filtro.
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {modalMode !== null
        ? createPortal(
          <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/55 p-4 backdrop-blur-sm sm:p-6">
            <div className="flex min-h-full items-start justify-center py-6">
              <div
                className={`absolute inset-0 transition-opacity duration-200 ${isModalOpen ? 'opacity-100' : 'opacity-0'}`}
                onClick={closeModal}
                aria-hidden="true"
              />

              <section
                role="dialog"
                aria-modal="true"
                aria-labelledby={modalMode === 'create' ? 'identity-create-modal-title' : 'identity-user-modal-title'}
                className={`relative z-10 w-full max-w-4xl overflow-hidden rounded-[2rem] border border-slate-700/60 bg-slate-950 text-slate-100 shadow-[0_30px_120px_rgba(15,23,42,0.6)] transition-all duration-200 ${isModalOpen ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-3 scale-95 opacity-0'}`}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.12),_transparent_42%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(15,23,42,0.92))]" />

                <div className="relative max-h-[calc(100vh-5rem)] overflow-y-auto p-5 sm:p-6">
                  {modalMode === 'create' ? (
                    <>
                      <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-300">Alta de usuario</p>
                          <h2 id="identity-create-modal-title" className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                            Agregar nuevo usuario
                          </h2>
                          <p className="mt-2 max-w-2xl text-sm text-slate-400">Completa la información básica y asigna los roles iniciales.</p>
                        </div>

                        <button
                          type="button"
                          onClick={closeModal}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
                          aria-label="Cerrar modal"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-5 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
                        {renderCreateFields()}

                        <section className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4 sm:p-5">
                          <p className="text-sm font-semibold text-white">Resumen</p>
                          <p className="mt-1 text-xs text-slate-400">Revisa la información antes de confirmar.</p>

                          <div className="mt-4 grid gap-3 text-sm text-slate-200">
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                              <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Nombre completo</p>
                              <p className="mt-1 font-semibold text-white">{createValues.nombre || 'Sin nombre'} {createValues.apellido || ''}</p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                              <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Correo</p>
                              <p className="mt-1 font-semibold text-white">{createValues.email || 'Sin correo'}</p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                              <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Identificador</p>
                              <p className="mt-1 font-semibold text-white">{createValues.identificador || 'Sin identificador'}</p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                              <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Roles seleccionados</p>
                              <p className="mt-1 font-semibold text-white">{createValues.roles.length}</p>
                            </div>
                          </div>

                          <div className="mt-6 text-xs text-slate-400">Los errores visibles aparecen junto a cada campo del formulario.</div>
                        </section>
                      </div>
                    </>
                  ) : selectedUsuario ? (
                    <>
                      <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
                        <div className="flex items-center gap-4">
                          {selectedUsuario.pathAvatar ? (
                            <img
                              src={resolveAdminAvatarUrl(selectedUsuario.pathAvatar)}
                              alt={`${selectedUsuario.nombre} ${selectedUsuario.apellido}`}
                              className="h-16 w-16 rounded-3xl border border-white/10 object-cover"
                            />
                          ) : (
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl border border-teal-400/20 bg-teal-500/15 text-lg font-bold text-teal-100 shadow-[0_0_0_1px_rgba(45,212,191,0.12)]">
                              {getUserInitials(selectedUsuario)}
                            </div>
                          )}

                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-300">Detalle del usuario</p>
                            <h2 id="identity-user-modal-title" className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                              {selectedUsuario.nombre} {selectedUsuario.apellido}
                            </h2>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-300">
                              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">ID usuario #{selectedUsuario.usuarioId}</span>
                              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Identificador: {getDisplayIdentifier(selectedUsuario)}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={closeModal}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
                          aria-label="Cerrar modal"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-5 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
                        <section className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4 sm:p-5">
                          <p className="text-sm font-semibold text-white">Informacion previa</p>
                          <p className="mt-1 text-xs text-slate-400">Datos de referencia del usuario seleccionado.</p>

                          <div className="mt-4 grid gap-3 text-sm text-slate-200">
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                              <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Correo</p>
                              <p className="mt-1 font-semibold text-white">{selectedUsuario.email}</p>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                              <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Telefono</p>
                              <p className="mt-1 font-semibold text-white">{selectedUsuario.telefono?.trim() || 'No registrado'}</p>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                              <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Fecha de nacimiento</p>
                              <p className="mt-1 font-semibold text-white">{formatDateLabel(selectedUsuario.fechaNacimiento)}</p>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                              <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Estado</p>
                              <p className="mt-1 font-semibold text-white">{selectedUsuario.activo ? 'Activo' : 'Inactivo'}</p>
                            </div>

                            <div className="mt-3">
                              <button
                                type="button"
                                onClick={() => void toggleUsuarioEstado(!selectedUsuario.activo)}
                                disabled={isModalSaving}
                                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10 disabled:opacity-60"
                              >
                                {isModalSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                                {selectedUsuario.activo ? 'Desactivar usuario' : 'Activar usuario'}
                              </button>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                              <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Roles actuales</p>
                              <p className="mt-1 font-semibold text-white">{selectedUsuario.roles.length} asignados</p>
                            </div>
                          </div>
                        </section>

                        <section className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4 sm:p-5">
                          <p className="text-sm font-semibold text-white">Editar roles</p>
                          <p className="mt-1 text-xs text-slate-400">Selecciona los roles que deseas conservar para este usuario.</p>

                          <div className="mt-4 flex flex-wrap gap-2">
                            {roleOptions.map((role) => {
                              const isSelected = selectedRoles.includes(role)
                              return (
                                <button
                                  key={role}
                                  type="button"
                                  onClick={() => toggleSelectedRole(role)}
                                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${isSelected ? 'border-teal-300 bg-teal-400/20 text-teal-100' : 'border-white/10 bg-white/5 text-slate-300 hover:border-teal-300/40 hover:bg-white/10'}`}
                                >
                                  {role}
                                </button>
                              )
                            })}
                          </div>

                          <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/30 p-3 text-sm text-slate-300">
                            <p>Roles seleccionados: <span className="font-semibold text-white">{selectedRoles.length}</span></p>
                            <p className="mt-1 text-xs text-slate-400">El guardado actualiza solo la asignacion de roles.</p>
                          </div>

                          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-end">
                            <button
                              type="button"
                              onClick={closeModal}
                              className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() => void saveSelectedRoles()}
                              disabled={isModalSaving}
                              className="inline-flex items-center justify-center rounded-2xl bg-teal-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-teal-300 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isModalSaving ? 'Guardando...' : 'Guardar cambios'}
                            </button>
                          </div>
                        </section>
                      </div>
                    </>
                  ) : null}
                </div>
              </section>
            </div>
          </div>,
          document.body,
        )
        : null}
    </section>
  )
}
