import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  useUser,
  useResetUserPassword,
  useToggleUserActive,
  useResetUserProgress,
} from '../../api/users'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { useToast } from '../../components/Toast'
import { t } from '../../lib/i18n'
import { formatDate, formatDateTime } from '../../lib/utils'

/**
 * User detail: read-only profile, progress, and sensitive actions (spec §6.7).
 * Password reset shows temp password exactly once then discards it (spec §6.7, §10).
 */
export function UserDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()

  const { data: user, isLoading } = useUser(id ?? '')
  const resetPassword = useResetUserPassword(id ?? '')
  const toggleActive = useToggleUserActive(id ?? '')
  const resetProgress = useResetUserProgress(id ?? '')

  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [showToggleConfirm, setShowToggleConfirm] = useState(false)
  const [showResetProgressConfirm, setShowResetProgressConfirm] = useState(false)
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

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
    if (!user) return
    try {
      await toggleActive.mutateAsync(!user.is_active)
      toast.success(user.is_active ? t.deactivated : t.activated)
    } catch {
      toast.error(t.error)
    } finally {
      setShowToggleConfirm(false)
    }
  }

  async function handleResetProgress() {
    if (!user) return
    try {
      await resetProgress.mutateAsync()
      toast.success(t.resetProgressDone)
    } catch {
      toast.error(t.error)
    } finally {
      setShowResetProgressConfirm(false)
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

  if (isLoading || !user) {
    return <p className="text-gray-400 p-6">{t.loading}</p>
  }

  return (
    <div className="max-w-2xl flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/admin/users')}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← {t.back}
        </button>
        <h2 className="text-xl font-bold text-gray-900">{user.email}</h2>
      </div>

      {/* Profile (read-only) */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Perfil</h3>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <dt className="text-gray-500">Nombre</dt>
          <dd className="text-gray-900">{user.display_name || '—'}</dd>

          <dt className="text-gray-500">Correo</dt>
          <dd className="text-gray-900">{user.email}</dd>

          <dt className="text-gray-500">Rol</dt>
          <dd className="text-gray-900">{user.role === 'admin' ? 'Administrador' : 'Jugador'}</dd>

          <dt className="text-gray-500">Estado</dt>
          <dd
            className={user.is_active ? 'text-green-700 font-medium' : 'text-red-600 font-medium'}
          >
            {user.is_active ? t.active : t.inactive}
          </dd>

          <dt className="text-gray-500">Registrado</dt>
          <dd className="text-gray-900">{formatDate(user.registered_at)}</dd>

          <dt className="text-gray-500">Última actividad</dt>
          <dd className="text-gray-900">
            {user.last_activity_at ? formatDateTime(user.last_activity_at) : '—'}
          </dd>
        </dl>
      </div>

      {/* Progress */}
      {user.completions && user.completions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Misiones completadas</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                <th className="pb-2">Misión</th>
                <th className="pb-2">Ciudad</th>
                <th className="pb-2">Fecha</th>
                <th className="pb-2 text-right">Puntos</th>
              </tr>
            </thead>
            <tbody>
              {user.completions.map((c) => (
                <tr key={c.mission_id} className="border-b border-gray-50 last:border-0">
                  <td className="py-2">{c.mission_name}</td>
                  <td className="py-2 text-gray-500">{c.city_name}</td>
                  <td className="py-2 text-gray-500">{formatDate(c.completed_at)}</td>
                  <td className="py-2 text-right font-semibold text-indigo-700">{c.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Points per city */}
      {user.points_per_city && Object.keys(user.points_per_city).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Puntos por ciudad</h3>
          <dl className="flex flex-col gap-2 text-sm">
            {Object.entries(user.points_per_city).map(([city, pts]) => (
              <div key={city} className="flex justify-between">
                <dt className="text-gray-600">{city}</dt>
                <dd className="font-semibold text-indigo-700">{pts.toLocaleString('es-PE')}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* Sensitive actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Acciones</h3>
        <div className="flex gap-3">
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
              user.is_active
                ? 'text-red-700 bg-red-50 hover:bg-red-100 border border-red-200'
                : 'text-green-700 bg-green-50 hover:bg-green-100 border border-green-200'
            }`}
          >
            {user.is_active ? t.deactivate : t.activate}
          </button>
          <button
            type="button"
            onClick={() => setShowResetProgressConfirm(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg"
          >
            {t.resetProgress}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          «{t.resetProgress}» borra todo el progreso del jugador para volver a probar desde cero.
        </p>
      </div>

      {/* Reset password confirm */}
      <ConfirmDialog
        open={showResetConfirm}
        title="Restablecer contraseña"
        message={t.resetPasswordConfirm(user.email)}
        confirmLabel="Generar contraseña temporal"
        variant="warning"
        onConfirm={handleReset}
        onCancel={() => setShowResetConfirm(false)}
        loading={resetPassword.isPending}
      />

      {/* Toggle active confirm */}
      <ConfirmDialog
        open={showToggleConfirm}
        title={user.is_active ? t.deactivate : t.activate}
        message={
          user.is_active ? t.deactivateUserConfirm(user.email) : t.activateUserConfirm(user.email)
        }
        confirmLabel={user.is_active ? t.deactivate : t.activate}
        variant={user.is_active ? 'danger' : 'warning'}
        onConfirm={handleToggle}
        onCancel={() => setShowToggleConfirm(false)}
        loading={toggleActive.isPending}
      />

      {/* Reset progress confirm (testing tool — destructive, no undo) */}
      <ConfirmDialog
        open={showResetProgressConfirm}
        title={t.resetProgress}
        message={t.resetProgressConfirm(user.email)}
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
