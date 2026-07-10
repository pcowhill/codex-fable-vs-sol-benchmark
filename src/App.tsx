import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AddRelayDialog, ComparisonPanel, ShortcutsDialog } from './components/Dialogs'
import { Inspector } from './components/Inspector'
import { MetricsBar } from './components/MetricsBar'
import { OrbitalMap } from './components/OrbitalMap'
import { Sidebar } from './components/Sidebar'
import { Timeline } from './components/Timeline'
import { scenarios, seededPlan } from './data/scenarios'
import { calculateMetrics, createRelay, simulateFrame } from './simulation/engine'
import { defaultState, loadPersistedState, makeExport, savePersistedState, validateImport } from './state/persistence'
import type { Asset, MissionEvent, PersistedState, ScenarioId } from './types'

type Selection = { kind: 'asset' | 'link'; id: string } | null
type Toast = { message: string; tone: 'success' | 'error' | 'info' }

export function App() {
  const [state, setState] = useState<PersistedState>(() => typeof localStorage === 'undefined' ? defaultState() : loadPersistedState())
  const [hour, setHour] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [selection, setSelection] = useState<Selection>({ kind: 'asset', id: 'shackleton' })
  const [addOpen, setAddOpen] = useState(false)
  const [compareOpen, setCompareOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)
  const [lastSaved, setLastSaved] = useState('SYNCED')
  const fileInput = useRef<HTMLInputElement>(null)
  const scenario = scenarios[state.activeScenario]
  const plan = state.plans[state.activeScenario]
  const baseline = state.baselines[state.activeScenario]
  const frame = useMemo(() => simulateFrame(scenario, plan, hour), [scenario, plan, hour])
  const metrics = useMemo(() => calculateMetrics(scenario, plan), [scenario, plan])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      savePersistedState(state)
      setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    }, 180)
    return () => window.clearTimeout(timer)
  }, [state])

  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => setHour((value) => {
      const next = value + 0.02 * speed
      if (next >= 24) { setPlaying(false); return 24 }
      return next
    }), 100)
    return () => window.clearInterval(timer)
  }, [playing, speed])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 3600)
    return () => window.clearTimeout(timer)
  }, [toast])

  const closeOverlays = useCallback(() => { setAddOpen(false); setCompareOpen(false); setShortcutsOpen(false) }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const element = event.target as HTMLElement
      const editing = ['INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName)
      if (event.key === 'Escape') { closeOverlays(); return }
      if (editing) return
      if (event.code === 'Space') { event.preventDefault(); setPlaying((value) => !value) }
      else if (event.key.toLowerCase() === 'r') setHour(0)
      else if (event.key.toLowerCase() === 'a') setAddOpen(true)
      else if (event.key.toLowerCase() === 'b') setCompareOpen(true)
      else if (event.key === '?') setShortcutsOpen(true)
      else if (event.key === 'ArrowRight') setHour((value) => Math.min(24, value + .25))
      else if (event.key === 'ArrowLeft') setHour((value) => Math.max(0, value - .25))
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [closeOverlays])

  const switchScenario = (id: ScenarioId) => {
    setState((current) => ({ ...current, activeScenario: id }))
    setHour(0)
    setPlaying(false)
    const target = state.plans[id].assets.find((asset) => asset.critical)?.id ?? state.plans[id].assets[0].id
    setSelection({ kind: 'asset', id: target })
    setToast({ tone: 'info', message: `${scenarios[id].code} scenario loaded.` })
  }

  const updatePlan = (updater: (current: PersistedState['plans'][ScenarioId]) => PersistedState['plans'][ScenarioId]) => {
    setState((current) => ({ ...current, plans: { ...current.plans, [current.activeScenario]: updater(current.plans[current.activeScenario]) } }))
  }

  const updateAsset = (id: string, updates: Partial<Asset>) => updatePlan((current) => ({ ...current, assets: current.assets.map((asset) => asset.id === id ? { ...asset, ...updates } : asset) }))

  const addRelay = (name: string, body: Asset['body'], phase: number, power: number) => {
    if (plan.assets.some((asset) => asset.name.toLowerCase() === name.trim().toLowerCase())) {
      setToast({ tone: 'error', message: 'Relay designation already exists in this scenario.' })
      return
    }
    const userRelays = plan.assets.filter((asset) => asset.userCreated)
    if (userRelays.length >= 5) {
      setToast({ tone: 'error', message: 'Deployment limit reached: remove an operator relay first.' })
      return
    }
    const relay = createRelay(scenario, name, body, phase, power, userRelays.length)
    updatePlan((current) => ({ ...current, assets: [...current.assets, relay] }))
    setSelection({ kind: 'asset', id: relay.id })
    setToast({ tone: 'success', message: `${relay.name} deployed and included in route calculations.` })
  }

  const removeRelay = (id: string) => {
    const relay = plan.assets.find((asset) => asset.id === id)
    if (!relay?.userCreated) return
    if (!window.confirm(`Remove ${relay.name} from this relay plan?`)) return
    updatePlan((current) => ({ ...current, assets: current.assets.filter((asset) => asset.id !== id), preferredRoutes: Object.fromEntries(Object.entries(current.preferredRoutes).filter(([from, to]) => from !== id && to !== id)) }))
    setSelection(null)
    setToast({ tone: 'info', message: `${relay.name} removed from the plan.` })
  }

  const setPreferred = (id: string, targetId: string) => updatePlan((current) => {
    const preferredRoutes = { ...current.preferredRoutes }
    if (targetId) preferredRoutes[id] = targetId
    else delete preferredRoutes[id]
    return { ...current, preferredRoutes }
  })

  const jumpToEvent = (event: MissionEvent) => {
    setHour(event.hour)
    setPlaying(false)
    if (event.targetId) setSelection({ kind: 'asset', id: event.targetId })
    setToast({ tone: event.severity === 'critical' ? 'error' : 'info', message: `MET +${event.hour.toFixed(1)} — ${event.title}` })
  }

  const saveBaseline = () => {
    setState((current) => ({ ...current, baselines: { ...current.baselines, [current.activeScenario]: { savedAt: new Date().toISOString(), metrics, plan: structuredClone(plan) } } }))
    setToast({ tone: 'success', message: 'Current 24-hour plan captured as baseline.' })
  }

  const resetScenario = () => {
    if (!window.confirm(`Reset ${scenario.name} to its seeded relay configuration?`)) return
    setState((current) => ({ ...current, plans: { ...current.plans, [current.activeScenario]: seededPlan(current.activeScenario) }, baselines: { ...current.baselines, [current.activeScenario]: undefined } }))
    setHour(0)
    setSelection({ kind: 'asset', id: scenario.assets.find((asset) => asset.critical)?.id ?? 'earth' })
    setToast({ tone: 'info', message: 'Seeded scenario restored.' })
  }

  const exportPlan = () => {
    const document = makeExport(state, state.activeScenario)
    const blob = new Blob([JSON.stringify(document, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = window.document.createElement('a')
    anchor.href = url
    anchor.download = `asterism-${scenario.code.toLowerCase()}-plan.json`
    anchor.click()
    URL.revokeObjectURL(url)
    setToast({ tone: 'success', message: 'Versioned relay plan exported.' })
  }

  const importPlan = async (file?: File) => {
    if (!file) return
    try {
      const document = validateImport(JSON.parse(await file.text()))
      setState((current) => ({ ...current, activeScenario: document.scenarioId, plans: { ...current.plans, [document.scenarioId]: document.plan }, baselines: { ...current.baselines, [document.scenarioId]: document.baseline } }))
      setHour(0)
      setSelection(null)
      setToast({ tone: 'success', message: `${scenarios[document.scenarioId].code} plan imported successfully.` })
    } catch (error) {
      setToast({ tone: 'error', message: error instanceof Error ? error.message : 'The selected file could not be imported.' })
    } finally {
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  const selectedAsset = selection?.kind === 'asset' ? frame.assets.find((asset) => asset.id === selection.id) : undefined
  const selectedLink = selection?.kind === 'link' ? frame.links.find((link) => link.id === selection.id) : undefined
  const connected = selectedAsset ? frame.links.filter((link) => link.fromId === selectedAsset.id || link.toId === selectedAsset.id).map((link) => ({ link, asset: frame.assets.find((asset) => asset.id === (link.fromId === selectedAsset.id ? link.toId : link.fromId))! })).sort((a, b) => b.link.quality - a.link.quality) : selectedLink ? [selectedLink.fromId, selectedLink.toId].map((id) => ({ link: selectedLink, asset: frame.assets.find((asset) => asset.id === id)! })) : []
  const nearbyCritical = scenario.events.find((event) => event.severity === 'critical' && Math.abs(event.hour - hour) < .65)

  return (
    <div className="app-shell" style={{ '--scenario-accent': scenario.accent } as React.CSSProperties}>
      <header className="topbar">
        <div className="brand"><span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /></span><div><strong>ASTERISM</strong><small>DEEP-SPACE RELAY PLANNING</small></div></div>
        <div className="mission-identity"><span>ACTIVE CONSTRAINT SET</span><strong>{scenario.code} / {scenario.name}</strong></div>
        <nav aria-label="Plan actions">
          <button onClick={() => setAddOpen(true)} title="Deploy relay (A)"><span>＋</span> ADD RELAY</button>
          <button onClick={() => setCompareOpen(true)} title="Baseline comparison (B)"><span>◇</span> COMPARE</button>
          <button onClick={exportPlan}><span>⇩</span> EXPORT</button>
          <button onClick={() => fileInput.current?.click()}><span>⇧</span> IMPORT</button>
          <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={(event) => void importPlan(event.target.files?.[0])} />
          <button onClick={resetScenario}><span>↻</span> RESET</button>
          <button className="icon-button" onClick={() => setShortcutsOpen(true)} aria-label="Keyboard shortcuts" title="Keyboard shortcuts (?)">?</button>
        </nav>
      </header>
      <div className="system-strip"><span><i className="status-dot" /> NETWORK MODEL ONLINE</span><span>AUTOSAVE {lastSaved}</span><span>INTERFERENCE {(frame.interference * 100).toFixed(0)}%</span><span className={nearbyCritical ? 'critical-banner' : ''}>{nearbyCritical ? `! ${nearbyCritical.title.toUpperCase()}` : 'NO ACTIVE CRITICAL ALERTS'}</span></div>
      <main className="workspace">
        <Sidebar scenario={scenario} hour={hour} onScenario={switchScenario} onEvent={jumpToEvent} />
        <section className="mission-stage" aria-label="Mission visualization and timeline">
          <div className="stage-heading"><div><span>SPATIAL NETWORK MODEL</span><strong>LINK TOPOLOGY / {scenario.code}</strong></div><div className="stage-status"><span><i className="state-active" /> {frame.links.filter((link) => link.available).length} AVAILABLE</span><span><i className="state-inactive" /> {frame.links.filter((link) => !link.available).length} UNAVAILABLE</span></div></div>
          <div className="map-wrap"><OrbitalMap scenario={scenario} frame={frame} selection={selection} onSelect={setSelection} /></div>
          <Timeline hour={hour} startIso={scenario.startIso} events={scenario.events} playing={playing} speed={speed} onHour={setHour} onPlay={() => setPlaying((value) => !value)} onSpeed={setSpeed} onEvent={jumpToEvent} />
          <MetricsBar metrics={metrics} baseline={baseline} onCompare={() => setCompareOpen(true)} />
        </section>
        <Inspector asset={selectedAsset} link={selectedLink} scenario={scenario} connected={connected} onUpdateAsset={updateAsset} onPreferred={setPreferred} preferredTarget={selectedAsset ? plan.preferredRoutes[selectedAsset.id] : undefined} onRemove={removeRelay} />
      </main>
      <AddRelayDialog open={addOpen} scenario={scenario} onClose={() => setAddOpen(false)} onAdd={addRelay} />
      <ComparisonPanel open={compareOpen} metrics={metrics} baseline={baseline} onClose={() => setCompareOpen(false)} onSave={saveBaseline} />
      <ShortcutsDialog open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      {toast && <div className={`toast toast-${toast.tone}`} role="status"><i>{toast.tone === 'success' ? '✓' : toast.tone === 'error' ? '!' : 'i'}</i>{toast.message}<button onClick={() => setToast(null)} aria-label="Dismiss notification">×</button></div>}
    </div>
  )
}
