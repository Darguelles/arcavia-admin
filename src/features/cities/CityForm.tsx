import { useEffect, useState, type ChangeEvent } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { citySchema, type CityForm as CityFormData } from '../../lib/validation'
import { useCity, useCreateCity, useUpdateCity } from '../../api/cities'
import { FormField } from '../../components/FormField'
import { MapAreaPicker, type BoundingBox } from '../../components/MapAreaPicker'
import { TranslationsEditor } from '../../components/TranslationsEditor'
import { useToast } from '../../components/Toast'
import { btnGhost, btnIcon, btnPrimary, card } from '../../components/ui'
import { slugify } from '../../lib/utils'
import { t } from '../../lib/i18n'
import { ApiClientError } from '../../api/client'
import { translateApiError } from '../../lib/apiErrors'

interface Place {
  name: string
  lat: number
  lng: number
}

interface Country {
  code: string
  label: string
  language: string
  timezone: string
  legal: 'GDPR' | 'LEY_29733'
  places: Place[]
}

// Curated country → city/state list. Selecting a place names the city and
// centers the map; the operator then fine-tunes the exact area on the map.
const COUNTRIES: Country[] = [
  {
    code: 'PE',
    label: 'Perú',
    language: 'es-PE',
    timezone: 'America/Lima',
    legal: 'LEY_29733',
    places: [
      { name: 'Lima', lat: -12.0464, lng: -77.0428 },
      { name: 'Arequipa', lat: -16.409, lng: -71.5375 },
      { name: 'Cusco', lat: -13.532, lng: -71.9675 },
      { name: 'Trujillo', lat: -8.112, lng: -79.0288 },
    ],
  },
  {
    code: 'ES',
    label: 'España',
    language: 'es-ES',
    timezone: 'Europe/Madrid',
    legal: 'GDPR',
    places: [
      { name: 'Madrid', lat: 40.4168, lng: -3.7038 },
      { name: 'Barcelona', lat: 41.3851, lng: 2.1734 },
      { name: 'Málaga', lat: 36.7213, lng: -4.4214 },
      { name: 'Sevilla', lat: 37.3891, lng: -5.9845 },
      { name: 'Valencia', lat: 39.4699, lng: -0.3763 },
    ],
  },
  {
    code: 'MX',
    label: 'México',
    language: 'es-MX',
    timezone: 'America/Mexico_City',
    legal: 'GDPR',
    places: [
      { name: 'Ciudad de México', lat: 19.4326, lng: -99.1332 },
      { name: 'Guadalajara', lat: 20.6597, lng: -103.3496 },
      { name: 'Monterrey', lat: 25.6866, lng: -100.3161 },
      { name: 'Cancún', lat: 21.1619, lng: -86.8515 },
    ],
  },
  {
    code: 'CO',
    label: 'Colombia',
    language: 'es-CO',
    timezone: 'America/Bogota',
    legal: 'GDPR',
    places: [
      { name: 'Bogotá', lat: 4.711, lng: -74.0721 },
      { name: 'Medellín', lat: 6.2442, lng: -75.5812 },
      { name: 'Cartagena', lat: 10.391, lng: -75.4794 },
      { name: 'Cali', lat: 3.4516, lng: -76.532 },
    ],
  },
  {
    code: 'AR',
    label: 'Argentina',
    language: 'es-AR',
    timezone: 'America/Argentina/Buenos_Aires',
    legal: 'GDPR',
    places: [
      { name: 'Buenos Aires', lat: -34.6037, lng: -58.3816 },
      { name: 'Córdoba', lat: -31.4201, lng: -64.1888 },
      { name: 'Mendoza', lat: -32.8895, lng: -68.8458 },
      { name: 'Rosario', lat: -32.9442, lng: -60.6505 },
    ],
  },
  {
    code: 'NL',
    label: 'Países Bajos',
    language: 'nl',
    timezone: 'Europe/Amsterdam',
    legal: 'GDPR',
    places: [
      { name: 'Ámsterdam', lat: 52.3676, lng: 4.9041 },
      { name: 'Róterdam', lat: 51.9244, lng: 4.4777 },
      { name: 'La Haya', lat: 52.0705, lng: 4.3007 },
      { name: 'Utrecht', lat: 52.0907, lng: 5.1214 },
      { name: 'Eindhoven', lat: 51.4416, lng: 5.4697 },
    ],
  },
]

const LANGUAGES = [
  { code: 'es-PE', label: 'Español (Perú)' },
  { code: 'es-ES', label: 'Español (España)' },
  { code: 'es-MX', label: 'Español (México)' },
  { code: 'es-CO', label: 'Español (Colombia)' },
  { code: 'es-AR', label: 'Español (Argentina)' },
  { code: 'nl', label: 'Neerlandés' },
  { code: 'en', label: 'Inglés' },
  { code: 'pt', label: 'Portugués' },
]

const TIMEZONES = [
  'America/Lima',
  'Europe/Madrid',
  'America/Mexico_City',
  'America/Bogota',
  'America/Argentina/Buenos_Aires',
  'Europe/Amsterdam',
]

// Half-extent of the auto-generated bounding box around a selected place.
const BBOX_HALF_LAT = 0.12
const BBOX_HALF_LNG = 0.16

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

  // Country → city/state cascade + auto-but-editable slug.
  const [placeName, setPlaceName] = useState('')
  // Once the operator edits the código corto by hand, stop auto-generating it.
  const [slugTouched, setSlugTouched] = useState(false)
  const countryCode = watch('country')
  const currentCountry = COUNTRIES.find((c) => c.code === countryCode) ?? COUNTRIES[0]

  function maybeAutoSlug(name: string) {
    if (!slugTouched && !isEdit) setValue('slug', slugify(name), { shouldDirty: true })
  }

  function handleCountryChange(e: ChangeEvent<HTMLSelectElement>) {
    const c = COUNTRIES.find((x) => x.code === e.target.value)
    if (!c) return
    // Sensible defaults for the picked country (operator can still override).
    setValue('default_language', c.language, { shouldDirty: true })
    setValue('timezone', c.timezone, { shouldDirty: true })
    setValue('legal_regime', c.legal, { shouldDirty: true })
    setPlaceName('')
  }

  function handlePlaceChange(e: ChangeEvent<HTMLSelectElement>) {
    const name = e.target.value
    setPlaceName(name)
    const place = currentCountry.places.find((p) => p.name === name)
    if (!place) return
    setValue('name', place.name, { shouldDirty: true })
    maybeAutoSlug(place.name)
    setValue('center_lat', place.lat)
    setValue('center_lng', place.lng)
    setValue('bbox_north', place.lat + BBOX_HALF_LAT, { shouldValidate: true })
    setValue('bbox_south', place.lat - BBOX_HALF_LAT)
    setValue('bbox_east', place.lng + BBOX_HALF_LNG)
    setValue('bbox_west', place.lng - BBOX_HALF_LNG)
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
      if (err instanceof ApiClientError) {
        if (err.code === 'SLUG_TAKEN') {
          setError('slug', { message: t.errSlugTakenField })
        }
        if (err.details) {
          Object.entries(err.details).forEach(([field, msg]) => {
            setError(field as keyof CityFormData, { message: String(msg) })
          })
        }
      }
      toast.error(translateApiError(err))
    }
  }

  if (isEdit && isLoading) {
    return <p className="text-faint p-6">{t.loading}</p>
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
          className={btnIcon}
          aria-label={t.back}
          title={t.back}
        >
          <ArrowLeft size={18} strokeWidth={1.5} />
        </button>
        <h2 className="text-2xl font-semibold text-ink">
          {isEdit ? `Editar ciudad: ${city?.name ?? ''}` : 'Nueva ciudad'}
        </h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
        <div className={`${card} p-6 flex flex-col gap-5`}>
          <h3 className="text-[17px] font-semibold text-ink">Información general</h3>

          {/* Step 1: country, then city/state — selecting a place names the
              city and centers the map below. */}
          <div className="grid grid-cols-2 gap-5">
            <FormField
              as="select"
              label={t.country}
              required
              error={errors.country?.message}
              {...register('country', { onChange: handleCountryChange })}
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </FormField>

            <FormField
              as="select"
              label={t.cityState}
              hint={t.cityStateHint}
              value={placeName}
              onChange={handlePlaceChange}
            >
              <option value="">{t.selectOption}</option>
              {currentCountry.places.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <FormField
              as="input"
              label={t.name}
              required
              error={errors.name?.message}
              {...register('name', { onChange: (e) => maybeAutoSlug(e.target.value) })}
            />
            <FormField
              as="input"
              label={t.slug}
              hint={t.slugHint}
              required
              error={errors.slug?.message}
              {...register('slug', { onChange: () => setSlugTouched(true) })}
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <FormField
              as="select"
              label={t.language}
              error={errors.default_language?.message}
              {...register('default_language')}
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </FormField>

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
          </div>

          <div className="grid grid-cols-2 gap-5">
            <FormField
              as="select"
              label={t.privacyRules}
              error={errors.legal_regime?.message}
              {...register('legal_regime')}
            >
              <option value="LEY_29733">Perú (Ley 29733)</option>
              <option value="GDPR">Europa (GDPR)</option>
            </FormField>

            <FormField
              as="input"
              label={t.launchDate}
              type="date"
              error={errors.launch_date?.message}
              {...register('launch_date')}
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              id="is_active"
              type="checkbox"
              className="h-4 w-4 rounded-chip border-line-strong accent-gold"
              {...register('is_active')}
            />
            <label htmlFor="is_active" className="text-sm font-medium text-ink">
              {t.active}
            </label>
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
        <div className={`${card} p-6`}>
          <h3 className="text-[17px] font-semibold text-ink mb-1">{t.cityMapArea}</h3>
          <p className="text-[13px] text-muted mb-4">{t.cityMapAreaHint}</p>

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
            <p className="text-xs text-danger mt-2">Define el área del mapa.</p>
          )}
        </div>

        {/* Advanced */}
        <details className={card}>
          <summary className="px-6 py-4 cursor-pointer text-sm font-medium text-muted hover:text-ink">
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

        <div className="flex justify-end gap-3 border-t border-line-soft pt-4">
          <button type="button" onClick={() => navigate('/admin/cities')} className={btnGhost}>
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
