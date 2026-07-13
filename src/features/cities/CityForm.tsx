import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useParams } from 'react-router-dom'
import { citySchema, type CityForm as CityFormData } from '../../lib/validation'
import { useCity, useCreateCity, useUpdateCity } from '../../api/cities'
import { FormField } from '../../components/FormField'
import { MapAreaPicker, type BoundingBox } from '../../components/MapAreaPicker'
import { TranslationsEditor } from '../../components/TranslationsEditor'
import { useToast } from '../../components/Toast'
import { slugify } from '../../lib/utils'
import { t } from '../../lib/i18n'
import { ApiClientError } from '../../api/client'

const COUNTRIES = [
  { code: 'PE', label: 'Perú' },
  { code: 'ES', label: 'España' },
  { code: 'MX', label: 'México' },
  { code: 'CO', label: 'Colombia' },
  { code: 'AR', label: 'Argentina' },
]

const TIMEZONES = [
  'America/Lima',
  'Europe/Madrid',
  'America/Mexico_City',
  'America/Bogota',
  'America/Argentina/Buenos_Aires',
]

export function CityForm() {
  const { id } = useParams<{ id?: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const toast = useToast()

  const { data: city, isLoading } = useCity(id ?? '')
  const createCity = useCreateCity()
  const updateCity = useUpdateCity(id ?? '')

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<CityFormData>({
    resolver: zodResolver(citySchema),
    defaultValues: {
      is_active: true,
      country: 'PE',
      default_language: 'es-PE',
      timezone: 'America/Lima',
      legal_regime: 'LEY_29733',
      translations: {},
    },
  })

  // Populate form when editing
  useEffect(() => {
    if (city) {
      setValue('name', city.name)
      setValue('slug', city.slug)
      setValue('country', city.country)
      setValue('default_language', city.default_language)
      setValue('timezone', city.timezone)
      setValue('legal_regime', city.legal_regime)
      setValue('bbox_north', city.bbox_north)
      setValue('bbox_south', city.bbox_south)
      setValue('bbox_east', city.bbox_east)
      setValue('bbox_west', city.bbox_west)
      setValue('center_lat', city.center_lat)
      setValue('center_lng', city.center_lng)
      setValue('is_active', city.is_active)
      setValue('launch_date', city.launch_date ?? '')
      setValue('translations', city.translations ?? {})
      if (city.map_tile_url) setValue('map_tile_url', city.map_tile_url)
    }
  }, [city, setValue])

  // Auto-suggest slug from name
  const nameValue = watch('name')
  function handleNameBlur() {
    const current = watch('slug')
    if (!current || (city && current === city.slug)) return
    if (!isEdit) setValue('slug', slugify(nameValue))
  }

  async function onSubmit(data: CityFormData) {
    try {
      if (isEdit) {
        await updateCity.mutateAsync(data)
        toast.success(t.saved)
      } else {
        const newCity = await createCity.mutateAsync(data)
        toast.success(t.created)
        navigate(`/admin/cities/${newCity.id}/edit`)
      }
    } catch (err) {
      if (err instanceof ApiClientError && err.details) {
        Object.entries(err.details).forEach(([field, msg]) => {
          setError(field as keyof CityFormData, { message: String(msg) })
        })
      }
      toast.error(t.error)
    }
  }

  if (isEdit && isLoading) {
    return <p className="text-gray-400 p-6">{t.loading}</p>
  }

  const bbox = {
    bbox_north: watch('bbox_north'),
    bbox_south: watch('bbox_south'),
    bbox_east: watch('bbox_east'),
    bbox_west: watch('bbox_west'),
    center_lat: watch('center_lat'),
    center_lng: watch('center_lng'),
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => navigate('/admin/cities')}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← {t.back}
        </button>
        <h2 className="text-xl font-bold text-gray-900">
          {isEdit ? `Editar ciudad: ${city?.name ?? ''}` : 'Nueva ciudad'}
        </h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
        <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4">
          <h3 className="font-semibold text-gray-800">Información general</h3>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              as="input"
              label={t.name}
              required
              error={errors.name?.message}
              {...register('name', { onBlur: handleNameBlur })}
            />
            <FormField
              as="input"
              label={t.slug}
              hint={t.slugHint}
              required
              error={errors.slug?.message}
              {...register('slug')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              as="select"
              label={t.country}
              required
              error={errors.country?.message}
              {...register('country')}
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </FormField>

            <FormField
              as="select"
              label={t.language}
              error={errors.default_language?.message}
              {...register('default_language')}
            >
              <option value="es-PE">Español (Perú)</option>
              <option value="es-ES">Español (España)</option>
              <option value="en">Inglés</option>
              <option value="pt">Portugués</option>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              as="select"
              label={t.timezone}
              error={errors.timezone?.message}
              {...register('timezone')}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </FormField>

            <FormField
              as="select"
              label={t.privacyRules}
              error={errors.legal_regime?.message}
              {...register('legal_regime')}
            >
              <option value="LEY_29733">Perú (Ley 29733)</option>
              <option value="GDPR">Europa (GDPR)</option>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              as="input"
              label={t.launchDate}
              type="date"
              error={errors.launch_date?.message}
              {...register('launch_date')}
            />

            <div className="flex items-center gap-3 pt-6">
              <input
                id="is_active"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-indigo-600"
                {...register('is_active')}
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                {t.active}
              </label>
            </div>
          </div>

          <Controller
            name="translations"
            control={control}
            render={({ field }) => (
              <TranslationsEditor
                fields={[{ key: 'name', label: t.name }]}
                value={field.value ?? {}}
                onChange={field.onChange}
              />
            )}
          />
        </div>

        {/* Map area */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-1">{t.cityMapArea}</h3>
          <p className="text-xs text-gray-500 mb-4">{t.cityMapAreaHint}</p>

          <MapAreaPicker
            value={bbox}
            onChange={(b: BoundingBox) => {
              setValue('bbox_north', b.bbox_north, { shouldValidate: true })
              setValue('bbox_south', b.bbox_south)
              setValue('bbox_east', b.bbox_east)
              setValue('bbox_west', b.bbox_west)
              setValue('center_lat', b.center_lat)
              setValue('center_lng', b.center_lng)
            }}
          />

          {errors.bbox_north && (
            <p className="text-xs text-red-600 mt-2">Define el área del mapa.</p>
          )}
        </div>

        {/* Advanced */}
        <details className="bg-white rounded-xl border border-gray-200">
          <summary className="px-6 py-4 cursor-pointer text-sm font-medium text-gray-600">
            Avanzado (URL de tiles del mapa)
          </summary>
          <div className="px-6 pb-6">
            <FormField
              as="input"
              label="URL de tiles del mapa"
              hint="Dejar vacío para usar la configuración global."
              error={errors.map_tile_url?.message}
              {...register('map_tile_url')}
            />
          </div>
        </details>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/cities')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            {t.cancel}
          </button>
          <button
            type="submit"
            disabled={isSubmitting || (!isDirty && isEdit)}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-60"
          >
            {isSubmitting ? t.loading : t.save}
          </button>
        </div>
      </form>
    </div>
  )
}
