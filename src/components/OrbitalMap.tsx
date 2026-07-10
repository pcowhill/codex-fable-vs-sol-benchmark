import { useId } from 'react'
import type { Scenario, SimulationFrame } from '../types'

type Selection = { kind: 'asset' | 'link'; id: string } | null

interface OrbitalMapProps {
  scenario: Scenario
  frame: SimulationFrame
  selection: Selection
  onSelect: (selection: NonNullable<Selection>) => void
}

const stars = Array.from({ length: 92 }, (_, index) => ({
  x: (index * 83 + 37) % 900,
  y: (index * 47 + 19) % 510,
  r: index % 13 === 0 ? 1.1 : index % 5 === 0 ? 0.7 : 0.38,
  opacity: 0.18 + (index % 7) * 0.045,
}))

const bodyRadius: Record<string, number> = { earth: 34, moon: 23, mars: 28 }

function assetSymbol(kind: string) {
  if (kind === 'station') return <path d="M-8 7H8M-4 7L-1-4H1L4 7M-5-1H5" />
  if (kind === 'surface') return <path d="M-8 7H8M-6 7l3-9h6l3 9M-5 2h10M0-2v-4" />
  if (kind === 'spacecraft') return <path d="M0-9 5-1 3 7 0 4-3 7-5-1ZM-5 0h-6M5 0h6" />
  return <><path d="M-4-5h8v10h-8zM-11-4h6v8h-6zM5-4h6v8H5z" /><circle cx="0" cy="0" r="2" /></>
}

export function OrbitalMap({ scenario, frame, selection, onSelect }: OrbitalMapProps) {
  const uid = useId().replace(/:/g, '')
  const bodies = frame.assets.filter((asset) => asset.kind === 'body')
  const nodes = frame.assets.filter((asset) => asset.kind !== 'body')

  return (
    <svg className="orbital-map" viewBox="0 0 900 510" role="img" aria-label={`${scenario.name} spatial communications network`}>
      <defs>
        <radialGradient id={`${uid}-earth`} cx="35%" cy="30%"><stop offset="0" stopColor="#8ec7cd" /><stop offset=".55" stopColor="#386f79" /><stop offset="1" stopColor="#122c36" /></radialGradient>
        <radialGradient id={`${uid}-moon`} cx="35%" cy="30%"><stop offset="0" stopColor="#d1d0c6" /><stop offset=".7" stopColor="#777a78" /><stop offset="1" stopColor="#343a3d" /></radialGradient>
        <radialGradient id={`${uid}-mars`} cx="35%" cy="30%"><stop offset="0" stopColor="#d08a64" /><stop offset=".65" stopColor="#8c4d37" /><stop offset="1" stopColor="#40251f" /></radialGradient>
        <filter id={`${uid}-glow`} x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <pattern id={`${uid}-grid`} width="45" height="45" patternUnits="userSpaceOnUse"><path d="M45 0H0V45" fill="none" stroke="#80919a" strokeOpacity=".07" strokeWidth=".6" /></pattern>
      </defs>
      <rect width="900" height="510" fill="#080d12" />
      <rect width="900" height="510" fill={`url(#${uid}-grid)`} />
      <g aria-hidden="true">{stars.map((star, index) => <circle key={index} {...star} fill="#d7e1e2" />)}</g>
      <path className="projection-axis" d="M36 426H864M450 32V478" />
      <g className="range-rings" aria-hidden="true">
        <circle cx="450" cy="255" r="85" /><circle cx="450" cy="255" r="170" /><circle cx="450" cy="255" r="255" />
      </g>
      <text className="map-coordinate" x="36" y="42">ECLIPTIC PROJECTION // MISSION ELAPSED GEOMETRY</text>
      <text className="map-coordinate" x="808" y="478">RANGE 1:42</text>

      <g className="orbit-tracks" aria-hidden="true">
        {nodes.filter((asset) => asset.orbitRadius > 42 && asset.body !== 'deep-space').map((asset) => (
          <ellipse key={asset.id} cx={asset.base.x} cy={asset.base.y} rx={asset.orbitRadius} ry={asset.orbitRadius * 0.58} />
        ))}
      </g>

      <g className="link-layer">
        {frame.links.map((link) => {
          const from = frame.assets.find((asset) => asset.id === link.fromId)!
          const to = frame.assets.find((asset) => asset.id === link.toId)!
          const selected = selection?.kind === 'link' && selection.id === link.id
          return (
            <g key={link.id} className={`map-link ${link.available ? 'is-active' : 'is-unavailable'} ${link.relayed ? 'is-relayed' : 'is-direct'} ${link.preferred ? 'is-preferred' : ''} ${selected ? 'is-selected' : ''}`}>
              <line className="link-visible" x1={from.position.x} y1={from.position.y} x2={to.position.x} y2={to.position.y} />
              {link.available && <circle className="link-pulse" r="2.2"><animateMotion dur={`${3.8 - link.quality * 2}s`} repeatCount="indefinite" path={`M${from.position.x},${from.position.y} L${to.position.x},${to.position.y}`} /></circle>}
              <line className="link-hit" x1={from.position.x} y1={from.position.y} x2={to.position.x} y2={to.position.y} role="button" tabIndex={0} aria-label={`${from.name} to ${to.name} link, ${link.available ? 'available' : 'unavailable'}`} onClick={() => onSelect({ kind: 'link', id: link.id })} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onSelect({ kind: 'link', id: link.id }) }} />
            </g>
          )
        })}
      </g>

      <g className="body-layer">
        {bodies.map((asset) => {
          const r = bodyRadius[asset.id] ?? 24
          return (
            <g key={asset.id} transform={`translate(${asset.position.x} ${asset.position.y})`} className={`celestial-body ${selection?.kind === 'asset' && selection.id === asset.id ? 'is-selected' : ''}`} role="button" tabIndex={0} aria-label={`Inspect ${asset.name}`} onClick={() => onSelect({ kind: 'asset', id: asset.id })} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onSelect({ kind: 'asset', id: asset.id }) }}>
              <circle className="body-halo" r={r + 12} />
              <circle className="body-disc" r={r} fill={`url(#${uid}-${asset.id})`} />
              <path className="body-meridian" d={`M${-r * .8} 0H${r * .8}M0 ${-r * .8}V${r * .8}`} />
              <text className="body-name" x={0} y={r + 23} textAnchor="middle">{asset.name.toUpperCase()}</text>
            </g>
          )
        })}
      </g>

      <g className="asset-layer">
        {nodes.map((asset) => {
          const selected = selection?.kind === 'asset' && selection.id === asset.id
          return (
            <g key={asset.id} transform={`translate(${asset.position.x} ${asset.position.y})`} className={`map-asset kind-${asset.kind} ${asset.enabled ? '' : 'is-disabled'} ${asset.critical ? 'is-critical' : ''} ${selected ? 'is-selected' : ''}`} role="button" tabIndex={0} aria-label={`Inspect ${asset.name}`} onClick={() => onSelect({ kind: 'asset', id: asset.id })} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onSelect({ kind: 'asset', id: asset.id }) }}>
              {asset.critical && <circle className="critical-ring" r="15" />}
              <circle className="asset-plate" r="11" />
              <g className="asset-glyph">{assetSymbol(asset.kind)}</g>
              {(selected || asset.critical || asset.userCreated) && <g className="asset-label" transform="translate(16 -17)"><rect x="0" y="0" width={Math.max(74, asset.name.length * 7.1 + 16)} height="23" /><text x="8" y="15">{asset.name.toUpperCase()}</text></g>}
            </g>
          )
        })}
      </g>
      <g className="map-legend" transform="translate(35 458)">
        <line className="legend-active" x1="0" y1="0" x2="26" y2="0" /><text x="34" y="4">AVAILABLE</text>
        <line className="legend-direct" x1="116" y1="0" x2="142" y2="0" /><text x="150" y="4">DIRECT</text>
        <line className="legend-off" x1="231" y1="0" x2="257" y2="0" /><text x="265" y="4">NO CARRIER</text>
      </g>
    </svg>
  )
}
