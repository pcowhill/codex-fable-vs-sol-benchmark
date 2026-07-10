import type { Asset, Scenario, ScenarioId } from '../types'

const body = (id: 'earth' | 'moon' | 'mars', name: string, x: number, y: number): Asset => ({
  id,
  name,
  kind: 'body',
  role: `${name} reference body`,
  body: id,
  base: { x, y },
  orbitRadius: 0,
  periodHours: 24,
  phase: 0,
  power: 0,
  health: 1,
  enabled: true,
})

export const scenarios: Record<ScenarioId, Scenario> = {
  lunar: {
    id: 'lunar',
    code: 'LSP-27',
    name: 'Lunar South Pole Resupply',
    subtitle: 'Cargo descent / polar surface continuity',
    startIso: '2037-10-14T06:00:00.000Z',
    objective: 'Maintain a continuous command path to Shackleton Base through descent and surface handover.',
    priority: 'Crew safety · 99.0% command availability',
    environment: 'Nominal cislunar environment; terrain masking at the lunar south pole.',
    interference: 0.08,
    accent: '#55d5c5',
    assets: [
      body('earth', 'Earth', 150, 276),
      body('moon', 'Moon', 668, 278),
      { id: 'dsn-atlas', name: 'Atlas DSN', kind: 'station', role: 'Primary Earth uplink', body: 'earth', base: { x: 150, y: 276 }, orbitRadius: 47, periodHours: 24, phase: 212, power: 92, health: 0.99, enabled: true },
      { id: 'selene-1', name: 'SELENE–1', kind: 'relay', role: 'Lunar polar relay', body: 'moon', base: { x: 668, y: 278 }, orbitRadius: 96, periodHours: 8.2, phase: 18, power: 64, health: 0.96, enabled: true },
      { id: 'selene-2', name: 'SELENE–2', kind: 'relay', role: 'Lunar polar relay', body: 'moon', base: { x: 668, y: 278 }, orbitRadius: 128, periodHours: 11.6, phase: 174, power: 56, health: 0.91, enabled: true },
      { id: 'shackleton', name: 'Shackleton Base', kind: 'surface', role: 'Mission-critical surface installation', body: 'moon', base: { x: 668, y: 278 }, orbitRadius: 39, periodHours: 672, phase: 100, power: 34, health: 0.98, enabled: true, critical: true },
      { id: 'kestrel', name: 'Kestrel Lander', kind: 'spacecraft', role: 'Autonomous cargo descent vehicle', body: 'moon', base: { x: 668, y: 278 }, orbitRadius: 176, periodHours: 17, phase: 305, power: 47, health: 0.97, enabled: true, critical: true },
    ],
    events: [
      { id: 'l-approach', hour: 2.4, title: 'Kestrel approach acquisition', detail: 'Descent carrier enters lunar relay envelope.', severity: 'nominal', targetId: 'kestrel' },
      { id: 'l-gap', hour: 7.75, title: 'Polar line-of-sight gap', detail: 'Terrain mask isolates Shackleton Base for a predicted 31 minutes.', severity: 'critical', targetId: 'shackleton' },
      { id: 'l-handoff', hour: 11.2, title: 'SELENE handoff', detail: 'Command path transfers from SELENE–1 to SELENE–2.', severity: 'advisory', targetId: 'selene-2' },
      { id: 'l-touchdown', hour: 16.6, title: 'Surface handover', detail: 'Kestrel transitions from descent telemetry to surface relay.', severity: 'warning', targetId: 'kestrel' },
      { id: 'l-recover', hour: 20.1, title: 'Full polar coverage restored', detail: 'Dual-relay geometry returns to nominal margin.', severity: 'nominal', targetId: 'shackleton' },
    ],
  },
  mars: {
    id: 'mars',
    code: 'MTH-04',
    name: 'Mars Transfer Handoff',
    subtitle: 'Interplanetary cruise / carrier migration',
    startIso: '2038-02-03T18:30:00.000Z',
    objective: 'Move Daedalus command authority from Earth direct to the Ares relay chain without packet loss.',
    priority: 'Navigation telemetry · latency stability',
    environment: 'Long-range geometry with a narrow antenna handoff window.',
    interference: 0.13,
    accent: '#e3a36a',
    assets: [
      body('earth', 'Earth', 132, 334),
      body('mars', 'Mars', 770, 190),
      { id: 'dsn-pioneer', name: 'Pioneer DSN', kind: 'station', role: 'Earth cruise uplink', body: 'earth', base: { x: 132, y: 334 }, orbitRadius: 49, periodHours: 24, phase: 48, power: 96, health: 0.99, enabled: true },
      { id: 'hermes', name: 'HERMES', kind: 'relay', role: 'Deep-space transfer relay', body: 'deep-space', base: { x: 392, y: 240 }, orbitRadius: 55, periodHours: 18, phase: 63, power: 78, health: 0.93, enabled: true },
      { id: 'ares-1', name: 'ARES–1', kind: 'relay', role: 'Mars capture relay', body: 'mars', base: { x: 770, y: 190 }, orbitRadius: 104, periodHours: 9.4, phase: 228, power: 68, health: 0.95, enabled: true },
      { id: 'ares-2', name: 'ARES–2', kind: 'relay', role: 'Mars contingency relay', body: 'mars', base: { x: 770, y: 190 }, orbitRadius: 145, periodHours: 15.7, phase: 22, power: 52, health: 0.88, enabled: true },
      { id: 'daedalus', name: 'Daedalus', kind: 'spacecraft', role: 'Crewed Mars transfer vehicle', body: 'deep-space', base: { x: 535, y: 306 }, orbitRadius: 34, periodHours: 13, phase: 10, power: 72, health: 0.97, enabled: true, critical: true },
      { id: 'arcadia', name: 'Arcadia Station', kind: 'surface', role: 'Mars surface science node', body: 'mars', base: { x: 770, y: 190 }, orbitRadius: 36, periodHours: 24.6, phase: 154, power: 38, health: 0.94, enabled: true, critical: true },
    ],
    events: [
      { id: 'm-long', hour: 3.1, title: 'Long-haul margin narrows', detail: 'Earth direct carrier falls below 4 dB margin.', severity: 'warning', targetId: 'daedalus' },
      { id: 'm-handoff', hour: 8.4, title: 'HERMES handoff window', detail: 'Preferred command route moves to deep-space relay.', severity: 'critical', targetId: 'hermes' },
      { id: 'm-track', hour: 12.7, title: 'ARES–1 acquisition', detail: 'Mars relay establishes navigation carrier lock.', severity: 'nominal', targetId: 'ares-1' },
      { id: 'm-occult', hour: 17.9, title: 'Mars limb occultation', detail: 'Arcadia path requires dual-hop relay.', severity: 'warning', targetId: 'arcadia' },
      { id: 'm-stable', hour: 22.3, title: 'Carrier migration complete', detail: 'All command traffic stable on Ares relay chain.', severity: 'nominal', targetId: 'daedalus' },
    ],
  },
  storm: {
    id: 'storm',
    code: 'SSC-11',
    name: 'Solar Storm Contingency',
    subtitle: 'Radiation event / degraded network posture',
    startIso: '2037-06-22T02:00:00.000Z',
    objective: 'Preserve minimum command coverage while reducing relay exposure during the proton event.',
    priority: 'Fault tolerance · relay energy reserve',
    environment: 'Severe solar radio burst; relay health and link noise vary through the window.',
    interference: 0.31,
    accent: '#f0c85a',
    assets: [
      body('earth', 'Earth', 154, 298),
      body('moon', 'Moon', 654, 296),
      { id: 'dsn-borealis', name: 'Borealis DSN', kind: 'station', role: 'Hardened Earth uplink', body: 'earth', base: { x: 154, y: 298 }, orbitRadius: 48, periodHours: 24, phase: 280, power: 88, health: 0.99, enabled: true },
      { id: 'shield-1', name: 'SHIELD–1', kind: 'relay', role: 'Radiation-hardened L1 relay', body: 'deep-space', base: { x: 390, y: 246 }, orbitRadius: 46, periodHours: 14, phase: 108, power: 74, health: 0.78, enabled: true },
      { id: 'selene-x', name: 'SELENE–X', kind: 'relay', role: 'Lunar contingency relay', body: 'moon', base: { x: 654, y: 296 }, orbitRadius: 118, periodHours: 10.4, phase: 46, power: 58, health: 0.67, enabled: true },
      { id: 'luna-array', name: 'Farside Array', kind: 'surface', role: 'Low-frequency surface observatory', body: 'moon', base: { x: 654, y: 296 }, orbitRadius: 38, periodHours: 672, phase: 208, power: 29, health: 0.91, enabled: true, critical: true },
      { id: 'sentinel', name: 'Sentinel Probe', kind: 'spacecraft', role: 'Solar particle monitor', body: 'deep-space', base: { x: 470, y: 122 }, orbitRadius: 58, periodHours: 20, phase: 330, power: 49, health: 0.72, enabled: true, critical: true },
      { id: 'haven', name: 'Haven Orbiter', kind: 'relay', role: 'Crew emergency store-and-forward', body: 'earth', base: { x: 154, y: 298 }, orbitRadius: 121, periodHours: 6.7, phase: 160, power: 62, health: 0.83, enabled: true },
    ],
    events: [
      { id: 's-watch', hour: 1.2, title: 'Storm watch upgraded', detail: 'Radio flux exceeds contingency planning threshold.', severity: 'warning', targetId: 'sentinel' },
      { id: 's-impact', hour: 5.6, title: 'Particle front arrival', detail: 'Network-wide interference increases sharply.', severity: 'critical', targetId: 'shield-1' },
      { id: 's-degrade', hour: 9.3, title: 'SELENE–X degraded', detail: 'Relay amplifier temperature triggers reduced-power mode.', severity: 'critical', targetId: 'selene-x' },
      { id: 's-blackout', hour: 13.8, title: 'Farside command blackout', detail: 'Surface array loses its primary command route.', severity: 'critical', targetId: 'luna-array' },
      { id: 's-recovery', hour: 19.4, title: 'Radio noise receding', detail: 'Contingency routes begin returning to service.', severity: 'advisory', targetId: 'shield-1' },
    ],
  },
}

export const scenarioList = Object.values(scenarios)

export function seededPlan(id: ScenarioId) {
  return {
    scenarioId: id,
    assets: scenarios[id].assets.map((asset) => ({ ...asset, base: { ...asset.base } })),
    preferredRoutes: {},
  }
}
