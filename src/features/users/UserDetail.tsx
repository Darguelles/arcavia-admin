import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Download, TriangleAlert } from 'lucide-react'
import {
  useUserOverview,
  useResetUserPassword,
  useToggleUserActive,
  useResetUserProgress,
  downloadUserExport,
} from '../../api/users'
import type { MissionProgress, UserSession } from '../../api/types'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { useToast } from '../../components/Toast'
import {
  Badge,
  btnApprove,
  btnDanger,
  btnIcon,
  btnSecondary,
  card,
  linkAction,
  overline,
} from '../../components/ui'
import { t } from '../../lib/i18n'
import { cn, formatDate, formatDateTime } from '../../lib/utils'

const fmtDate = (s: string | null | undefined) => (s ? formatDate(s) : '—')
const fmtDateTime = (s: string | null | undefined) => (s ? formatDateTime(s) : '—')

function deviceLabel(kind: string | null): string {
  switch (kind) {
    case 'desktop':
      return t.deviceDesktop
    case 'mobile':
      return t.deviceMobile
    case 'tablet':
      return t.deviceTablet
    default:
      return t.deviceUnknown
  }
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={cn(card, 'p-6')}>
      <h3 className="mb-5 text-[17px] font-semibold text-ink">{title}</h3>
      {children}
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className={overline}>{label}</dt>
      <dd className="mt-1 text-sm text-ink">{children}</dd>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[30px] leading-[34px] font-semibold text-ink tnum">{value}</span>
      <span className={overline}>{label}</span>
    </div>
  )
}

function CategoryBar({ name, earnedPct, met }: { name: string; earnedPct: number; met: boolean }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-muted">{name}</span>
        <span className={cn('tnum', met ? 'font-medium text-success-deep' : 'text-muted')}>
          {earnedPct}% {met && `· ${t.categoryMet}`}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-chip bg-line-soft">
        <div
          className={met ? 'h-full bg-success' : 'h-full bg-gold'}
          style={{ width: `${Math.min(earnedPct, 100)}%` }}
        />
      </div>
    </div>
  )
}

function MissionRow({ m }: { m: MissionProgress }) {
  const completed = m.status === 'completed'
  return (
    <div className="rounded-control border border-line p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-ink">{m.mission_name}</p>
          {m.city_name && <p className="mt-0.5 text-xs text-faint">{m.city_name}</p>}
        </div>
        <div className="flex shrink-0 gap-1.5">
          {/* removed by an admin — the player's progress below is kept as-is */}
          {m.mission_archived_at && (
            <Badge variant="danger">{t.missionArchivedOn(fmtDate(m.mission_archived_at))}</Badge>
          )}
          <Badge variant={completed ? 'success' : 'warn'}>
            {completed ? t.statusCompleted : t.statusInProgress}
          </Badge>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted tnum">
        <span>{t.checkpointsProgress(m.waypoints_completed, m.waypoints_total)}</span>
        <span>
          {t.checkpointPoints}: <span className="text-ink">{m.checkpoint_points}</span>
        </span>
        <span>
          {t.bonusPointsLabel}: <span className="text-ink">{m.bonus_points}</span>
        </span>
        <span className={m.riddle_solved ? 'text-success-deep' : ''}>
          {m.riddle_solved ? t.riddleSolvedLabel : t.riddlePendingLabel}
        </span>
        {completed && <span>{fmtDate(m.completed_at)}</span>}
      </div>

      {m.categories.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          {m.categories.map((c) => (
            <CategoryBar key={c.category_id} name={c.name} earnedPct={c.earned_pct} met={c.met} />
          ))}
        </div>
      )}
    </div>
  )
}

function SessionsTable({ sessions }: { sessions: UserSession[] }) {
  if (sessions.length === 0) {
    return <p className="text-sm text-faint">{t.noSessionsUser}</p>
  }
  const th = cn(overline, 'pb-2.5 text-left font-semibold')
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line">
            <th className={th}>{t.sessionDevice}</th>
            <th className={th}>{t.sessionBrowser}</th>
            <th className={th}>{t.sessionIp}</th>
            <th className={th}>{t.sessionFirstSeen}</th>
            <th className={th}>{t.sessionLastSeen}</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((s) => (
            <tr key={s.id} className="border-b border-line-soft last:border-0">
              <td className="py-2.5 text-ink">{deviceLabel(s.device_type)}</td>
              <td className="py-2.5 text-muted">
                {[s.browser, s.os].filter(Boolean).join(' · ') || '—'}
              </td>
              <td className="py-2.5 font-mono text-xs text-muted">
                {s.ip_country || s.ip_masked || '—'}
              </td>
              <td className="py-2.5 text-muted">{fmtDateTime(s.created_at)}</td>
              <td className="py-2.5 text-muted">{fmtDateTime(s.last_seen_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * User lifecycle detail: profile + consent, points summary, missions & progress,
 * rewards earned, devices/sessions, and sensitive actions incl. GDPR data export.
 */
export function UserDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()

  const { data: overview, isLoading } = useUserOverview(id ?? '')
  const resetPassword = useResetUserPassword(id ?? '')
  const toggleActive = useToggleUserActive(id ?? '')
  const resetProgress = useResetUserProgress(id ?? '')

  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [showToggleConfirm, setShowToggleConfirm] = useState(false)
  const [showResetProgressConfirm, setShowResetProgressConfirm] = useState(false)
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [exporting, setExporting] = useState(false)

  const profile = overview?.profile

  async function handleReset() {
    try {
      const res = await resetPassword.mutateAsync()
      setTempPassword(res.temp_password)
      toast.success('Contraseña temporal generada.')
    } catch {
      toast.error(t.error)
    } finally {
      setShowResetConfirm(false)
    }
  }

  async function handleToggle() {
    if (!profile) return
    try {
      await toggleActive.mutateAsync(!profile.is_active)
      toast.success(profile.is_active ? t.deactivated : t.activated)
    } catch {
      toast.error(t.error)
    } finally {
      setShowToggleConfirm(false)
    }
  }

  async function handleResetProgress() {
    if (!profile) return
    try {
      await resetProgress.mutateAsync()
      toast.success(t.resetProgressDone)
    } catch {
      toast.error(t.error)
    } finally {
      setShowResetProgressConfirm(false)
    }
  }

  async function handleExport() {
    if (!id) return
    setExporting(true)
    try {
      await downloadUserExport(id)
      toast.success(t.exportDataDone)
    } catch {
      toast.error(t.error)
    } finally {
      setExporting(false)
    }
  }

  async function copyPassword() {
    if (!tempPassword) return
    await navigator.clipboard.writeText(tempPassword)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function dismissTempPassword() {
    setTempPassword(null)
    setCopied(false)
  }

  if (isLoading || !overview || !profile) {
    return <p className="p-6 text-faint">{t.loading}</p>
  }

  return (
    <div className="max-w-3xl flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/admin/users')}
          aria-label={t.back}
          className={btnIcon}
        >
          <ArrowLeft size={18} strokeWidth={1.5} aria-hidden />
        </button>
        <h2 className="text-[24px] font-semibold text-ink">{profile.email}</h2>
        {overview.is_anonymized && <Badge variant="warn">{t.anonymizedBadge}</Badge>}
      </div>

      {overview.is_anonymized && (
        <p className="flex items-start gap-2.5 rounded-control bg-warn-tint px-4 py-3 text-[13px] leading-5 text-warn-text">
          <TriangleAlert size={16} strokeWidth={1.5} aria-hidden className="mt-0.5 shrink-0" />
          {t.anonymizedHint}
        </p>
      )}

      {/* Profile */}
      <Card title={t.sectionProfile}>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
          <Field label={t.name}>{profile.display_name || '—'}</Field>
          <Field label={t.email}>{profile.email}</Field>
          <Field label={t.colRole}>{profile.role === 'admin' ? t.roleAdmin : t.rolePlayer}</Field>
          <Field label={t.filterStatus}>
            <Badge variant={profile.is_active ? 'success' : 'danger'}>
              {profile.is_active ? t.active : t.inactive}
            </Badge>
          </Field>
          <Field label={t.colRegistered}>
            <span className="tnum">{fmtDate(profile.created_at)}</span>
          </Field>
          <Field label={t.colLastActivity}>
            <span className="tnum">{fmtDateTime(profile.last_activity_at)}</span>
          </Field>
          <Field label={t.consentAccepted}>
            <span className="tnum">
              {profile.consent_at ? fmtDateTime(profile.consent_at) : t.notAccepted}
            </span>
          </Field>
          <Field label={t.consentVersion}>{profile.consent_version || '—'}</Field>
        </dl>
      </Card>

      {/* Points summary */}
      <Card title={t.sectionPoints}>
        <div className="flex flex-wrap gap-x-10 gap-y-6">
          <Stat label={t.accumulatedPoints} value={overview.total_points.toLocaleString('es-PE')} />
          <Stat
            label={t.checkpointPoints}
            value={overview.checkpoint_points.toLocaleString('es-PE')}
          />
          <Stat label={t.bonusPointsLabel} value={overview.bonus_points.toLocaleString('es-PE')} />
          <Stat label={t.missionsStarted} value={overview.missions_started} />
          <Stat label={t.missionsCompletedLabel} value={overview.missions_completed} />
          <Stat label={t.challengesCorrect} value={overview.challenges_completed} />
        </div>

        {overview.points_by_city.length > 0 && (
          <dl className="mt-6 flex flex-col gap-2 border-t border-line-soft pt-4 text-sm">
            <p className={overline}>{t.pointsByCity}</p>
            {overview.points_by_city.map((c) => (
              <div key={c.city_id ?? 'none'} className="flex justify-between">
                <dt className="text-muted">{c.city_name || '—'}</dt>
                <dd className="font-semibold text-ink tnum">{c.points.toLocaleString('es-PE')}</dd>
              </div>
            ))}
          </dl>
        )}
      </Card>

      {/* Missions */}
      <Card title={t.sectionMissions}>
        {overview.missions.length === 0 ? (
          <p className="text-sm text-faint">{t.noMissionsUser}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {overview.missions.map((m) => (
              <MissionRow key={m.mission_id} m={m} />
            ))}
          </div>
        )}
      </Card>

      {/* Rewards */}
      <Card title={t.sectionRewards}>
        {overview.rewards.length === 0 ? (
          <p className="text-sm text-faint">{t.noRewardsUser}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {overview.rewards.map((r) => (
              <div
                key={r.reward_id}
                className="flex items-start justify-between gap-3 rounded-control border border-line p-4"
              >
                <div>
                  <p className="font-medium text-ink">{r.name}</p>
                  {r.description && <p className="mt-0.5 text-xs text-muted">{r.description}</p>}
                  <p className="mt-1 text-xs text-faint tnum">
                    {t.rewardEarnedAt}: {fmtDate(r.earned_at)} · {t.rewardValidUntil}:{' '}
                    {fmtDate(r.validity_ends_at)}
                  </p>
                </div>
                <Badge variant={r.currently_valid ? 'success' : 'neutral'}>
                  {r.currently_valid ? t.rewardValid : t.rewardExpired}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Devices / sessions */}
      <Card title={t.sectionDevices}>
        <SessionsTable sessions={overview.recent_sessions} />
      </Card>

      {/* Sensitive actions */}
      <Card title={t.sectionActions}>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => setShowResetConfirm(true)} className={btnSecondary}>
            Restablecer contraseña
          </button>
          <button
            type="button"
            onClick={() => setShowToggleConfirm(true)}
            className={profile.is_active ? btnDanger : btnApprove}
          >
            {profile.is_active ? t.deactivate : t.activate}
          </button>
          <button
            type="button"
            onClick={() => setShowResetProgressConfirm(true)}
            className={btnDanger}
          >
            {t.resetProgress}
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className={btnSecondary}
          >
            <Download size={16} strokeWidth={1.5} aria-hidden />
            {t.exportData}
          </button>
        </div>
        <p className="mt-3 text-[13px] text-muted">{t.exportDataHint}</p>
      </Card>

      {/* Reset password confirm */}
      <ConfirmDialog
        open={showResetConfirm}
        title="Restablecer contraseña"
        message={t.resetPasswordConfirm(profile.email)}
        confirmLabel="Generar contraseña temporal"
        variant="warning"
        onConfirm={handleReset}
        onCancel={() => setShowResetConfirm(false)}
        loading={resetPassword.isPending}
      />

      {/* Toggle active confirm */}
      <ConfirmDialog
        open={showToggleConfirm}
        title={profile.is_active ? t.deactivate : t.activate}
        message={
          profile.is_active
            ? t.deactivateUserConfirm(profile.email)
            : t.activateUserConfirm(profile.email)
        }
        confirmLabel={profile.is_active ? t.deactivate : t.activate}
        variant={profile.is_active ? 'danger' : 'warning'}
        onConfirm={handleToggle}
        onCancel={() => setShowToggleConfirm(false)}
        loading={toggleActive.isPending}
      />

      {/* Reset progress confirm (testing tool — destructive, no undo) */}
      <ConfirmDialog
        open={showResetProgressConfirm}
        title={t.resetProgress}
        message={t.resetProgressConfirm(profile.email)}
        confirmLabel={t.resetProgress}
        variant="danger"
        onConfirm={handleResetProgress}
        onCancel={() => setShowResetProgressConfirm(false)}
        loading={resetProgress.isPending}
      />

      {/* One-time temp password reveal (spec §6.7, §10) */}
      {tempPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-ink/50" />
          <div
            className="relative mx-4 w-full max-w-md rounded-card bg-surface p-6 shadow-float"
            role="dialog"
            aria-modal="true"
            aria-labelledby="temp-pw-title"
          >
            <h2 id="temp-pw-title" className="mb-2 text-[17px] font-semibold text-ink">
              {t.tempPasswordTitle}
            </h2>
            <p className="mb-4 flex items-start gap-2.5 rounded-control bg-warn-tint px-4 py-3 text-[13px] leading-5 text-warn-text">
              <TriangleAlert size={16} strokeWidth={1.5} aria-hidden className="mt-0.5 shrink-0" />
              {t.tempPasswordHint}
            </p>

            <div className="mb-4 flex items-center gap-2 rounded-control border border-line bg-paper px-4 py-3">
              <code className="flex-1 select-all font-mono text-lg text-ink">{tempPassword}</code>
              <button
                type="button"
                onClick={copyPassword}
                className={cn(linkAction, 'inline-flex items-center gap-1 whitespace-nowrap')}
              >
                {copied && <Check size={13} strokeWidth={1.5} aria-hidden />}
                {copied ? 'Copiado' : t.copy}
              </button>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={dismissTempPassword}
                className="inline-flex h-10 cursor-pointer items-center rounded-control bg-ink px-4 text-sm font-semibold text-cream hover:bg-ink-2"
              >
                {t.close} — ya copié la contraseña
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
