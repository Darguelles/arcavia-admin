import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronDown,
  ChevronRight,
  GripVertical,
  MapPin,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  TriangleAlert,
  X,
} from 'lucide-react'
import { usePhases, useCreatePhase, useUpdatePhase, useDeletePhase } from '../../api/phases'
import { useWaypoints, useDeleteWaypoint, useRestoreWaypoint } from '../../api/waypoints'
import { useCategories } from '../../api/categories'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { useToast } from '../../components/Toast'
import {
  Badge,
  btnAddDashed,
  btnIconSm,
  btnIconSmDanger,
  btnRowAction,
  btnSecondary,
  card,
} from '../../components/ui'
import { t } from '../../lib/i18n'
import { translateApiError } from '../../lib/apiErrors'
import { cn } from '../../lib/utils'
import type { Phase, Waypoint } from '../../api/types'

function WarnBanner({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 bg-warn-tint text-warn-text rounded-control px-4 py-3 text-[13px] leading-5">
      <TriangleAlert
        size={16}
        strokeWidth={1.5}
        className="shrink-0 mt-0.5 text-warn-deep"
        aria-hidden
      />
      <span>{children}</span>
    </div>
  )
}

export function PhasesEditor({
  missionId,
  hasCategories,
}: {
  missionId: string
  hasCategories: boolean
}) {
  const { data: phases, isLoading } = usePhases(missionId)
  // Shared query key with CategoriesEditor / the readiness panel — resolves
  // each waypoint's category name without an extra request.
  const { data: categories } = useCategories(missionId)
  const create = useCreatePhase(missionId)
  const toast = useToast()
  const [name, setName] = useState('')

  const categoryNames = new Map((categories ?? []).map((c) => [c.id, c.name]))

  async function add() {
    if (!name.trim()) return
    try {
      await create.mutateAsync({ name: name.trim(), order_index: phases?.length ?? 0 })
      setName('')
      toast.success(t.created)
    } catch (err) {
      toast.error(translateApiError(err))
    }
  }

  if (isLoading) return <p className="text-faint">{t.loading}</p>

  return (
    <div className="flex flex-col gap-5">
      {!hasCategories && <WarnBanner>{t.noCategoriesYet}</WarnBanner>}

      {phases && phases.length > 0 ? (
        phases.map((p, i) => (
          <PhaseCard
            key={p.id}
            missionId={missionId}
            phase={p}
            index={i}
            canAddWaypoint={hasCategories}
            categoryNames={categoryNames}
          />
        ))
      ) : (
        <WarnBanner>{t.noPhasesYet}</WarnBanner>
      )}

      {/* Add phase */}
      <div className="flex items-center gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-10 flex-1 max-w-xs rounded-control border border-line-strong bg-surface px-3 text-sm"
          placeholder={t.addPhase}
          aria-label={t.phase}
        />
        <button
          type="button"
          onClick={add}
          disabled={create.isPending || !name.trim()}
          className={btnSecondary}
        >
          <Plus size={16} strokeWidth={1.5} />
          {t.addPhase}
        </button>
      </div>
    </div>
  )
}

function PhaseCard({
  missionId,
  phase,
  index,
  canAddWaypoint,
  categoryNames,
}: {
  missionId: string
  phase: Phase
  index: number
  canAddWaypoint: boolean
  categoryNames: Map<string, string>
}) {
  const navigate = useNavigate()
  const { data: waypoints } = useWaypoints(phase.id)
  const update = useUpdatePhase(missionId, phase.id)
  const del = useDeletePhase(missionId, phase.id)
  const toast = useToast()
  const [name, setName] = useState(phase.name)
  const [editing, setEditing] = useState(false)
  const [confirm, setConfirm] = useState(false)

  // Deleted points are archived server-side (progress and QR history are
  // kept). They are listed apart, below the live ones, and never counted.
  const live = (waypoints ?? []).filter((w) => w.archived_at === null)
  const archived = (waypoints ?? []).filter((w) => w.archived_at !== null)
  const hasActive = live.some((w) => w.is_active)
  const totalPoints = live.reduce((sum, w) => sum + w.points, 0)

  async function save() {
    try {
      await update.mutateAsync({ name })
      toast.success(t.saved)
      setEditing(false)
    } catch (err) {
      toast.error(translateApiError(err))
    }
  }

  async function remove() {
    try {
      await del.mutateAsync()
      toast.success(t.deleted)
    } catch (err) {
      toast.error(translateApiError(err))
    } finally {
      setConfirm(false)
    }
  }

  const addWaypointButton = (
    <button
      type="button"
      disabled={!canAddWaypoint}
      onClick={() => navigate(`/admin/missions/${missionId}/waypoints/new?phaseId=${phase.id}`)}
      className={btnAddDashed}
      title={!canAddWaypoint ? t.noCategoriesYet : undefined}
    >
      <Plus size={15} strokeWidth={1.5} />
      {t.addWaypoint}
    </button>
  )

  return (
    <div className={cn(card, 'overflow-hidden')}>
      {/* Header */}
      <div className="px-5 py-4 flex items-center gap-3 border-b border-line bg-paper">
        <GripVertical
          size={18}
          strokeWidth={1.5}
          className="text-line-strong shrink-0"
          aria-hidden
        />
        {editing ? (
          <>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className="h-8 flex-1 rounded-control border border-line-strong bg-surface px-2.5 text-sm font-medium"
              aria-label={`${t.phase}: ${phase.name}`}
            />
            <button
              type="button"
              onClick={save}
              disabled={name === phase.name || update.isPending}
              className={btnRowAction}
            >
              {t.save}
            </button>
            <button
              type="button"
              onClick={() => {
                setName(phase.name)
                setEditing(false)
              }}
              className={btnIconSm}
              aria-label={t.cancel}
              title={t.cancel}
            >
              <X size={15} strokeWidth={1.5} />
            </button>
          </>
        ) : (
          <>
            <p className="m-0 text-[15px] font-semibold text-ink">
              {t.phase} {index + 1} — {phase.name}
            </p>
            {waypoints &&
              (hasActive ? (
                <span className="text-xs text-muted tnum">
                  {live.length} {live.length === 1 ? 'punto' : 'puntos'} · {totalPoints} pts
                </span>
              ) : (
                // A phase without an active waypoint blocks mission activation.
                <Badge variant="outline">{t.noActiveWaypointBadge}</Badge>
              ))}
            <div className="ml-auto flex gap-1.5">
              <button
                type="button"
                onClick={() => setEditing(true)}
                className={btnIconSm}
                aria-label={`${t.edit} ${phase.name}`}
                title={t.edit}
              >
                <Pencil size={15} strokeWidth={1.5} />
              </button>
              <button
                type="button"
                onClick={() => setConfirm(true)}
                className={btnIconSmDanger}
                aria-label={`${t.delete} ${phase.name}`}
                title={t.delete}
              >
                <Trash2 size={15} strokeWidth={1.5} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Waypoints */}
      {live.length > 0 ? (
        <>
          {live.map((w) => (
            <WaypointRow
              key={w.id}
              missionId={missionId}
              phaseId={phase.id}
              waypoint={w}
              categoryName={categoryNames.get(w.category_id) ?? ''}
            />
          ))}
          <div className="px-5 py-3">{addWaypointButton}</div>
        </>
      ) : (
        waypoints && (
          <div className="px-5 py-[22px] flex flex-col items-start gap-3">
            <p className="m-0 text-[13px] text-muted">{t.noWaypointsYet}</p>
            {addWaypointButton}
          </div>
        )
      )}

      {archived.length > 0 && (
        <ArchivedWaypoints
          missionId={missionId}
          phaseId={phase.id}
          waypoints={archived}
          categoryNames={categoryNames}
        />
      )}

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

/** Collapsed tail of a phase card listing its deleted (archived) points. */
function ArchivedWaypoints({
  missionId,
  phaseId,
  waypoints,
  categoryNames,
}: {
  missionId: string
  phaseId: string
  waypoints: Waypoint[]
  categoryNames: Map<string, string>
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-t border-line bg-paper">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center gap-2 px-5 py-2.5 bg-transparent border-0 text-left cursor-pointer"
      >
        {open ? (
          <ChevronDown size={15} strokeWidth={1.5} className="text-faint" aria-hidden />
        ) : (
          <ChevronRight size={15} strokeWidth={1.5} className="text-faint" aria-hidden />
        )}
        <span className="text-xs font-semibold text-muted">
          {t.archivedWaypoints} ({waypoints.length})
        </span>
        <span className="text-xs text-faint truncate">{t.archivedWaypointsHint}</span>
      </button>
      {open &&
        waypoints.map((w) => (
          <WaypointRow
            key={w.id}
            missionId={missionId}
            phaseId={phaseId}
            waypoint={w}
            categoryName={categoryNames.get(w.category_id) ?? ''}
          />
        ))}
    </div>
  )
}

function WaypointRow({
  missionId,
  phaseId,
  waypoint,
  categoryName,
}: {
  missionId: string
  phaseId: string
  waypoint: Waypoint
  categoryName: string
}) {
  const navigate = useNavigate()
  const del = useDeleteWaypoint(waypoint.id, phaseId, missionId)
  const restore = useRestoreWaypoint(waypoint.id, phaseId, missionId)
  const toast = useToast()
  const [confirm, setConfirm] = useState(false)
  const isArchived = waypoint.archived_at !== null

  async function remove() {
    try {
      await del.mutateAsync()
      toast.success(t.deleted)
    } catch (err) {
      toast.error(translateApiError(err))
    } finally {
      setConfirm(false)
    }
  }

  async function bringBack() {
    try {
      await restore.mutateAsync()
      toast.success(t.restored)
    } catch (err) {
      toast.error(translateApiError(err))
    }
  }

  function open() {
    navigate(`/admin/missions/${missionId}/waypoints/${waypoint.id}`)
  }

  // "Categoría · factores de check-in" (question count is not available here).
  const factors = [
    waypoint.requires_qr && 'QR',
    'ubicación',
    waypoint.requires_keyword && 'palabra clave',
  ]
    .filter(Boolean)
    .join(' + ')
  const subtitle = [categoryName, factors].filter(Boolean).join(' · ')

  return (
    <>
      <div
        onClick={open}
        className={cn(
          'px-5 py-3.5 flex items-center gap-3.5 border-b border-line-soft last:border-b-0 hover:bg-paper cursor-pointer transition-colors',
          isArchived && 'opacity-70'
        )}
      >
        <MapPin
          size={18}
          strokeWidth={1.5}
          className={cn('shrink-0', waypoint.is_active ? 'text-gold-deep' : 'text-line-strong')}
          aria-hidden
        />
        <div className="flex-1 min-w-0">
          <button
            type="button"
            onClick={open}
            className={cn(
              'block m-0 p-0 bg-transparent border-0 text-sm font-medium text-left cursor-pointer',
              isArchived ? 'text-muted line-through' : 'text-ink'
            )}
          >
            {waypoint.name}
          </button>
          {subtitle && <p className="m-0 mt-0.5 text-xs text-faint truncate">{subtitle}</p>}
        </div>
        <span className="text-[13px] text-muted tnum shrink-0">{waypoint.points} pts</span>
        {isArchived ? (
          <Badge variant="outline">{t.archived}</Badge>
        ) : (
          <Badge variant={waypoint.is_active ? 'success' : 'neutral'}>
            {waypoint.is_active ? t.active : t.inactive}
          </Badge>
        )}
        {isArchived ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              void bringBack()
            }}
            disabled={restore.isPending}
            className={btnRowAction}
            aria-label={`${t.restore} ${waypoint.name}`}
            title={t.restore}
          >
            <RotateCcw size={14} strokeWidth={1.5} />
            {t.restore}
          </button>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setConfirm(true)
            }}
            className={btnIconSmDanger}
            aria-label={`${t.delete} ${waypoint.name}`}
            title={t.delete}
          >
            <Trash2 size={15} strokeWidth={1.5} />
          </button>
        )}
        <ChevronRight size={18} strokeWidth={1.5} className="text-faint shrink-0" aria-hidden />
      </div>
      <ConfirmDialog
        open={confirm}
        title={t.delete}
        message={t.deleteWaypointConfirm(waypoint.name)}
        confirmLabel={t.delete}
        onConfirm={remove}
        onCancel={() => setConfirm(false)}
        loading={del.isPending}
      />
    </>
  )
}
