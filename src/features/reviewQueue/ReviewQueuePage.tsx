import { useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable, Pagination } from '../../components/DataTable'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { useToast } from '../../components/Toast'
import { useGeoAttempts, useReviewGeoAttempt } from '../../api/geoAttempts'
import { t } from '../../lib/i18n'
import { ApiClientError } from '../../api/client'
import type { GeoAttempt } from '../../api/types'

const LIMIT = 20

/**
 * Operator review queue for geo check-in attempts the anti-cheat heuristics
 * flagged (frozen coordinates, constant accuracy, etc.) — never auto-rejected,
 * a human resolves them here. Reject is flag-only for audit/ban purposes; it
 * does not revert the waypoint/mission progress the attempt already granted.
 */
export function ReviewQueuePage() {
  const [offset, setOffset] = useState(0)
  const { data, isLoading } = useGeoAttempts({ flaggedOnly: true, limit: LIMIT, offset })
  const [target, setTarget] = useState<{
    attempt: GeoAttempt
    action: 'approve' | 'reject'
  } | null>(null)

  const columns: ColumnDef<GeoAttempt, unknown>[] = [
    { header: 'Punto', accessorKey: 'waypoint_name' },
    {
      header: 'Usuario',
      accessorKey: 'user_id',
      cell: ({ getValue }) => (
        <code className="text-xs text-gray-500">{String(getValue()).slice(0, 8)}…</code>
      ),
    },
    {
      header: t.flags,
      accessorKey: 'flags',
      cell: ({ getValue }) => (
        <div className="flex flex-wrap gap-1">
          {(getValue() as string[]).map((f) => (
            <span
              key={f}
              className="px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800"
            >
              {f}
            </span>
          ))}
        </div>
      ),
    },
    {
      header: t.accuracyRange,
      id: 'accuracy',
      cell: ({ row }) => {
        const { best_accuracy_m, worst_accuracy_m } = row.original
        if (best_accuracy_m == null || worst_accuracy_m == null) return '—'
        return `${best_accuracy_m.toFixed(0)}–${worst_accuracy_m.toFixed(0)} m`
      },
    },
    {
      header: 'Fecha',
      accessorKey: 'created_at',
      cell: ({ getValue }) => new Date(String(getValue())).toLocaleString(),
    },
    {
      header: 'Estado',
      id: 'reviewed',
      cell: ({ row }) => (
        <span
          className={`px-2 py-0.5 rounded text-xs font-medium ${
            row.original.reviewed_at ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}
        >
          {row.original.reviewed_at ? t.reviewed : t.notReviewed}
        </span>
      ),
    },
    {
      header: 'Acciones',
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTarget({ attempt: row.original, action: 'approve' })}
            className="px-3 py-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg"
          >
            {t.approve}
          </button>
          <button
            type="button"
            onClick={() => setTarget({ attempt: row.original, action: 'reject' })}
            className="px-3 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg"
          >
            {t.reject}
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="max-w-5xl flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">{t.reviewQueueTitle}</h2>
        <p className="text-sm text-gray-500 mt-1">{t.reviewQueueHint}</p>
      </div>

      <DataTable
        data={data?.items ?? []}
        columns={columns}
        loading={isLoading}
        emptyMessage={t.reviewQueueEmpty}
      />

      {data && <Pagination total={data.total} limit={LIMIT} offset={offset} onChange={setOffset} />}

      {target && <ReviewDialog target={target} onClose={() => setTarget(null)} />}
    </div>
  )
}

function ReviewDialog({
  target,
  onClose,
}: {
  target: { attempt: GeoAttempt; action: 'approve' | 'reject' }
  onClose: () => void
}) {
  const toast = useToast()
  const review = useReviewGeoAttempt(target.attempt.id)
  const isReject = target.action === 'reject'

  async function handleConfirm() {
    try {
      await review.mutateAsync({ action: target.action })
      toast.success(isReject ? t.deactivated : t.saved)
      onClose()
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : t.error)
    }
  }

  return (
    <ConfirmDialog
      open
      title={isReject ? t.reject : t.approve}
      message={isReject ? t.rejectConfirm : t.approveConfirm}
      confirmLabel={isReject ? t.reject : t.approve}
      variant={isReject ? 'danger' : 'warning'}
      onConfirm={handleConfirm}
      onCancel={onClose}
      loading={review.isPending}
    />
  )
}
