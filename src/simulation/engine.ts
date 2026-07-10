import type { Asset, PlanMetrics, Position, RelayPlan, Scenario, SimulatedAsset, SimulatedLink, SimulationFrame } from '../types'

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value))
const radians = (degrees: number) => (degrees * Math.PI) / 180
const distance = (a: Position, b: Position) => Math.hypot(a.x - b.x, a.y - b.y)

export function positionAt(asset: Asset, hour: number): Position {
  if (asset.kind === 'body') return asset.base
  const angle = radians(asset.phase + (hour / asset.periodHours) * 360)
  const radialPulse = asset.kind === 'spacecraft' ? 1 + Math.sin(hour * 0.41 + asset.phase) * 0.08 : 1
  return {
    x: asset.base.x + Math.cos(angle) * asset.orbitRadius * radialPulse,
    y: asset.base.y + Math.sin(angle) * asset.orbitRadius * 0.58 * radialPulse,
  }
}

export function interferenceAt(scenario: Scenario, hour: number) {
  const cycle = (Math.sin((hour / 24) * Math.PI * 2 - 0.7) + 1) / 2
  const stormSpike = scenario.id === 'storm' ? Math.exp(-Math.pow((hour - 10) / 4.2, 2)) * 0.36 : 0
  const occultation = scenario.id === 'mars' ? Math.exp(-Math.pow((hour - 17.9) / 2.3, 2)) * 0.13 : 0
  return clamp(scenario.interference + cycle * 0.09 + stormSpike + occultation, 0, 0.82)
}

function bodyOcclusion(a: SimulatedAsset, b: SimulatedAsset, assets: SimulatedAsset[]) {
  const bodies = assets.filter((asset) => asset.kind === 'body')
  return bodies.some((body) => {
    if (body.id === a.id || body.id === b.id) return false
    const ab = distance(a.position, b.position)
    const ap = distance(a.position, body.position)
    const bp = distance(b.position, body.position)
    const tolerance = body.id === 'earth' ? 45 : 30
    return Math.abs(ap + bp - ab) < tolerance && ap < ab && bp < ab
  })
}

function linkFor(a: SimulatedAsset, b: SimulatedAsset, all: SimulatedAsset[], scenario: Scenario, hour: number, plan: RelayPlan): SimulatedLink | null {
  if (a.kind === 'body' || b.kind === 'body' || !a.enabled || !b.enabled) return null
  const d = distance(a.position, b.position)
  const interference = interferenceAt(scenario, hour)
  const occluded = bodyOcclusion(a, b, all)
  const surfacePenalty = a.kind === 'surface' || b.kind === 'surface' ? 0.08 : 0
  const phaseNoise = (Math.sin(hour * 0.73 + a.phase * 0.05 + b.phase * 0.02) + 1) * 0.035
  const power = Math.sqrt(a.power * b.power) / 100
  const range = Math.max(0, 1 - d / 760)
  const health = Math.min(a.health, b.health)
  const preferred = plan.preferredRoutes[a.id] === b.id || plan.preferredRoutes[b.id] === a.id
  let quality = clamp(power * 0.48 + range * 0.56 + health * 0.22 - interference * 0.48 - surfacePenalty - phaseNoise + (preferred ? 0.08 : 0))
  if (occluded) quality *= 0.18
  const available = quality >= 0.35 && !occluded
  const id = [a.id, b.id].sort().join('::')
  return {
    id,
    fromId: a.id,
    toId: b.id,
    available,
    preferred,
    relayed: a.kind === 'relay' || b.kind === 'relay',
    quality,
    signalDb: -132 + quality * 72,
    latencyMs: d * 2.25 + (a.kind === 'relay' || b.kind === 'relay' ? 18 : 5),
    bandwidthMbps: Math.max(0, quality * quality * 128),
    interference,
    distance: d,
    reason: occluded ? 'Body occlusion' : available ? 'Carrier locked' : quality < 0.24 ? 'Below acquisition threshold' : 'Insufficient link margin',
  }
}

export function simulateFrame(scenario: Scenario, plan: RelayPlan, hour: number): SimulationFrame {
  const assets: SimulatedAsset[] = plan.assets.map((asset) => ({ ...asset, position: positionAt(asset, hour) }))
  const links: SimulatedLink[] = []
  const comms = assets.filter((asset) => asset.kind !== 'body')
  for (let i = 0; i < comms.length; i += 1) {
    for (let j = i + 1; j < comms.length; j += 1) {
      const link = linkFor(comms[i], comms[j], assets, scenario, hour, plan)
      if (link && (link.quality > 0.16 || link.preferred || comms[i].critical || comms[j].critical)) links.push(link)
    }
  }
  return { assets, links, interference: interferenceAt(scenario, hour) }
}

function shortestRoute(frame: SimulationFrame, startId: string) {
  const groundIds = frame.assets.filter((a) => a.kind === 'station' && a.body === 'earth').map((a) => a.id)
  const distances = new Map<string, number>([[startId, 0]])
  const reliability = new Map<string, number>([[startId, 1]])
  const queue = [startId]
  while (queue.length) {
    const current = queue.shift()!
    const edges = frame.links.filter((link) => link.available && (link.fromId === current || link.toId === current))
    for (const edge of edges) {
      const next = edge.fromId === current ? edge.toId : edge.fromId
      const nextDistance = (distances.get(current) ?? Infinity) + edge.latencyMs
      if (nextDistance < (distances.get(next) ?? Infinity)) {
        distances.set(next, nextDistance)
        reliability.set(next, (reliability.get(current) ?? 1) * (0.72 + edge.quality * 0.27))
        queue.push(next)
      }
    }
  }
  const reachableGround = groundIds.filter((id) => distances.has(id)).sort((a, b) => (distances.get(a) ?? 0) - (distances.get(b) ?? 0))[0]
  return reachableGround ? { latency: distances.get(reachableGround)!, reliability: reliability.get(reachableGround)! } : null
}

export function calculateMetrics(scenario: Scenario, plan: RelayPlan): PlanMetrics {
  const criticalIds = plan.assets.filter((asset) => asset.critical && asset.enabled).map((asset) => asset.id)
  const samples = Array.from({ length: 24 }, (_, index) => index + 0.5)
  let reachable = 0
  let opportunities = 0
  let latencyTotal = 0
  let reliabilityTotal = 0
  let routeCount = 0
  let gaps = 0
  for (const hour of samples) {
    const frame = simulateFrame(scenario, plan, hour)
    let sampleGap = false
    for (const id of criticalIds) {
      opportunities += 1
      const route = shortestRoute(frame, id)
      if (route) {
        reachable += 1
        latencyTotal += route.latency
        reliabilityTotal += route.reliability
        routeCount += 1
      } else {
        sampleGap = true
      }
    }
    if (sampleGap) gaps += 1
  }
  const enabledRelays = plan.assets.filter((asset) => asset.kind === 'relay' && asset.enabled)
  return {
    coverage: opportunities ? (reachable / opportunities) * 100 : 100,
    latency: routeCount ? latencyTotal / routeCount : 9999,
    reliability: routeCount ? (reliabilityTotal / routeCount) * 100 : 0,
    energy: enabledRelays.reduce((sum, relay) => sum + Math.pow(relay.power / 10, 1.35), 0),
    gaps,
    relays: enabledRelays.length,
  }
}

export function createRelay(scenario: Scenario, name: string, body: Asset['body'], phase: number, power: number, existingCount = 0): Asset {
  const anchor = scenario.assets.find((asset) => asset.id === body)?.base ?? (body === 'deep-space' ? { x: 430, y: 245 } : { x: 430, y: 270 })
  return {
    id: `user-relay-${Date.now()}-${existingCount}`,
    name: name.trim(),
    kind: 'relay',
    role: 'Operator-deployed relay',
    body,
    base: { ...anchor },
    orbitRadius: body === 'deep-space' ? 72 : 108 + existingCount * 10,
    periodHours: body === 'earth' ? 7.8 : body === 'moon' ? 10.8 : body === 'mars' ? 12.4 : 18,
    phase,
    power,
    health: 0.96,
    enabled: true,
    userCreated: true,
  }
}

export function formatMissionTime(startIso: string, hour: number) {
  const value = new Date(new Date(startIso).getTime() + hour * 3_600_000)
  return value.toLocaleString('en-US', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' }).replace(',', ' ·') + ' UTC'
}
