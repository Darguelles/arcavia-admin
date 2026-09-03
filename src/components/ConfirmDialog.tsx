import { useEffect, useRef, type ReactNode } from 'react'
import { t } from '../lib/i18n'
import { cn } from '../lib/utils'
import { btnGhost } from './ui'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string | ReactNode
  confirmLabel?: string
  variant?: 'danger' | 'warning'
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

/**
 * Confirm dialog for destructive/sensitive actions (spec §5.4).
 * Always states the concrete effect before the user can confirm.
 * Design: única superficie flotante — tarjeta con shadow-float sobre el velo.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = t.confirm,
  variant = 'danger',
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (open) cancelRef.current?.focus()
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-ink/50" onClick={onCancel} />

      <div className="relative bg-surface rounded-card border border-line shadow-float p-6 max-w-md w-full mx-4">
        <h2 id="confirm-title" className="text-[17px] font-semibold text-ink mb-2">
          {title}
        </h2>
        <p className="text-sm leading-[22px] text-muted mb-5">{message}</p>

        <div className="flex justify-end gap-2.5">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={loading}
            className={cn(btnGhost, 'px-4')}
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              'inline-flex items-center justify-center h-10 px-[18px] rounded-control border text-sm font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed',
              variant === 'danger'
                ? 'bg-danger border-danger text-white hover:opacity-90'
                : 'bg-warn border-warn text-white hover:opacity-90'
            )}
          >
            {loading ? t.loading : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
