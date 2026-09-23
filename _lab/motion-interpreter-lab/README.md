# Motion Interpreter Lab

An interactive guide to the SIMATIC S7-1500T Motion Interpreter (MCL), V10.0 / STEP 7 V21 — the technology objects involved, the two-clock (prepare/execute) model, a path simulator with blending controls, an instruction reference, the load/run workflow, and the StatusWord bit layout. It began as a single published Claude artifact (one HTML file with an inline stylesheet and script) and has been split into this modular Vite project without changing its rendering or behaviour.

## Quick start

From a PowerShell prompt in this folder:

```powershell
npm install
npm run dev
```

Vite prints the local dev server URL on start (default `http://localhost:5173`). To produce a production build and check it locally:

```powershell
npm run build
npm run preview
```

## Project structure

```
motion-interpreter-lab/
├─ index.html            entry HTML; assembles the page from src/partials/ at build/dev time
├─ vite.config.js         the @include partial plugin, and base:'./' / server / build settings
├─ public/
│  └─ favicon.svg         the browser-tab icon
└─ src/
   ├─ main.js             imports the styles, starts the shared rAF ticker, runs every module's init()
   ├─ partials/           one HTML file per page section, included into index.html at build/dev time
   ├─ styles/             the original inline <style> block, split along its own banner comments
   │  └─ sections/        one stylesheet per page section (S1–S9)
   ├─ lib/                shared helpers used by more than one module (DOM, math, storage, colour, the
   │                      rAF ticker, IntersectionObserver visibility flags, canvas sizing)
   ├─ data/               plain data tables — MCL program presets, the instruction list, the diagram
   │                      detail text, the StatusWord bit tables — with no behaviour of their own
   └─ modules/            one file per page section's behaviour, each exporting an init() function
```

## Where to edit what

| To change...                                   | Edit...                                  |
|-------------------------------------------------|-------------------------------------------|
| The three MCL example programs (S1/S4)          | `src/data/presets.js`                     |
| The instruction reference list (S5)             | `src/data/instructions.js`                |
| The S2 diagram's per-box detail text            | `src/data/diagram-detail.js`              |
| The StatusWord / error / warning bit tables (S7)| `src/data/statusword.js`                  |
| A section's copy or markup                      | `src/partials/`                           |
| Colours, spacing, fonts (the design tokens)     | `src/styles/tokens.css`                   |
| A section's own look                            | `src/styles/sections/`                    |
| A simulation's behaviour                        | `src/modules/`                            |

## How it fits together

- **Shared rAF ticker.** `src/lib/ticker.js` runs one `requestAnimationFrame` loop; modules register a per-frame callback with `registerTicker()` instead of starting their own loop. `main.js` starts it (`startTicker()`) before running any module, matching the original inline script's script-evaluation-time start.
- **`safeRun` isolation.** Each module's `init()` runs inside `safeRun()` (`src/lib/dom.js`), so a fault in one module — a missing element, a canvas quirk — can't stop the others from initialising, exactly as in the original.
- **The partial-include plugin.** `vite.config.js` defines a small `htmlPartials()` plugin that replaces every `<!-- @include src/partials/xxx.html -->` comment with that file's contents, recursively, at `transformIndexHtml` time (both `vite dev` and `vite build`). The markup is static in the served/built HTML — nothing is fetched or injected at runtime. Editing a file under `src/partials/` triggers a full page reload in dev (the plugin's `handleHotUpdate` forces it, since Vite can't HMR raw HTML fragments).
- **Theme tokens.** Colours are CSS custom properties on `:root` (light by default), redefined for dark under `@media (prefers-color-scheme: dark)` (guarded by `:root:not([data-theme="light"])`) and again under `:root[data-theme="dark"]`. The header toggle sets `data-theme` on `<html>` and persists the explicit choice in `localStorage` under the key `mil-theme`; with no stored choice, the OS/browser preference wins.
- **`base: './'`.** Vite is configured with relative asset paths so a production build can be served from a sub-path, a file share, or a PLC/HMI web server — not only from a domain root.

## Sources

- *S7-1500T Interpreter functions V10.0 as of STEP 7 V21*, Function Manual, 11/2025, A5E53131966-AC (Siemens entry 109990077).
- *Getting Started Manual — SIMATIC Motion Interpreter*, Entry-ID 109826233, V1.0, 12/2023.

The path simulator's dynamics constants (acceleration/deceleration/cruise velocity) for presets 1 and 3 are illustrative, chosen to make the simulation read well — they are not values published in either manual.
