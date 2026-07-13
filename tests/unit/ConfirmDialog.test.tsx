import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmDialog } from '../../src/components/ConfirmDialog'

describe('ConfirmDialog', () => {
  it('does not render when open=false', () => {
    render(
      <ConfirmDialog
        open={false}
        title="Confirm"
        message="Are you sure?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('renders title and message when open=true', () => {
    render(
      <ConfirmDialog
        open={true}
        title="Desactivar ciudad"
        message="Esta acción desactivará la ciudad."
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Desactivar ciudad')).toBeInTheDocument()
    expect(screen.getByText('Esta acción desactivará la ciudad.')).toBeInTheDocument()
  })

  it('calls onConfirm only after clicking confirm button', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    const onCancel = vi.fn()

    render(
      <ConfirmDialog
        open={true}
        title="Confirmar"
        message="¿Continuar?"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )

    expect(onConfirm).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Confirmar' }))
    expect(onConfirm).toHaveBeenCalledOnce()
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    const onCancel = vi.fn()

    render(
      <ConfirmDialog
        open={true}
        title="Confirmar"
        message="¿Continuar?"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )

    await user.click(screen.getByText('Cancelar'))
    expect(onCancel).toHaveBeenCalledOnce()
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('disables buttons when loading=true', () => {
    render(
      <ConfirmDialog
        open={true}
        title="Confirmar"
        message="¿Continuar?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        loading={true}
      />
    )
    expect(screen.getByText('Cargando…')).toBeDisabled()
    expect(screen.getByText('Cancelar')).toBeDisabled()
  })
})
