import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { useUsers } from '../../api/users'
import { ADMIN_ROLES, type Role, type User } from '../../api/types'
import { DataTable } from '../../components/DataTable'
import { Badge, btnRowAction } from '../../components/ui'
import { t } from '../../lib/i18n'
import { cn, formatDate, formatDateTime } from '../../lib/utils'

const LIMIT = 20

// Column id (frontend) → backend sort_by key.
const SORT_KEY: Record<string, string> = {
  email: 'email',
  role: 'role',
  is_active: 'is_active',
  registered_at: 'created_at',
  last_activity_at: 'last_activity',
}

type StatusFilter = '' | 'active' | 'inactive'

/** Initials for the row avatar: first letters of the first two name words. */
function initials(u: User): string {
  const src = (u.display_name || u.email).trim()
  return src
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join('')
    .toUpperCase()
}

function Avatar({ user }: { user: User }) {
  const ini = initials(user)
  const isAdmin = ADMIN_ROLES.includes(user.role)
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
        !ini
          ? 'bg-line-soft text-faint'
          : isAdmin
            ? 'bg-ink text-cream'
            : 'bg-gold-tint text-gold-deep'
      )}
    >
      {ini || '·'}
    </span>
  )
}

const inputCls =
  'h-10 rounded-control border border-line-strong bg-surface px-2.5 text-[13.5px] text-ink focus:outline-none focus:border-gold'

export function UsersPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [role, setRole] = useState<Role | ''>('')
  const [status, setStatus] = useState<StatusFilter>('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [sortCol, setSortCol] = useState('registered_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [offset, setOffset] = useState(0)

  const hasFilters = !!(search || role || status || from || to)

  const { data, isLoading } = useUsers({
    search: search || undefined,
    role: role || undefined,
    is_active: status === '' ? undefined : status === 'active',
    registered_from: from || undefined,
    registered_to: to || undefined,
    sort_by: SORT_KEY[sortCol],
    sort_dir: sortDir,
    limit: LIMIT,
    offset,
  })

  // Any change to the query resets to the first page.
  function resetPage() {
    setOffset(0)
  }

  function handleSort(columnId: string) {
    if (columnId === sortCol) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortCol(columnId)
      setSortDir('asc')
    }
    resetPage()
  }

  function clearFilters() {
    setSearch('')
    setRole('')
    setStatus('')
    setFrom('')
    setTo('')
    resetPage()
  }

  const columns: ColumnDef<User, unknown>[] = [
    {
      accessorKey: 'email',
      header: t.email,
      meta: { sortable: true },
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar user={row.original} />
          <div>
            <p className="font-medium text-ink">
              {row.original.display_name || row.original.email}
            </p>
            {row.original.display_name && (
              <p className="mt-0.5 text-xs text-faint">{row.original.email}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'role',
      header: t.colRole,
      meta: { sortable: true },
      cell: ({ row }) => (
        <Badge variant={ADMIN_ROLES.includes(row.original.role) ? 'admin' : 'neutral'}>
          {row.original.role === 'admin' ? t.roleAdmin : t.rolePlayer}
        </Badge>
      ),
    },
    {
      accessorKey: 'is_active',
      header: t.filterStatus,
      meta: { sortable: true },
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? 'success' : 'danger'}>
          {row.original.is_active ? t.active : t.inactive}
        </Badge>
      ),
    },
    {
      // The list endpoint doesn't return per-user points yet (see the user
      // detail overview) — the design's column renders the absent marker.
      id: 'points',
      header: t.waypoints, // "Puntos" — no dedicated column key yet
      meta: { align: 'right' },
      cell: () => <span className="text-faint">—</span>,
    },
    {
      accessorKey: 'registered_at',
      header: t.colRegistered,
      meta: { sortable: true },
      cell: ({ row }) => (
        <span className="text-muted">{formatDate(row.original.registered_at)}</span>
      ),
    },
    {
      accessorKey: 'last_activity_at',
      header: t.colLastActivity,
      meta: { sortable: true },
      cell: ({ row }) =>
        row.original.last_activity_at ? (
          <span className="text-muted">{formatDateTime(row.original.last_activity_at)}</span>
        ) : (
          <span className="text-faint">—</span>
        ),
    },
    {
      id: 'actions',
      header: '',
      meta: { align: 'right' },
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => navigate(`/admin/users/${row.original.id}`)}
          className={btnRowAction}
        >
          {t.viewDetail}
        </button>
      ),
    },
  ]

  return (
    <div className="max-w-[1120px] flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative flex items-center">
          <Search
            size={16}
            strokeWidth={1.5}
            aria-hidden
            className="pointer-events-none absolute left-3 text-faint"
          />
          <input
            type="search"
            placeholder={t.searchUsersPlaceholder}
            aria-label={t.searchUsersPlaceholder}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              resetPage()
            }}
            className={cn(inputCls, 'w-[300px] pl-9 text-sm')}
          />
        </div>

        <select
          aria-label={t.filterRole}
          value={role}
          onChange={(e) => {
            setRole(e.target.value as Role | '')
            resetPage()
          }}
          className={inputCls}
        >
          <option value="">
            {t.filterRole} · {t.filterAll}
          </option>
          <option value="player">{t.rolePlayer}</option>
          <option value="admin">{t.roleAdmin}</option>
        </select>

        <select
          aria-label={t.filterStatus}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as StatusFilter)
            resetPage()
          }}
          className={inputCls}
        >
          <option value="">
            {t.filterStatus} · {t.filterAll}
          </option>
          <option value="active">{t.active}</option>
          <option value="inactive">{t.inactive}</option>
        </select>

        <input
          type="date"
          aria-label={t.registeredFrom}
          value={from}
          onChange={(e) => {
            setFrom(e.target.value)
            resetPage()
          }}
          className={cn(inputCls, 'text-muted tnum')}
        />

        <input
          type="date"
          aria-label={t.registeredTo}
          value={to}
          onChange={(e) => {
            setTo(e.target.value)
            resetPage()
          }}
          className={cn(inputCls, 'text-muted tnum')}
        />

        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="h-10 px-3 text-[13.5px] text-gold-deep underline underline-offset-3 cursor-pointer"
          >
            {t.clearFilters}
          </button>
        )}
      </div>

      <DataTable
        data={data?.items ?? []}
        columns={columns}
        loading={isLoading}
        emptyMessage={t.noUsers}
        sortBy={sortCol}
        sortDir={sortDir}
        onSort={handleSort}
        pagination={{
          total: data?.total ?? 0,
          limit: LIMIT,
          offset,
          onChange: setOffset,
        }}
      />
    </div>
  )
}
