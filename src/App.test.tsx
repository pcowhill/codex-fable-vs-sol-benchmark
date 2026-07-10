import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('Asterism planning workflows', () => {
  it('switches between meaningfully different scenarios', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /Mars Transfer Handoff/i }))
    expect(screen.getByText(/Move Daedalus command authority/i)).toBeInTheDocument()
    expect(screen.getByText(/MTH-04 \/ Mars Transfer Handoff/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Solar Storm Contingency/i }))
    expect(screen.getByText(/Preserve minimum command coverage/i)).toBeInTheDocument()
  })

  it('adds and edits an operator relay from the visual plan controls', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /ADD RELAY/i }))
    const dialog = screen.getByRole('dialog', { name: /Deploy communications relay/i })
    const name = within(dialog).getByLabelText(/Relay designation/i)
    await user.clear(name)
    await user.type(name, 'POLARIS TEST')
    await user.click(within(dialog).getByRole('button', { name: /Deploy relay/i }))
    expect(screen.getByRole('heading', { name: 'POLARIS TEST' })).toBeInTheDocument()
    const power = screen.getByRole('slider', { name: 'Transmission power' })
    fireEvent.change(power, { target: { value: '91' } })
    expect(power).toHaveValue('91')
    const enabled = screen.getByRole('checkbox', { name: /Relay enabled/i })
    await user.click(enabled)
    expect(enabled).not.toBeChecked()
  })

  it('captures a baseline and presents comparison deltas after plan edits', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /COMPARE/i }))
    await user.click(screen.getByRole('button', { name: /Save current baseline/i }))
    await user.click(screen.getByRole('button', { name: /Close comparison/i }))
    await user.click(screen.getByRole('button', { name: /ADD RELAY/i }))
    await user.click(screen.getByRole('button', { name: /Deploy relay/i }))
    await user.click(screen.getByRole('button', { name: /COMPARE/i }))
    expect(screen.getByText(/Current plan \/ saved baseline/i)).toBeInTheDocument()
    expect(screen.getByText(/metrics improved/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Replace baseline/i })).toBeInTheDocument()
  })
})
