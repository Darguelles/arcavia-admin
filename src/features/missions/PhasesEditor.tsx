import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePhases, useCreatePhase, useUpdatePhase, useDeletePhase } from '../../api/phases'
import { useWaypoints, useDeleteWaypoint } from '../../api/waypoints'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { useToast } from '../../components/Toast'
import { ApiClientError } from '../../api/client'
import { t } from '../../lib/i18n'
import type { Phase, Waypoint } from '../../api/types'

export function PhasesEditor({
  missionId,
  hasCategories,
}: {
  missionId: string
  hasCategories: boolean
}) {
  const { data: phases, isLoading } = usePhases(missionId)
  const create = useCreatePhase(missionId)
  const toast = useToast()
  const [name, setName] = useState('')

  async function add() {
    if (!name.trim()) return
    try {
      await create.mutateAsync({ name: name.trim(), order_index: phases?.length ?? 0 })
      setName('')
      toast.success(t.created)
    } catch {
      toast.error(t.error)
    }
  }

  if (isLoading) return <p className="text-gray-400">{t.loading}</p>

  return (
    <div className="flex flex-col gap-4">
      {!hasCategories && (
        <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-4 py-3">
          {t.noCategoriesYet}
        </p>
      )}

      {phases && phases.length > 0 ? (
        phases.map((p) => (
          <PhaseCard key={p.id} missionId={missionId} phase={p} canAddWaypoint={hasCategories} />
        ))
      ) : (
        <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-4 py-3">{t.noPhasesYet}</p>
      )}

      {/* Add phase */}
      <div className="flex items-end gap-2">
        <label className="flex flex-col gap-1 flex-1">
          <span className="text-xs font-medium text-gray-600">{t.phase}</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder={t.addPhase}
          />
        </label>
        <button
          type="button"
          onClick={add}
          disabled={create.isPending || !name.trim()}
          className="px-3 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-60"
        >
          + {t.addPhase}
        </button>
      </div>
    </div>
  )
}

function PhaseCard({
  missionId,
  phase,
  canAddWaypoint,
}: {
  missionId: string
  phase: Phase
  canAddWaypoint: boolean
}) {
  const navigate = useNavigate()
  const { data: waypoints } = useWaypoints(phase.id)
  const update = useUpdatePhase(missionId, phase.id)
  const del = useDeletePhase(missionId, phase.id)
  const toast = useToast()
  const [name, setName] = useState(phase.name)
  const [confirm, setConfirm] = useState(false)

  async function save() {
    try {
      await update.mutateAsync({ name })
      toast.success(t.saved)
    } catch {
      toast.error(t.error)
    }
  }

  async function remove() {
    try {
      await del.mutateAsync()
      toast.success(t.deleted)
    } catch (e) {
      toast.error(e instanceof ApiClientError ? e.message : t.error)
    } finally {
      setConfirm(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium flex-1"
          aria-label={`${t.phase}: ${phase.name}`}
        />
        <button
          type="button"
          onClick={save}
          disabled={name === phase.name || update.isPending}
          className="px-3 py-2 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg disabled:opacity-40"
        >
          {t.save}
        </button>
        <button
          type="button"
          onClick={() => setConfirm(true)}
          className="px-2 py-2 text-xs text-red-600 hover:text-red-800"
          aria-label={`${t.delete} ${phase.name}`}
        >
          ✕
        </button>
      </div>

      {/* Waypoints */}
      <div className="flex flex-col gap-1.5 pl-1">
        {waypoints && waypoints.length > 0 ? (
          waypoints.map((w) => (
            <WaypointRow key={w.id} missionId={missionId} phaseId={phase.id} waypoint={w} />
          ))
        ) : (
          <p className="text-xs text-gray-400 py-1">{t.noWaypointsYet}</p>
        )}
      </div>

      <button
        type="button"
        disabled={!canAddWaypoint}
        onClick={() => navigate(`/admin/missions/${missionId}/waypoints/new?phaseId=${phase.id}`)}
        className="self-start text-sm text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
        title={!canAddWaypoint ? t.noCategoriesYet : undefined}
      >
        + {t.addWaypoint}
      </button>

      <ConfirmDialog
        open={confirm}
        title={t.delete}
        message={t.deletePhaseConfirm(phase.name)}
        confirmLabel={t.delete}
        onConfirm={remove}
        onCancel={() => setConfirm(false)}
        loading={del.isPending}
      />
    </div>
  )
}

function WaypointRow({
  missionId,
  phaseId,
  waypoint,
}: {
  missionId: string
  phaseId: string
  waypoint: Waypoint
}) {
  const navigate = useNavigate()
  const del = useDeleteWaypoint(waypoint.id, phaseId)
  const toast = useToast()
  const [confirm, setConfirm] = useState(false)

  async function remove() {
    try {
      await del.mutateAsync()
      toast.success(t.deactivated)
    } catch {
      toast.error(t.error)
    } finally {
      setConfirm(false)
    }
  }

  return (
    <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5">
      <button
        type="button"
        onClick={() => navigate(`/admin/missions/${missionId}/waypoints/${waypoint.id}`)}
        className="text-sm text-gray-800 hover:text-indigo-700 font-medium flex-1 text-left"
      >
        {waypoint.name}
      </button>
      <span className="text-xs text-gray-400">{waypoint.points} pts</span>
      <span
        className={`px-2 py-0.5 rounded text-xs font-medium ${
          waypoint.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}
      >
        {waypoint.is_active ? t.active : t.inactive}
      </span>
      <button
        type="button"
        onClick={() => setConfirm(true)}
        className="px-2 text-xs text-red-600 hover:text-red-800"
        aria-label={`${t.deactivate} ${waypoint.name}`}
      >
        ✕
      </button>
      <ConfirmDialog
        open={confirm}
        title={t.deactivate}
        message={t.deleteWaypointConfirm(waypoint.name)}
        confirmLabel={t.deactivate}
        onConfirm={remove}
        onCancel={() => setConfirm(false)}
        loading={del.isPending}
      />
    </div>
  )
}
