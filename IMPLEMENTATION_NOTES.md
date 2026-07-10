# Implementation notes

## Design decisions

- The interface uses a fixed operations-console frame rather than a card dashboard: mission context on the left, the spatial planning instrument at center, and a persistent context inspector on the right.
- Square controls, fine measurement lines, condensed type, tabular numerals, and low-chroma status color establish the aerospace-instrument character without using decorative space photography.
- Scenario accent color is restrained to actionable and selected states. Severity always includes a three-letter code or symbol so color is not the only signal.
- Direct connections are blue dashed segments; relay mesh segments are cyan solid lines; unavailable carriers are muted red dashes; operator-preferred routes are amber.
- The event queue is sorted by temporal proximity to the current simulation time, while every event remains directly selectable.

## Engineering decisions

- The deterministic engine is independent of React and has reusable functions for position, interference, frame construction, link quality, graph routing, and 24-hour metrics.
- Scenario seeds are data rather than conditional UI branches, so scenario switching replaces the planning problem without changing component behavior.
- Only operator inputs are persisted. Positions, routes, link properties, and metrics are derived, preventing stale simulation values in saved plans.
- Baselines capture both plan inputs and metrics. Comparison displays the full metric vector, with latency, energy, and gaps correctly treated as “lower is better.”
- The SVG map uses real buttons through `role`, keyboard handlers, names, and generous invisible hit lines while retaining precise technical geometry.

## Assumptions

- The 24-hour analysis window begins at each seeded scenario's UTC timestamp; “current scenario start” means mission elapsed time zero rather than the computer's current clock.
- Earth ground stations are route sinks for coverage calculation.
- A maximum of five operator-created relays per scenario keeps the plot legible and prevents obviously invalid over-deployment.
- User relay designations must be unique within a scenario and at least three characters long.
- The range, latency, bandwidth, reliability, and energy values are internally consistent planning indices, not certified physical predictions.

## Alternatives considered

- Canvas/WebGL was considered for the map, but SVG provides sharper technical marks, easier semantic interaction, and reliable screenshots for this network size.
- A global state library was considered, but typed local state and derived selectors keep this application more transparent with no benefit from another dependency.
- Continuous physics integration was considered, but deterministic parametric tracks and hourly planning samples better fit the product's explicitly non-scientific simulation scope.
- A modal-only inspector was rejected because persistent side-by-side context is more useful during rapid time scrubbing and route editing.

## Visual inspection changes

The browser pass checked the seeded lunar state and an edited polar-gap state at 1920×1080, then repeated the seeded layout at 1366×768. The rendered plot kept its intended hierarchy at both sizes: the orbital geometry remained the focal area, all six metrics stayed visible, and the inspector controls avoided clipping. After inspection, the event queue gained an explicit current-event rail so the active critical gap is recognizable beyond the top alert text. Modal focus handling was tightened, and the edited-plan screenshot now dismisses its transient confirmation so the full metric strip remains inspectable.

## Remaining limitations

- Orbital and RF behavior is intentionally simplified and should not be used for flight decisions.
- The desktop-first layout uses a minimum width; smaller viewports scroll rather than reorganize into a mobile experience.
- The import boundary is strict about the version and required plan fields but does not attempt cryptographic authenticity or provenance checks.
