import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from './store'

export function RequireAdmin() {
  const { accessToken, role, forceReset } = useAuthStore()
  const location = useLocation()

  if (!accessToken || role !== 'admin') {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  if (forceReset && location.pathname !== '/admin/reset-password') {
    return <Navigate to="/admin/reset-password" replace />
  }

  return <Outlet />
}
