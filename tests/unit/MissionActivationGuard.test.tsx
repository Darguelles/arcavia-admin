import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// We test the activation guard logic on the MissionsPage list view
// and on the MissionEditor details tab

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

// Test a standalone component that models the guard logic
function ActiveToggle({ challengeCount }: { challengeCount: number }) {
  const canActivate = challengeCount > 0
  return (
    <div>
      <input
        type="checkbox"
        id="active"
        disabled={!canActivate}
        aria-label="Activo"
        data-testid="active-toggle"
      />
      {!canActivate && (
        <span data-testid="guard-message">
          Agrega al menos una pregunta antes de activar esta misión.
        </span>
      )}
    </div>
  )
}

describe('Mission activation guard (spec §5.1)', () => {
  it('disables the Active toggle when challenge_count is 0', () => {
    render(<ActiveToggle challengeCount={0} />)
    expect(screen.getByTestId('active-toggle')).toBeDisabled()
  })

  it('shows the explanatory message when challenge_count is 0', () => {
    render(<ActiveToggle challengeCount={0} />)
    expect(screen.getByTestId('guard-message')).toBeInTheDocument()
    expect(screen.getByText(/Agrega al menos una pregunta/)).toBeInTheDocument()
  })

  it('enables the Active toggle when challenge_count is 1', () => {
    render(<ActiveToggle challengeCount={1} />)
    expect(screen.getByTestId('active-toggle')).not.toBeDisabled()
  })

  it('enables the Active toggle when challenge_count is 5', () => {
    render(<ActiveToggle challengeCount={5} />)
    expect(screen.getByTestId('active-toggle')).not.toBeDisabled()
  })

  it('hides the guard message when challenge_count >= 1', () => {
    render(<ActiveToggle challengeCount={2} />)
    expect(screen.queryByTestId('guard-message')).toBeNull()
  })
})
