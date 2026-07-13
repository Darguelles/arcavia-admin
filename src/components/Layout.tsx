import { type ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { create } from 'zustand'
import { useAuth } from '../auth/useAuth'
import { t } from '../lib/i18n'
import { cn } from '../lib/utils'
import { useCities } from '../api/cities'
import { useToast } from './Toast'

// City filter lives in Zustand (transient UI state per spec §2)
interface CityFilterState {
  cityId: string
  setCityId: (id: string) => void
}
export const useCityFilter = create<CityFilterState>((set) => ({
  cityId: '',
  setCityId: (cityId) => set({ cityId }),
}))

const NAV_ITEMS = [
  { to: '/admin', label: t.dashboard, icon: '▦', end: true },
  { to: '/admin/cities', label: t.cities, icon: '🏙' },
  { to: '/admin/campaigns', label: t.campaigns, icon: '📋' },
  { to: '/admin/missions', label: t.missions, icon: '📍' },
  { to: '/admin/users', label: t.users, icon: '👤' },
  { to: '/admin/settings', label: t.settings, icon: '⚙' },
]

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const { cityId, setCityId } = useCityFilter()
  const { data: citiesPage } = useCities({ limit: 100 })
  const cities = citiesPage?.items ?? []

  async function handleLogout() {
    await logout()
    navigate('/admin/login', { replace: true })
    toast.success('Sesión cerrada.')
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="px-4 py-5 border-b border-gray-100">
          <h1 className="text-lg font-bold text-indigo-700">Arcavia Admin</h1>
        </div>

        <nav className="flex-1 py-3 overflow-y-auto" aria-label="Navegación principal">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 border-r-2 border-indigo-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )
              }
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-3 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 py-1 transition-colors"
          >
            <span aria-hidden>↩</span>
            {t.logout}
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with city filter */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4">
          <label
            htmlFor="city-filter"
            className="text-sm text-gray-600 font-medium whitespace-nowrap"
          >
            Ciudad:
          </label>
          <select
            id="city-filter"
            value={cityId}
            onChange={(e) => setCityId(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="">Todas las ciudades</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
