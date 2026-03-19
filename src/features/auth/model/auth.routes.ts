import type { Role } from '@/types/auth'

export const roleHomeRoutes: Record<Role, string> = {
  user: '/dashboard',
  developer: '/developer',
  industrialist: '/industrialist',
  utilities: '/utilities',
  akimat: '/akimat',
  admin: '/admin',
}

export function getDefaultRouteForRole(role: Role | null): string {
  if (!role) {
    return '/login'
  }

  return roleHomeRoutes[role]
}
