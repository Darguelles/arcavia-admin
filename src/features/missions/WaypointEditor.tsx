import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { useMission } from '../../api/missions'
import { useCity } from '../../api/cities'
import { useCategories } from '../../api/categories'
import {
  useWaypoint,
  useCreateWaypoint,
  useUpdateWaypoint,
  waypointKeys,
} from '../../api/waypoints'
import {
  waypointSchema,
  challengeSchema,
  type WaypointForm,
  type ChallengeFormItem,
} from '../../lib/validation'
import { FormField } from '../../components/FormField'
import { MapPicker } from '../../components/MapPicker'
import { TranslationsEditor } from '../../components/TranslationsEditor'
import { useToast } from '../../components/Toast'
import { btnGhost, btnIcon, btnPrimary, card, overline } from '../../components/ui'
import { ChallengesEditor, DraftChallenges, challengeFormToCreate } from './ChallengesEditor'
import { QRSection } from './QRSection'
import { t } from '../../lib/i18n'
import { translateApiError } from '../../lib/apiErrors'
import { apiClient } from '../../api/client'
import { categoryKeys } from '../../api/categories'
import { cn } from '../../lib/utils'
import type { Challenge, Waypoint } from '../../api/types'

const checkboxClass = 'h-4 w-4 rounded-chip border-line-strong accent-gold'

export function WaypointEditor() {
  const { missionId, waypointId } = useParams<{ missionId: string; waypointId?: string }>()
  const [searchParams] = useSearchParams()
  const isEdit = !!waypointId
  const navigate = useNavigate()
  const toast = useToast()

  const { data: mission } = useMission(missionId ?? '')
  const { data: city } = useCity(mission?.city_id ?? '')
  const { data: categories } = useCategories(missionId ?? '')
  const { data: waypoint, isLoading } = useWaypoint(waypointId ?? '')

  // Phase comes from the query on create, or the waypoint on edit.
  const phaseId = isEdit ? (waypoint?.phase_id ?? '') : (searchParams.get('phaseId') ?? '')
  const createWaypoint = useCreateWaypoint(phaseId, missionId)
  const updateWaypoint = useUpdateWaypoint(waypointId ?? '', phaseId, missionId)
  const queryClient = useQueryClient()

  // On create, questions are buffered here and flushed once the waypoint exists,
  // so a single Save builds the whole point (and can activate it right away).
  const [drafts, setDrafts] = useState<ChallengeFormItem[]>([])
  const [activeNeedsQuestion, setActiveNeedsQuestion] = useState(false)
  useEffect(() => {
    if (drafts.length > 0) setActiveNeedsQuestion(false)
  }, [drafts])

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<WaypointForm>({
    resolver: zodResolver(waypointSchema),
    defaultValues: {
      name: '',
      description: '',
      tolerance_radius_m: 50,
      points: 0,
      order_index: 0,
      is_active: false,
      requires_qr: false,
      requires_keyword: false,
      required_accuracy_m: 50,
      dwell_seconds: 60,
      min_fixes: 4,
      onsite_keyword_prompt: '',
      onsite_keyword_answer: '',
      translations: {},
    },
  })

  // Populate on edit.
  useEffect(() => {
    if (waypoint) {
      reset({
        category_id: waypoint.category_id,
        name: waypoint.name,
        description: waypoint.description,
        lat: waypoint.lat,
        lng: waypoint.lng,
        tolerance_radius_m: waypoint.tolerance_radius_m,
        points: waypoint.points,
        order_index: waypoint.order_index,
        is_active: waypoint.is_active,
        requires_qr: waypoint.requires_qr,
        requires_keyword: waypoint.requires_keyword,
        required_accuracy_m: waypoint.required_accuracy_m,
        dwell_seconds: waypoint.dwell_seconds,
        min_fixes: waypoint.min_fixes,
        onsite_keyword_prompt: waypoint.onsite_keyword_prompt ?? '',
        onsite_keyword_answer: waypoint.onsite_keyword_answer ?? '',
        translations: waypoint.translations ?? {},
      })
    }
  }, [waypoint, reset])

  // On create, drop the initial pin at the city center so the map is useful.
  useEffect(() => {
    if (!isEdit && city && !Number.isFinite(watch('lat'))) {
      setValue('lat', city.center_lat)
      setValue('lng', city.center_lng)
    }
  }, [isEdit, city, setValue, watch])

  const lat = watch('lat')
  const lng = watch('lng')
  const radius = watch('tolerance_radius_m')
  const requiresQr = watch('requires_qr')
  const requiresKeyword = watch('requires_keyword')

  async function onSubmit(data: WaypointForm) {
    if (isEdit) {
      try {
        await updateWaypoint.mutateAsync(data)
        toast.success(t.saved)
      } catch (err) {
        toast.error(translateApiError(err))
      }
      return
    }

    // ── Create: one Save orchestrates create → questions → activate ──────────
    // The backend forces a new waypoint inactive and refuses to activate one
    // with no questions, so create it inactive, flush the buffered questions,
    // then flip it active — mirroring the guard here for an instant message.
    if (data.is_active && drafts.length === 0) {
      setActiveNeedsQuestion(true)
      toast.error(t.waypointNoChallengesHint)
      return
    }
    if (drafts.some((q) => !challengeSchema.safeParse(q).success)) {
      toast.error(t.reviewQuestions)
      return
    }

    let created: Waypoint
    try {
      created = await createWaypoint.mutateAsync({ ...data, is_active: false })
    } catch (err) {
      toast.error(translateApiError(err))
      return
    }

    let followUpFailed = false
    try {
      let order = 0
      for (const q of drafts) {
        await apiClient.post<Challenge>(
          `/api/v1/admin/waypoints/${created.id}/challenges`,
          challengeFormToCreate({ ...q, order_index: order++ })
        )
      }
      if (data.is_active) {
        await apiClient.patch<Waypoint>(`/api/v1/admin/waypoints/${created.id}`, {
          is_active: true,
        })
      }
      toast.success(t.created)
    } catch (err) {
      // The point exists but a follow-up step failed — surface it and hand off
      // to the edit screen so the operator can finish instead of losing work.
      followUpFailed = true
      toast.error(translateApiError(err))
    }
    queryClient.invalidateQueries({ queryKey: waypointKeys.byPhase(phaseId) })
    if (missionId) {
      queryClient.invalidateQueries({ queryKey: categoryKeys.byMission(missionId) })
    }
    // On success, go straight back to the mission's phases tab — no detour
    // through the waypoint edit screen.
    navigate(
      followUpFailed
        ? `/admin/missions/${missionId}/waypoints/${created.id}`
        : `/admin/missions/${missionId}?tab=fases`
    )
  }

  if (isEdit && isLoading) return <p className="text-faint p-6">{t.loading}</p>
  if (!phaseId && !isEdit) {
    return <p className="text-danger p-6">Falta la fase (phaseId).</p>
  }

  const cats = categories ?? []

  return (
    <div className="max-w-3xl flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate(`/admin/missions/${missionId}?tab=fases`)}
          className={cn(btnIcon, 'h-9 w-9')}
          aria-label={t.back}
          title={t.back}
        >
          <ArrowLeft size={16} strokeWidth={1.5} />
        </button>
        <div>
          {mission?.name && <p className={cn(overline, 'm-0')}>{mission.name}</p>}
          <h2 className="m-0 mt-1 text-2xl leading-[30px] font-semibold text-ink">
            {isEdit ? waypoint?.name : `${t.addWaypoint}`}
          </h2>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <div className={cn(card, 'p-6 flex flex-col gap-4')}>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              as="input"
              label={t.name}
              required
              error={errors.name?.message}
              {...register('name')}
            />
            <FormField
              as="select"
              label={t.category}
              required
              error={errors.category_id?.message}
              {...register('category_id')}
            >
              <option value="">{t.selectOption}</option>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </FormField>
          </div>

          <FormField
            as="textarea"
            label={t.description}
            error={errors.description?.message}
            {...register('description')}
          />

          <div className="grid grid-cols-3 gap-4">
            <FormField
              as="input"
              label={t.pointsAwarded}
              type="number"
              min={0}
              error={errors.points?.message}
              {...register('points', { valueAsNumber: true })}
            />
            <FormField
              as="input"
              label={t.requiredCloseness}
              type="number"
              min={5}
              max={5000}
              hint={t.requiredClosenessHint}
              error={errors.tolerance_radius_m?.message}
              {...register('tolerance_radius_m', { valueAsNumber: true })}
            />
            <FormField
              as="input"
              label={t.order}
              type="number"
              min={0}
              error={errors.order_index?.message}
              {...register('order_index', { valueAsNumber: true })}
            />
          </div>

          {/* Location */}
          <div>
            <label className="text-[13px] font-medium text-ink mb-1.5 block">
              {t.mapAreaLabel}
            </label>
            <MapPicker
              lat={lat}
              lng={lng}
              toleranceRadius={radius || 50}
              onChange={(newLat, newLng) => {
                setValue('lat', newLat, { shouldValidate: true, shouldDirty: true })
                setValue('lng', newLng, { shouldDirty: true })
              }}
              height="360px"
            />
            {(errors.lat || errors.lng) && (
              <p className="text-[13px] text-danger mt-1.5">Coloca el pin en el mapa.</p>
            )}
          </div>

          {/* Geolocation check-in is the always-on presence proof (uses the
              pin + tolerance_radius_m above as the geofence). QR and an
              on-site keyword are optional additional factors. */}
          <div className="rounded-card border border-line p-5 flex flex-col gap-4">
            <h4 className="m-0 text-[15px] font-semibold text-ink">{t.validationSection}</h4>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                as="input"
                label={t.requiredAccuracy}
                type="number"
                min={5}
                max={500}
                hint={t.requiredAccuracyHint}
                error={errors.required_accuracy_m?.message}
                {...register('required_accuracy_m', { valueAsNumber: true })}
              />
              <FormField
                as="input"
                label={t.dwellSeconds}
                type="number"
                min={0}
                max={600}
                hint={t.dwellSecondsHint}
                error={errors.dwell_seconds?.message}
                {...register('dwell_seconds', { valueAsNumber: true })}
              />
              <FormField
                as="input"
                label={t.minFixes}
                type="number"
                min={1}
                max={50}
                hint={t.minFixesHint}
                error={errors.min_fixes?.message}
                {...register('min_fixes', { valueAsNumber: true })}
              />
            </div>

            <div className="flex items-start gap-3">
              <input
                id="wp_requires_qr"
                type="checkbox"
                className={cn(checkboxClass, 'mt-0.5')}
                {...register('requires_qr')}
              />
              <div className="text-sm">
                <label htmlFor="wp_requires_qr" className="font-medium text-ink">
                  {t.requireQr}
                </label>
                <p className="m-0 text-[13px] text-muted">{t.requireQrHint}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <input
                id="wp_requires_keyword"
                type="checkbox"
                className={cn(checkboxClass, 'mt-0.5')}
                {...register('requires_keyword')}
              />
              <div className="text-sm">
                <label htmlFor="wp_requires_keyword" className="font-medium text-ink">
                  {t.requireKeyword}
                </label>
                <p className="m-0 text-[13px] text-muted">{t.requireKeywordHint}</p>
              </div>
            </div>

            {requiresKeyword && (
              <div className="grid grid-cols-2 gap-4 pl-7">
                <FormField
                  as="input"
                  label={t.onsiteKeywordPrompt}
                  hint={t.onsiteKeywordPromptHint}
                  error={errors.onsite_keyword_prompt?.message}
                  {...register('onsite_keyword_prompt')}
                />
                <FormField
                  as="input"
                  label={t.onsiteKeywordAnswer}
                  hint={t.onsiteKeywordAnswerHint}
                  error={errors.onsite_keyword_answer?.message}
                  {...register('onsite_keyword_answer')}
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <input
              id="wp_active"
              type="checkbox"
              className={checkboxClass}
              {...register('is_active')}
            />
            <label htmlFor="wp_active" className="text-sm font-medium text-ink">
              {t.active}
            </label>
            <span
              className={activeNeedsQuestion ? 'text-xs text-danger' : 'text-xs text-faint'}
              role={activeNeedsQuestion ? 'alert' : undefined}
            >
              {t.waypointNoChallengesHint}
            </span>
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
        </div>
      </form>

      {/* On create, questions are added inline and saved together with the
          point below — no separate "save, come back, then activate" step. */}
      {!isEdit && (
        <section className={cn(card, 'p-6')}>
          <h3 className="m-0 text-[17px] font-semibold text-ink">{t.questions}</h3>
          <p className="m-0 mt-1 mb-4 text-[13px] text-muted">{t.questionsHint}</p>
          <DraftChallenges onChange={setDrafts} />
        </section>
      )}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => navigate(`/admin/missions/${missionId}?tab=fases`)}
          className={btnGhost}
        >
          {t.cancel}
        </button>
        <button
          type="button"
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting || (isEdit && !isDirty)}
          className={btnPrimary}
        >
          {isSubmitting ? t.loading : isEdit ? t.save : t.create}
        </button>
      </div>

      {/* Challenges + QR only make sense once the waypoint exists */}
      {isEdit && waypointId && (
        <>
          <section className={cn(card, 'p-6')}>
            <h3 className="m-0 mb-4 text-[17px] font-semibold text-ink">{t.questions}</h3>
            <ChallengesEditor waypointId={waypointId} />
          </section>

          {/* Only relevant once "Requerir escaneo de código QR" is checked
              above — QR stays available as a fallback, but de-emphasized for
              waypoints that rely on geolocation (+ keyword) instead. */}
          {requiresQr && (
            <section className={cn(card, 'p-6')}>
              <h3 className="m-0 mb-4 text-[17px] font-semibold text-ink">{t.qrTab}</h3>
              <QRSection
                waypointId={waypointId}
                waypointName={waypoint?.name ?? ''}
                cityName={city?.name ?? ''}
              />
            </section>
          )}
        </>
      )}
    </div>
  )
}
