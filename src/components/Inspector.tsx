import type { Asset, Scenario, SimulatedAsset, SimulatedLink } from '../types'

interface InspectorProps {
  asset?: SimulatedAsset
  link?: SimulatedLink
  scenario: Scenario
  connected: Array<{ asset: SimulatedAsset; link: SimulatedLink }>
  onUpdateAsset: (id: string, updates: Partial<Asset>) => void
  onPreferred: (id: string, targetId: string) => void
  preferredTarget?: string
  onRemove: (id: string) => void
}

function Gauge({ value, label }: { value: number; label: string }) {
  return <div className="gauge"><span>{label}</span><div><i style={{ width: `${Math.max(2, Math.min(100, value))}%` }} /></div><strong>{value.toFixed(0)}%</strong></div>
}

export function Inspector({ asset, link, scenario, connected, onUpdateAsset, onPreferred, preferredTarget, onRemove }: InspectorProps) {
  if (link) {
    const from = connected[0]?.asset
    const quality = link.quality * 100
    return (
      <aside className="inspector" aria-label="Link inspector">
        <div className="inspector-heading"><div><span>LINK INSPECTION</span><h2>{link.fromId.replace(/-/g, ' ')} / {link.toId.replace(/-/g, ' ')}</h2></div><b className={link.available ? 'state-up' : 'state-down'}>{link.available ? '● CARRIER LOCK' : '× NO CARRIER'}</b></div>
        <div className="signal-plot" aria-label={`Signal quality ${quality.toFixed(0)} percent`}><svg viewBox="0 0 280 75"><path d="M0 55 C25 48,34 62,58 43 S96 38,118 46 S155 16,181 31 S225 19,280 25" /><line x1="0" y1={64 - quality * .48} x2="280" y2={64 - quality * .48} /></svg><span>LINK MARGIN / LIVE</span></div>
        <section className="inspector-section"><h3>QUALITY VECTOR</h3><Gauge value={quality} label="Route quality" /><Gauge value={(1 - link.interference) * 100} label="Noise immunity" /></section>
        <section className="inspector-section data-grid"><div><span>SIGNAL</span><strong>{link.signalDb.toFixed(1)} dBm</strong></div><div><span>LATENCY</span><strong>{link.latencyMs.toFixed(0)} ms</strong></div><div><span>BANDWIDTH</span><strong>{link.bandwidthMbps.toFixed(1)} Mb/s</strong></div><div><span>RANGE INDEX</span><strong>{link.distance.toFixed(0)} Mm</strong></div></section>
        <section className="inspector-section"><h3>PATH STATUS</h3><p className="status-explanation"><b>{link.reason}.</b> {link.relayed ? 'This segment participates in the relay mesh.' : 'This is a direct endpoint-to-endpoint segment.'}{link.preferred ? ' Operator preference is adding route weight.' : ''}</p></section>
        {from && <p className="inspector-footnote">Geometry and link state are recalculated from plan inputs at the current mission time.</p>}
      </aside>
    )
  }

  if (!asset) return <aside className="inspector inspector-empty"><span>INSPECTOR READY</span><h2>Select an asset or link</h2><p>Use the spatial plot to inspect live geometry, route quality, and planning controls.</p></aside>

  const editable = asset.kind !== 'body' && asset.kind !== 'surface' && asset.kind !== 'station'
  return (
    <aside className="inspector" aria-label="Asset inspector">
      <div className="inspector-heading"><div><span>{asset.kind.toUpperCase()} / {asset.body.toUpperCase()}</span><h2>{asset.name}</h2></div><b className={asset.enabled ? 'state-up' : 'state-down'}>{asset.enabled ? '● ONLINE' : '○ STANDBY'}</b></div>
      <p className="asset-role">{asset.role}</p>
      <section className="inspector-section data-grid"><div><span>X / ECLIPTIC</span><strong>{asset.position.x.toFixed(1)}</strong></div><div><span>Y / ECLIPTIC</span><strong>{asset.position.y.toFixed(1)}</strong></div><div><span>HEALTH</span><strong>{(asset.health * 100).toFixed(0)}%</strong></div><div><span>LINKS</span><strong>{connected.filter(({ link }) => link.available).length} / {connected.length}</strong></div></section>
      <section className="inspector-section"><h3>OPERATING STATE</h3><Gauge value={asset.health * 100} label="Subsystem health" /><Gauge value={asset.power} label="Transmit power" /></section>
      {editable && <section className="inspector-section controls-section"><h3>PLAN CONTROLS</h3>
        <label className="toggle-row"><span><b>Relay enabled</b><small>Include in route calculation</small></span><input type="checkbox" checked={asset.enabled} onChange={(event) => onUpdateAsset(asset.id, { enabled: event.target.checked })} /></label>
        <label className="range-control"><span><b>Transmission power</b><output>{asset.power.toFixed(0)}%</output></span><input aria-label="Transmission power" type="range" min="20" max="100" value={asset.power} onChange={(event) => onUpdateAsset(asset.id, { power: Number(event.target.value) })} /></label>
        <label className="range-control"><span><b>Orbital phase</b><output>{asset.phase.toFixed(0)}°</output></span><input aria-label="Orbital phase" type="range" min="0" max="359" value={asset.phase} onChange={(event) => onUpdateAsset(asset.id, { phase: Number(event.target.value) })} /></label>
        <label className="select-control"><span>Preferred next hop</span><select aria-label="Preferred next hop" value={preferredTarget ?? ''} onChange={(event) => onPreferred(asset.id, event.target.value)}><option value="">Automatic routing</option>{connected.map(({ asset: neighbor }) => <option key={neighbor.id} value={neighbor.id}>{neighbor.name}</option>)}</select></label>
      </section>}
      <section className="inspector-section"><h3>CONNECTED ASSETS</h3><div className="connection-list">{connected.length ? connected.slice(0, 5).map(({ asset: neighbor, link: item }) => <div key={neighbor.id}><i className={item.available ? 'connection-up' : 'connection-down'}>{item.available ? '●' : '×'}</i><span>{neighbor.name}<small>{item.available ? `${item.bandwidthMbps.toFixed(1)} Mb/s` : item.reason}</small></span><b>{(item.quality * 100).toFixed(0)}</b></div>) : <p>No link candidates in current geometry.</p>}</div></section>
      {asset.userCreated && <button className="danger-button" onClick={() => onRemove(asset.id)}>Remove operator relay</button>}
      <p className="inspector-footnote">Constraint set: {scenario.code} / values update immediately.</p>
    </aside>
  )
}
