import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

beforeEach(() => {
  localStorage.clear()
  vi.stubGlobal('confirm', vi.fn(() => true))
  vi.stubGlobal('structuredClone', (value: unknown) => JSON.parse(JSON.stringify(value)))
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})
