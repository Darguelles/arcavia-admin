import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Image, Plus, TriangleAlert, Upload } from 'lucide-react'
import { useSetting, useUpdateSetting, uploadAsset } from '../../api/settings'
import type { HomeContent, HomeSponsor, HomeStep, LandmarkSlide } from '../../api/types'
import { HOME_DEFAULTS } from '../../lib/homeDefaults'
import { appInfoSchema, type AppInfoForm } from '../../lib/validation'
import { FormField } from '../../components/FormField'
import { TranslationsEditor } from '../../components/TranslationsEditor'
import { useToast } from '../../components/Toast'
import {
  btnAddDashed,
  btnGhost,
  btnPrimary,
  btnRowAction,
  btnSecondary,
  card,
  overline,
} from '../../components/ui'
import { t } from '../../lib/i18n'
import { cn } from '../../lib/utils'

type Section = 'branding' | 'appinfo' | 'content' | 'texts' | 'home'

const sectionCard = cn(card, 'p-6 flex flex-col gap-5')

const sectionTitle = 'm-0 text-[17px] font-semibold text-ink'
const sectionHint = 'm-0 mt-1.5 text-[13px] text-muted'

const inputClass =
  'block w-full rounded-control border border-line-strong bg-surface px-3 text-sm text-ink focus:outline-2 focus:outline-gold focus:-outline-offset-[3px] focus:ring-0 focus:border-ink'

const btnRowDanger = cn(
  btnRowAction,
  'text-danger border-danger-line hover:border-danger hover:bg-danger-tint'
)

/** Pie de tarjeta con la acción de guardado (diseño: separado por línea suave). */
function CardFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 pt-4 border-t border-line-soft">
      <div className="ml-auto flex items-center gap-2.5">{children}</div>
    </div>
  )
}

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
    <div className={sectionCard}>
      <div>
        <h2 className={sectionTitle}>{t.branding}</h2>
        <p className={sectionHint}>
          El logo se muestra en la app del jugador. JPG, PNG o WebP — máximo 5 MB.
        </p>
      </div>

      <div className="flex items-center gap-6">
        {currentUrl ? (
          <img
            src={currentUrl}
            alt="Logo actual"
            className="h-24 w-24 object-contain rounded-card border border-line bg-paper"
          />
        ) : (
          <div className="h-24 w-24 flex items-center justify-center rounded-card border border-dashed border-line-strong bg-paper text-faint">
            <Image size={22} strokeWidth={1.5} aria-hidden />
          </div>
        )}

        <div className="flex flex-col items-start gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className={btnSecondary}
          >
            <Upload size={16} strokeWidth={1.5} aria-hidden />
            {uploading ? t.loading : 'Subir logo'}
          </button>
          <p className="m-0 text-[12.5px] text-faint">
            {currentUrl ? 'Logo cargado.' : 'Sin logo cargado.'}
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

  if (isLoading) return <p className="text-faint">{t.loading}</p>

  return (
    <div className={sectionCard}>
      <div>
        <h2 className={sectionTitle}>{t.uiTexts}</h2>
        <p className={sectionHint}>
          Textos que aparecen en la app del jugador. Edita el español y agrega traducciones para
          otros idiomas.
        </p>
      </div>

      <TranslationsEditor
        fields={Object.entries(texts).map(([key]) => ({ key, label: key }))}
        value={translations}
        onChange={setTranslations}
      />

      <CardFooter>
        <button type="button" onClick={handleSave} className={btnPrimary}>
          {t.save}
        </button>
      </CardFooter>
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
    <form onSubmit={handleSubmit(onSubmit)} className={sectionCard} noValidate>
      <h2 className={sectionTitle}>{t.appInfo}</h2>

      <div className="grid grid-cols-2 gap-5">
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
        <div className="bg-warn-tint text-warn-text rounded-control px-4 py-3 text-[13px] leading-5 flex items-center justify-between gap-4">
          <span className="flex items-start gap-2.5">
            <TriangleAlert size={16} strokeWidth={1.5} className="shrink-0 mt-0.5" aria-hidden />
            El texto de la política ha cambiado. ¿Aumentar la versión a que los usuarios acepten la
            nueva política?
          </span>
          <span className="flex gap-2 shrink-0">
            <button type="button" onClick={bumpVersion} className={btnRowAction}>
              Sí, aumentar versión
            </button>
            <button
              type="button"
              onClick={() => setShowVersionPrompt(false)}
              className={cn(btnGhost, 'h-8 px-2.5 text-[13px]')}
            >
              No
            </button>
          </span>
        </div>
      )}

      <CardFooter>
        <button
          type="submit"
          onClick={handleSaveClick}
          disabled={isSubmitting || !isDirty}
          className={btnPrimary}
        >
          {isSubmitting ? t.loading : t.save}
        </button>
      </CardFooter>
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

  if (isLoading) return <p className="text-faint">{t.loading}</p>

  return (
    <div className={sectionCard}>
      <div>
        <h2 className={sectionTitle}>{label}</h2>
        <p className={sectionHint}>{hint}</p>
      </div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={12}
        className={cn(inputClass, 'p-3 resize-y')}
      />
      <CardFooter>
        <button
          type="button"
          onClick={handleSave}
          disabled={updateSetting.isPending}
          className={btnPrimary}
        >
          {updateSetting.isPending ? t.loading : t.save}
        </button>
      </CardFooter>
    </div>
  )
}

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
      <span className="text-[13px] font-medium text-ink">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          className={cn(inputClass, 'py-2')}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(inputClass, 'h-10')}
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
            className="h-16 w-28 shrink-0 rounded-card border border-line bg-paper object-cover"
          />
        ) : (
          <div className="h-16 w-28 shrink-0 flex items-center justify-center rounded-card border border-dashed border-line-strong bg-paper text-faint">
            <Image size={18} strokeWidth={1.5} aria-hidden />
          </div>
        )}
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-medium text-ink">{label}</span>
          <div className="flex items-center gap-2.5">
            <label className={btnRowAction}>
              <Upload size={13} strokeWidth={1.5} aria-hidden />
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
                className={btnRowDanger}
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

  if (isLoading) return <p className="text-faint">{t.loading}</p>

  return (
    <div className="flex flex-col gap-5">
      <div className={sectionCard}>
        <div>
          <h2 className={sectionTitle}>{t.homeContent}</h2>
          <p className={sectionHint}>{t.homeContentHint}</p>
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

        <h3 className={cn(overline, 'pt-2 m-0')}>{t.homeNeedSection}</h3>
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

        <h3 className={cn(overline, 'pt-2 m-0')}>{t.homeSolutionSection}</h3>
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

        <h3 className={cn(overline, 'pt-2 m-0')}>{t.homeHowSection}</h3>
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

        <h3 className={cn(overline, 'pt-2 m-0')}>{t.homeVisionSection}</h3>
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

        <h3 className={cn(overline, 'pt-2 m-0')}>{t.homeClosingSection}</h3>
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

      <div className={sectionCard}>
        <div>
          <h2 className={sectionTitle}>{t.homeImages}</h2>
          <p className={sectionHint}>{t.homeImagesHint}</p>
        </div>
        {imageRow(t.homeHeroImage, 'hero_image_url', 'home_hero')}
        {imageRow(t.homeBrandMark, 'brand_mark_url', 'home_brand')}
      </div>

      <div className={sectionCard}>
        <div>
          <h2 className={sectionTitle}>{t.homeLandmarks}</h2>
          <p className={sectionHint}>{t.homeLandmarksHint}</p>
        </div>

        {landmarks.map((slide, index) => (
          <div
            key={index}
            className="flex items-start gap-4 rounded-control border border-line p-4"
          >
            {slide.image_url ? (
              <img
                src={slide.image_url}
                alt={slide.title || `Imagen ${index + 1}`}
                className="h-24 w-16 shrink-0 rounded-card border border-line bg-paper object-cover"
              />
            ) : (
              <div className="h-24 w-16 shrink-0 flex items-center justify-center rounded-card border border-dashed border-line-strong bg-paper text-faint">
                <Image size={18} strokeWidth={1.5} aria-hidden />
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
              <div className="col-span-2 flex items-center gap-2.5">
                <label className={btnRowAction}>
                  <Upload size={13} strokeWidth={1.5} aria-hidden />
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
                  className={btnRowDanger}
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
            className={btnAddDashed}
          >
            <Plus size={15} strokeWidth={1.5} aria-hidden />
            {t.addLandmark}
          </button>
          {landmarks.length >= 8 && (
            <span className="text-[12.5px] text-faint">{t.landmarkLimitReached}</span>
          )}
        </div>
      </div>

      <div className={sectionCard}>
        <div>
          <h2 className={sectionTitle}>{t.homeSponsors}</h2>
          <p className={sectionHint}>{t.homeSponsorsHint}</p>
        </div>

        {sponsors.map((sponsor, index) => (
          <div
            key={index}
            className="flex items-start gap-4 rounded-control border border-line p-4"
          >
            {sponsor.image_url ? (
              <img
                src={sponsor.image_url}
                alt={sponsor.name || 'Banner'}
                className="h-16 w-28 shrink-0 rounded-card border border-line bg-paper object-cover"
              />
            ) : (
              <div className="h-16 w-28 shrink-0 flex items-center justify-center rounded-card border border-dashed border-line-strong bg-paper text-faint">
                <Image size={18} strokeWidth={1.5} aria-hidden />
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
              <div className="col-span-2 flex items-center gap-2.5">
                <label className={btnRowAction}>
                  <Upload size={13} strokeWidth={1.5} aria-hidden />
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
                  className={btnRowDanger}
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
            className={btnAddDashed}
          >
            <Plus size={15} strokeWidth={1.5} aria-hidden />
            {t.addSponsor}
          </button>
        </div>

        <CardFooter>
          <button
            type="button"
            onClick={handleSave}
            disabled={updateSetting.isPending}
            className={btnPrimary}
          >
            {updateSetting.isPending ? t.loading : t.save}
          </button>
        </CardFooter>
      </div>
    </div>
  )
}

function ContentSection() {
  return (
    <div className="flex flex-col gap-5">
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
    { key: 'appinfo', label: t.appInfo },
    { key: 'content', label: t.legalContent },
    { key: 'texts', label: t.uiTexts },
    { key: 'home', label: t.homeContent },
  ]

  return (
    <div className="grid grid-cols-[220px_1fr] gap-8 items-start">
      <nav className="sticky top-0 flex flex-col gap-0.5">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setSection(s.key)}
            className={cn(
              'px-3.5 py-2.5 text-[13.5px] text-left border-l-[3px] cursor-pointer transition-colors',
              section === s.key
                ? 'border-gold bg-surface rounded-r-control font-semibold text-ink'
                : 'border-transparent text-muted hover:text-ink'
            )}
          >
            {s.label}
          </button>
        ))}
      </nav>

      <div className="flex flex-col gap-5 max-w-3xl">
        {section === 'branding' && <BrandingSection />}
        {section === 'texts' && <UITextsSection />}
        {section === 'appinfo' && <AppInfoSection />}
        {section === 'content' && <ContentSection />}
        {section === 'home' && <HomeContentSection />}
      </div>
    </div>
  )
}
