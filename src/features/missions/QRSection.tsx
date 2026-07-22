import { useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { useWaypointQR, useGenerateQR, useToggleQRActive } from '../../api/qr'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { useToast } from '../../components/Toast'
import { t } from '../../lib/i18n'

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
    } catch {
      toast.error(t.error)
    }
  }

  async function setActive(active: boolean) {
    try {
      await toggle.mutateAsync(active)
      toast.success(active ? t.activated : t.deactivated)
    } catch {
      toast.error(t.error)
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

  if (isLoading) return <p className="text-gray-400">{t.loading}</p>

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
        ⚠ {t.qrGuardrail}
      </div>

      {qr ? (
        <div className="flex flex-col items-center gap-4">
          <div
            ref={printRef}
            className={`p-6 bg-white border-2 border-gray-200 rounded-xl inline-block ${
              qr.is_active ? '' : 'opacity-50'
            }`}
          >
            <QRCodeSVG value={qr.token} size={200} />
          </div>

          <p className="text-xs text-gray-500">
            Token: <code className="bg-gray-100 px-1 rounded">{qr.token.slice(0, 8)}…</code>{' '}
            <span
              className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                qr.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {qr.is_active ? t.active : t.inactive}
            </span>
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
            >
              🖨 {t.download}
            </button>
            {qr.is_active ? (
              <button
                type="button"
                onClick={() => setConfirmRetire(true)}
                className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg"
              >
                {t.deactivate}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActive(true)}
                disabled={toggle.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-60"
              >
                {t.activate}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <p className="text-sm text-gray-500">Este punto no tiene un código QR.</p>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generate.isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-60"
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
