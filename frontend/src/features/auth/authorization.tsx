import { useMemo } from 'react'
import { useAuth } from './AuthContext'

export const appPermissions = {
  dashboardAcademico: 'DASHBOARD_ACADEMICO',
  talleresView: 'TALLERES_VIEW',
  talleresCreate: 'TALLERES_CREATE',
  talleresEdit: 'TALLERES_EDIT',
  talleresPublish: 'TALLERES_PUBLISH',
} as const

export type AppPermission = (typeof appPermissions)[keyof typeof appPermissions]

function normalize(items: string[] | undefined) {
  return new Set((items ?? []).map((item) => item.trim().toUpperCase()))
}

export function useAuthorization() {
  const { user } = useAuth()

  return useMemo(() => {
    const roleSet = normalize(user?.roles)
    const permissionSet = normalize(user?.permisos)

    const hasRole = (...roles: string[]) => roles.some((role) => roleSet.has(role.toUpperCase()))

    const hasPermission = (permission: AppPermission | string) => permissionSet.has(permission.toUpperCase())

    const can = (permission: AppPermission | string, fallbackRoles: string[] = []) => {
      return hasPermission(permission) || hasRole(...fallbackRoles)
    }

    return {
      user,
      hasRole,
      hasPermission,
      can,
    }
  }, [user])
}
