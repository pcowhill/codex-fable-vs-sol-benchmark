# Asterism

Asterism is a desktop mission-planning console for evaluating deep-space communications relay networks across a deterministic 24-hour operations window. It opens on a populated Lunar South Pole resupply mission and includes distinct Mars-transfer and solar-storm contingency problems.

## Main features

- Interactive SVG spatial model with Earth, Moon, Mars, stations, spacecraft, surface assets, relay orbits, unavailable links, live carriers, direct paths, and relay segments.
- Deterministic playback with scrubbing, four playback rates, event jumps, live geometry, link state, interference, and route metrics.
- Contextual asset and link inspectors with power, phase, enabled state, preferred next-hop, link margin, bandwidth, latency, health, and connectivity controls.
- Operator relay deployment in Earth, lunar, Mars, or deep-space regions, including safe limits and removable user-created assets.
- Full-window plan metrics and baseline comparison using paired visual bars and improvement/regression indicators.
- Scenario-specific briefs, events, environmental constraints, priorities, and critical alerts.
- Versioned JSON import/export, schema validation at the import boundary, reset controls, and debounced local-storage autosave.
- Visible focus states, semantic controls, reduced-motion support, and keyboard-accessible SVG assets and links.

## Technology

- React 19 and TypeScript
- Vite 6
- Modern CSS and inline SVG (no runtime network requests)
- Vitest, Testing Library, and jsdom
- Playwright for Chromium workflow verification and screenshots

## Setup and run

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. The app requires no backend, API key, account, or network connection after installation.

## Verification commands

```bash
npm run typecheck
npm test
npm run build
npm run test:e2e
npm run screenshots
```

The Playwright commands require a Chromium browser available to Playwright. If it is not already installed, run `npx playwright install chromium` once.

## Architecture

- `src/data/scenarios.ts` centralizes the three scenario seeds and their events.
- `src/simulation/engine.ts` owns geometry, environmental interference, link calculations, graph routing, and full-window metrics.
- `src/state/persistence.ts` owns versioned local state, export construction, and import validation.
- `src/components/` contains the spatial map, timeline, mission sidebar, inspectors, metric strip, and focused overlays.
- `src/App.tsx` coordinates plan mutations, playback, selection, persistence, keyboard commands, and data portability.
- `e2e/` contains the complete operator workflow and final screenshot capture.

The state boundary is intentionally small: each scenario stores a typed relay plan and optional baseline. All derived geometry, links, alerts, and metrics are recalculated from those inputs.

## Simulation model

The simulation is lightweight and deterministic. Asset positions use elliptical parametric tracks derived from each asset's anchor, period, phase, and mission elapsed time. Link quality is calculated from:

- endpoint transmission power;
- projected distance;
- minimum endpoint health;
- scenario and time-dependent interference;
- surface-link and body-occlusion penalties;
- a small deterministic phase term;
- operator preferred-route weighting.

A carrier must clear the acquisition threshold and body-occlusion check. Critical endpoints are routed to an Earth ground station across the available-link graph. The 24-hour metrics sample every hour and report average critical-endpoint coverage, routed latency, multiplicative route reliability, relay transmission cost, uncovered windows, and enabled relay count. This makes useful tradeoffs possible: added power or relays can improve reachability while increasing energy cost.

### Scientific simplifications

- The spatial plot is an ecliptic planning projection, not a scale orbital ephemeris.
- Screen-space distance is a normalized range index used consistently for latency and margin; displayed `Mm` and `ms` are planning-model units rather than predictions for flight certification.
- Celestial body motion, antenna pointing, terrain, occultation, and radiation effects are approximated by deterministic functions.
- Route search minimizes modeled latency and uses a simplified compounded reliability value.
- Full-window metrics use hourly samples rather than continuous visibility-window integration.

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| `Space` | Play or pause |
| `R` | Return to mission start |
| `A` | Open relay deployment |
| `B` | Open baseline comparison |
| `←` / `→` | Step by 15 minutes |
| `?` | Open shortcut reference |
| `Esc` | Close active overlay |

Shortcuts are ignored while editing form fields.

## Persistence and portability

Changes autosave to `localStorage` under the versioned key `asterism-console-state-v1`. Reset affects only the active scenario and asks for confirmation. Export creates a readable `asterism-relay-plan` version 1 JSON document containing the current plan and optional baseline. Import accepts only compatible version 1 documents with valid scenario, asset, station, critical-endpoint, power, phase, and enabled-state fields; malformed files produce a visible error without replacing current state.

## Screenshots

Final screenshots are stored in `artifacts/screenshots/`:

- `asterism-main-1920x1080.png`
- `asterism-edited-plan-1920x1080.png`
- `asterism-main-1366x768.png`

## Limitations

- Asterism is a communications-planning simulation, not a flight-dynamics or RF-certification tool.
- Import validation deliberately validates the stable plan boundary rather than every derived simulation field.
- The interface is optimized for desktop operations displays and has a deliberate minimum width of 1180 px.
- State is browser-local; plans can be moved between browsers only through JSON export and import.
