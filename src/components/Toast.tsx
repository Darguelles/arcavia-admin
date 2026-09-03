import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { Check, CircleAlert, Info } from 'lucide-react'
import { cn } from '../lib/utils'

type ToastVariant = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  message: string
  variant: ToastVariant
}

interface ToastContextValue {
  show: (message: string, variant?: ToastVariant) => void
  success: (message: string) => void
  error: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let nextId = 0

const ICONS: Record<ToastVariant, ReactNode> = {
  success: <Check aria-hidden size={18} strokeWidth={1.5} className="text-gold shrink-0" />,
  error: <CircleAlert aria-hidden size={18} strokeWidth={1.5} className="shrink-0" />,
  info: <Info aria-hidden size={18} strokeWidth={1.5} className="text-gold shrink-0" />,
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const show = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = ++nextId
    setToasts((prev) => [...prev, { id, message, variant }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }, [])

  const success = useCallback((message: string) => show(message, 'success'), [show])
  const error = useCallback((message: string) => show(message, 'error'), [show])

  return (
    <ToastContext.Provider value={{ show, success, error }}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5"
        role="region"
        aria-label="Notificaciones"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="alert"
            className={cn(
              'flex items-center gap-2.5 rounded-control px-4 py-3 text-sm max-w-sm shadow-float',
              t.variant === 'error' ? 'bg-danger text-white' : 'bg-ink text-cream'
            )}
          >
            {ICONS[t.variant]}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
