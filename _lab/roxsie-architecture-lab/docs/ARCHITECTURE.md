# Architecture

One rule decides where everything lives: **arithmetic never touches the DOM, and views never
own state.** That is what makes the engineering figures reviewable without reading rendering
code, and what let this page be split out of a single 1,900-line file without behaviour drift.

```
                    ┌──────────────┐
                    │   main.js    │  wiring + rAF loop only
                    └──────┬───────┘
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
   ┌────────────┐   ┌─────────────┐   ┌──────────┐
   │ lib/store  │   │ sim/        │   │ views/*  │
   │ observable │   │ lifetime-   │   │ render   │
   │ state      │   │ buffer      │   │ only     │
   └────────────┘   └─────────────┘   └──────────┘
          │                │                │
          └────────────────┴────────────────┘
                           ▼
                  ┌──────────────────┐
                  │ lib/model.js     │  every derived figure
                  │ lib/format.js    │  every published constant
                  │ data/messages.js │  message size estimates
                  └──────────────────┘
```

## Layers

**`lib/format.js`** — published constants and the four arithmetic primitives (`align8`,
`cycleMs`, `segmentCount`, `bufferBytes`, `holdMs`). Each constant carries its citation. No
imports beyond itself.

**`lib/model.js`** — everything derived: per-topic buffer geometry, whole-interface totals
and ceiling tests, the consistency verdict, the staleness budget. Pure functions in, plain
objects out. If a number on the page looks wrong, it is computed here.

**`sim/lifetime-buffer.js`** — the ring as a state machine: a writer that publishes on a fixed
cycle and a reader that samples at the same rate. Emits an event log the views draw from. No
DOM, no colours, no timers — `advance(deltaMs)` is called by the loop, so the model has no
opinion about wall-clock time. That is what makes the slow-motion control a one-line divide.

**`lib/store.js`** — a `Set` of subscribers and two mutators. Deliberately not a framework.
`set()` replaces fields; `mutate()` edits the topic array in place. Both notify.

**`views/*`** — take a view model, write to their own element, and return nothing. They read
design tokens through `theme.js` rather than hard-coding colours, which is why a theme flip
is a repaint rather than a reload.

**`main.js`** — builds the store, binds the views, runs `requestAnimationFrame`. The only
place that knows element IDs.

## The view model

`viewModel()` in `main.js` is the single seam between state and rendering:

```js
{ hasTopic, topic, lifetime, readWindow, metrics, snapshot }
```

`metrics` comes from `topicMetrics()`, `snapshot` from the simulation. Every renderer takes
this shape, so adding a view means writing one function and calling it in `paintSimulation()`.

## Adding things

- **A new ROS message type** — one entry in `src/data/messages.js`. The table, the ring, the
  budget and the checks all pick it up; nothing else changes.
- **A new published limit** — a constant in `format.js` plus a test in
  `interfaceTotals()`. Add the readout tile to the `.readouts` grid in `index.html` and the
  element to `el.checks` in `main.js`.
- **A new diagram** — inline SVG in `index.html`. Use `currentColor` for strokes and text so
  it follows the theme, and reserve a literal token colour for the one element carrying the
  argument.

## Known rough edges

- The ring caps at 56 drawn segments (`RING_DRAW_CAP`). Above that the model still computes
  the true `N`, and the legend says the drawing is capped — but the simulated ring is the
  capped size, so torn-read timing at extreme lifetime/rate combinations is indicative only.
- `ctx.letterSpacing` in `trace.js` is recent-browser only. It degrades to no letter-spacing
  on the two lane labels, which is cosmetic.
- There are no tests. The arithmetic in `model.js` and `format.js` is pure and would take a
  Vitest suite in an afternoon; the worked example from RIB §4.2.6 (lifetime 3 ms, cycle 1 ms
  → 6 segments) is the obvious first case.
