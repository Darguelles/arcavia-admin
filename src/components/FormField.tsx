import type {
  ReactNode,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  SelectHTMLAttributes,
} from 'react'
import { AlertCircle } from 'lucide-react'
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

  // Design: campo 40, radio 5, borde line-strong; el error tiñe el borde, no
  // el fondo entero. Foco: borde tinta + anillo dorado interior.
  const baseClass = cn(
    'block w-full rounded-control border bg-surface px-3 text-sm text-ink',
    'focus:outline-2 focus:outline-gold focus:-outline-offset-[3px] focus:ring-0 focus:border-ink',
    error ? 'border-danger' : 'border-line-strong',
    (rest as { disabled?: boolean }).disabled && 'bg-line-soft cursor-not-allowed opacity-70'
  )

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={fieldId} className="text-[13px] font-medium text-ink">
        {label}
        {required && (
          <span className="text-danger ml-1" aria-hidden>
            *
          </span>
        )}
      </label>

      {as === 'textarea' ? (
        <textarea
          id={fieldId}
          className={cn(baseClass, 'resize-y min-h-[80px] py-2')}
          aria-describedby={hint ? `${fieldId}-hint` : undefined}
          aria-invalid={!!error}
          {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : as === 'select' ? (
        <select
          id={fieldId}
          className={cn(baseClass, 'h-10 py-0')}
          aria-describedby={hint ? `${fieldId}-hint` : undefined}
          aria-invalid={!!error}
          {...(rest as SelectHTMLAttributes<HTMLSelectElement>)}
        >
          {(props as SelectProps).children}
        </select>
      ) : (
        <input
          id={fieldId}
          className={cn(baseClass, 'h-10 py-0')}
          aria-describedby={hint ? `${fieldId}-hint` : undefined}
          aria-invalid={!!error}
          {...(rest as InputHTMLAttributes<HTMLInputElement>)}
        />
      )}

      {hint && (
        <p id={`${fieldId}-hint`} className="text-[13px] leading-[19px] text-muted m-0">
          {hint}
        </p>
      )}
      {error && (
        <p role="alert" className="flex items-center gap-1.5 text-[13px] text-danger m-0">
          <AlertCircle aria-hidden size={14} />
          {error}
        </p>
      )}
    </div>
  )
}
