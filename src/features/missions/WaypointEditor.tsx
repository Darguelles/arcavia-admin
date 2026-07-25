import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
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
import { ChallengesEditor, DraftChallenges, challengeFormToCreate } from './ChallengesEditor'
import { QRSection } from './QRSection'
import { t } from '../../lib/i18n'
import { apiClient, ApiClientError } from '../../api/client'
import type { Challenge, Waypoint } from '../../api/types'

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
  const createWaypoint = useCreateWaypoint(phaseId)
  const updateWaypoint = useUpdateWaypoint(waypointId ?? '', phaseId)
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
        toast.error(err instanceof ApiClientError ? err.message : t.error)
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
      toast.error(err instanceof ApiClientError ? err.message : t.error)
      return
    }

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
      toast.error(err instanceof ApiClientError ? err.message : t.error)
    } finally {
      queryClient.invalidateQueries({ queryKey: waypointKeys.byPhase(phaseId) })
      navigate(`/admin/missions/${missionId}/waypoints/${created.id}`)
    }
  }

  if (isEdit && isLoading) return <p className="text-gray-400 p-6">{t.loading}</p>
  if (!phaseId && !isEdit) {
    return <p className="text-red-600 p-6">Falta la fase (phaseId).</p>
  }

  const cats = categories ?? []

  return (
    <div className="max-w-3xl flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(`/admin/missions/${missionId}`)}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← {t.back}
        </button>
        <h2 className="text-xl font-bold text-gray-900">
          {isEdit ? waypoint?.name : `${t.addWaypoint}`}
        </h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4">
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
            <label className="text-sm font-medium text-gray-700 mb-1 block">{t.mapAreaLabel}</label>
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
              <p className="text-xs text-red-600 mt-1">Coloca el pin en el mapa.</p>
            )}
          </div>

          {/* Geolocation check-in is the always-on presence proof (uses the
              pin + tolerance_radius_m above as the geofence). QR and an
              on-site keyword are optional additional factors. */}
          <div className="border border-gray-200 rounded-lg p-4 flex flex-col gap-4">
            <h4 className="text-sm font-semibold text-gray-800">{t.validationSection}</h4>

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
                className="h-4 w-4 mt-0.5 rounded border-gray-300 text-indigo-600"
                {...register('requires_qr')}
              />
              <div className="text-sm">
                <label htmlFor="wp_requires_qr" className="font-medium text-gray-700">
                  {t.requireQr}
                </label>
                <p className="text-xs text-gray-400">{t.requireQrHint}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <input
                id="wp_requires_keyword"
                type="checkbox"
                className="h-4 w-4 mt-0.5 rounded border-gray-300 text-indigo-600"
                {...register('requires_keyword')}
              />
              <div className="text-sm">
                <label htmlFor="wp_requires_keyword" className="font-medium text-gray-700">
                  {t.requireKeyword}
                </label>
                <p className="text-xs text-gray-400">{t.requireKeywordHint}</p>
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
              className="h-4 w-4 rounded border-gray-300 text-indigo-600"
              {...register('is_active')}
            />
            <label htmlFor="wp_active" className="text-sm font-medium text-gray-700">
              {t.active}
            </label>
            <span
              className={activeNeedsQuestion ? 'text-xs text-red-600' : 'text-xs text-gray-400'}
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
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800">{t.questions}</h3>
          <p className="text-xs text-gray-400 mt-0.5 mb-4">{t.questionsHint}</p>
          <DraftChallenges onChange={setDrafts} />
        </section>
      )}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => navigate(`/admin/missions/${missionId}`)}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          {t.cancel}
        </button>
        <button
          type="button"
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting || (isEdit && !isDirty)}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-60"
        >
          {isSubmitting ? t.loading : isEdit ? t.save : t.create}
        </button>
      </div>

      {/* Challenges + QR only make sense once the waypoint exists */}
      {isEdit && waypointId && (
        <>
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-800 mb-4">{t.questions}</h3>
            <ChallengesEditor waypointId={waypointId} />
          </section>

          {/* Only relevant once "Requerir escaneo de código QR" is checked
              above — QR stays available as a fallback, but de-emphasized for
              waypoints that rely on geolocation (+ keyword) instead. */}
          {requiresQr && (
            <section className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-800 mb-4">{t.qrTab}</h3>
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
