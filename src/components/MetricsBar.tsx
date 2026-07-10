import type { BaselineSnapshot, PlanMetrics } from '../types'

interface MetricsBarProps {
  metrics: PlanMetrics
  baseline?: BaselineSnapshot
  onCompare: () => void
}

const format = {
  coverage: (value: number) => `${value.toFixed(1)}%`,
  latency: (value: number) => value > 9000 ? 'NO ROUTE' : `${value.toFixed(0)} ms`,
  reliability: (value: number) => `${value.toFixed(1)}%`,
  energy: (value: number) => `${value.toFixed(1)} kW·h`,
  gaps: (value: number) => `${value}`,
  relays: (value: number) => `${value}`,
}

export function MetricsBar({ metrics, baseline, onCompare }: MetricsBarProps) {
  const items: Array<[keyof PlanMetrics, string]> = [['coverage', '24H COVERAGE'], ['latency', 'AVG LATENCY'], ['reliability', 'ROUTE RELIABILITY'], ['energy', 'TX ENERGY'], ['gaps', 'CRITICAL GAPS'], ['relays', 'ACTIVE RELAYS']]
  return (
    <section className="metrics-bar" aria-label="Mission plan metrics">
      {items.map(([key, label]) => {
        const delta = baseline ? metrics[key] - baseline.metrics[key] : 0
        const lowerIsBetter = key === 'latency' || key === 'energy' || key === 'gaps'
        const improved = lowerIsBetter ? delta < 0 : delta > 0
        return <button key={key} className="metric" onClick={onCompare} title={baseline ? 'Open baseline comparison' : 'Save a baseline to enable comparison'}><span>{label}</span><strong>{format[key](metrics[key])}</strong>{baseline && Math.abs(delta) > .01 ? <small className={improved ? 'delta-good' : 'delta-bad'}>{improved ? '▲' : '▼'} {Math.abs(delta).toFixed(key === 'gaps' || key === 'relays' ? 0 : 1)}</small> : <small>—</small>}</button>
      })}
    </section>
  )
}
