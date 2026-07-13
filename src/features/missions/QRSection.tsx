import { useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { useQRCodes, useGenerateQR, useToggleQRActive } from '../../api/qr'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { useToast } from '../../components/Toast'
import { t } from '../../lib/i18n'
import { cn } from '../../lib/utils'
import { useState } from 'react'
import type { QRCode } from '../../api/types'

interface QRSectionProps {
  missionId: string
  missionName: string
  cityName: string
}

/**
 * QR code management: generate, view, print, retire (spec §6.6).
 * High-care screen — includes guardrail copy about reprinting physical codes.
 */
export function QRSection({ missionId, missionName, cityName }: QRSectionProps) {
  const toast = useToast()
  const printRef = useRef<HTMLDivElement>(null)
  const { data: qrCodes, isLoading } = useQRCodes(missionId)
  const generateQR = useGenerateQR(missionId)
  const [confirmQR, setConfirmQR] = useState<QRCode | null>(null)
  const [activatingTo, setActivatingTo] = useState<boolean>(false)
  const toggleQR = useToggleQRActive(missionId, confirmQR?.id ?? '')

  const activeQR = qrCodes?.find((q) => q.is_active)
  const allQRs = qrCodes ?? []

  async function handleGenerate() {
    try {
      await generateQR.mutateAsync()
      toast.success('Código QR generado.')
    } catch {
      toast.error(t.error)
    }
  }

  async function handleToggle() {
    if (!confirmQR) return
    try {
      await toggleQR.mutateAsync(activatingTo)
      toast.success(activatingTo ? t.activated : t.deactivated)
    } catch {
      toast.error(t.error)
    } finally {
      setConfirmQR(null)
    }
  }

  function handlePrint() {
    if (!printRef.current) return
    const html = `
      <html><head><title>QR ${missionName}</title>
      <style>
        body { font-family: sans-serif; text-align: center; padding: 40px; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        p { color: #555; font-size: 14px; margin-bottom: 24px; }
      </style></head>
      <body>
        <h1>${missionName}</h1>
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
      {/* Guardrail notice (spec §6.6) */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
        ⚠ {t.qrGuardrail}
      </div>

      {/* Active QR display */}
      {activeQR ? (
        <div className="flex flex-col items-center gap-4">
          <div
            ref={printRef}
            className="p-6 bg-white border-2 border-gray-200 rounded-xl inline-block"
          >
            <QRCodeSVG value={activeQR.token} size={200} />
          </div>

          <p className="text-xs text-gray-500">
            Token: <code className="bg-gray-100 px-1 rounded">{activeQR.token.slice(0, 8)}…</code>
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
            >
              🖨 {t.download} para imprimir
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmQR(activeQR)
                setActivatingTo(false)
              }}
              className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg"
            >
              Retirar código QR
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <p className="text-sm text-gray-500">Esta misión no tiene un código QR activo.</p>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generateQR.isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-60"
          >
            {generateQR.isPending ? t.loading : `${t.generate} código QR`}
          </button>
        </div>
      )}

      {/* Inactive QRs history */}
      {allQRs.filter((q) => !q.is_active).length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Códigos anteriores (inactivos)</h4>
          <div className="flex flex-col gap-2">
            {allQRs
              .filter((q) => !q.is_active)
              .map((qr) => (
                <div
                  key={qr.id}
                  className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-500"
                >
                  <span>{qr.token.slice(0, 12)}…</span>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded text-xs font-medium',
                      'bg-gray-100 text-gray-400'
                    )}
                  >
                    Inactivo
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmQR}
        title="Retirar código QR"
        message={t.deactivateQRConfirm}
        confirmLabel={t.deactivate}
        onConfirm={handleToggle}
        onCancel={() => setConfirmQR(null)}
        loading={toggleQR.isPending}
      />
    </div>
  )
}
