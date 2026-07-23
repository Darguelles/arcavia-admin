import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastProvider } from '../../src/components/Toast'
import { WaypointEditor } from '../../src/features/missions/WaypointEditor'
import { t } from '../../src/lib/i18n'

function Wrapper({ initialEntry }: { initialEntry: string }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <MemoryRouter initialEntries={[initialEntry]}>
      <QueryClientProvider client={qc}>
        <ToastProvider>
          <Routes>
            <Route path="/admin/missions/:missionId/waypoints/new" element={<WaypointEditor />} />
            <Route
              path="/admin/missions/:missionId/waypoints/:waypointId"
              element={<WaypointEditor />}
            />
          </Routes>
        </ToastProvider>
      </QueryClientProvider>
    </MemoryRouter>
  )
}

describe('WaypointEditor — geolocation check-in config', () => {
  it('geofence/dwell fields are always shown', async () => {
    render(<Wrapper initialEntry="/admin/missions/mission-1/waypoints/new?phaseId=phase-1" />)
    await waitFor(() => {
      expect(screen.getByText(t.requiredAccuracy)).toBeInTheDocument()
      expect(screen.getByText(t.dwellSeconds)).toBeInTheDocument()
      expect(screen.getByText(t.minFixes)).toBeInTheDocument()
    })
  })

  it('QR section is hidden until "Requerir escaneo de código QR" is checked', async () => {
    const user = userEvent.setup()
    render(<Wrapper initialEntry="/admin/missions/mission-1/waypoints/wp-1" />)
    await waitFor(() => expect(screen.getByLabelText(t.requireQr)).toBeInTheDocument())
    expect(screen.queryByText(t.qrTab)).not.toBeInTheDocument()

    await user.click(screen.getByLabelText(t.requireQr))
    await waitFor(() => expect(screen.getByText(t.qrTab)).toBeInTheDocument())
  })

  it('on-site keyword fields appear only when "Requerir palabra clave" is checked', async () => {
    const user = userEvent.setup()
    render(<Wrapper initialEntry="/admin/missions/mission-1/waypoints/wp-1" />)
    await waitFor(() => expect(screen.getByLabelText(t.requireKeyword)).toBeInTheDocument())
    expect(screen.queryByText(t.onsiteKeywordPrompt)).not.toBeInTheDocument()

    await user.click(screen.getByLabelText(t.requireKeyword))
    await waitFor(() => {
      expect(screen.getByText(t.onsiteKeywordPrompt)).toBeInTheDocument()
      expect(screen.getByText(t.onsiteKeywordAnswer)).toBeInTheDocument()
    })
  })

  it('requires both a prompt and an answer when the keyword factor is on', async () => {
    const user = userEvent.setup()
    render(<Wrapper initialEntry="/admin/missions/mission-1/waypoints/wp-1" />)
    await waitFor(() => expect(screen.getByLabelText(t.requireKeyword)).toBeInTheDocument())
    await user.click(screen.getByLabelText(t.requireKeyword))

    await waitFor(() => screen.getByRole('button', { name: t.save }))
    await user.click(screen.getByRole('button', { name: t.save }))

    await waitFor(() => {
      expect(screen.getByText(/necesita una pregunta y una respuesta/i)).toBeInTheDocument()
    })
  })
})
