import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '../../api/categories'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { useToast } from '../../components/Toast'
import { Badge, btnIconSmDanger, btnRowAction, btnSecondary, card } from '../../components/ui'
import { t } from '../../lib/i18n'
import { translateApiError } from '../../lib/apiErrors'
import { cn } from '../../lib/utils'
import type { MissionCategory } from '../../api/types'

const inputClass = 'h-10 rounded-control border border-line-strong bg-surface px-3 text-sm'

export function CategoriesEditor({ missionId }: { missionId: string }) {
  const { data: categories, isLoading } = useCategories(missionId)
  const create = useCreateCategory(missionId)
  const toast = useToast()
  const [name, setName] = useState('')
  const [threshold, setThreshold] = useState(60)

  async function add() {
    if (!name.trim()) return
    try {
      await create.mutateAsync({
        name: name.trim(),
        threshold_pct: threshold,
        order_index: categories?.length ?? 0,
      })
      setName('')
      setThreshold(60)
      toast.success(t.created)
    } catch (err) {
      toast.error(translateApiError(err))
    }
  }

  if (isLoading) return <p className="text-faint">{t.loading}</p>

  return (
    <div className={cn(card, 'p-6 flex flex-col gap-4')}>
      <div>
        <h3 className="m-0 text-[17px] font-semibold text-ink">{t.categories}</h3>
        <p className="m-0 mt-1 text-[13px] text-muted">{t.thresholdHint}</p>
      </div>

      {categories && categories.length > 0 ? (
        <div className="flex flex-col gap-2">
          {categories.map((c) => (
            <CategoryRow key={c.id} missionId={missionId} category={c} />
          ))}
        </div>
      ) : (
        <div className="bg-warn-tint text-warn-text rounded-control px-4 py-3 text-[13px] leading-5">
          {t.noCategoriesYet}
        </div>
      )}

      {/* Add row */}
      <div className="flex items-end gap-2 border-t border-line-soft pt-4">
        <label className="flex flex-col gap-1.5 flex-1">
          <span className="text-[13px] font-medium text-ink">{t.name}</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder={t.categoryPlaceholder}
          />
        </label>
        <label className="flex flex-col gap-1.5 w-28">
          <span className="text-[13px] font-medium text-ink">{t.threshold}</span>
          <input
            type="number"
            min={0}
            max={100}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className={inputClass}
          />
        </label>
        <button
          type="button"
          onClick={add}
          disabled={create.isPending || !name.trim()}
          className={btnSecondary}
        >
          <Plus size={16} strokeWidth={1.5} />
          {t.add}
        </button>
      </div>
    </div>
  )
}

function CategoryRow({ missionId, category }: { missionId: string; category: MissionCategory }) {
  const update = useUpdateCategory(missionId, category.id)
  const del = useDeleteCategory(missionId, category.id)
  const toast = useToast()
  const [name, setName] = useState(category.name)
  const [threshold, setThreshold] = useState(category.threshold_pct)
  const [confirm, setConfirm] = useState(false)

  const dirty = name !== category.name || threshold !== category.threshold_pct

  async function save() {
    try {
      await update.mutateAsync({ name, threshold_pct: threshold })
      toast.success(t.saved)
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

  return (
    <div className="flex items-center gap-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className={cn(inputClass, 'flex-1')}
        aria-label={`${t.category}: ${category.name}`}
      />
      <input
        type="number"
        min={0}
        max={100}
        value={threshold}
        onChange={(e) => setThreshold(Number(e.target.value))}
        className={cn(inputClass, 'w-24')}
        aria-label={t.threshold}
      />
      {category.total_points > 0 ? (
        <span className="text-xs text-muted tnum w-24 text-right" title={t.totalPoints}>
          {category.total_points} pts
        </span>
      ) : (
        // 0 points blocks mission activation (the category's threshold would be
        // unreachable) — make it look like the problem it is.
        <span title={t.totalPoints}>
          <Badge variant="warn" className="whitespace-nowrap tnum">
            0 pts · {t.noPointsBadge}
          </Badge>
        </span>
      )}
      <button
        type="button"
        onClick={save}
        disabled={!dirty || update.isPending}
        className={btnRowAction}
      >
        {t.save}
      </button>
      <button
        type="button"
        onClick={() => setConfirm(true)}
        className={btnIconSmDanger}
        aria-label={`${t.delete} ${category.name}`}
        title={t.delete}
      >
        <Trash2 size={15} strokeWidth={1.5} />
      </button>
      <ConfirmDialog
        open={confirm}
        title={t.delete}
        message={t.deleteCategoryConfirm(category.name)}
        confirmLabel={t.delete}
        onConfirm={remove}
        onCancel={() => setConfirm(false)}
        loading={del.isPending}
      />
    </div>
  )
}
