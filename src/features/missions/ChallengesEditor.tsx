import { useEffect } from 'react'
import { useFieldArray, useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  challengesListSchema,
  type ChallengesListForm,
  type ChallengeFormItem,
} from '../../lib/validation'
import { useChallenges, useSaveChallenges } from '../../api/challenges'
import { TranslationsEditor } from '../../components/TranslationsEditor'
import { useToast } from '../../components/Toast'
import { t } from '../../lib/i18n'
import { cn } from '../../lib/utils'
import type { Challenge } from '../../api/types'

interface ChallengesEditorProps {
  missionId: string
  challengeCount: number
}

function toFormItem(c: Challenge): ChallengeFormItem {
  return {
    prompt: c.prompt,
    order_index: c.order_index,
    translations: c.translations ?? {},
    options: c.options.map((o) => ({
      text: o.text,
      is_correct: o.is_correct,
      order_index: o.order_index,
      translations: o.translations ?? {},
    })),
  }
}

interface SortableQuestionProps {
  id: string
  index: number
  control: ReturnType<typeof useForm<ChallengesListForm>>['control']
  register: ReturnType<typeof useForm<ChallengesListForm>>['register']
  errors: ReturnType<typeof useForm<ChallengesListForm>>['formState']['errors']
  onRemove: () => void
  canRemove: boolean
  watch: ReturnType<typeof useForm<ChallengesListForm>>['watch']
  setValue: ReturnType<typeof useForm<ChallengesListForm>>['setValue']
}

function SortableQuestion({
  id,
  index,
  control,
  register,
  errors,
  onRemove,
  canRemove,
  watch,
  setValue,
}: SortableQuestionProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  })
  const style = { transform: CSS.Transform.toString(transform), transition }

  const {
    fields: optionFields,
    append: appendOption,
    remove: removeOption,
  } = useFieldArray({
    control,
    name: `challenges.${index}.options`,
  })

  const options = watch(`challenges.${index}.options`) ?? []
  const questionError = errors.challenges?.[index]

  function handleCorrectChange(optIdx: number) {
    options.forEach((_, i) => {
      setValue(`challenges.${index}.options.${i}.is_correct`, i === optIdx)
    })
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-4',
        isDragging && 'opacity-60 shadow-lg'
      )}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab text-gray-400 hover:text-gray-600 text-lg select-none"
          title="Arrastra para reordenar"
          aria-label="Reordenar pregunta"
        >
          ⠿
        </button>
        <h4 className="font-medium text-gray-800 flex-1">
          {t.question} {index + 1}
        </h4>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs text-red-500 hover:text-red-700"
            aria-label={`Eliminar pregunta ${index + 1}`}
          >
            {t.remove}
          </button>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={`challenge-${index}-prompt`} className="text-sm font-medium text-gray-700">
          {t.questionPrompt} *
        </label>
        <textarea
          id={`challenge-${index}-prompt`}
          className={cn(
            'rounded-lg border px-3 py-2 text-sm resize-y min-h-[60px]',
            questionError?.prompt ? 'border-red-400 bg-red-50' : 'border-gray-300'
          )}
          aria-invalid={!!questionError?.prompt}
          {...register(`challenges.${index}.prompt`)}
        />
        {questionError?.prompt && (
          <p className="text-xs text-red-600" role="alert">
            {questionError.prompt.message}
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
              name={`challenge-${index}-correct`}
              checked={options[optIdx]?.is_correct ?? false}
              onChange={() => handleCorrectChange(optIdx)}
              className="h-4 w-4 text-indigo-600 border-gray-300"
              aria-label={`Opción ${optIdx + 1} es correcta`}
              title={t.correctOption}
            />
            <input
              type="text"
              className={cn(
                'flex-1 rounded border px-3 py-1.5 text-sm',
                questionError?.options?.[optIdx]?.text
                  ? 'border-red-400 bg-red-50'
                  : 'border-gray-300'
              )}
              placeholder={`${t.optionText} ${optIdx + 1}`}
              aria-label={`Opción ${optIdx + 1}`}
              {...register(`challenges.${index}.options.${optIdx}.text`)}
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

        {/* Inline validation messages */}
        {typeof questionError?.options === 'object' && !Array.isArray(questionError.options) && (
          <p className="text-xs text-red-600" role="alert">
            {(questionError.options as { message?: string }).message}
          </p>
        )}
        {optionFields.length < 2 && (
          <p className="text-xs text-red-600" role="alert">
            {t.minTwoOptions}
          </p>
        )}
        {options.length >= 2 && !options.some((o) => o.is_correct) && (
          <p className="text-xs text-red-600" role="alert">
            {t.mustMarkCorrect}
          </p>
        )}
      </div>

      <Controller
        name={`challenges.${index}.translations`}
        control={control}
        render={({ field }) => (
          <TranslationsEditor
            fields={[{ key: 'prompt', label: t.questionPrompt, multiline: true }]}
            value={field.value ?? {}}
            onChange={field.onChange}
          />
        )}
      />
    </div>
  )
}

/**
 * Ordered list of N≥1 questions. Not capped at 5 (spec §6.5).
 * Single-correct enforced via radio, save blocked if <2 options or no correct (spec §5.1).
 */
export function ChallengesEditor({ missionId, challengeCount }: ChallengesEditorProps) {
  const toast = useToast()
  const { data: challenges, isLoading } = useChallenges(missionId)
  const saveChallenges = useSaveChallenges(missionId)

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ChallengesListForm>({
    resolver: zodResolver(challengesListSchema),
    defaultValues: { challenges: [] },
  })

  // Populate form when data loads
  const { fields, append, remove, move } = useFieldArray({ control, name: 'challenges' })

  // Load existing challenges into form once data arrives
  useEffect(() => {
    if (challenges && !isDirty) {
      reset({ challenges: challenges.map(toFormItem) })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challenges])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = fields.findIndex((f) => f.id === active.id)
    const newIndex = fields.findIndex((f) => f.id === over.id)
    move(oldIndex, newIndex)
  }

  async function onSubmit(data: ChallengesListForm) {
    try {
      const payload = data.challenges.map((c, idx) => ({
        ...c,
        order_index: idx,
        options: c.options.map((o, oi) => ({ ...o, order_index: oi })),
      }))
      await saveChallenges.mutateAsync(payload)
      toast.success(t.saved)
    } catch {
      toast.error(t.error)
    }
  }

  if (isLoading) return <p className="text-gray-400">{t.loading}</p>

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      {fields.length === 0 ? (
        <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-4 py-3">
          {t.noQuestionsYet}
        </p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-4">
              {fields.map((field, index) => (
                <SortableQuestion
                  key={field.id}
                  id={field.id}
                  index={index}
                  control={control}
                  register={register}
                  errors={errors}
                  onRemove={() => remove(index)}
                  canRemove={fields.length > 1}
                  watch={watch}
                  setValue={setValue}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={() =>
            append({
              prompt: '',
              order_index: fields.length,
              options: [
                { text: '', is_correct: false, order_index: 0, translations: {} },
                { text: '', is_correct: false, order_index: 1, translations: {} },
              ],
              translations: {},
            })
          }
          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
        >
          + {t.addQuestion}
        </button>

        <button
          type="submit"
          disabled={isSubmitting || !isDirty}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-60"
        >
          {isSubmitting ? t.loading : t.save}
        </button>
      </div>

      {errors.challenges?.root?.message && (
        <p className="text-xs text-red-600" role="alert">
          {errors.challenges.root.message}
        </p>
      )}
    </form>
  )
}
