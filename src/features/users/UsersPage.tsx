import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { useUsers } from '../../api/users'
import type { Role, User } from '../../api/types'
import { DataTable, Pagination } from '../../components/DataTable'
import { t } from '../../lib/i18n'
import { formatDate, formatDateTime } from '../../lib/utils'

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
        <div>
          <p className="font-medium text-gray-900">{row.original.email}</p>
          {row.original.display_name && (
            <p className="text-xs text-gray-500">{row.original.display_name}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'role',
      header: t.colRole,
      meta: { sortable: true },
      cell: ({ row }) => (
        <span
          className={`px-2 py-0.5 rounded text-xs font-medium ${
            row.original.role === 'admin'
              ? 'bg-indigo-100 text-indigo-700'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {row.original.role === 'admin' ? t.roleAdmin : t.rolePlayer}
        </span>
      ),
    },
    {
      accessorKey: 'is_active',
      header: t.filterStatus,
      meta: { sortable: true },
      cell: ({ row }) => (
        <span
          className={`px-2 py-0.5 rounded text-xs font-medium ${
            row.original.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
          }`}
        >
          {row.original.is_active ? t.active : t.inactive}
        </span>
      ),
    },
    {
      accessorKey: 'registered_at',
      header: t.colRegistered,
      meta: { sortable: true },
      cell: ({ row }) => formatDate(row.original.registered_at),
    },
    {
      accessorKey: 'last_activity_at',
      header: t.colLastActivity,
      meta: { sortable: true },
      cell: ({ row }) =>
        row.original.last_activity_at ? formatDateTime(row.original.last_activity_at) : '—',
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <button
          onClick={() => navigate(`/admin/users/${row.original.id}`)}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
        >
          {t.viewDetail}
        </button>
      ),
    },
  ]

  const selectCls =
    'rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold text-gray-900">{t.users}</h2>

      <div className="flex flex-wrap items-end gap-3">
        <input
          type="search"
          placeholder={t.searchUsersPlaceholder}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            resetPage()
          }}
          className={`${selectCls} w-full max-w-xs`}
        />

        <label className="flex flex-col gap-1 text-xs text-gray-500">
          {t.filterRole}
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value as Role | '')
              resetPage()
            }}
            className={selectCls}
          >
            <option value="">{t.filterAll}</option>
            <option value="player">{t.rolePlayer}</option>
            <option value="admin">{t.roleAdmin}</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-gray-500">
          {t.filterStatus}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as StatusFilter)
              resetPage()
            }}
            className={selectCls}
          >
            <option value="">{t.filterAll}</option>
            <option value="active">{t.active}</option>
            <option value="inactive">{t.inactive}</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-gray-500">
          {t.registeredFrom}
          <input
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value)
              resetPage()
            }}
            className={selectCls}
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-gray-500">
          {t.registeredTo}
          <input
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value)
              resetPage()
            }}
            className={selectCls}
          />
        </label>

        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 underline"
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
      />
      <Pagination total={data?.total ?? 0} limit={LIMIT} offset={offset} onChange={setOffset} />
    </div>
  )
}
