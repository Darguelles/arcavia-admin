import { type ReactNode } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { create } from 'zustand'
import {
  Building2,
  Flag,
  LayoutDashboard,
  LogOut,
  MapPin,
  Megaphone,
  ScrollText,
  Settings,
  Shield,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import { t } from '../lib/i18n'
import { cn } from '../lib/utils'
import { useCities } from '../api/cities'
import { useToast } from './Toast'
import { useAuthStore } from '../auth/store'
import { overline } from './ui'
import logoUrl from '../assets/logo.svg'
import type { Role } from '../api/types'

// City filter lives in Zustand (transient UI state per spec §2)
interface CityFilterState {
  cityId: string
  setCityId: (id: string) => void
}
export const useCityFilter = create<CityFilterState>((set) => ({
  cityId: '',
  setCityId: (cityId) => set({ cityId }),
}))

// `roles` restricts an entry to those roles; omitted = visible to everyone.
// (Visibility only — the API enforces the real permission.)
const NAV_ITEMS: Array<{
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
  roles?: Role[]
}> = [
  { to: '/admin', label: t.dashboard, icon: LayoutDashboard, end: true },
  { to: '/admin/cities', label: t.cities, icon: Building2 },
  { to: '/admin/campaigns', label: t.campaigns, icon: Megaphone },
  { to: '/admin/missions', label: t.missions, icon: MapPin },
  { to: '/admin/review-queue', label: t.reviewQueue, icon: Flag },
  { to: '/admin/users', label: t.users, icon: Users },
  { to: '/admin/team', label: t.team, icon: Shield, roles: ['root'] },
  { to: '/admin/audit', label: t.audit, icon: ScrollText, roles: ['root', 'admin'] },
  { to: '/admin/settings', label: t.settings, icon: Settings },
]

// Header title per section (longest prefix wins).
const TITLES: Array<[string, string]> = [
  ['/admin/cities', t.cities],
  ['/admin/campaigns', t.campaigns],
  ['/admin/missions', t.missions],
  ['/admin/review-queue', t.reviewQueueTitle],
  ['/admin/users', t.users],
  ['/admin/team', t.teamTitle],
  ['/admin/audit', t.auditTitle],
  ['/admin/settings', t.settings],
]

const ROLE_LABELS: Record<Role, string> = {
  root: 'root',
  admin: 'admin',
  staff: 'staff',
  player: 'player',
}

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const { cityId, setCityId } = useCityFilter()
  const { data: citiesPage } = useCities({ limit: 100 })
  const cities = citiesPage?.items ?? []
  const role = useAuthStore((s) => s.role)
  const navItems = NAV_ITEMS.filter(
    (item) => !item.roles || (role !== null && item.roles.includes(role))
  )
  const title = TITLES.find(([prefix]) => location.pathname.startsWith(prefix))?.[1] ?? t.dashboard

  async function handleLogout() {
    await logout()
    navigate('/admin/login', { replace: true })
    toast.success('Sesión cerrada.')
  }

  return (
    <div className="flex h-screen bg-paper overflow-hidden">
      {/* Rail */}
      <aside className="w-[232px] bg-ink flex flex-col shrink-0">
        <div className="px-5 pt-[22px] pb-[18px] flex items-end gap-2.5 border-b border-cream/12">
          <h1 className="m-0">
            <img
              src={logoUrl}
              alt="Arcavia Quest"
              width={260}
              height={122}
              className="h-auto w-[124px]"
            />
          </h1>
          <span className="ml-auto text-cream/45 text-[10px] font-semibold tracking-[0.12em] uppercase">
            Panel
          </span>
        </div>

        <nav
          className="flex-1 py-3 overflow-y-auto flex flex-col gap-px"
          aria-label="Navegación principal"
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-5 py-2.5 text-sm border-l-[3px] transition-colors',
                  isActive
                    ? 'bg-ink-2 border-gold text-cream font-semibold'
                    : 'border-transparent text-cream/60 hover:bg-ink-2 hover:text-cream'
                )
              }
            >
              <item.icon aria-hidden size={18} strokeWidth={1.5} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-5 pt-3.5 pb-[18px] border-t border-cream/12 flex flex-col gap-3.5">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="h-[30px] w-[30px] rounded-full bg-ink-2 text-cream text-xs font-semibold inline-flex items-center justify-center"
            >
              EA
            </span>
            <div className="flex flex-col">
              <span className="text-cream text-[12.5px] font-medium">Equipo Arcavia</span>
              {role && <span className="text-cream/45 text-[11px]">{ROLE_LABELS[role]}</span>}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 text-[13px] text-cream/60 hover:text-cream transition-colors cursor-pointer"
          >
            <LogOut aria-hidden size={15} strokeWidth={1.5} />
            {t.logout}
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header: page title + city filter */}
        <header className="bg-surface border-b border-line px-8 h-[68px] flex items-center gap-5 shrink-0">
          <h2 className="m-0 text-xl font-semibold">{title}</h2>
          <div className="ml-auto flex items-center gap-2">
            <label htmlFor="city-filter" className={overline}>
              Ciudad
            </label>
            <select
              id="city-filter"
              value={cityId}
              onChange={(e) => setCityId(e.target.value)}
              className="h-9 rounded-control border border-line-strong bg-surface pl-2.5 pr-8 py-0 text-[13.5px] text-ink focus:outline-none focus:border-ink"
            >
              <option value="">Todas las ciudades</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  )
}
