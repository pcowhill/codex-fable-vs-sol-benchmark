import { describe, expect, it, vi } from 'vitest'
import { scenarios, seededPlan } from '../data/scenarios'
import { calculateMetrics, createRelay, interferenceAt, positionAt, simulateFrame } from './engine'

describe('deterministic simulation', () => {
  it('returns identical geometry and links for the same scenario timestamp', () => {
    const plan = seededPlan('lunar')
    const first = simulateFrame(scenarios.lunar, plan, 7.75)
    const second = simulateFrame(scenarios.lunar, plan, 7.75)
    expect(second).toEqual(first)
    expect(first.assets.find((asset) => asset.id === 'selene-1')?.position).toEqual(positionAt(plan.assets.find((asset) => asset.id === 'selene-1')!, 7.75))
  })

  it('changes environmental interference meaningfully over mission time', () => {
    expect(interferenceAt(scenarios.storm, 10)).toBeGreaterThan(interferenceAt(scenarios.storm, 23))
    expect(interferenceAt(scenarios.storm, 10)).toBe(interferenceAt(scenarios.storm, 10))
  })
})

describe('route and coverage metrics', () => {
  it('responds to relay deployment and power with consistent tradeoffs', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1234)
    const baseline = seededPlan('lunar')
    const relay = createRelay(scenarios.lunar, 'VANTAGE–3', 'moon', 225, 88)
    const modified = { ...baseline, assets: [...baseline.assets, relay] }
    const before = calculateMetrics(scenarios.lunar, baseline)
    const after = calculateMetrics(scenarios.lunar, modified)
    expect(after.relays).toBe(before.relays + 1)
    expect(after.energy).toBeGreaterThan(before.energy)
    expect(after.coverage).toBeGreaterThanOrEqual(before.coverage)
  })

  it('degrades coverage when every seeded relay is disabled', () => {
    const baseline = seededPlan('mars')
    const disabled = { ...baseline, assets: baseline.assets.map((asset) => asset.kind === 'relay' ? { ...asset, enabled: false } : asset) }
    expect(calculateMetrics(scenarios.mars, disabled).coverage).toBeLessThan(calculateMetrics(scenarios.mars, baseline).coverage)
  })
})
