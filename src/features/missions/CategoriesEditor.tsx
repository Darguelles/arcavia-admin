import { useState } from 'react'
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '../../api/categories'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { useToast } from '../../components/Toast'
import { ApiClientError } from '../../api/client'
import { t } from '../../lib/i18n'
import type { MissionCategory } from '../../api/types'

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
    } catch {
      toast.error(t.error)
    }
  }

  if (isLoading) return <p className="text-gray-400">{t.loading}</p>

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <h3 className="font-semibold text-gray-800">{t.categories}</h3>
        <p className="text-xs text-gray-500">{t.thresholdHint}</p>
      </div>

      {categories && categories.length > 0 ? (
        <div className="flex flex-col gap-2">
          {categories.map((c) => (
            <CategoryRow key={c.id} missionId={missionId} category={c} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-4 py-3">
          {t.noCategoriesYet}
        </p>
      )}

      {/* Add row */}
      <div className="flex items-end gap-2 border-t border-gray-100 pt-4">
        <label className="flex flex-col gap-1 flex-1">
          <span className="text-xs font-medium text-gray-600">{t.name}</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder={t.category}
          />
        </label>
        <label className="flex flex-col gap-1 w-28">
          <span className="text-xs font-medium text-gray-600">{t.threshold}</span>
          <input
            type="number"
            min={0}
            max={100}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <button
          type="button"
          onClick={add}
          disabled={create.isPending || !name.trim()}
          className="px-3 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-60"
        >
          + {t.add}
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
    <div className="flex items-center gap-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm flex-1"
        aria-label={`${t.category}: ${category.name}`}
      />
      <input
        type="number"
        min={0}
        max={100}
        value={threshold}
        onChange={(e) => setThreshold(Number(e.target.value))}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm w-24"
        aria-label={t.threshold}
      />
      <span className="text-xs text-gray-400 w-24 text-right" title={t.totalPoints}>
        {category.total_points} pts
      </span>
      <button
        type="button"
        onClick={save}
        disabled={!dirty || update.isPending}
        className="px-3 py-2 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg disabled:opacity-40"
      >
        {t.save}
      </button>
      <button
        type="button"
        onClick={() => setConfirm(true)}
        className="px-2 py-2 text-xs text-red-600 hover:text-red-800"
        aria-label={`${t.delete} ${category.name}`}
      >
        ✕
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
