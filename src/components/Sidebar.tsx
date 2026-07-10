import { scenarioList } from '../data/scenarios'
import type { MissionEvent, Scenario, ScenarioId } from '../types'

interface SidebarProps {
  scenario: Scenario
  hour: number
  onScenario: (id: ScenarioId) => void
  onEvent: (event: MissionEvent) => void
}

const severityLabel = { nominal: 'NOM', advisory: 'ADV', warning: 'WRN', critical: 'CRT' }

export function Sidebar({ scenario, hour, onScenario, onEvent }: SidebarProps) {
  const orderedEvents = [...scenario.events].sort((a, b) => Math.abs(a.hour - hour) - Math.abs(b.hour - hour))
  return (
    <aside className="sidebar" aria-label="Mission scenarios and events">
      <section className="sidebar-section scenario-section">
        <div className="section-label"><span>01</span> MISSION SCENARIO</div>
        <div className="scenario-selector">
          {scenarioList.map((item) => (
            <button key={item.id} className={item.id === scenario.id ? 'is-active' : ''} onClick={() => onScenario(item.id)} aria-pressed={item.id === scenario.id}>
              <span className="scenario-code">{item.code}</span><span>{item.name}</span>
            </button>
          ))}
        </div>
      </section>
      <section className="sidebar-section brief-section">
        <div className="section-label"><span>02</span> OPERATIONS BRIEF</div>
        <h2>{scenario.name}</h2>
        <p className="scenario-subtitle">{scenario.subtitle}</p>
        <p className="objective">{scenario.objective}</p>
        <dl className="brief-facts">
          <div><dt>PRIORITY</dt><dd>{scenario.priority}</dd></div>
          <div><dt>ENVIRONMENT</dt><dd>{scenario.environment}</dd></div>
        </dl>
      </section>
      <section className="sidebar-section events-section">
        <div className="section-label"><span>03</span> EVENT QUEUE <b>{scenario.events.length}</b></div>
        <div className="event-list">
          {orderedEvents.map((event) => {
            const delta = event.hour - hour
            return (
              <button key={event.id} className={`event-row severity-${event.severity} ${Math.abs(delta) < .65 ? 'is-current' : ''}`} onClick={() => onEvent(event)}>
                <span className="severity-code">{severityLabel[event.severity]}</span>
                <span className="event-copy"><strong>{event.title}</strong><small>{event.detail}</small></span>
                <time>{delta >= 0 ? `T+${delta.toFixed(1)}` : `T${delta.toFixed(1)}`}</time>
              </button>
            )
          })}
        </div>
      </section>
    </aside>
  )
}
