import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSetting, useUpdateSetting, uploadAsset } from '../../api/settings'
import type { HomeContent, HomeSponsor, HomeStep, LandmarkSlide } from '../../api/types'
import { HOME_DEFAULTS } from '../../lib/homeDefaults'
import { appInfoSchema, type AppInfoForm } from '../../lib/validation'
import { FormField } from '../../components/FormField'
import { TranslationsEditor } from '../../components/TranslationsEditor'
import { useToast } from '../../components/Toast'
import { t } from '../../lib/i18n'
import { cn } from '../../lib/utils'

type Section = 'branding' | 'texts' | 'appinfo' | 'content' | 'home'

function BrandingSection() {
  const toast = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const { data: logoSetting } = useSetting('branding_logo')
  const updateSetting = useUpdateSetting('branding_logo')

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadAsset(file, 'branding_logo')
      await updateSetting.mutateAsync(url)
      toast.success('Imagen actualizada.')
    } catch {
      toast.error(t.error)
    } finally {
      setUploading(false)
    }
  }

  const currentUrl = logoSetting?.value as string | undefined

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4">
      <h3 className="font-semibold text-gray-800">{t.branding}</h3>

      <div className="flex items-start gap-6">
        {currentUrl ? (
          <img
            src={currentUrl}
            alt="Logo actual"
            className="h-24 w-24 object-contain rounded-lg border border-gray-200 bg-gray-50"
          />
        ) : (
          <div className="h-24 w-24 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-gray-400 text-xs text-center">
            Sin logo
          </div>
        )}

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg disabled:opacity-60"
          >
            {uploading ? t.loading : 'Subir nuevo logo'}
          </button>
          <p className="text-xs text-gray-500">
            JPG, PNG o WebP — máximo 5 MB. Se muestra en la app del jugador.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleUpload}
          />
        </div>
      </div>
    </div>
  )
}

function UITextsSection() {
  const toast = useToast()
  const { data: textsSetting, isLoading } = useSetting('ui_texts')
  const updateSetting = useUpdateSetting('ui_texts')
  const [translations, setTranslations] = useState<Record<string, Record<string, string>>>({})

  const texts = (textsSetting?.value as Record<string, string> | undefined) ?? {}

  async function handleSave() {
    try {
      await updateSetting.mutateAsync({ texts, translations })
      toast.success(t.saved)
    } catch {
      toast.error(t.error)
    }
  }

  if (isLoading) return <p className="text-gray-400">{t.loading}</p>

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4">
      <h3 className="font-semibold text-gray-800">{t.uiTexts}</h3>
      <p className="text-sm text-gray-500">
        Textos que aparecen en la app del jugador. Edita el español y agrega traducciones para otros
        idiomas.
      </p>

      <TranslationsEditor
        fields={Object.entries(texts).map(([key]) => ({ key, label: key }))}
        value={translations}
        onChange={setTranslations}
      />

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
        >
          {t.save}
        </button>
      </div>
    </div>
  )
}

function AppInfoSection() {
  const toast = useToast()
  const { data: infoSetting } = useSetting('app_info')
  const updateSetting = useUpdateSetting('app_info')
  const [showVersionPrompt, setShowVersionPrompt] = useState(false)

  const info = (infoSetting?.value as Partial<AppInfoForm> | undefined) ?? {}

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<AppInfoForm>({
    resolver: zodResolver(appInfoSchema),
    defaultValues: {
      app_name: info.app_name ?? '',
      support_contact: info.support_contact ?? '',
      privacy_policy_text: info.privacy_policy_text ?? '',
      privacy_policy_version: info.privacy_policy_version ?? '1.0',
    },
  })

  const currentVersion = watch('privacy_policy_version')
  const currentText = watch('privacy_policy_text')
  const originalText = info.privacy_policy_text

  async function onSubmit(data: AppInfoForm) {
    try {
      await updateSetting.mutateAsync(data)
      toast.success(t.saved)
      setShowVersionPrompt(false)
    } catch {
      toast.error(t.error)
    }
  }

  function handleSaveClick() {
    // If policy text changed, prompt about version (spec §6.8)
    if (currentText !== originalText) {
      setShowVersionPrompt(true)
    }
  }

  function bumpVersion() {
    const parts = currentVersion.split('.')
    const patch = parseInt(parts[1] ?? '0') + 1
    setValue('privacy_policy_version', `${parts[0]}.${patch}`)
    setShowVersionPrompt(false)
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4"
      noValidate
    >
      <h3 className="font-semibold text-gray-800">{t.appInfo}</h3>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          as="input"
          label={t.appName}
          required
          error={errors.app_name?.message}
          {...register('app_name')}
        />
        <FormField
          as="input"
          label={t.supportContact}
          type="email"
          error={errors.support_contact?.message}
          {...register('support_contact')}
        />
      </div>

      <FormField
        as="textarea"
        label={t.privacyPolicy}
        hint="Esta política se muestra a los jugadores al registrarse."
        error={errors.privacy_policy_text?.message}
        {...register('privacy_policy_text')}
      />

      <FormField
        as="input"
        label={t.privacyPolicyVersion}
        hint={t.privacyPolicyVersionHint}
        error={errors.privacy_policy_version?.message}
        {...register('privacy_policy_version')}
      />

      {/* Version bump prompt */}
      {showVersionPrompt && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center justify-between gap-4">
          <p className="text-sm text-amber-800">
            El texto de la política ha cambiado. ¿Aumentar la versión a que los usuarios acepten la
            nueva política?
          </p>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={bumpVersion}
              className="text-xs font-medium text-amber-700 bg-white border border-amber-300 rounded px-3 py-1 hover:bg-amber-50"
            >
              Sí, aumentar versión
            </button>
            <button
              type="button"
              onClick={() => setShowVersionPrompt(false)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              No
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button
          type="submit"
          onClick={handleSaveClick}
          disabled={isSubmitting || !isDirty}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-60"
        >
          {isSubmitting ? t.loading : t.save}
        </button>
      </div>
    </form>
  )
}

/**
 * Plain-text setting editor backed by a single settings key holding a string.
 * Used for operator-editable player-app copy (game instructions, terms) that the
 * PWA reads from the public settings store and renders in its info menu.
 */
function PlainTextSetting({
  settingKey,
  label,
  hint,
}: {
  settingKey: string
  label: string
  hint: string
}) {
  const toast = useToast()
  const { data, isLoading } = useSetting<string>(settingKey)
  const updateSetting = useUpdateSetting(settingKey)
  const [value, setValue] = useState('')
  const [seeded, setSeeded] = useState(false)

  // Seed the textarea from the fetched value once, then let the user edit freely.
  useEffect(() => {
    if (!seeded && data) {
      setValue(typeof data.value === 'string' ? data.value : '')
      setSeeded(true)
    }
  }, [data, seeded])

  async function handleSave() {
    try {
      await updateSetting.mutateAsync(value)
      toast.success(t.saved)
    } catch {
      toast.error(t.error)
    }
  }

  if (isLoading) return <p className="text-gray-400">{t.loading}</p>

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4">
      <div>
        <h3 className="font-semibold text-gray-800">{label}</h3>
        <p className="text-sm text-gray-500">{hint}</p>
      </div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={12}
        className="w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={updateSetting.isPending}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-60"
        >
          {updateSetting.isPending ? t.loading : t.save}
        </button>
      </div>
    </div>
  )
}

const inputClass =
  'w-full rounded-lg border border-gray-300 p-2.5 text-sm text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'

function LabeledField({
  label,
  multiline = false,
  rows = 3,
  value,
  onChange,
}: {
  label: string
  multiline?: boolean
  rows?: number
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          className={inputClass}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      )}
    </label>
  )
}

/**
 * Editor for the `home_content` settings key — the operator-managed copy and
 * sponsor banners of the player app's Home page. Empty fields are stripped on
 * save; the player app hides the corresponding blocks.
 */
function HomeContentSection() {
  const toast = useToast()
  const { data, isLoading } = useSetting<HomeContent>('home_content')
  const updateSetting = useUpdateSetting('home_content')
  const [content, setContent] = useState<HomeContent>({})
  const [sponsors, setSponsors] = useState<HomeSponsor[]>([])
  const [landmarks, setLandmarks] = useState<LandmarkSlide[]>([])
  const [seeded, setSeeded] = useState(false)
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)
  const [uploadingLandmark, setUploadingLandmark] = useState<number | null>(null)

  const [steps, setSteps] = useState<HomeStep[]>([...HOME_DEFAULTS.how_steps])
  const [visionText, setVisionText] = useState(HOME_DEFAULTS.vision_points.join('\n'))

  useEffect(() => {
    if (!seeded && data) {
      const value = (data.value as HomeContent | null) ?? {}
      // Pre-fill the defaulted blocks with the copy the player currently
      // shows, so the operator edits the live text in place.
      setContent({
        headline: HOME_DEFAULTS.headline,
        need_title: HOME_DEFAULTS.need_title,
        need_body: HOME_DEFAULTS.need_body,
        solution_title: HOME_DEFAULTS.solution_title,
        solution_body: HOME_DEFAULTS.solution_body,
        how_title: HOME_DEFAULTS.how_title,
        vision_title: HOME_DEFAULTS.vision_title,
        vision_intro: HOME_DEFAULTS.vision_intro,
        band_text: HOME_DEFAULTS.band_text,
        play_title: HOME_DEFAULTS.play_title,
        closing_title: HOME_DEFAULTS.closing_title,
        closing_body: HOME_DEFAULTS.closing_body,
        ...value,
      })
      setSteps(HOME_DEFAULTS.how_steps.map((d, i) => ({ ...d, ...value.how_steps?.[i] })))
      setVisionText((value.vision_points ?? HOME_DEFAULTS.vision_points).join('\n'))
      setSponsors(value.sponsors ?? [])
      // Seed from the carousel list, or lift the pre-carousel single photo into it.
      setLandmarks(
        value.landmarks ??
          (value.landmark_image_url
            ? [
                {
                  image_url: value.landmark_image_url,
                  title: value.landmark_title,
                  caption: value.landmark_caption,
                },
              ]
            : [])
      )
      setSeeded(true)
    }
  }, [data, seeded])

  function setField(field: keyof Omit<HomeContent, 'sponsors'>, value: string) {
    setContent((prev) => ({ ...prev, [field]: value }))
  }

  function setSponsor(index: number, patch: Partial<HomeSponsor>) {
    setSponsors((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)))
  }

  async function handleSponsorImage(index: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingIndex(index)
    try {
      const url = await uploadAsset(file, 'home_sponsor')
      setSponsor(index, { image_url: url })
    } catch {
      toast.error(t.error)
    } finally {
      setUploadingIndex(null)
    }
  }

  function setLandmark(index: number, patch: Partial<LandmarkSlide>) {
    setLandmarks((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)))
  }

  async function handleLandmarkImage(index: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingLandmark(index)
    try {
      const url = await uploadAsset(file, 'home_landmark')
      setLandmark(index, { image_url: url })
    } catch {
      toast.error(t.error)
    } finally {
      setUploadingLandmark(null)
    }
  }

  type ImageField = 'hero_image_url' | 'brand_mark_url'
  const [uploadingField, setUploadingField] = useState<ImageField | null>(null)

  async function handleContentImage(
    field: ImageField,
    slug: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingField(field)
    try {
      const url = await uploadAsset(file, slug)
      setContent((prev) => ({ ...prev, [field]: url }))
    } catch {
      toast.error(t.error)
    } finally {
      setUploadingField(null)
    }
  }

  function imageRow(label: string, field: ImageField, slug: string) {
    const url = content[field]
    return (
      <div className="flex items-center gap-4">
        {url ? (
          <img
            src={url}
            alt={label}
            className="h-16 w-28 shrink-0 rounded-md border border-gray-200 bg-gray-50 object-cover"
          />
        ) : (
          <div className="h-16 w-28 shrink-0 flex items-center justify-center rounded-md border-2 border-dashed border-gray-300 bg-gray-50 text-xs text-gray-400">
            {t.noImage}
          </div>
        )}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <div className="flex items-center gap-3">
            <label className="cursor-pointer px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg">
              {uploadingField === field ? t.loading : t.uploadImage}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(e) => handleContentImage(field, slug, e)}
              />
            </label>
            {url && (
              <button
                type="button"
                onClick={() => setContent((prev) => ({ ...prev, [field]: '' }))}
                className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 border border-red-200 rounded-lg"
              >
                {t.remove}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  async function handleSave() {
    // Strip empty strings and imageless rows — the player app treats absent
    // fields as "hide this block". The legacy single-landmark fields are
    // dropped for good: the carousel list is their replacement.
    const legacyKeys = [
      'sponsors',
      'landmarks',
      'how_steps',
      'vision_points',
      'landmark_image_url',
      'landmark_title',
      'landmark_caption',
    ]
    const trimmed = Object.fromEntries(
      Object.entries(content)
        .filter(([key]) => !legacyKeys.includes(key))
        .map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])
        .filter(([, value]) => value !== '')
    )
    const visionPoints = visionText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
    const value: HomeContent = {
      ...trimmed,
      how_steps: steps.map((s, i) => ({
        title: s.title.trim() || HOME_DEFAULTS.how_steps[i].title,
        body: s.body.trim() || HOME_DEFAULTS.how_steps[i].body,
      })),
      ...(visionPoints.length ? { vision_points: visionPoints } : {}),
      landmarks: landmarks
        .filter((s) => s.image_url)
        .slice(0, 8)
        .map((s) => ({
          image_url: s.image_url,
          ...(s.title?.trim() ? { title: s.title.trim() } : {}),
          ...(s.caption?.trim() ? { caption: s.caption.trim() } : {}),
        })),
      sponsors: sponsors
        .filter((s) => s.image_url)
        .map((s) => ({
          name: s.name.trim(),
          image_url: s.image_url,
          ...(s.link_url?.trim() ? { link_url: s.link_url.trim() } : {}),
        })),
    }
    try {
      await updateSetting.mutateAsync(value)
      toast.success(t.saved)
    } catch {
      toast.error(t.error)
    }
  }

  if (isLoading) return <p className="text-gray-400">{t.loading}</p>

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4">
        <div>
          <h3 className="font-semibold text-gray-800">{t.homeContent}</h3>
          <p className="text-sm text-gray-500">{t.homeContentHint}</p>
        </div>
        <LabeledField
          label={t.homeHeroIntro}
          multiline
          value={content.hero_intro ?? ''}
          onChange={(v) => setField('hero_intro', v)}
        />
        <LabeledField
          label={t.homeHeadline}
          multiline
          rows={2}
          value={content.headline ?? ''}
          onChange={(v) => setField('headline', v)}
        />
        <LabeledField
          label={t.homeHeadlineBody}
          multiline
          value={content.headline_body ?? ''}
          onChange={(v) => setField('headline_body', v)}
        />
        <LabeledField
          label={t.homeSectionTitle}
          value={content.section_title ?? ''}
          onChange={(v) => setField('section_title', v)}
        />

        <h4 className="pt-2 text-sm font-semibold text-gray-600">{t.homeNeedSection}</h4>
        <LabeledField
          label={t.fieldTitle}
          value={content.need_title ?? ''}
          onChange={(v) => setField('need_title', v)}
        />
        <LabeledField
          label={t.fieldBody}
          multiline
          rows={4}
          value={content.need_body ?? ''}
          onChange={(v) => setField('need_body', v)}
        />

        <h4 className="pt-2 text-sm font-semibold text-gray-600">{t.homeSolutionSection}</h4>
        <LabeledField
          label={t.fieldTitle}
          value={content.solution_title ?? ''}
          onChange={(v) => setField('solution_title', v)}
        />
        <LabeledField
          label={t.fieldBody}
          multiline
          rows={4}
          value={content.solution_body ?? ''}
          onChange={(v) => setField('solution_body', v)}
        />

        <h4 className="pt-2 text-sm font-semibold text-gray-600">{t.homeHowSection}</h4>
        <LabeledField
          label={t.fieldTitle}
          value={content.how_title ?? ''}
          onChange={(v) => setField('how_title', v)}
        />
        {steps.map((step, index) => (
          <div key={index} className="grid grid-cols-[1fr_2fr] gap-3">
            <LabeledField
              label={`Paso ${index + 1} — ${t.fieldTitle.toLowerCase()}`}
              value={step.title}
              onChange={(v) =>
                setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, title: v } : s)))
              }
            />
            <LabeledField
              label={t.fieldBody}
              value={step.body}
              onChange={(v) =>
                setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, body: v } : s)))
              }
            />
          </div>
        ))}

        <h4 className="pt-2 text-sm font-semibold text-gray-600">{t.homeVisionSection}</h4>
        <LabeledField
          label={t.fieldTitle}
          value={content.vision_title ?? ''}
          onChange={(v) => setField('vision_title', v)}
        />
        <LabeledField
          label={t.fieldBody}
          multiline
          rows={2}
          value={content.vision_intro ?? ''}
          onChange={(v) => setField('vision_intro', v)}
        />
        <LabeledField
          label={t.homeVisionPoints}
          multiline
          rows={5}
          value={visionText}
          onChange={setVisionText}
        />

        <LabeledField
          label={t.homeBandText}
          multiline
          rows={2}
          value={content.band_text ?? ''}
          onChange={(v) => setField('band_text', v)}
        />
        <LabeledField
          label={t.homePlayTitle}
          value={content.play_title ?? ''}
          onChange={(v) => setField('play_title', v)}
        />
        <LabeledField
          label={t.homePlayIntro}
          multiline
          rows={2}
          value={content.play_intro ?? ''}
          onChange={(v) => setField('play_intro', v)}
        />
        <LabeledField
          label={t.homePlayOutro}
          multiline
          rows={2}
          value={content.play_outro ?? ''}
          onChange={(v) => setField('play_outro', v)}
        />

        <h4 className="pt-2 text-sm font-semibold text-gray-600">{t.homeClosingSection}</h4>
        <LabeledField
          label={t.fieldTitle}
          value={content.closing_title ?? ''}
          onChange={(v) => setField('closing_title', v)}
        />
        <LabeledField
          label={t.fieldBody}
          value={content.closing_body ?? ''}
          onChange={(v) => setField('closing_body', v)}
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4">
        <div>
          <h3 className="font-semibold text-gray-800">{t.homeImages}</h3>
          <p className="text-sm text-gray-500">{t.homeImagesHint}</p>
        </div>
        {imageRow(t.homeHeroImage, 'hero_image_url', 'home_hero')}
        {imageRow(t.homeBrandMark, 'brand_mark_url', 'home_brand')}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4">
        <div>
          <h3 className="font-semibold text-gray-800">{t.homeLandmarks}</h3>
          <p className="text-sm text-gray-500">{t.homeLandmarksHint}</p>
        </div>

        {landmarks.map((slide, index) => (
          <div key={index} className="flex items-start gap-4 rounded-lg border border-gray-200 p-4">
            {slide.image_url ? (
              <img
                src={slide.image_url}
                alt={slide.title || `Imagen ${index + 1}`}
                className="h-24 w-16 shrink-0 rounded-md border border-gray-200 bg-gray-50 object-cover"
              />
            ) : (
              <div className="h-24 w-16 shrink-0 flex items-center justify-center rounded-md border-2 border-dashed border-gray-300 bg-gray-50 text-xs text-gray-400 text-center">
                {t.noImage}
              </div>
            )}
            <div className="flex-1 grid grid-cols-2 gap-3">
              <LabeledField
                label={t.landmarkTitle}
                value={slide.title ?? ''}
                onChange={(v) => setLandmark(index, { title: v })}
              />
              <LabeledField
                label={t.landmarkCaption}
                value={slide.caption ?? ''}
                onChange={(v) => setLandmark(index, { caption: v })}
              />
              <div className="col-span-2 flex items-center gap-3">
                <label className="cursor-pointer px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg">
                  {uploadingLandmark === index ? t.loading : t.uploadImage}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={(e) => handleLandmarkImage(index, e)}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setLandmarks((prev) => prev.filter((_, i) => i !== index))}
                  className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 border border-red-200 rounded-lg"
                >
                  {t.remove}
                </button>
              </div>
            </div>
          </div>
        ))}

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={landmarks.length >= 8}
            onClick={() => setLandmarks((prev) => [...prev, { image_url: '' }])}
            className="px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {t.addLandmark}
          </button>
          {landmarks.length >= 8 && (
            <span className="text-xs text-gray-500">{t.landmarkLimitReached}</span>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4">
        <div>
          <h3 className="font-semibold text-gray-800">{t.homeSponsors}</h3>
          <p className="text-sm text-gray-500">{t.homeSponsorsHint}</p>
        </div>

        {sponsors.map((sponsor, index) => (
          <div key={index} className="flex items-start gap-4 rounded-lg border border-gray-200 p-4">
            {sponsor.image_url ? (
              <img
                src={sponsor.image_url}
                alt={sponsor.name || 'Banner'}
                className="h-16 w-28 shrink-0 rounded-md border border-gray-200 bg-gray-50 object-cover"
              />
            ) : (
              <div className="h-16 w-28 shrink-0 flex items-center justify-center rounded-md border-2 border-dashed border-gray-300 bg-gray-50 text-xs text-gray-400">
                Sin imagen
              </div>
            )}
            <div className="flex-1 grid grid-cols-2 gap-3">
              <LabeledField
                label={t.sponsorName}
                value={sponsor.name}
                onChange={(v) => setSponsor(index, { name: v })}
              />
              <LabeledField
                label={t.sponsorLink}
                value={sponsor.link_url ?? ''}
                onChange={(v) => setSponsor(index, { link_url: v })}
              />
              <div className="col-span-2 flex items-center gap-3">
                <label className="cursor-pointer px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg">
                  {uploadingIndex === index ? t.loading : t.uploadImage}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={(e) => handleSponsorImage(index, e)}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setSponsors((prev) => prev.filter((_, i) => i !== index))}
                  className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 border border-red-200 rounded-lg"
                >
                  {t.remove}
                </button>
              </div>
            </div>
          </div>
        ))}

        <div>
          <button
            type="button"
            onClick={() => setSponsors((prev) => [...prev, { name: '', image_url: '' }])}
            className="px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg"
          >
            {t.addSponsor}
          </button>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={updateSetting.isPending}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-60"
        >
          {updateSetting.isPending ? t.loading : t.save}
        </button>
      </div>
    </div>
  )
}

function ContentSection() {
  return (
    <div className="flex flex-col gap-6">
      <PlainTextSetting
        settingKey="game_instructions"
        label={t.gameInstructions}
        hint={t.gameInstructionsHint}
      />
      <PlainTextSetting
        settingKey="terms_and_conditions"
        label={t.termsAndConditions}
        hint={t.termsAndConditionsHint}
      />
    </div>
  )
}

export function SettingsPage() {
  const [section, setSection] = useState<Section>('branding')

  const SECTIONS: { key: Section; label: string }[] = [
    { key: 'branding', label: t.branding },
    { key: 'texts', label: t.uiTexts },
    { key: 'appinfo', label: t.appInfo },
    { key: 'content', label: t.legalContent },
    { key: 'home', label: t.homeContent },
  ]

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-bold text-gray-900">{t.settings}</h2>

      <div className="flex border-b border-gray-200">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setSection(s.key)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              section === s.key
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="max-w-3xl">
        {section === 'branding' && <BrandingSection />}
        {section === 'texts' && <UITextsSection />}
        {section === 'appinfo' && <AppInfoSection />}
        {section === 'content' && <ContentSection />}
        {section === 'home' && <HomeContentSection />}
      </div>
    </div>
  )
}
