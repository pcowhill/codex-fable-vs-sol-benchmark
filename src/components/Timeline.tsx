import type { MissionEvent } from '../types'
import { formatMissionTime } from '../simulation/engine'

interface TimelineProps {
  hour: number
  startIso: string
  events: MissionEvent[]
  playing: boolean
  speed: number
  onHour: (hour: number) => void
  onPlay: () => void
  onSpeed: (speed: number) => void
  onEvent: (event: MissionEvent) => void
}

export function Timeline({ hour, startIso, events, playing, speed, onHour, onPlay, onSpeed, onEvent }: TimelineProps) {
  return (
    <section className="timeline" aria-label="Mission time controls">
      <div className="transport">
        <button className="transport-button" onClick={() => onHour(0)} aria-label="Return to scenario start" title="Return to start (R)">↤</button>
        <button className="play-button" onClick={onPlay} aria-label={playing ? 'Pause simulation' : 'Play simulation'} title="Play or pause (Space)">{playing ? 'Ⅱ' : '▶'}</button>
        <div className="time-readout"><span>MET +{hour.toFixed(2).padStart(5, '0')} H</span><strong>{formatMissionTime(startIso, hour)}</strong></div>
      </div>
      <div className="scrubber-wrap">
        <div className="timeline-ticks" aria-hidden="true">{[0, 6, 12, 18, 24].map((tick) => <span key={tick} style={{ left: `${(tick / 24) * 100}%` }}>{String(tick).padStart(2, '0')}H</span>)}</div>
        <div className="event-markers" aria-label="Mission events">
          {events.map((event) => <button key={event.id} className={`event-marker severity-${event.severity}`} style={{ left: `${(event.hour / 24) * 100}%` }} onClick={() => onEvent(event)} title={`${event.hour.toFixed(1)}h — ${event.title}`} aria-label={`Jump to ${event.title} at ${event.hour.toFixed(1)} hours`} />)}
        </div>
        <input aria-label="Mission elapsed time" type="range" min="0" max="24" step="0.05" value={hour} onChange={(event) => onHour(Number(event.target.value))} />
      </div>
      <label className="speed-control">RATE
        <select aria-label="Playback speed" value={speed} onChange={(event) => onSpeed(Number(event.target.value))}>
          <option value="0.5">0.5×</option><option value="1">1×</option><option value="4">4×</option><option value="12">12×</option>
        </select>
      </label>
    </section>
  )
}
