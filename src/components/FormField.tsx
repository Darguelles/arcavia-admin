import type {
  ReactNode,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  SelectHTMLAttributes,
} from 'react'
import { cn } from '../lib/utils'

interface BaseProps {
  label: string
  hint?: string
  error?: string
  required?: boolean
  className?: string
}

type InputProps = BaseProps & InputHTMLAttributes<HTMLInputElement> & { as?: 'input' }
type TextareaProps = BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement> & { as: 'textarea' }
type SelectProps = BaseProps &
  SelectHTMLAttributes<HTMLSelectElement> & { as: 'select'; children: ReactNode }

type FormFieldProps = InputProps | TextareaProps | SelectProps

/** Labelled form field with helper text and error display. Used on every form per spec §5.2. */
export function FormField(props: FormFieldProps) {
  const { label, hint, error, required, className, as = 'input', ...rest } = props
  const fieldId = `field-${label.toLowerCase().replace(/\s+/g, '-')}-${Math.random().toString(36).slice(2, 6)}`

  const baseClass = cn(
    'block w-full rounded-lg border px-3 py-2 text-sm text-gray-900',
    'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
    error ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white',
    (rest as { disabled?: boolean }).disabled && 'bg-gray-100 cursor-not-allowed opacity-70'
  )

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label htmlFor={fieldId} className="text-sm font-medium text-gray-700">
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-hidden>
            *
          </span>
        )}
      </label>

      {as === 'textarea' ? (
        <textarea
          id={fieldId}
          className={cn(baseClass, 'resize-y min-h-[80px]')}
          aria-describedby={hint ? `${fieldId}-hint` : undefined}
          aria-invalid={!!error}
          {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : as === 'select' ? (
        <select
          id={fieldId}
          className={baseClass}
          aria-describedby={hint ? `${fieldId}-hint` : undefined}
          aria-invalid={!!error}
          {...(rest as SelectHTMLAttributes<HTMLSelectElement>)}
        >
          {(props as SelectProps).children}
        </select>
      ) : (
        <input
          id={fieldId}
          className={baseClass}
          aria-describedby={hint ? `${fieldId}-hint` : undefined}
          aria-invalid={!!error}
          {...(rest as InputHTMLAttributes<HTMLInputElement>)}
        />
      )}

      {hint && (
        <p id={`${fieldId}-hint`} className="text-xs text-gray-500">
          {hint}
        </p>
      )}
      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
