# Asset and package record

The application does not use downloaded imagery, audio, textures, logos, icon packs, remote fonts, external data feeds, or runtime CDN resources. All celestial rendering, interface symbols, charts, and the Asterism mark are original SVG/CSS created in this repository.

## Runtime packages

| Package | Source | License | Use | Delivery |
| --- | --- | --- | --- | --- |
| React / React DOM | [npm](https://www.npmjs.com/package/react) | MIT | Component rendering and UI state | Local npm dependency |
| Vite and `@vitejs/plugin-react` | [npm](https://www.npmjs.com/package/vite) | MIT | Development server and production bundling | Local npm development dependency |
| TypeScript | [npm](https://www.npmjs.com/package/typescript) | Apache-2.0 | Static typing and project checks | Local npm development dependency |

## Verification packages

| Package | Source | License | Use | Delivery |
| --- | --- | --- | --- | --- |
| Vitest | [npm](https://www.npmjs.com/package/vitest) | MIT | Unit and component tests | Local npm development dependency |
| Testing Library / jest-dom / user-event | [npm](https://www.npmjs.com/package/@testing-library/react) | MIT | Accessible component interaction tests | Local npm development dependencies |
| jsdom | [npm](https://www.npmjs.com/package/jsdom) | MIT | Browser-like unit test environment | Local npm development dependency |
| Playwright Test | [npm](https://www.npmjs.com/package/@playwright/test) | Apache-2.0 | Chromium workflow testing and screenshots | Local npm development dependency |

## Fonts

Asterism uses a local system stack (`Bahnschrift`, `DIN Alternate`, `Segoe UI`, Georgia, and monospace fallbacks). No font files are bundled or loaded from the network.
