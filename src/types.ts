export type ScenarioId = 'lunar' | 'mars' | 'storm'
export type BodyId = 'earth' | 'moon' | 'mars' | 'deep-space'
export type AssetKind = 'body' | 'surface' | 'relay' | 'spacecraft' | 'station'
export type Severity = 'nominal' | 'advisory' | 'warning' | 'critical'

export interface Position {
  x: number
  y: number
}

export interface Asset {
  id: string
  name: string
  kind: AssetKind
  role: string
  body: BodyId
  base: Position
  orbitRadius: number
  periodHours: number
  phase: number
  power: number
  health: number
  enabled: boolean
  critical?: boolean
  userCreated?: boolean
}

export interface MissionEvent {
  id: string
  hour: number
  title: string
  detail: string
  severity: Severity
  targetId?: string
}

export interface Scenario {
  id: ScenarioId
  code: string
  name: string
  subtitle: string
  startIso: string
  objective: string
  priority: string
  environment: string
  interference: number
  accent: string
  assets: Asset[]
  events: MissionEvent[]
}

export interface RelayPlan {
  scenarioId: ScenarioId
  assets: Asset[]
  preferredRoutes: Record<string, string>
}

export interface SimulatedAsset extends Asset {
  position: Position
}

export interface SimulatedLink {
  id: string
  fromId: string
  toId: string
  available: boolean
  preferred: boolean
  relayed: boolean
  quality: number
  signalDb: number
  latencyMs: number
  bandwidthMbps: number
  interference: number
  distance: number
  reason: string
}

export interface SimulationFrame {
  assets: SimulatedAsset[]
  links: SimulatedLink[]
  interference: number
}

export interface PlanMetrics {
  coverage: number
  latency: number
  reliability: number
  energy: number
  gaps: number
  relays: number
}

export interface BaselineSnapshot {
  savedAt: string
  metrics: PlanMetrics
  plan: RelayPlan
}

export interface PersistedState {
  version: 1
  activeScenario: ScenarioId
  plans: Record<ScenarioId, RelayPlan>
  baselines: Partial<Record<ScenarioId, BaselineSnapshot>>
}

export interface ExportDocument {
  format: 'asterism-relay-plan'
  version: 1
  exportedAt: string
  scenarioId: ScenarioId
  plan: RelayPlan
  baseline?: BaselineSnapshot
}
