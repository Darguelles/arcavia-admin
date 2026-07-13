import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { useUsers } from '../../api/users'
import type { User } from '../../api/types'
import { DataTable, Pagination } from '../../components/DataTable'
import { t } from '../../lib/i18n'
import { formatDate, formatDateTime } from '../../lib/utils'

const LIMIT = 20

export function UsersPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [offset, setOffset] = useState(0)

  const { data, isLoading } = useUsers({ search, limit: LIMIT, offset })

  const columns: ColumnDef<User, unknown>[] = [
    {
      accessorKey: 'email',
      header: t.email,
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
      header: 'Rol',
      cell: ({ row }) => (
        <span
          className={`px-2 py-0.5 rounded text-xs font-medium ${
            row.original.role === 'admin'
              ? 'bg-indigo-100 text-indigo-700'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {row.original.role === 'admin' ? 'Administrador' : 'Jugador'}
        </span>
      ),
    },
    {
      accessorKey: 'is_active',
      header: t.active,
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
      header: 'Registrado',
      cell: ({ row }) => formatDate(row.original.registered_at),
    },
    {
      accessorKey: 'last_activity_at',
      header: 'Última actividad',
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
          Ver detalle
        </button>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold text-gray-900">{t.users}</h2>

      <input
        type="search"
        placeholder={`${t.search} por correo…`}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          setOffset(0)
        }}
        className="w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      <DataTable
        data={data?.items ?? []}
        columns={columns}
        loading={isLoading}
        emptyMessage={t.noUsers}
      />
      <Pagination total={data?.total ?? 0} limit={LIMIT} offset={offset} onChange={setOffset} />
    </div>
  )
}
