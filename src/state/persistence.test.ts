import { describe, expect, it } from 'vitest'
import { seededPlan } from '../data/scenarios'
import { defaultState, makeExport, validateImport } from './persistence'

describe('import validation', () => {
  it('accepts a versioned document produced by the exporter', () => {
    const state = defaultState()
    const document = makeExport(state, 'lunar')
    expect(validateImport(document).plan.assets).toHaveLength(seededPlan('lunar').assets.length)
  })

  it('rejects malformed and incompatible documents with useful errors', () => {
    expect(() => validateImport({ version: 1 })).toThrow('not an Asterism')
    expect(() => validateImport({ format: 'asterism-relay-plan', version: 8, scenarioId: 'lunar', plan: seededPlan('lunar') })).toThrow('Unsupported plan version')
    expect(() => validateImport({ format: 'asterism-relay-plan', version: 1, scenarioId: 'lunar', plan: { scenarioId: 'lunar', assets: [], preferredRoutes: {} } })).toThrow('missing required mission assets')
  })
})
