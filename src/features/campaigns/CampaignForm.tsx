import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { campaignSchema, type CampaignForm as CampaignFormData } from '../../lib/validation'
import { useCampaign, useCreateCampaign, useUpdateCampaign } from '../../api/campaigns'
import { useCities } from '../../api/cities'
import { FormField } from '../../components/FormField'
import { TranslationsEditor } from '../../components/TranslationsEditor'
import { useToast } from '../../components/Toast'
import { btnGhost, btnIcon, btnPrimary, card } from '../../components/ui'
import { t } from '../../lib/i18n'
import { ApiClientError } from '../../api/client'
import { useCityFilter } from '../../components/Layout'

export function CampaignForm() {
  const { id } = useParams<{ id?: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const toast = useToast()
  const { cityId: filterCityId } = useCityFilter()

  const { data: campaign, isLoading } = useCampaign(id ?? '')
  const createCampaign = useCreateCampaign()
  const updateCampaign = useUpdateCampaign(id ?? '')
  const { data: citiesPage } = useCities({ limit: 100 })
  const cities = citiesPage?.items ?? []

  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      city_id: filterCityId || '',
      name: '',
      description: '',
      is_active: true,
      translations: {},
    },
  })

  useEffect(() => {
    if (campaign) {
      setValue('city_id', campaign.city_id)
      setValue('name', campaign.name)
      setValue('description', campaign.description)
      setValue('is_active', campaign.is_active)
      setValue('starts_at', campaign.starts_at ?? '')
      setValue('ends_at', campaign.ends_at ?? '')
      setValue('translations', campaign.translations ?? {})
    }
  }, [campaign, setValue])

  async function onSubmit(data: CampaignFormData) {
    try {
      if (isEdit) {
        await updateCampaign.mutateAsync(data)
        toast.success(t.saved)
      } else {
        await createCampaign.mutateAsync(data)
        toast.success(t.created)
        navigate('/admin/campaigns')
      }
    } catch (err) {
      if (err instanceof ApiClientError && err.details) {
        Object.entries(err.details).forEach(([field, msg]) =>
          setError(field as keyof CampaignFormData, { message: String(msg) })
        )
      }
      toast.error(t.error)
    }
  }

  if (isEdit && isLoading) return <p className="text-faint p-6">{t.loading}</p>

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => navigate('/admin/campaigns')}
          className={btnIcon}
          aria-label={t.back}
          title={t.back}
        >
          <ArrowLeft size={18} strokeWidth={1.5} />
        </button>
        <h2 className="text-2xl font-semibold text-ink">
          {isEdit ? `Editar campaña: ${campaign?.name ?? ''}` : 'Nueva campaña'}
        </h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
        <div className={`${card} p-6 flex flex-col gap-5`}>
          <FormField
            as="select"
            label={t.cities}
            required
            error={errors.city_id?.message}
            {...register('city_id')}
          >
            <option value="">Selecciona una ciudad</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
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

          <div className="grid grid-cols-2 gap-5">
            <FormField
              as="input"
              label={t.startDate}
              type="datetime-local"
              error={errors.starts_at?.message}
              {...register('starts_at')}
            />
            <FormField
              as="input"
              label={t.endDate}
              type="datetime-local"
              error={errors.ends_at?.message}
              {...register('ends_at')}
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              id="camp_active"
              type="checkbox"
              className="h-4 w-4 rounded-chip border-line-strong accent-gold"
              {...register('is_active')}
            />
            <label htmlFor="camp_active" className="text-sm font-medium text-ink">
              {t.active}
            </label>
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

        <div className="flex justify-end gap-3 border-t border-line-soft pt-4">
          <button type="button" onClick={() => navigate('/admin/campaigns')} className={btnGhost}>
            {t.cancel}
          </button>
          <button
            type="submit"
            disabled={isSubmitting || (!isDirty && isEdit)}
            className={btnPrimary}
          >
            {isSubmitting ? t.loading : t.save}
          </button>
        </div>
      </form>
    </div>
  )
}
