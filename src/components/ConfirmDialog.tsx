import { useEffect, useRef, type ReactNode } from 'react'
import { t } from '../lib/i18n'
import { cn } from '../lib/utils'

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
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />

      <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
        <h2 id="confirm-title" className="text-lg font-semibold text-gray-900 mb-2">
          {title}
        </h2>
        <p className="text-sm text-gray-600 mb-6">{message}</p>

        <div className="flex justify-end gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium text-white focus:outline-none focus:ring-2 disabled:opacity-50',
              variant === 'danger'
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                : 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500'
            )}
          >
            {loading ? t.loading : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
