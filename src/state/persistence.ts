import { seededPlan } from '../data/scenarios'
import type { ExportDocument, PersistedState, RelayPlan, ScenarioId } from '../types'

export const STORAGE_KEY = 'asterism-console-state-v1'
const scenarioIds: ScenarioId[] = ['lunar', 'mars', 'storm']

export function defaultState(): PersistedState {
  return {
    version: 1,
    activeScenario: 'lunar',
    plans: { lunar: seededPlan('lunar'), mars: seededPlan('mars'), storm: seededPlan('storm') },
    baselines: {},
  }
}

function isPlan(value: unknown): value is RelayPlan {
  if (!value || typeof value !== 'object') return false
  const plan = value as RelayPlan
  const kinds = ['body', 'surface', 'relay', 'spacecraft', 'station']
  const bodies = ['earth', 'moon', 'mars', 'deep-space']
  return scenarioIds.includes(plan.scenarioId) && Array.isArray(plan.assets) && plan.assets.every((asset) =>
    asset && typeof asset.id === 'string' && asset.id.length > 0 && typeof asset.name === 'string' && asset.name.length > 0 && typeof asset.role === 'string' &&
    kinds.includes(asset.kind) && bodies.includes(asset.body) && asset.base && Number.isFinite(asset.base.x) && Number.isFinite(asset.base.y) &&
    Number.isFinite(asset.orbitRadius) && asset.orbitRadius >= 0 && Number.isFinite(asset.periodHours) && asset.periodHours > 0 &&
    Number.isFinite(asset.power) && asset.power >= 0 && asset.power <= 100 && Number.isFinite(asset.phase) && asset.phase >= 0 && asset.phase < 360 &&
    Number.isFinite(asset.health) && asset.health >= 0 && asset.health <= 1 && typeof asset.enabled === 'boolean'
  ) && plan.preferredRoutes !== null && typeof plan.preferredRoutes === 'object' && Object.entries(plan.preferredRoutes).every(([from, to]) => typeof from === 'string' && typeof to === 'string')
}

export function validateImport(value: unknown): ExportDocument {
  if (!value || typeof value !== 'object') throw new Error('Import must contain a JSON object.')
  const document = value as ExportDocument
  if (document.format !== 'asterism-relay-plan') throw new Error('This file is not an Asterism relay plan.')
  if (document.version !== 1) throw new Error(`Unsupported plan version: ${String(document.version)}.`)
  if (!scenarioIds.includes(document.scenarioId)) throw new Error('The plan references an unknown scenario.')
  if (!isPlan(document.plan) || document.plan.scenarioId !== document.scenarioId) throw new Error('The relay plan structure is incomplete or invalid.')
  if (!document.plan.assets.some((asset) => asset.kind === 'station') || !document.plan.assets.some((asset) => asset.critical)) throw new Error('The plan is missing required mission assets.')
  return document
}

export function loadPersistedState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState()
    const parsed = JSON.parse(raw) as PersistedState
    if (parsed.version !== 1 || !scenarioIds.includes(parsed.activeScenario) || !scenarioIds.every((id) => isPlan(parsed.plans?.[id]))) return defaultState()
    return parsed
  } catch {
    return defaultState()
  }
}

export function savePersistedState(state: PersistedState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function makeExport(state: PersistedState, id: ScenarioId): ExportDocument {
  return {
    format: 'asterism-relay-plan',
    version: 1,
    exportedAt: new Date().toISOString(),
    scenarioId: id,
    plan: state.plans[id],
    baseline: state.baselines[id],
  }
}
