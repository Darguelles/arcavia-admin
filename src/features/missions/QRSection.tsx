import { useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Printer, TriangleAlert } from 'lucide-react'
import { useWaypointQR, useGenerateQR, useToggleQRActive } from '../../api/qr'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { useToast } from '../../components/Toast'
import { Badge, btnApprove, btnDanger, btnSecondary } from '../../components/ui'
import { t } from '../../lib/i18n'
import { translateApiError } from '../../lib/apiErrors'
import { cn } from '../../lib/utils'

interface QRSectionProps {
  waypointId: string
  waypointName: string
  cityName: string
}

/**
 * Per-waypoint QR management: generate, view, print, retire/reactivate (spec §6.6).
 * There is one QR per waypoint; retiring toggles it inactive rather than deleting.
 */
export function QRSection({ waypointId, waypointName, cityName }: QRSectionProps) {
  const toast = useToast()
  const printRef = useRef<HTMLDivElement>(null)
  const { data: qr, isLoading } = useWaypointQR(waypointId)
  const generate = useGenerateQR(waypointId)
  const toggle = useToggleQRActive(waypointId, qr?.id ?? '')
  const [confirmRetire, setConfirmRetire] = useState(false)

  async function handleGenerate() {
    try {
      await generate.mutateAsync()
      toast.success('Código QR generado.')
    } catch (err) {
      toast.error(translateApiError(err))
    }
  }

  async function setActive(active: boolean) {
    try {
      await toggle.mutateAsync(active)
      toast.success(active ? t.activated : t.deactivated)
    } catch (err) {
      toast.error(translateApiError(err))
    } finally {
      setConfirmRetire(false)
    }
  }

  function handlePrint() {
    if (!printRef.current) return
    const html = `
      <html><head><title>QR ${waypointName}</title>
      <style>
        body { font-family: sans-serif; text-align: center; padding: 40px; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        p { color: #555; font-size: 14px; margin-bottom: 24px; }
      </style></head>
      <body>
        <h1>${waypointName}</h1>
        <p>${cityName}</p>
        ${printRef.current.innerHTML}
      </body></html>`
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(html)
    w.document.close()
    w.focus()
    w.print()
    w.close()
  }

  if (isLoading) return <p className="text-faint">{t.loading}</p>

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-2.5 bg-warn-tint text-warn-text rounded-control px-4 py-3 text-[13px] leading-5">
        <TriangleAlert
          size={16}
          strokeWidth={1.5}
          className="shrink-0 mt-0.5 text-warn-deep"
          aria-hidden
        />
        <span>{t.qrGuardrail}</span>
      </div>

      {qr ? (
        <div className="flex flex-col items-center gap-4">
          <div
            ref={printRef}
            className={cn(
              'p-6 bg-surface border border-line rounded-card inline-block',
              !qr.is_active && 'opacity-50'
            )}
          >
            <QRCodeSVG value={qr.token} size={200} />
          </div>

          <p className="m-0 flex items-center gap-2 text-[13px] text-muted">
            Token:{' '}
            <code className="font-mono text-xs bg-paper border border-line rounded-chip px-1.5 py-0.5">
              {qr.token.slice(0, 8)}…
            </code>
            <Badge variant={qr.is_active ? 'success' : 'neutral'}>
              {qr.is_active ? t.active : t.inactive}
            </Badge>
          </p>

          <div className="flex gap-3">
            <button type="button" onClick={handlePrint} className={btnSecondary}>
              <Printer size={16} strokeWidth={1.5} />
              {t.download}
            </button>
            {qr.is_active ? (
              <button type="button" onClick={() => setConfirmRetire(true)} className={btnDanger}>
                {t.deactivate}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActive(true)}
                disabled={toggle.isPending}
                className={btnApprove}
              >
                {t.activate}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 py-8 rounded-card border border-dashed border-line-strong bg-paper">
          <p className="m-0 text-[13px] text-muted">Este punto no tiene un código QR.</p>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generate.isPending}
            className={btnSecondary}
          >
            {generate.isPending ? t.loading : `${t.generate} código QR`}
          </button>
        </div>
      )}

      <ConfirmDialog
        open={confirmRetire}
        title={t.deactivate}
        message={t.deactivateQRConfirm}
        confirmLabel={t.deactivate}
        onConfirm={() => setActive(false)}
        onCancel={() => setConfirmRetire(false)}
        loading={toggle.isPending}
      />
    </div>
  )
}
