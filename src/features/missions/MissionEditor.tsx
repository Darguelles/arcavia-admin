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
import {
  missionDetailsSchema,
  missionCreateSchema,
  type MissionDetailsForm,
  type MissionCreateForm,
} from '../../lib/validation'
import { FormField } from '../../components/FormField'
import { MapPicker } from '../../components/MapPicker'
import { TranslationsEditor } from '../../components/TranslationsEditor'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { useToast } from '../../components/Toast'
import { ChallengesEditor } from './ChallengesEditor'
import { QRSection } from './QRSection'
import { t } from '../../lib/i18n'
import { cn } from '../../lib/utils'
import { ApiClientError } from '../../api/client'

type Tab = 'details' | 'location' | 'questions' | 'qr'

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

  // Form for create mode
  const createForm = useForm<MissionCreateForm>({
    resolver: zodResolver(missionCreateSchema),
    defaultValues: { is_active: false, points: 100, tolerance_radius_m: 50, translations: {} },
  })

  // Form for edit mode (details tab)
  const detailsForm = useForm<MissionDetailsForm>({
    resolver: zodResolver(missionDetailsSchema),
    defaultValues: { is_active: false, points: 100, tolerance_radius_m: 50, translations: {} },
  })

  // Location state (separate save in edit mode)
  const [mapLat, setMapLat] = useState<number | undefined>()
  const [mapLng, setMapLng] = useState<number | undefined>()
  const [mapRadius, setMapRadius] = useState(50)

  useEffect(() => {
    if (mission) {
      detailsForm.reset({
        name: mission.name,
        description: mission.description,
        points: mission.points,
        tolerance_radius_m: mission.tolerance_radius_m,
        is_active: mission.is_active,
        calibration_notes: mission.calibration_notes ?? '',
        translations: mission.translations ?? {},
      })
      setMapLat(mission.lat)
      setMapLng(mission.lng)
      setMapRadius(mission.tolerance_radius_m)
    }
  }, [mission, detailsForm])

  const canActivate = (mission?.challenge_count ?? 0) > 0

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
    } catch {
      toast.error(t.error)
    }
  }

  async function saveLocation() {
    if (!id || mapLat === undefined || mapLng === undefined) return
    try {
      await updateMission.mutateAsync({ lat: mapLat, lng: mapLng, tolerance_radius_m: mapRadius })
      toast.success(t.saved)
    } catch {
      toast.error(t.error)
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

  // ── Create mode (simple form, no tabs) ──────────────────────────────────
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
            label="Campaña"
            required
            error={errors.campaign_id?.message}
            {...register('campaign_id')}
          >
            <option value="">Selecciona una campaña</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — {c.city_name}
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

          <div className="grid grid-cols-2 gap-4">
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
              hint={t.requiredClosenessHint}
              error={errors.tolerance_radius_m?.message}
              {...register('tolerance_radius_m', { valueAsNumber: true })}
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
    { key: 'details', label: t.detailsTab },
    { key: 'location', label: t.locationTab },
    { key: 'questions', label: t.questionsTab },
    { key: 'qr', label: t.qrTab },
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

      {/* Tab bar */}
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

      {/* Details tab */}
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                as="input"
                label={t.pointsAwarded}
                type="number"
                min={0}
                error={detailsForm.formState.errors.points?.message}
                {...detailsForm.register('points', { valueAsNumber: true })}
              />
              <FormField
                as="input"
                label={t.requiredCloseness}
                type="number"
                min={5}
                hint={t.requiredClosenessHint}
                error={detailsForm.formState.errors.tolerance_radius_m?.message}
                {...detailsForm.register('tolerance_radius_m', { valueAsNumber: true })}
              />
            </div>

            {/* Activation toggle with guard (spec §5.1, §6.3) */}
            <div className="flex items-center gap-3">
              <input
                id="mission_active"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 disabled:opacity-50"
                disabled={!canActivate}
                {...detailsForm.register('is_active')}
              />
              <label htmlFor="mission_active" className="text-sm font-medium text-gray-700">
                {t.active}
              </label>
              {!canActivate && (
                <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {t.missionNoQuestionsHint}
                </span>
              )}
            </div>

            <FormField
              as="textarea"
              label={t.calibrationNotes}
              hint={t.mapFromCalibration}
              error={detailsForm.formState.errors.calibration_notes?.message}
              {...detailsForm.register('calibration_notes')}
            />

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

      {/* Location tab */}
      {activeTab === 'location' && (
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                {t.requiredCloseness}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={5}
                  max={5000}
                  value={mapRadius}
                  onChange={(e) => setMapRadius(Number(e.target.value))}
                  className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                <span className="text-sm text-gray-500">metros</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{t.requiredClosenessHint}</p>
            </div>

            {mapLat !== undefined && mapLng !== undefined && (
              <div className="text-xs text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded">
                📍 {mapFromCalibrationNote(mapLat, mapLng)}
              </div>
            )}

            <MapPicker
              lat={mapLat}
              lng={mapLng}
              toleranceRadius={mapRadius}
              onChange={(lat, lng) => {
                setMapLat(lat)
                setMapLng(lng)
              }}
              height="400px"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={saveLocation}
              disabled={mapLat === undefined || mapLng === undefined || updateMission.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-60"
            >
              {updateMission.isPending ? t.loading : t.save}
            </button>
          </div>
        </div>
      )}

      {/* Questions tab */}
      {activeTab === 'questions' && id && (
        <ChallengesEditor missionId={id} challengeCount={mission?.challenge_count ?? 0} />
      )}

      {/* QR tab */}
      {activeTab === 'qr' && id && (
        <QRSection missionId={id} missionName={mission?.name ?? ''} cityName="" />
      )}

      <ConfirmDialog
        open={confirmDeactivate}
        title={`Desactivar misión`}
        message={mission ? t.deactivateMissionConfirm(mission.name) : ''}
        confirmLabel={t.deactivate}
        onConfirm={handleDeactivate}
        onCancel={() => setConfirmDeactivate(false)}
        loading={deactivateMission.isPending}
      />
    </div>
  )
}

function mapFromCalibrationNote(lat: number, lng: number) {
  return `${t.mapFromCalibration} Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`
}
