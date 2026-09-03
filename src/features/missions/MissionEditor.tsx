import { useState, useEffect, useRef, type ChangeEvent } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Power } from 'lucide-react'
import {
  useMission,
  useCreateMission,
  useUpdateMission,
  useDeactivateMission,
  useUploadMissionImage,
  useDeleteMissionImage,
} from '../../api/missions'
import { useCampaigns } from '../../api/campaigns'
import { useCategories } from '../../api/categories'
import { usePhases } from '../../api/phases'
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
import {
  Badge,
  btnDanger,
  btnGhost,
  btnIcon,
  btnPrimary,
  btnSecondary,
  card,
  overline,
} from '../../components/ui'
import { CategoriesEditor } from './CategoriesEditor'
import { PhasesEditor } from './PhasesEditor'
import { MissionReadinessPanel } from './MissionReadinessPanel'
import { t } from '../../lib/i18n'
import { translateApiError } from '../../lib/apiErrors'
import { cn } from '../../lib/utils'
import { ApiClientError } from '../../api/client'

type Tab = 'details' | 'categories' | 'phases'

// The active tab lives in the URL (?tab=…) so it survives remounts — e.g.
// coming back from the waypoint editor lands on "Fases y puntos", not Detalles.
const TAB_FROM_PARAM: Record<string, Tab> = {
  detalles: 'details',
  categorias: 'categories',
  fases: 'phases',
}
const TAB_TO_PARAM: Record<Tab, string> = {
  details: 'detalles',
  categories: 'categorias',
  phases: 'fases',
}

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
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab: Tab = TAB_FROM_PARAM[searchParams.get('tab') ?? ''] ?? 'details'
  const setActiveTab = (tab: Tab) => setSearchParams({ tab: TAB_TO_PARAM[tab] }, { replace: true })
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)

  const { data: mission, isLoading } = useMission(id ?? '')
  const createMission = useCreateMission()
  const updateMission = useUpdateMission(id ?? '')
  const deactivateMission = useDeactivateMission(id ?? '')
  const { data: campaignsPage } = useCampaigns({ limit: 200 })
  const campaigns = campaignsPage?.items ?? []
  const { data: categories } = useCategories(id ?? '')
  const { data: phases } = usePhases(id ?? '')

  const createForm = useForm<MissionCreateForm>({
    resolver: zodResolver(missionCreateSchema),
    defaultValues: {
      difficulty: 'media',
      reward_points: 0,
      estimated_time_minutes: 0,
      translations: {},
    },
  })

  const detailsForm = useForm<MissionDetailsForm>({
    resolver: zodResolver(missionDetailsSchema),
    defaultValues: {
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
        translations: mission.translations ?? {},
      })
    }
  }, [mission, detailsForm])

  async function onCreateSubmit(data: MissionCreateForm) {
    try {
      const created = await createMission.mutateAsync(data)
      toast.success(t.created)
      // Land on the natural next step: adding categories.
      navigate(`/admin/missions/${created.id}?tab=categorias`)
    } catch (err) {
      if (err instanceof ApiClientError && err.details) {
        Object.entries(err.details).forEach(([field, msg]) =>
          createForm.setError(field as keyof MissionCreateForm, { message: String(msg) })
        )
      } else {
        toast.error(translateApiError(err))
      }
    }
  }

  async function onDetailsSubmit(data: MissionDetailsForm) {
    if (!id) return
    try {
      await updateMission.mutateAsync(data)
      toast.success(t.saved)
    } catch (err) {
      toast.error(translateApiError(err))
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

  if (isEdit && isLoading) return <p className="text-faint p-6">{t.loading}</p>

  // ── Create mode ───────────────────────────────────────────────────────────
  if (!isEdit) {
    const {
      register,
      handleSubmit,
      control,
      formState: { errors, isSubmitting },
    } = createForm
    return (
      <div className="max-w-2xl flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/admin/missions')}
            className={cn(btnIcon, 'h-9 w-9')}
            aria-label={t.back}
            title={t.back}
          >
            <ArrowLeft size={16} strokeWidth={1.5} />
          </button>
          <h2 className="m-0 text-2xl leading-[30px] font-semibold text-ink">{t.newMission}</h2>
        </div>

        <form
          onSubmit={handleSubmit(onCreateSubmit)}
          className={cn(card, 'p-6 flex flex-col gap-4')}
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
              hint={t.rewardPointsHint}
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
            <button type="button" onClick={() => navigate('/admin/missions')} className={btnGhost}>
              {t.cancel}
            </button>
            <button type="submit" disabled={isSubmitting} className={btnPrimary}>
              {isSubmitting ? t.loading : t.create}
            </button>
          </div>
        </form>
      </div>
    )
  }

  // ── Edit mode (tabbed) ────────────────────────────────────────────────────
  const campaign = campaigns.find((c) => c.id === mission?.campaign_id)
  const breadcrumb = [campaign?.name, campaign?.city_name].filter(Boolean).join(' · ')

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: 'details', label: t.detailsSection },
    { key: 'categories', label: t.categoriesTab, count: categories?.length },
    { key: 'phases', label: t.phasesTab, count: phases?.length },
  ]

  return (
    <div className="max-w-[1120px] flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate('/admin/missions')}
          className={cn(btnIcon, 'h-9 w-9')}
          aria-label={t.back}
          title={t.back}
        >
          <ArrowLeft size={16} strokeWidth={1.5} />
        </button>
        <div>
          {breadcrumb && <p className={cn(overline, 'm-0')}>{breadcrumb}</p>}
          <h2 className="m-0 mt-1 text-2xl leading-[30px] font-semibold text-ink">
            {mission?.name}
          </h2>
        </div>
        <Badge variant={mission?.is_active ? 'success' : 'neutral'}>
          {mission?.is_active ? t.active : t.filterTabDraft}
        </Badge>
        {mission?.is_active && (
          <button
            type="button"
            onClick={() => setConfirmDeactivate(true)}
            className={cn(btnDanger, 'ml-auto')}
          >
            <Power size={16} strokeWidth={1.5} />
            {t.deactivate}
          </button>
        )}
      </div>

      <div className="grid grid-cols-[1fr_340px] gap-6 items-start">
        <div className="flex flex-col gap-5 min-w-0">
          <div className="flex gap-0 border-b border-line">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'px-1 py-2.5 mr-5 border-b-2 -mb-px text-sm transition-colors cursor-pointer',
                  activeTab === tab.key
                    ? 'border-gold font-semibold text-ink'
                    : 'border-transparent font-medium text-muted hover:text-ink'
                )}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className="ml-1.5 text-faint tnum">{tab.count}</span>
                )}
              </button>
            ))}
          </div>

          {activeTab === 'details' && (
            <form
              onSubmit={detailsForm.handleSubmit(onDetailsSubmit)}
              className="flex flex-col gap-5"
              noValidate
            >
              {id && <MissionImageSection missionId={id} imageUrl={mission?.image_url ?? null} />}

              <div className={cn(card, 'p-6 flex flex-col gap-4')}>
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
                    hint={t.rewardPointsHint}
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
                  className={btnSecondary}
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
        </div>

        <div className="sticky top-0 flex flex-col gap-5">
          {id && (
            <MissionReadinessPanel
              missionId={id}
              isActive={mission?.is_active ?? false}
              onNavigateTab={setActiveTab}
            />
          )}
        </div>
      </div>

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

// Keep in sync with the backend guard (config.allowed_image_types /
// max_image_upload_bytes) so the operator gets an instant, clear rejection
// instead of a round-trip error.
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_IMAGE_BYTES = 5 * 1024 * 1024

/**
 * Mission cover image. Uploaded after the mission exists (edit mode only), the
 * same way rewards handle their image. The bytes go straight to the API, which
 * stores them via the configured backend (local disk in dev, S3 in prod) and
 * returns the mission with its new image_url.
 */
function MissionImageSection({
  missionId,
  imageUrl,
}: {
  missionId: string
  imageUrl: string | null
}) {
  const toast = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const uploadImage = useUploadMissionImage(missionId)
  const removeImage = useDeleteMissionImage(missionId)
  const busy = uploadImage.isPending || removeImage.isPending

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // let the operator re-pick the same file after an error
    if (!file) return
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return toast.error(t.invalidImageType)
    if (file.size > MAX_IMAGE_BYTES) return toast.error(t.imageTooLarge)
    try {
      await uploadImage.mutateAsync(file)
      toast.success(t.imageUploaded)
    } catch (err) {
      toast.error(translateApiError(err))
    }
  }

  async function onRemove() {
    try {
      await removeImage.mutateAsync()
      toast.success(t.imageRemoved)
    } catch (err) {
      toast.error(translateApiError(err))
    }
  }

  return (
    <div className={cn(card, 'p-6 flex flex-col gap-4')}>
      <div>
        <h3 className="m-0 text-[17px] font-semibold text-ink">{t.missionImage}</h3>
        <p className="m-0 mt-1 text-[13px] text-muted">{t.missionImageHint}</p>
      </div>

      <div className="flex items-center gap-5">
        <div className="h-28 w-44 shrink-0 overflow-hidden rounded-card border border-line bg-paper">
          {imageUrl ? (
            <img src={imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center px-2 text-center text-xs text-faint">
              {t.noImageYet}
            </div>
          )}
        </div>

        <div className="flex flex-col items-start gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className={btnSecondary}
          >
            {busy ? t.loading : imageUrl ? t.changeImage : t.uploadImage}
          </button>
          {imageUrl && (
            <button
              type="button"
              onClick={onRemove}
              disabled={busy}
              className="bg-transparent border-0 p-0 text-[13px] font-medium text-danger hover:text-danger-deep cursor-pointer disabled:opacity-40"
            >
              {t.removeImage}
            </button>
          )}
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={onFile}
      />
    </div>
  )
}
