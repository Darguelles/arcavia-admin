import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
import { t } from '../../lib/i18n'
import { formatDate, formatDateTime } from '../../lib/utils'

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
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-800 mb-4">{title}</h3>
      {children}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col">
      <span className="text-2xl font-bold text-indigo-700">{value}</span>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  )
}

function CategoryBar({ name, earnedPct, met }: { name: string; earnedPct: number; met: boolean }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600">{name}</span>
        <span className={met ? 'text-green-700 font-medium' : 'text-gray-500'}>
          {earnedPct}% {met && `· ${t.categoryMet}`}
        </span>
      </div>
      <div className="h-2 rounded bg-gray-100 overflow-hidden">
        <div
          className={met ? 'h-full bg-green-500' : 'h-full bg-indigo-400'}
          style={{ width: `${Math.min(earnedPct, 100)}%` }}
        />
      </div>
    </div>
  )
}

function MissionRow({ m }: { m: MissionProgress }) {
  const completed = m.status === 'completed'
  return (
    <div className="border border-gray-100 rounded-lg p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-gray-900">{m.mission_name}</p>
          {m.city_name && <p className="text-xs text-gray-500">{m.city_name}</p>}
        </div>
        <span
          className={`px-2 py-0.5 rounded text-xs font-medium ${
            completed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
          }`}
        >
          {completed ? t.statusCompleted : t.statusInProgress}
        </span>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-xs text-gray-500">
        <span>{t.checkpointsProgress(m.waypoints_completed, m.waypoints_total)}</span>
        <span>
          {t.checkpointPoints}: <span className="text-gray-800">{m.checkpoint_points}</span>
        </span>
        <span>
          {t.bonusPointsLabel}: <span className="text-gray-800">{m.bonus_points}</span>
        </span>
        <span className={m.riddle_solved ? 'text-green-700' : ''}>
          {m.riddle_solved ? t.riddleSolvedLabel : t.riddlePendingLabel}
        </span>
        {completed && <span>{fmtDate(m.completed_at)}</span>}
      </div>

      {m.categories.length > 0 && (
        <div className="flex flex-col gap-2 mt-3">
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
    return <p className="text-sm text-gray-400">{t.noSessionsUser}</p>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
            <th className="pb-2">{t.sessionDevice}</th>
            <th className="pb-2">{t.sessionBrowser}</th>
            <th className="pb-2">{t.sessionIp}</th>
            <th className="pb-2">{t.sessionFirstSeen}</th>
            <th className="pb-2">{t.sessionLastSeen}</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((s) => (
            <tr key={s.id} className="border-b border-gray-50 last:border-0">
              <td className="py-2">{deviceLabel(s.device_type)}</td>
              <td className="py-2 text-gray-500">
                {[s.browser, s.os].filter(Boolean).join(' · ') || '—'}
              </td>
              <td className="py-2 text-gray-500">{s.ip_country || s.ip_masked || '—'}</td>
              <td className="py-2 text-gray-500">{fmtDateTime(s.created_at)}</td>
              <td className="py-2 text-gray-500">{fmtDateTime(s.last_seen_at)}</td>
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
    return <p className="text-gray-400 p-6">{t.loading}</p>
  }

  return (
    <div className="max-w-3xl flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/admin/users')}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← {t.back}
        </button>
        <h2 className="text-xl font-bold text-gray-900">{profile.email}</h2>
        {overview.is_anonymized && (
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-800 text-white">
            {t.anonymizedBadge}
          </span>
        )}
      </div>

      {overview.is_anonymized && (
        <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
          {t.anonymizedHint}
        </p>
      )}

      {/* Profile */}
      <Card title={t.sectionProfile}>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <dt className="text-gray-500">{t.name}</dt>
          <dd className="text-gray-900">{profile.display_name || '—'}</dd>

          <dt className="text-gray-500">{t.email}</dt>
          <dd className="text-gray-900">{profile.email}</dd>

          <dt className="text-gray-500">{t.colRole}</dt>
          <dd className="text-gray-900">{profile.role === 'admin' ? t.roleAdmin : t.rolePlayer}</dd>

          <dt className="text-gray-500">{t.filterStatus}</dt>
          <dd
            className={
              profile.is_active ? 'text-green-700 font-medium' : 'text-red-600 font-medium'
            }
          >
            {profile.is_active ? t.active : t.inactive}
          </dd>

          <dt className="text-gray-500">{t.colRegistered}</dt>
          <dd className="text-gray-900">{fmtDate(profile.created_at)}</dd>

          <dt className="text-gray-500">{t.colLastActivity}</dt>
          <dd className="text-gray-900">{fmtDateTime(profile.last_activity_at)}</dd>

          <dt className="text-gray-500">{t.consentAccepted}</dt>
          <dd className="text-gray-900">
            {profile.consent_at ? fmtDateTime(profile.consent_at) : t.notAccepted}
          </dd>

          <dt className="text-gray-500">{t.consentVersion}</dt>
          <dd className="text-gray-900">{profile.consent_version || '—'}</dd>
        </dl>
      </Card>

      {/* Points summary */}
      <Card title={t.sectionPoints}>
        <div className="flex flex-wrap gap-8">
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
          <dl className="flex flex-col gap-2 text-sm mt-6 border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {t.pointsByCity}
            </p>
            {overview.points_by_city.map((c) => (
              <div key={c.city_id ?? 'none'} className="flex justify-between">
                <dt className="text-gray-600">{c.city_name || '—'}</dt>
                <dd className="font-semibold text-indigo-700">
                  {c.points.toLocaleString('es-PE')}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </Card>

      {/* Missions */}
      <Card title={t.sectionMissions}>
        {overview.missions.length === 0 ? (
          <p className="text-sm text-gray-400">{t.noMissionsUser}</p>
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
          <p className="text-sm text-gray-400">{t.noRewardsUser}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {overview.rewards.map((r) => (
              <div
                key={r.reward_id}
                className="flex items-start justify-between gap-3 border border-gray-100 rounded-lg p-3"
              >
                <div>
                  <p className="font-medium text-gray-900">{r.name}</p>
                  {r.description && <p className="text-xs text-gray-500">{r.description}</p>}
                  <p className="text-xs text-gray-400 mt-1">
                    {t.rewardEarnedAt}: {fmtDate(r.earned_at)} · {t.rewardValidUntil}:{' '}
                    {fmtDate(r.validity_ends_at)}
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    r.currently_valid ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {r.currently_valid ? t.rewardValid : t.rewardExpired}
                </span>
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
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg"
          >
            Restablecer contraseña
          </button>
          <button
            type="button"
            onClick={() => setShowToggleConfirm(true)}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${
              profile.is_active
                ? 'text-red-700 bg-red-50 hover:bg-red-100 border border-red-200'
                : 'text-green-700 bg-green-50 hover:bg-green-100 border border-green-200'
            }`}
          >
            {profile.is_active ? t.deactivate : t.activate}
          </button>
          <button
            type="button"
            onClick={() => setShowResetProgressConfirm(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg"
          >
            {t.resetProgress}
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50"
          >
            {t.exportData}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-3">{t.exportDataHint}</p>
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
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="relative bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="temp-pw-title"
          >
            <h2 id="temp-pw-title" className="text-lg font-semibold text-gray-900 mb-2">
              {t.tempPasswordTitle}
            </h2>
            <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mb-4">
              {t.tempPasswordHint}
            </p>

            <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-4 py-3 mb-4">
              <code className="flex-1 text-lg font-mono text-gray-900 select-all">
                {tempPassword}
              </code>
              <button
                type="button"
                onClick={copyPassword}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium whitespace-nowrap"
              >
                {copied ? '✓ Copiado' : t.copy}
              </button>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={dismissTempPassword}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-800 hover:bg-gray-900 rounded-lg"
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
