import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from './store'
import { ADMIN_ROLES } from '../api/types'

export function RequireAdmin() {
  const { accessToken, role, forceReset } = useAuthStore()
  const location = useLocation()

  if (!accessToken || !role || !ADMIN_ROLES.includes(role)) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  if (forceReset && location.pathname !== '/admin/reset-password') {
    return <Navigate to="/admin/reset-password" replace />
  }

  return <Outlet />
}
