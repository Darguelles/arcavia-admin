import { Fragment, useState } from 'react'
import { Pagination } from '../../components/DataTable'
import { btnGhost, btnRowAction, card } from '../../components/ui'
import { cn } from '../../lib/utils'
import { t } from '../../lib/i18n'
import { useAuditLog, type AuditLogEntry } from '../../api/audit'
import { useTeam } from '../../api/team'
import { useAuthStore } from '../../auth/store'

const LIMIT = 50

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-ES', {
    dateStyle: 'short',
    timeStyle: 'medium',
  })
}

/** Tint the action chip by rough intent parsed from the action code. */
function actionChipClass(action: string): string {
  if (/REJECT|DELETE|FAIL|DENIED|BLOCK/i.test(action)) return 'bg-danger-tint text-danger-deep'
  if (/UPDATE|CREATE|UPLOAD|RESET/i.test(action)) return 'bg-gold-tint text-gold-text'
  return 'bg-line-soft'
}

const filterControl =
  'h-10 rounded-control border border-line-strong bg-surface px-3 text-[13.5px] text-ink focus:outline-2 focus:outline-gold focus:-outline-offset-[3px]'

const thClass =
  'px-4 py-[11px] first:pl-6 last:pr-6 text-left text-[11px] font-semibold tracking-[0.1em] uppercase text-faint border-b border-line'

const tdClass = 'px-4 py-[15px] first:pl-6 last:pr-6'

export function AuditLogPage() {
  const role = useAuthStore((s) => s.role)
  const [actorId, setActorId] = useState('')
  const [action, setAction] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [offset, setOffset] = useState(0)
  const [expanded, setExpanded] = useState<string | null>(null)

  // actor dropdown needs the team list, which only root can fetch
  const { data: team = [] } = useTeam(role === 'root')

  const { data, isLoading } = useAuditLog({
    actor_user_id: actorId || undefined,
    action: action.trim() || undefined,
    date_from: dateFrom ? new Date(dateFrom).toISOString() : undefined,
    date_to: dateTo ? new Date(dateTo).toISOString() : undefined,
    limit: LIMIT,
    offset,
  })

  const entries = data?.items ?? []

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2.5">
        {role === 'root' && (
          <select
            aria-label={t.auditFilterActor}
            value={actorId}
            onChange={(e) => {
              setActorId(e.target.value)
              setOffset(0)
            }}
            className={cn(filterControl, 'px-2.5')}
          >
            <option value="">{t.filterAll}</option>
            {team.map((m) => (
              <option key={m.id} value={m.id}>
                {m.email}
              </option>
            ))}
          </select>
        )}
        <input
          type="text"
          aria-label={t.auditFilterAction}
          value={action}
          onChange={(e) => {
            setAction(e.target.value)
            setOffset(0)
          }}
          placeholder="LOGIN_SUCCESS…"
          className={cn(filterControl, 'w-[240px]')}
        />
        <input
          type="datetime-local"
          aria-label={t.auditFilterFrom}
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value)
            setOffset(0)
          }}
          className={cn(filterControl, 'px-2.5 text-muted tnum')}
        />
        <input
          type="datetime-local"
          aria-label={t.auditFilterTo}
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value)
            setOffset(0)
          }}
          className={cn(filterControl, 'px-2.5 text-muted tnum')}
        />
        {(actorId || action || dateFrom || dateTo) && (
          <button
            type="button"
            onClick={() => {
              setActorId('')
              setAction('')
              setDateFrom('')
              setDateTo('')
              setOffset(0)
            }}
            className={cn(btnGhost, 'text-[13px]')}
          >
            {t.clearFilters}
          </button>
        )}
        {typeof data?.total === 'number' && (
          <span className="ml-auto text-[13px] text-muted tnum">{t.recordsCount(data.total)}</span>
        )}
      </div>

      <div className={cn(card, 'overflow-hidden')}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-paper">
              <tr>
                <th scope="col" className={thClass}>
                  {t.auditColDate}
                </th>
                <th scope="col" className={thClass}>
                  {t.auditColActor}
                </th>
                <th scope="col" className={thClass}>
                  {t.auditColAction}
                </th>
                <th scope="col" className={thClass}>
                  {t.auditColTarget}
                </th>
                <th scope="col" className={thClass}>
                  {t.auditColIp}
                </th>
                <th scope="col" className={thClass} />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-faint">
                    {t.loading}
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-faint">
                    {t.auditNoResults}
                  </td>
                </tr>
              ) : (
                entries.map((entry: AuditLogEntry) => {
                  const isExpanded = expanded === entry.id
                  return (
                    <Fragment key={entry.id}>
                      <tr
                        className={cn(
                          'border-b border-line-soft last:border-b-0 transition-colors',
                          isExpanded ? 'bg-paper' : 'hover:bg-paper'
                        )}
                      >
                        <td className={cn(tdClass, 'whitespace-nowrap text-muted tnum')}>
                          {formatDate(entry.created_at)}
                        </td>
                        <td className={tdClass}>
                          <p className="m-0 font-medium text-ink">{entry.actor_email ?? '—'}</p>
                          <p className="m-0 mt-0.5 text-xs text-faint">{entry.actor_role}</p>
                        </td>
                        <td className={tdClass}>
                          <code
                            className={cn(
                              'font-mono text-xs rounded-chip px-1.5 py-0.5',
                              actionChipClass(entry.action)
                            )}
                          >
                            {entry.action}
                          </code>
                        </td>
                        <td className={tdClass}>
                          {entry.target_type ? (
                            <span className="text-muted">
                              {entry.target_type}
                              {entry.target_id ? `: ${entry.target_id}` : ''}
                            </span>
                          ) : (
                            <span className="text-faint">—</span>
                          )}
                        </td>
                        <td className={tdClass}>
                          {entry.ip ? (
                            <span className="text-muted tnum">{entry.ip}</span>
                          ) : (
                            <span className="text-faint">—</span>
                          )}
                        </td>
                        <td className={cn(tdClass, 'text-right')}>
                          {entry.metadata ? (
                            <button
                              type="button"
                              onClick={() => setExpanded(isExpanded ? null : entry.id)}
                              className={btnRowAction}
                            >
                              {isExpanded ? t.auditHideDetails : t.auditDetails}
                            </button>
                          ) : null}
                        </td>
                      </tr>
                      {isExpanded && entry.metadata && (
                        <tr className="border-b border-line-soft last:border-b-0">
                          <td colSpan={6} className="bg-paper px-6 pb-[18px]">
                            <pre className="m-0 bg-ink text-cream rounded-control px-5 py-[18px] font-mono text-xs leading-[19px] overflow-x-auto">
                              {JSON.stringify(
                                {
                                  request_id: entry.request_id,
                                  user_agent: entry.user_agent,
                                  metadata: entry.metadata,
                                },
                                null,
                                2
                              )}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination total={data?.total ?? 0} limit={LIMIT} offset={offset} onChange={setOffset} />
    </div>
  )
}
