import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useMission } from '../../api/missions'
import { useCity } from '../../api/cities'
import { useCategories } from '../../api/categories'
import { useWaypoint, useCreateWaypoint, useUpdateWaypoint } from '../../api/waypoints'
import { waypointSchema, type WaypointForm } from '../../lib/validation'
import { FormField } from '../../components/FormField'
import { MapPicker } from '../../components/MapPicker'
import { TranslationsEditor } from '../../components/TranslationsEditor'
import { useToast } from '../../components/Toast'
import { ChallengesEditor } from './ChallengesEditor'
import { QRSection } from './QRSection'
import { t } from '../../lib/i18n'
import { ApiClientError } from '../../api/client'

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

  async function onSubmit(data: WaypointForm) {
    try {
      if (isEdit) {
        await updateWaypoint.mutateAsync(data)
        toast.success(t.saved)
      } else {
        const created = await createWaypoint.mutateAsync(data)
        toast.success(t.created)
        navigate(`/admin/missions/${missionId}/waypoints/${created.id}`)
      }
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : t.error)
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
            <span className="text-xs text-gray-400">{t.waypointNoChallengesHint}</span>
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

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(`/admin/missions/${missionId}`)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            {t.cancel}
          </button>
          <button
            type="submit"
            disabled={isSubmitting || (isEdit && !isDirty)}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-60"
          >
            {isSubmitting ? t.loading : isEdit ? t.save : t.create}
          </button>
        </div>
      </form>

      {/* Challenges + QR only make sense once the waypoint exists */}
      {isEdit && waypointId && (
        <>
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-800 mb-4">{t.questions}</h3>
            <ChallengesEditor waypointId={waypointId} />
          </section>

          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-800 mb-4">{t.qrTab}</h3>
            <QRSection
              waypointId={waypointId}
              waypointName={waypoint?.name ?? ''}
              cityName={city?.name ?? ''}
            />
          </section>
        </>
      )}
    </div>
  )
}
