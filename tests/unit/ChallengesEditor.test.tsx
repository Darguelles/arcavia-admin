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

describe('ChallengesEditor', () => {
  it('shows empty state when mission has no questions', async () => {
    render(
      <Wrapper>
        <ChallengesEditor missionId="mission-1" challengeCount={0} />
      </Wrapper>
    )
    await waitFor(() => {
      expect(screen.getByText(/Agrega al menos una para activarla/)).toBeInTheDocument()
    })
  })

  it('adds a question when "Agregar pregunta" is clicked', async () => {
    const user = userEvent.setup()
    render(
      <Wrapper>
        <ChallengesEditor missionId="mission-1" challengeCount={0} />
      </Wrapper>
    )
    await waitFor(() => screen.getByText('+ Agregar pregunta'))
    await user.click(screen.getByText('+ Agregar pregunta'))
    expect(screen.getByText('Pregunta 1')).toBeInTheDocument()
  })

  it('shows at least 2 option fields for a new question', async () => {
    const user = userEvent.setup()
    render(
      <Wrapper>
        <ChallengesEditor missionId="mission-1" challengeCount={0} />
      </Wrapper>
    )
    await waitFor(() => screen.getByText('+ Agregar pregunta'))
    await user.click(screen.getByText('+ Agregar pregunta'))

    const optionInputs = screen.getAllByPlaceholderText(/Texto de la opción/)
    expect(optionInputs.length).toBeGreaterThanOrEqual(2)
  })

  it('shows validation message if no option is marked correct', async () => {
    const user = userEvent.setup()
    render(
      <Wrapper>
        <ChallengesEditor missionId="mission-1" challengeCount={0} />
      </Wrapper>
    )
    await waitFor(() => screen.getByText('+ Agregar pregunta'))
    await user.click(screen.getByText('+ Agregar pregunta'))

    // Fill prompt using the label text (htmlFor connected)
    await user.type(
      screen.getByLabelText(/Enunciado de la pregunta/i),
      '¿Cuál es la capital de Perú?'
    )

    // Fill options text (required for form to be valid enough to attempt submit)
    const optionInputs = screen.getAllByPlaceholderText(/Texto de la opción/)
    await user.type(optionInputs[0]!, 'Lima')
    await user.type(optionInputs[1]!, 'Cusco')

    // Submit without marking correct answer
    await user.click(screen.getByRole('button', { name: /^guardar$/i }))

    await waitFor(() => {
      expect(screen.getByText(/marcar una opción como correcta/i)).toBeInTheDocument()
    })
  })

  it('allows removing a question (canRemove only if >1)', async () => {
    const user = userEvent.setup()
    render(
      <Wrapper>
        <ChallengesEditor missionId="mission-1" challengeCount={0} />
      </Wrapper>
    )
    await waitFor(() => screen.getByText('+ Agregar pregunta'))
    await user.click(screen.getByText('+ Agregar pregunta'))
    await user.click(screen.getByText('+ Agregar pregunta'))

    // Two questions → both should have Remove buttons
    const removeButtons = screen.getAllByText('Eliminar')
    expect(removeButtons.length).toBeGreaterThanOrEqual(2)
  })
})
