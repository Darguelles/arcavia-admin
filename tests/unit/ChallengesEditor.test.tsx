import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastProvider } from '../../src/components/Toast'
import { ChallengesEditor } from '../../src/features/missions/ChallengesEditor'

function Wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <MemoryRouter>
      <QueryClientProvider client={qc}>
        <ToastProvider>{children}</ToastProvider>
      </QueryClientProvider>
    </MemoryRouter>
  )
}

describe('ChallengesEditor (per waypoint)', () => {
  it('shows empty state when the waypoint has no questions', async () => {
    render(
      <Wrapper>
        <ChallengesEditor waypointId="wp-1" />
      </Wrapper>
    )
    await waitFor(() => {
      expect(screen.getByText(/Agrega al menos una para activarlo/)).toBeInTheDocument()
    })
  })

  it('adds a question when "Agregar pregunta" is clicked', async () => {
    const user = userEvent.setup()
    render(
      <Wrapper>
        <ChallengesEditor waypointId="wp-1" />
      </Wrapper>
    )
    await waitFor(() => screen.getByText('Agregar pregunta'))
    await user.click(screen.getByText('Agregar pregunta'))
    expect(screen.getByText('Pregunta 1')).toBeInTheDocument()
  })

  it('decouples fun fact from the riddle: "Dato curioso" is always visible, "Palabra clave" only when the riddle box is checked', async () => {
    const user = userEvent.setup()
    render(
      <Wrapper>
        <ChallengesEditor waypointId="wp-1" />
      </Wrapper>
    )
    await waitFor(() => screen.getByText('Agregar pregunta'))
    await user.click(screen.getByText('Agregar pregunta'))

    // Any question can carry a fun fact — no riddle required.
    expect(screen.getByText('Dato curioso')).toBeInTheDocument()
    expect(screen.queryByText('Palabra clave')).not.toBeInTheDocument()

    await user.click(screen.getByLabelText(/Es un acertijo/))
    expect(screen.getByText('Palabra clave')).toBeInTheDocument()
  })

  it('shows at least 2 option fields for a new question', async () => {
    const user = userEvent.setup()
    render(
      <Wrapper>
        <ChallengesEditor waypointId="wp-1" />
      </Wrapper>
    )
    await waitFor(() => screen.getByText('Agregar pregunta'))
    await user.click(screen.getByText('Agregar pregunta'))

    const optionInputs = screen.getAllByPlaceholderText(/Texto de la opción/)
    expect(optionInputs.length).toBeGreaterThanOrEqual(2)
  })

  it('shows validation message if no option is marked correct', async () => {
    const user = userEvent.setup()
    render(
      <Wrapper>
        <ChallengesEditor waypointId="wp-1" />
      </Wrapper>
    )
    await waitFor(() => screen.getByText('Agregar pregunta'))
    await user.click(screen.getByText('Agregar pregunta'))

    await user.type(
      screen.getByLabelText(/Enunciado de la pregunta/i),
      '¿Cuál es la capital de Perú?'
    )
    const optionInputs = screen.getAllByPlaceholderText(/Texto de la opción/)
    await user.type(optionInputs[0]!, 'Lima')
    await user.type(optionInputs[1]!, 'Cusco')

    await user.click(screen.getByRole('button', { name: /^guardar$/i }))

    await waitFor(() => {
      expect(screen.getByText(/marcar una opción como correcta/i)).toBeInTheDocument()
    })
  })

  it('each question card has a remove control', async () => {
    const user = userEvent.setup()
    render(
      <Wrapper>
        <ChallengesEditor waypointId="wp-1" />
      </Wrapper>
    )
    await waitFor(() => screen.getByText('Agregar pregunta'))
    await user.click(screen.getByText('Agregar pregunta'))
    await user.click(screen.getByText('Agregar pregunta'))

    // Two question cards → two card-level remove buttons
    const removeButtons = screen.getAllByRole('button', { name: /^Eliminar \d+$/ })
    expect(removeButtons.length).toBeGreaterThanOrEqual(2)
  })
})
