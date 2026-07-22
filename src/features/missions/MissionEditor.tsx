import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useParams } from 'react-router-dom'
import {
  useMission,
  useCreateMission,
  useUpdateMission,
  useDeactivateMission,
} from '../../api/missions'
import { useCampaigns } from '../../api/campaigns'
import { useCategories } from '../../api/categories'
import {
  missionDetailsSchema,
  missionCreateSchema,
  type MissionDetailsForm,
  type MissionCreateForm,
} from '../../lib/validation'
import { FormField } from '../../components/FormField'
import { TranslationsEditor } from '../../components/TranslationsEditor'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { useToast } from '../../components/Toast'
import { CategoriesEditor } from './CategoriesEditor'
import { PhasesEditor } from './PhasesEditor'
import { t } from '../../lib/i18n'
import { cn } from '../../lib/utils'
import { ApiClientError } from '../../api/client'

type Tab = 'details' | 'categories' | 'phases'

const DIFFICULTIES = [
  { value: 'baja', label: t.difficultyBaja },
  { value: 'media', label: t.difficultyMedia },
  { value: 'alta', label: t.difficultyAlta },
] as const

export function MissionEditor() {
  const { id } = useParams<{ id?: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const toast = useToast()
  const [activeTab, setActiveTab] = useState<Tab>('details')
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)

  const { data: mission, isLoading } = useMission(id ?? '')
  const createMission = useCreateMission()
  const updateMission = useUpdateMission(id ?? '')
  const deactivateMission = useDeactivateMission(id ?? '')
  const { data: campaignsPage } = useCampaigns({ limit: 200 })
  const campaigns = campaignsPage?.items ?? []
  const { data: categories } = useCategories(id ?? '')

  const createForm = useForm<MissionCreateForm>({
    resolver: zodResolver(missionCreateSchema),
    defaultValues: {
      is_active: false,
      difficulty: 'media',
      reward_points: 0,
      estimated_time_minutes: 0,
      translations: {},
    },
  })

  const detailsForm = useForm<MissionDetailsForm>({
    resolver: zodResolver(missionDetailsSchema),
    defaultValues: {
      is_active: false,
      difficulty: 'media',
      reward_points: 0,
      estimated_time_minutes: 0,
      translations: {},
    },
  })

  useEffect(() => {
    if (mission) {
      detailsForm.reset({
        name: mission.name,
        description: mission.description,
        difficulty: mission.difficulty,
        reward_points: mission.reward_points,
        estimated_time_minutes: mission.estimated_time_minutes,
        is_active: mission.is_active,
        translations: mission.translations ?? {},
      })
    }
  }, [mission, detailsForm])

  async function onCreateSubmit(data: MissionCreateForm) {
    try {
      const created = await createMission.mutateAsync(data)
      toast.success(t.created)
      navigate(`/admin/missions/${created.id}`)
    } catch (err) {
      if (err instanceof ApiClientError && err.details) {
        Object.entries(err.details).forEach(([field, msg]) =>
          createForm.setError(field as keyof MissionCreateForm, { message: String(msg) })
        )
      }
      toast.error(t.error)
    }
  }

  async function onDetailsSubmit(data: MissionDetailsForm) {
    if (!id) return
    try {
      await updateMission.mutateAsync(data)
      toast.success(t.saved)
    } catch (err) {
      // Activation can fail if the structure isn't completable (§8.4).
      toast.error(err instanceof ApiClientError ? err.message : t.error)
    }
  }

  async function handleDeactivate() {
    if (!id) return
    try {
      await deactivateMission.mutateAsync()
      toast.success(t.deactivated)
      navigate('/admin/missions')
    } catch {
      toast.error(t.error)
    } finally {
      setConfirmDeactivate(false)
    }
  }

  if (isEdit && isLoading) return <p className="text-gray-400 p-6">{t.loading}</p>

  // ── Create mode ───────────────────────────────────────────────────────────
  if (!isEdit) {
    const {
      register,
      handleSubmit,
      control,
      formState: { errors, isSubmitting },
    } = createForm
    return (
      <div className="max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => navigate('/admin/missions')}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← {t.back}
          </button>
          <h2 className="text-xl font-bold text-gray-900">Nueva misión</h2>
        </div>

        <form
          onSubmit={handleSubmit(onCreateSubmit)}
          className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4"
          noValidate
        >
          <FormField
            as="select"
            label={t.campaign}
            required
            error={errors.campaign_id?.message}
            {...register('campaign_id')}
          >
            <option value="">{t.selectOption}</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.city_name ? ` — ${c.city_name}` : ''}
              </option>
            ))}
          </FormField>

          <FormField
            as="input"
            label={t.name}
            required
            error={errors.name?.message}
            {...register('name')}
          />
          <FormField
            as="textarea"
            label={t.description}
            error={errors.description?.message}
            {...register('description')}
          />

          <div className="grid grid-cols-3 gap-4">
            <FormField
              as="select"
              label={t.difficulty}
              error={errors.difficulty?.message}
              {...register('difficulty')}
            >
              {DIFFICULTIES.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </FormField>
            <FormField
              as="input"
              label={t.rewardPoints}
              type="number"
              min={0}
              error={errors.reward_points?.message}
              {...register('reward_points', { valueAsNumber: true })}
            />
            <FormField
              as="input"
              label={t.estimatedTime}
              type="number"
              min={0}
              error={errors.estimated_time_minutes?.message}
              {...register('estimated_time_minutes', { valueAsNumber: true })}
            />
          </div>

          <Controller
            name="translations"
            control={control}
            render={({ field }) => (
              <TranslationsEditor
                fields={[
                  { key: 'name', label: t.name },
                  { key: 'description', label: t.description, multiline: true },
                ]}
                value={field.value ?? {}}
                onChange={field.onChange}
              />
            )}
          />

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin/missions')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-60"
            >
              {isSubmitting ? t.loading : t.create}
            </button>
          </div>
        </form>
      </div>
    )
  }

  // ── Edit mode (tabbed) ────────────────────────────────────────────────────
  const TABS: { key: Tab; label: string }[] = [
    { key: 'details', label: t.detailsSection },
    { key: 'categories', label: t.categoriesTab },
    { key: 'phases', label: t.phasesTab },
  ]

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-4">
        <button
          type="button"
          onClick={() => navigate('/admin/missions')}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← {t.back}
        </button>
        <h2 className="text-xl font-bold text-gray-900 flex-1">{mission?.name}</h2>
        {mission?.is_active && (
          <button
            type="button"
            onClick={() => setConfirmDeactivate(true)}
            className="text-sm text-red-600 hover:text-red-800 font-medium"
          >
            {t.deactivate}
          </button>
        )}
      </div>

      <div className="flex border-b border-gray-200 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === tab.key
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'details' && (
        <form
          onSubmit={detailsForm.handleSubmit(onDetailsSubmit)}
          className="flex flex-col gap-4"
          noValidate
        >
          <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4">
            <FormField
              as="input"
              label={t.name}
              required
              error={detailsForm.formState.errors.name?.message}
              {...detailsForm.register('name')}
            />
            <FormField
              as="textarea"
              label={t.description}
              error={detailsForm.formState.errors.description?.message}
              {...detailsForm.register('description')}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                as="select"
                label={t.difficulty}
                error={detailsForm.formState.errors.difficulty?.message}
                {...detailsForm.register('difficulty')}
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </FormField>
              <FormField
                as="input"
                label={t.rewardPoints}
                type="number"
                min={0}
                error={detailsForm.formState.errors.reward_points?.message}
                {...detailsForm.register('reward_points', { valueAsNumber: true })}
              />
              <FormField
                as="input"
                label={t.estimatedTime}
                type="number"
                min={0}
                error={detailsForm.formState.errors.estimated_time_minutes?.message}
                {...detailsForm.register('estimated_time_minutes', { valueAsNumber: true })}
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                id="mission_active"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-indigo-600"
                {...detailsForm.register('is_active')}
              />
              <label htmlFor="mission_active" className="text-sm font-medium text-gray-700">
                {t.active}
              </label>
              <span className="text-xs text-gray-400">{t.missionNotCompletableHint}</span>
            </div>

            <Controller
              name="translations"
              control={detailsForm.control}
              render={({ field }) => (
                <TranslationsEditor
                  fields={[
                    { key: 'name', label: t.name },
                    { key: 'description', label: t.description, multiline: true },
                  ]}
                  value={field.value ?? {}}
                  onChange={field.onChange}
                />
              )}
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={detailsForm.formState.isSubmitting || !detailsForm.formState.isDirty}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-60"
            >
              {detailsForm.formState.isSubmitting ? t.loading : t.save}
            </button>
          </div>
        </form>
      )}

      {activeTab === 'categories' && id && <CategoriesEditor missionId={id} />}

      {activeTab === 'phases' && id && (
        <PhasesEditor missionId={id} hasCategories={(categories?.length ?? 0) > 0} />
      )}

      <ConfirmDialog
        open={confirmDeactivate}
        title={t.deactivate}
        message={mission ? t.deactivateMissionConfirm(mission.name) : ''}
        confirmLabel={t.deactivate}
        onConfirm={handleDeactivate}
        onCancel={() => setConfirmDeactivate(false)}
        loading={deactivateMission.isPending}
      />
    </div>
  )
}
