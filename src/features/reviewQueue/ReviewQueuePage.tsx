import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { Pagination } from '../../components/DataTable'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { useToast } from '../../components/Toast'
import { useGeoAttempts, useReviewGeoAttempt } from '../../api/geoAttempts'
import { t } from '../../lib/i18n'
import { ApiClientError } from '../../api/client'
import type { GeoAttempt } from '../../api/types'
import { Badge, btnApprove, btnDanger, card, overline } from '../../components/ui'
import { cn, formatDateTime } from '../../lib/utils'

const LIMIT = 20

type ReviewFilter = 'pending' | 'resolved'

/**
 * Review outcome badge for a resolved attempt. Approve leaves the attempt's
 * status intact (still `passed`); reject flips it to `failed`.
 */
function outcomeBadge(a: GeoAttempt) {
  if (a.status === 'failed') return <Badge variant="danger">{t.reviewRejected}</Badge>
  return <Badge variant="success">{t.reviewApproved}</Badge>
}

/**
 * Operator review queue for geo check-in attempts the anti-cheat heuristics
 * flagged (frozen coordinates, constant accuracy, etc.) — never auto-rejected,
 * a human resolves them here. Reject is flag-only for audit/ban purposes; it
 * does not revert the waypoint/mission progress the attempt already granted.
 */
export function ReviewQueuePage() {
  const [offset, setOffset] = useState(0)
  const [filter, setFilter] = useState<ReviewFilter>('pending')
  const { data, isLoading } = useGeoAttempts({ flaggedOnly: true, limit: LIMIT, offset })
  const [target, setTarget] = useState<{
    attempt: GeoAttempt
    action: 'approve' | 'reject'
  } | null>(null)

  const items = data?.items ?? []
  const pendingCount = items.filter((a) => !a.reviewed_at).length
  const visible = items.filter((a) => (filter === 'pending' ? !a.reviewed_at : !!a.reviewed_at))

  const segment = (active: boolean) =>
    cn(
      'h-full px-3.5 text-[13px] cursor-pointer transition-colors',
      active
        ? 'bg-ink text-cream font-semibold'
        : 'bg-surface text-muted hover:bg-paper-hover border-l border-line'
    )

  return (
    <div className="max-w-[1120px] flex flex-col gap-5">
      <p className="max-w-[80ch] text-sm leading-[22px] text-muted">{t.reviewQueueHint}</p>

      <div className="flex items-center gap-3">
        <div
          className="flex h-10 overflow-hidden rounded-control border border-line-strong"
          role="group"
        >
          <button
            type="button"
            aria-pressed={filter === 'pending'}
            onClick={() => setFilter('pending')}
            className={cn(segment(filter === 'pending'), 'border-l-0')}
          >
            {t.filterTabPending} <span className="tnum">{pendingCount}</span>
          </button>
          <button
            type="button"
            aria-pressed={filter === 'resolved'}
            onClick={() => setFilter('resolved')}
            className={segment(filter === 'resolved')}
          >
            {t.filterTabResolved}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {isLoading ? (
          <p className="text-faint text-sm">{t.loading}</p>
        ) : visible.length === 0 ? (
          <p className="text-faint text-sm">{t.reviewQueueEmpty}</p>
        ) : (
          visible.map((a) => (
            <article
              key={a.id}
              className={cn(
                card,
                'grid items-center gap-6 px-6 py-5 lg:grid-cols-[1.4fr_1fr_1fr_200px]'
              )}
            >
              <div>
                {/* i18n: no key for the singular waypoint column label yet */}
                <p className={overline}>Punto</p>
                <p className="mt-1.5 text-[15px] font-semibold text-ink">{a.waypoint_name}</p>
                <p className="mt-0.5 text-[12.5px] text-muted tnum">
                  {formatDateTime(a.created_at)}
                </p>
              </div>

              <div>
                <p className={overline}>{t.flags}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {a.flags.map((f) => (
                    <Badge key={f} variant="warn" mono>
                      {f}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <p className={overline}>{t.accuracyRange}</p>
                <p className="mt-1.5 text-sm text-ink tnum">
                  {a.best_accuracy_m == null || a.worst_accuracy_m == null
                    ? '—'
                    : `${a.best_accuracy_m.toFixed(0)}–${a.worst_accuracy_m.toFixed(0)} m`}
                </p>
                <p className="mt-0.5 font-mono text-xs text-muted">{a.user_id.slice(0, 8)}…</p>
              </div>

              {a.reviewed_at ? (
                <div className="flex items-center gap-2.5 lg:justify-end">{outcomeBadge(a)}</div>
              ) : (
                <div className="flex gap-2 lg:justify-end">
                  <button
                    type="button"
                    onClick={() => setTarget({ attempt: a, action: 'approve' })}
                    className={btnApprove}
                  >
                    <Check size={16} strokeWidth={1.5} aria-hidden />
                    {t.approve}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTarget({ attempt: a, action: 'reject' })}
                    className={btnDanger}
                  >
                    <X size={16} strokeWidth={1.5} aria-hidden />
                    {t.reject}
                  </button>
                </div>
              )}
            </article>
          ))
        )}
      </div>

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
