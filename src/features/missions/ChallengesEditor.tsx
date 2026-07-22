import { useState } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { challengeSchema, type ChallengeFormItem } from '../../lib/validation'
import {
  useChallenges,
  useCreateChallenge,
  useUpdateChallenge,
  useDeleteChallenge,
} from '../../api/challenges'
import { FormField } from '../../components/FormField'
import { TranslationsEditor } from '../../components/TranslationsEditor'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { useToast } from '../../components/Toast'
import { ApiClientError } from '../../api/client'
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

function toPayload(data: ChallengeFormItem): ChallengeCreate {
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
 * Per-waypoint challenge editor (spec §6.5). Each question is created/updated
 * individually against the v2 API; ≥2 options and exactly one correct answer.
 */
export function ChallengesEditor({ waypointId }: { waypointId: string }) {
  const { data: challenges, isLoading } = useChallenges(waypointId)
  const [newCards, setNewCards] = useState<number[]>([])

  if (isLoading) return <p className="text-gray-400">{t.loading}</p>

  const existing = challenges ?? []

  return (
    <div className="flex flex-col gap-4">
      {existing.length === 0 && newCards.length === 0 && (
        <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-4 py-3">
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
        className="self-start text-sm text-indigo-600 hover:text-indigo-800 font-medium"
      >
        + {t.addQuestion}
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

  async function onSubmit(data: ChallengeFormItem) {
    try {
      if (isNew) {
        await create.mutateAsync(toPayload({ ...data, order_index: index }))
        toast.success(t.created)
        onDone?.()
      } else {
        await update.mutateAsync(toPayload(data))
        toast.success(t.saved)
      }
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : t.error)
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
      toast.error(err instanceof ApiClientError ? err.message : t.error)
    } finally {
      setConfirm(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-4"
      noValidate
    >
      <div className="flex items-center gap-3">
        <h4 className="font-medium text-gray-800 flex-1">
          {t.question} {index + 1}
        </h4>
        <button
          type="button"
          onClick={() => (isNew ? remove() : setConfirm(true))}
          className="text-xs text-red-500 hover:text-red-700"
          aria-label={`${t.remove} ${index + 1}`}
        >
          {t.remove}
        </button>
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor={`ch-${waypointId}-${index}-prompt`}
          className="text-sm font-medium text-gray-700"
        >
          {t.questionPrompt} *
        </label>
        <textarea
          id={`ch-${waypointId}-${index}-prompt`}
          className={cn(
            'rounded-lg border px-3 py-2 text-sm resize-y min-h-[60px]',
            errors.prompt ? 'border-red-400 bg-red-50' : 'border-gray-300'
          )}
          aria-invalid={!!errors.prompt}
          {...register('prompt')}
        />
        {errors.prompt && (
          <p className="text-xs text-red-600" role="alert">
            {errors.prompt.message}
          </p>
        )}
      </div>

      {/* Options */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">{t.options}</label>
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
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
          >
            + {t.addOption}
          </button>
        </div>

        {optionFields.map((opt, optIdx) => (
          <div key={opt.id} className="flex items-center gap-3">
            <input
              type="radio"
              name={`ch-${waypointId}-${index}-correct`}
              checked={options[optIdx]?.is_correct ?? false}
              onChange={() => setCorrect(optIdx)}
              className="h-4 w-4 text-indigo-600 border-gray-300"
              aria-label={`Opción ${optIdx + 1} es correcta`}
              title={t.correctOption}
            />
            <input
              type="text"
              className="flex-1 rounded border border-gray-300 px-3 py-1.5 text-sm"
              placeholder={`${t.optionText} ${optIdx + 1}`}
              aria-label={`Opción ${optIdx + 1}`}
              {...register(`options.${optIdx}.text`)}
            />
            {optionFields.length > 2 && (
              <button
                type="button"
                onClick={() => removeOption(optIdx)}
                className="text-gray-400 hover:text-red-500 text-xs"
                aria-label={`Eliminar opción ${optIdx + 1}`}
              >
                ✕
              </button>
            )}
          </div>
        ))}

        {typeof errors.options === 'object' && !Array.isArray(errors.options) && (
          <p className="text-xs text-red-600" role="alert">
            {(errors.options as { message?: string }).message}
          </p>
        )}
        {options.length >= 2 && !options.some((o) => o.is_correct) && (
          <p className="text-xs text-red-600" role="alert">
            {t.mustMarkCorrect}
          </p>
        )}
      </div>

      {/* Riddle */}
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300"
            {...register('is_riddle')}
          />
          {t.riddle}
        </label>
        {isRiddle && (
          <div className="grid grid-cols-2 gap-3">
            <FormField as="input" label={t.keyword} hint={t.keywordHint} {...register('keyword')} />
            <FormField as="input" label={t.funFact} {...register('fun_fact')} />
          </div>
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

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-60"
        >
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
