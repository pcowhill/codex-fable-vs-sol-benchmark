import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import type { Asset, BaselineSnapshot, PlanMetrics, Scenario } from '../types'

interface AddRelayDialogProps {
  open: boolean
  scenario: Scenario
  onClose: () => void
  onAdd: (name: string, body: Asset['body'], phase: number, power: number) => void
}

function useFocusTrap(open: boolean, container: RefObject<HTMLElement | null>, preferred?: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const focus = window.setTimeout(() => (preferred?.current ?? container.current?.querySelector<HTMLElement>('button, input, select'))?.focus(), 0)
    const keepFocusInside = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !container.current) return
      const controls = [...container.current.querySelectorAll<HTMLElement>('button, input, select, [tabindex]:not([tabindex="-1"])')].filter((element) => !element.hasAttribute('disabled'))
      if (!controls.length) return
      const first = controls[0]
      const last = controls[controls.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', keepFocusInside)
    return () => { window.clearTimeout(focus); document.removeEventListener('keydown', keepFocusInside); previous?.focus() }
  }, [container, open, preferred])
}

export function AddRelayDialog({ open, scenario, onClose, onAdd }: AddRelayDialogProps) {
  const [name, setName] = useState('VANTAGE–3')
  const [body, setBody] = useState<Asset['body']>(scenario.id === 'mars' ? 'mars' : 'moon')
  const [phase, setPhase] = useState(90)
  const [power, setPower] = useState(62)
  const nameRef = useRef<HTMLInputElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  useFocusTrap(open, dialogRef, nameRef)
  useEffect(() => { setBody(scenario.id === 'mars' ? 'mars' : 'moon') }, [scenario.id])
  if (!open) return null
  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><div ref={dialogRef} className="dialog" role="dialog" aria-modal="true" aria-labelledby="add-relay-title"><header><span>PLAN MODIFICATION</span><h2 id="add-relay-title">Deploy communications relay</h2><button onClick={onClose} aria-label="Close dialog">×</button></header><form onSubmit={(event) => { event.preventDefault(); if (name.trim().length >= 3) { onAdd(name, body, phase, power); onClose() } }}>
    <label htmlFor="relay-name">Relay designation<input id="relay-name" ref={nameRef} value={name} minLength={3} maxLength={24} required onChange={(event) => setName(event.target.value)} /></label>
    <label htmlFor="relay-region">Deployment region<select id="relay-region" value={body} onChange={(event) => setBody(event.target.value as Asset['body'])}><option value="earth">Earth orbit</option><option value="moon">Lunar orbit</option><option value="mars">Mars orbit</option><option value="deep-space">Deep-space station</option></select></label>
    <label className="dialog-range" htmlFor="relay-phase"><span>Initial orbital phase <output aria-hidden="true">{phase}°</output></span><input id="relay-phase" type="range" min="0" max="359" value={phase} onChange={(event) => setPhase(Number(event.target.value))} /></label>
    <label className="dialog-range" htmlFor="relay-power"><span>Transmission power <output aria-hidden="true">{power}%</output></span><input id="relay-power" type="range" min="20" max="100" value={power} onChange={(event) => setPower(Number(event.target.value))} /></label>
    <p className="deployment-note"><b>Predicted tradeoff</b> Higher power can recover marginal routes, with a proportional energy penalty across the mission window.</p>
    <footer><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button type="submit" className="primary-button">Deploy relay</button></footer>
  </form></div></div>
}

interface ComparisonProps { open: boolean; metrics: PlanMetrics; baseline?: BaselineSnapshot; onClose: () => void; onSave: () => void }
const rows: Array<[keyof PlanMetrics, string, string, boolean]> = [['coverage', '24-hour coverage', '%', false], ['latency', 'Average latency', 'ms', true], ['reliability', 'Route reliability', '%', false], ['energy', 'Transmission energy', 'kW·h', true], ['gaps', 'Critical uncovered windows', '', true], ['relays', 'Active relay assets', '', false]]

export function ComparisonPanel({ open, metrics, baseline, onClose, onSave }: ComparisonProps) {
  if (!open) return null
  return <section className="comparison-panel" aria-label="Baseline comparison"><header><div><span>PLAN DELTA ANALYSIS</span><h2>{baseline ? 'Current plan / saved baseline' : 'No baseline captured'}</h2></div><button onClick={onClose} aria-label="Close comparison">×</button></header>{baseline ? <><div className="comparison-summary"><strong>{rows.filter(([key,,, lower]) => lower ? metrics[key] < baseline.metrics[key] : metrics[key] > baseline.metrics[key]).length}</strong><span>metrics improved</span><i>since {new Date(baseline.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</i></div><div className="comparison-rows">{rows.map(([key, label, unit, lower]) => { const delta = metrics[key] - baseline.metrics[key]; const improved = lower ? delta < 0 : delta > 0; const range = key === 'coverage' || key === 'reliability' ? 100 : Math.max(metrics[key], baseline.metrics[key], 1); return <div className="comparison-row" key={key}><span>{label}</span><div className="bar-pair"><i className="baseline-bar" style={{ width: `${Math.min(100, baseline.metrics[key] / range * 100)}%` }} /><i className="current-bar" style={{ width: `${Math.min(100, metrics[key] / range * 100)}%` }} /></div><b>{metrics[key].toFixed(key === 'gaps' || key === 'relays' ? 0 : 1)} {unit}</b><em className={Math.abs(delta) < .01 ? '' : improved ? 'delta-good' : 'delta-bad'}>{Math.abs(delta) < .01 ? '—' : `${delta > 0 ? '+' : ''}${delta.toFixed(key === 'gaps' || key === 'relays' ? 0 : 1)}`}</em></div>})}</div><div className="comparison-key"><span><i className="key-baseline" />BASELINE</span><span><i className="key-current" />CURRENT</span></div></> : <div className="baseline-empty"><span>◇</span><p>Capture the current relay configuration as a reference. Subsequent edits will be evaluated across the full 24-hour window.</p></div>}<footer><button className="primary-button" onClick={onSave}>{baseline ? 'Replace baseline' : 'Save current baseline'}</button></footer></section>
}

export function ShortcutsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  useFocusTrap(open, dialogRef, closeRef)
  if (!open) return null
  const shortcuts = [['Space', 'Play / pause simulation'], ['R', 'Return to mission start'], ['A', 'Deploy a relay'], ['B', 'Open baseline comparison'], ['← / →', 'Step time by 15 minutes'], ['?', 'Show this reference'], ['Esc', 'Close active overlay']]
  return <div className="dialog-backdrop"><div ref={dialogRef} className="dialog shortcuts-dialog" role="dialog" aria-modal="true" aria-labelledby="shortcuts-title"><header><span>OPERATOR REFERENCE</span><h2 id="shortcuts-title">Keyboard shortcuts</h2><button ref={closeRef} onClick={onClose} aria-label="Close dialog">×</button></header><div className="shortcut-list">{shortcuts.map(([key, label]) => <div key={key}><kbd>{key}</kbd><span>{label}</span></div>)}</div></div></div>
}
