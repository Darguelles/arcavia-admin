import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import {
  useForm,
  useFieldArray,
  Controller,
  type Control,
  type UseFormRegister,
  type UseFormWatch,
  type UseFormSetValue,
  type FieldErrors,
} from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { challengeSchema, type ChallengeFormItem } from '../../lib/validation'
import {
  useChallenges,
  useCreateChallenge,
  useUpdateChallenge,
  useDeleteChallenge,
  useUploadChallengeImage,
  useDeleteChallengeImage,
} from '../../api/challenges'
import { Plus, Trash2, X } from 'lucide-react'
import { FormField } from '../../components/FormField'
import { TranslationsEditor } from '../../components/TranslationsEditor'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { useToast } from '../../components/Toast'
import { btnAddDashed, btnIconSmDanger, btnSecondary, card, linkAction } from '../../components/ui'
import { translateApiError } from '../../lib/apiErrors'
import { t } from '../../lib/i18n'
import { cn } from '../../lib/utils'
import type { Challenge, ChallengeCreate } from '../../api/types'

function blankChallenge(order: number): ChallengeFormItem {
  return {
    prompt: '',
    order_index: order,
    is_riddle: false,
    keyword: '',
    fun_fact: '',
    options: [
      { text: '', is_correct: false, order_index: 0, translations: {} },
      { text: '', is_correct: false, order_index: 1, translations: {} },
    ],
    translations: {},
  }
}

function toForm(c: Challenge): ChallengeFormItem {
  return {
    prompt: c.prompt,
    order_index: c.order_index,
    is_riddle: c.is_riddle,
    keyword: c.keyword ?? '',
    fun_fact: c.fun_fact ?? '',
    options: c.options.map((o) => ({
      text: o.text,
      is_correct: o.is_correct,
      order_index: o.order_index,
      translations: o.translations ?? {},
    })),
    translations: c.translations ?? {},
  }
}

/** Form model → API create payload. Exported so the waypoint create flow can
 *  flush its buffered draft questions once the waypoint exists. */
export function challengeFormToCreate(data: ChallengeFormItem): ChallengeCreate {
  return {
    prompt: data.prompt,
    order_index: data.order_index,
    is_riddle: data.is_riddle,
    keyword: data.is_riddle ? data.keyword?.trim() || null : null,
    fun_fact: data.fun_fact?.trim() || null,
    options: data.options.map((o, i) => ({
      text: o.text,
      is_correct: o.is_correct,
      order_index: i,
      translations: o.translations ?? {},
    })),
    translations: data.translations ?? {},
  }
}

/**
 * The editable fields of a single question (prompt, options, riddle,
 * translations) — shared by the live card (saved individually to the API on
 * edit) and the draft card (buffered locally while a new waypoint is being
 * created). `idPrefix` keeps element ids / radio-group names unique per card.
 */
function ChallengeFormBody({
  idPrefix,
  register,
  control,
  watch,
  setValue,
  errors,
}: {
  idPrefix: string
  register: UseFormRegister<ChallengeFormItem>
  control: Control<ChallengeFormItem>
  watch: UseFormWatch<ChallengeFormItem>
  setValue: UseFormSetValue<ChallengeFormItem>
  errors: FieldErrors<ChallengeFormItem>
}) {
  const {
    fields: optionFields,
    append: appendOption,
    remove: removeOption,
  } = useFieldArray({ control, name: 'options' })

  const options = watch('options') ?? []
  const isRiddle = watch('is_riddle')

  function setCorrect(optIdx: number) {
    options.forEach((_, i) => setValue(`options.${i}.is_correct`, i === optIdx))
  }

  return (
    <>
      <div className="flex flex-col gap-1">
        <label htmlFor={`ch-${idPrefix}-prompt`} className="text-[13px] font-medium text-ink">
          {t.questionPrompt} *
        </label>
        <textarea
          id={`ch-${idPrefix}-prompt`}
          className={cn(
            'rounded-control border bg-surface px-3 py-2 text-sm resize-y min-h-[60px]',
            errors.prompt ? 'border-danger' : 'border-line-strong'
          )}
          aria-invalid={!!errors.prompt}
          {...register('prompt')}
        />
        {errors.prompt && (
          <p className="text-[13px] text-danger" role="alert">
            {errors.prompt.message}
          </p>
        )}
      </div>

      {/* Options */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-[13px] font-medium text-ink">{t.options}</label>
          <button
            type="button"
            onClick={() =>
              appendOption({
                text: '',
                is_correct: false,
                order_index: optionFields.length,
                translations: {},
              })
            }
            className={linkAction}
          >
            {t.addOption}
          </button>
        </div>

        {optionFields.map((opt, optIdx) => (
          <div key={opt.id} className="flex items-center gap-3">
            <input
              type="radio"
              name={`ch-${idPrefix}-correct`}
              checked={options[optIdx]?.is_correct ?? false}
              onChange={() => setCorrect(optIdx)}
              className="h-4 w-4 accent-gold border-line-strong"
              aria-label={`Opción ${optIdx + 1} es correcta`}
              title={t.correctOption}
            />
            <input
              type="text"
              className="flex-1 h-9 rounded-control border border-line-strong bg-surface px-3 text-sm"
              placeholder={`${t.optionText} ${optIdx + 1}`}
              aria-label={`Opción ${optIdx + 1}`}
              {...register(`options.${optIdx}.text`)}
            />
            {optionFields.length > 2 && (
              <button
                type="button"
                onClick={() => removeOption(optIdx)}
                className="bg-transparent border-0 p-0 text-faint hover:text-danger cursor-pointer"
                aria-label={`Eliminar opción ${optIdx + 1}`}
              >
                <X size={15} strokeWidth={1.5} />
              </button>
            )}
          </div>
        ))}

        {typeof errors.options === 'object' && !Array.isArray(errors.options) && (
          <p className="text-[13px] text-danger" role="alert">
            {(errors.options as { message?: string }).message}
          </p>
        )}
        {options.length >= 2 && !options.some((o) => o.is_correct) && (
          <p className="text-[13px] text-danger" role="alert">
            {t.mustMarkCorrect}
          </p>
        )}
      </div>

      {/* Fun fact — independent of the riddle: any question can reveal one on
          a correct answer (the game engine already works this way). */}
      <FormField as="input" label={t.funFact} hint={t.funFactHint} {...register('fun_fact')} />

      {/* Riddle */}
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm font-medium text-ink">
          <input
            type="checkbox"
            className="h-4 w-4 rounded-chip border-line-strong accent-gold"
            {...register('is_riddle')}
          />
          {t.riddle}
          <span className="text-[13px] font-normal text-muted">{t.riddleHint}</span>
        </label>
        {isRiddle && (
          <FormField as="input" label={t.keyword} hint={t.keywordHint} {...register('keyword')} />
        )}
      </div>

      <Controller
        name="translations"
        control={control}
        render={({ field }) => (
          <TranslationsEditor
            fields={[{ key: 'prompt', label: t.questionPrompt, multiline: true }]}
            value={field.value ?? {}}
            onChange={field.onChange}
          />
        )}
      />
    </>
  )
}

/**
 * Per-waypoint challenge editor (spec §6.5). Each question is created/updated
 * individually against the v2 API; ≥2 options and exactly one correct answer.
 */
export function ChallengesEditor({ waypointId }: { waypointId: string }) {
  const { data: challenges, isLoading } = useChallenges(waypointId)
  const [newCards, setNewCards] = useState<number[]>([])

  if (isLoading) return <p className="text-faint">{t.loading}</p>

  const existing = challenges ?? []

  return (
    <div className="flex flex-col gap-4">
      {existing.length === 0 && newCards.length === 0 && (
        <p className="m-0 bg-warn-tint text-warn-text rounded-control px-4 py-3 text-[13px] leading-5">
          {t.noQuestionsYet}
        </p>
      )}

      {existing.map((c, i) => (
        <ChallengeCard key={c.id} waypointId={waypointId} challenge={c} index={i} />
      ))}

      {newCards.map((key) => (
        <ChallengeCard
          key={`new-${key}`}
          waypointId={waypointId}
          index={existing.length}
          onDone={() => setNewCards((prev) => prev.filter((k) => k !== key))}
        />
      ))}

      <button
        type="button"
        onClick={() => setNewCards((prev) => [...prev, Date.now()])}
        className={cn(btnAddDashed, 'self-start')}
      >
        <Plus size={15} strokeWidth={1.5} />
        {t.addQuestion}
      </button>
    </div>
  )
}

function ChallengeCard({
  waypointId,
  challenge,
  index,
  onDone,
}: {
  waypointId: string
  challenge?: Challenge
  index: number
  onDone?: () => void
}) {
  const isNew = !challenge
  const toast = useToast()
  const create = useCreateChallenge(waypointId)
  const update = useUpdateChallenge(waypointId, challenge?.id ?? '')
  const del = useDeleteChallenge(waypointId, challenge?.id ?? '')
  const [confirm, setConfirm] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ChallengeFormItem>({
    resolver: zodResolver(challengeSchema),
    defaultValues: challenge ? toForm(challenge) : blankChallenge(index),
  })

  async function onSubmit(data: ChallengeFormItem) {
    try {
      if (isNew) {
        await create.mutateAsync(challengeFormToCreate({ ...data, order_index: index }))
        toast.success(t.created)
        onDone?.()
      } else {
        await update.mutateAsync(challengeFormToCreate(data))
        toast.success(t.saved)
      }
    } catch (err) {
      toast.error(translateApiError(err))
    }
  }

  async function remove() {
    if (isNew) {
      onDone?.()
      return
    }
    try {
      await del.mutateAsync()
      toast.success(t.deleted)
    } catch (err) {
      toast.error(translateApiError(err))
    } finally {
      setConfirm(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn(card, 'p-5 flex flex-col gap-4')}
      noValidate
    >
      <div className="flex items-center gap-3">
        <h4 className="m-0 text-[15px] font-semibold text-ink flex-1">
          {t.question} {index + 1}
        </h4>
        <button
          type="button"
          onClick={() => (isNew ? remove() : setConfirm(true))}
          className={btnIconSmDanger}
          aria-label={`${t.remove} ${index + 1}`}
          title={t.remove}
        >
          <Trash2 size={15} strokeWidth={1.5} />
        </button>
      </div>

      <ChallengeFormBody
        idPrefix={`${waypointId}-${index}`}
        register={register}
        control={control}
        watch={watch}
        setValue={setValue}
        errors={errors}
      />

      {/* Reference image — only once the challenge exists (needs its id). */}
      {challenge && (
        <ChallengeImageSection
          waypointId={waypointId}
          challengeId={challenge.id}
          imageUrl={challenge.image_url ?? null}
        />
      )}

      <div className="flex justify-end">
        <button type="submit" disabled={isSubmitting} className={btnSecondary}>
          {isSubmitting ? t.loading : t.save}
        </button>
      </div>

      <ConfirmDialog
        open={confirm}
        title={t.delete}
        message={t.deleteChallengeConfirm}
        confirmLabel={t.delete}
        onConfirm={remove}
        onCancel={() => setConfirm(false)}
        loading={del.isPending}
      />
    </form>
  )
}

/**
 * Inline questions for a waypoint that doesn't exist yet (the create screen).
 * Questions are buffered locally and reported up via `onChange`; the parent
 * flushes them to the API (via `challengeFormToCreate`) right after it creates
 * the waypoint, so the whole point is built with a single Save.
 */
export function DraftChallenges({
  onChange,
}: {
  onChange: (questions: ChallengeFormItem[]) => void
}) {
  const [cards, setCards] = useState<{ key: number; data: ChallengeFormItem }[]>([])
  const nextKey = useRef(1)

  useEffect(() => {
    onChange(cards.map((c) => c.data))
  }, [cards, onChange])

  return (
    <div className="flex flex-col gap-4">
      {cards.length === 0 && (
        <p className="m-0 bg-warn-tint text-warn-text rounded-control px-4 py-3 text-[13px] leading-5">
          {t.noQuestionsYet}
        </p>
      )}

      {cards.map((c, i) => (
        <DraftChallengeCard
          key={c.key}
          index={i}
          initial={c.data}
          onChange={(data) =>
            setCards((cs) => cs.map((x) => (x.key === c.key ? { ...x, data } : x)))
          }
          onRemove={() => setCards((cs) => cs.filter((x) => x.key !== c.key))}
        />
      ))}

      <button
        type="button"
        onClick={() =>
          setCards((cs) => [...cs, { key: nextKey.current++, data: blankChallenge(cs.length) }])
        }
        className={cn(btnAddDashed, 'self-start')}
      >
        <Plus size={15} strokeWidth={1.5} />
        {t.addQuestion}
      </button>
    </div>
  )
}

function DraftChallengeCard({
  index,
  initial,
  onChange,
  onRemove,
}: {
  index: number
  initial: ChallengeFormItem
  onChange: (data: ChallengeFormItem) => void
  onRemove: () => void
}) {
  const {
    register,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ChallengeFormItem>({
    resolver: zodResolver(challengeSchema),
    defaultValues: initial,
    mode: 'onChange',
  })

  // Lift every edit up to the buffer without forcing a per-card save.
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  useEffect(() => {
    const sub = watch((value) => onChangeRef.current(value as ChallengeFormItem))
    return () => sub.unsubscribe()
  }, [watch])

  return (
    <div className={cn(card, 'p-5 flex flex-col gap-4')}>
      <div className="flex items-center gap-3">
        <h4 className="m-0 text-[15px] font-semibold text-ink flex-1">
          {t.question} {index + 1}
        </h4>
        <button
          type="button"
          onClick={onRemove}
          className={btnIconSmDanger}
          aria-label={`${t.remove} ${index + 1}`}
          title={t.remove}
        >
          <Trash2 size={15} strokeWidth={1.5} />
        </button>
      </div>

      <ChallengeFormBody
        idPrefix={`draft-${index}`}
        register={register}
        control={control}
        watch={watch}
        setValue={setValue}
        errors={errors}
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
 * Optional per-challenge reference image, uploaded once the challenge exists.
 * The bytes go straight to the API, which stores them via the configured backend
 * (local disk in dev, S3 in prod) and returns the challenge with its new
 * image_url — shown on the player's DESAFIO screen. Mirrors the mission cover
 * image flow.
 */
function ChallengeImageSection({
  waypointId,
  challengeId,
  imageUrl,
}: {
  waypointId: string
  challengeId: string
  imageUrl: string | null
}) {
  const toast = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const uploadImage = useUploadChallengeImage(waypointId, challengeId)
  const removeImage = useDeleteChallengeImage(waypointId, challengeId)
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
    <div className="flex flex-col gap-3 rounded-card border border-line bg-paper p-4">
      <div>
        <h5 className="m-0 text-[13px] font-semibold text-ink">{t.challengeImage}</h5>
        <p className="m-0 mt-0.5 text-[13px] text-muted">{t.challengeImageHint}</p>
      </div>

      <div className="flex items-center gap-5">
        <div className="h-24 w-40 shrink-0 overflow-hidden rounded-card border border-line bg-surface">
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
