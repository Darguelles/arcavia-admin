import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'
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

describe('WaypointEditor — single-step create', () => {
  const CREATE_ENTRY = '/admin/missions/mission-1/waypoints/new?phaseId=phase-1'
  // waypointSchema requires a UUID category_id, so override the mock's 'cat-1'.
  const CAT_ID = '11111111-1111-4111-8111-111111111111'
  const categoryHandler = http.get(
    'http://localhost:8000/api/v1/admin/missions/:id/categories',
    () =>
      HttpResponse.json([
        {
          id: CAT_ID,
          mission_id: 'mission-1',
          name: 'Cultural',
          threshold_pct: 60,
          total_points: 0,
          order_index: 0,
        },
      ])
  )

  it('lets the operator add questions inline on the create screen', async () => {
    const user = userEvent.setup()
    render(<Wrapper initialEntry={CREATE_ENTRY} />)
    await waitFor(() => expect(screen.getByText(t.questionsHint)).toBeInTheDocument())
    expect(screen.getByText(t.noQuestionsYet)).toBeInTheDocument()

    await user.click(screen.getByText(`+ ${t.addQuestion}`))
    expect(screen.getByText(`${t.question} 1`)).toBeInTheDocument()
  })

  it('blocks activating a new point that has no question, and creates nothing', async () => {
    const user = userEvent.setup()
    let created = 0
    server.use(
      categoryHandler,
      http.post('http://localhost:8000/api/v1/admin/phases/:id/waypoints', async ({ request }) => {
        created++
        const body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ id: 'new-waypoint-1', ...body }, { status: 201 })
      })
    )
    render(<Wrapper initialEntry={CREATE_ENTRY} />)
    await waitFor(() => screen.getByLabelText(/Nombre/))

    await user.type(screen.getByLabelText(/Nombre/), 'Plaza Mayor')
    await waitFor(() => screen.getByRole('option', { name: 'Cultural' }))
    await user.selectOptions(screen.getByLabelText(/Categoría/), CAT_ID)
    await user.click(screen.getByLabelText(t.active))
    await user.click(screen.getByRole('button', { name: t.create }))

    await waitFor(() =>
      expect(
        screen
          .getAllByRole('alert')
          .some((el) => /Agrega al menos una pregunta/i.test(el.textContent ?? ''))
      ).toBe(true)
    )
    // The guard fired, so nothing was created and we're still on the create screen.
    expect(created).toBe(0)
    expect(screen.getByText(`+ ${t.addQuestion}`)).toBeInTheDocument()
  })

  it('creates the point, its question, and activates it in a single save', async () => {
    const user = userEvent.setup()
    const questions: unknown[] = []
    let activated = false
    server.use(
      categoryHandler,
      http.post(
        'http://localhost:8000/api/v1/admin/waypoints/:id/challenges',
        async ({ request, params }) => {
          const body = (await request.json()) as Record<string, unknown>
          questions.push(body)
          return HttpResponse.json(
            { id: `ch-${questions.length}`, waypoint_id: params['id'], ...body },
            { status: 201 }
          )
        }
      ),
      http.patch(
        'http://localhost:8000/api/v1/admin/waypoints/:id',
        async ({ request, params }) => {
          const body = (await request.json()) as Record<string, unknown>
          if (body['is_active'] === true) activated = true
          return HttpResponse.json({ id: params['id'], ...body })
        }
      )
    )
    render(<Wrapper initialEntry={CREATE_ENTRY} />)
    await waitFor(() => screen.getByLabelText(/Nombre/))

    await user.type(screen.getByLabelText(/Nombre/), 'Plaza Mayor')
    await waitFor(() => screen.getByRole('option', { name: 'Cultural' }))
    await user.selectOptions(screen.getByLabelText(/Categoría/), CAT_ID)

    await user.click(screen.getByText(`+ ${t.addQuestion}`))
    await user.type(screen.getByLabelText(/Enunciado de la pregunta/i), '¿Año de fundación?')
    const options = screen.getAllByPlaceholderText(/Texto de la opción/)
    await user.type(options[0]!, '1535')
    await user.type(options[1]!, '1542')
    await user.click(screen.getByLabelText('Opción 1 es correcta'))

    await user.click(screen.getByLabelText(t.active))
    await user.click(screen.getByRole('button', { name: t.create }))

    await waitFor(() => expect(questions).toHaveLength(1))
    await waitFor(() => expect(activated).toBe(true))
  })
})
