import type { PropsWithChildren } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import type { Role } from '@/types/auth'
import { useAuth } from '../model/AuthProvider'

type ProtectedRouteProps = PropsWithChildren<{
  allowedRoles?: Role[]
}>

export function ProtectedRoute({
  allowedRoles,
  children,
}: ProtectedRouteProps) {
  const { user, role, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div />
  }

  if (!user || !role) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}
