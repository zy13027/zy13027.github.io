# ROXSIE Architecture Lab

An interactive teardown of **Siemens ROXSIE** (SIMATIC Connector for ROS, formerly ROSie)
and the **Realtime Information Backbone (RIB)** it runs on: an animated stack schematic,
a live lifetime-buffer simulator, an interface budget calculator that checks every
published ceiling at once, and a staleness budget that shows where the latency really is.

Static front end. No framework, no runtime dependencies — Vite is the only dev dependency.

---

## Quick start

```powershell
npm install
npm run dev      # http://localhost:5173, opens automatically
```

```powershell
npm run build    # -> dist/
npm run preview  # serve dist/ locally
```

Node `^20.19.0 || >=22.12.0` (Vite 8's requirement).

`vite.config.js` sets `base: './'`, so `dist/` can be served from a sub-path — an Industrial
Edge app, a PLC web server directory, IIS under a virtual folder — with no rewrite rule and no
absolute paths to patch. It still has to be **served**, not opened as a `file://` URL: the
build is an ES module, and browsers block module and stylesheet loads from `file://`. Use
`npm run preview`, or WebStorm's built-in server (right-click `dist/index.html` → *Open in
Browser*), or any static host.

---

## Layout

```
roxsie-architecture-lab/
├─ index.html              the whole document: prose, tables, inline SVG diagrams
├─ vite.config.js
├─ public/
│  ├─ favicon.svg          six-segment lifetime buffer, one segment lit (theme-aware)
│  ├─ favicon-32.png
│  └─ apple-touch-icon.png
├─ docs/
│  └─ ARCHITECTURE.md      module boundaries and why they fall where they do
└─ src/
   ├─ main.js              wiring and the animation loop — nothing else
   ├─ styles/
   │  ├─ tokens.css        Siemens palette: light, system-dark, explicit-dark
   │  ├─ base.css          reset, document defaults, typography, motion
   │  ├─ layout.css        top bar, hero, section bands, footer
   │  ├─ components.css    figures, cards, notes, tables, tags, steps, code
   │  └─ sim.css           instrument panel: controls, readouts, verdicts, budget bar
   ├─ lib/
   │  ├─ format.js         published limits and the buffer arithmetic
   │  ├─ model.js          every derived figure — the file to review the maths in
   │  ├─ scales.js         slider ↔ value curves
   │  ├─ store.js          ~30-line observable store
   │  └─ theme.js          theme toggle, token reads, repaint-on-flip
   ├─ sim/
   │  └─ lifetime-buffer.js   the ring model — pure, no DOM, no colours
   ├─ data/
   │  ├─ messages.js       ROS 2 message size estimates, field by field
   │  └─ presets.js        the AMR preset
   └─ views/
      ├─ ring.js           SVG segment ring
      ├─ trace.js          canvas rolling timeline
      ├─ controls.js       slider bindings
      ├─ topic-table.js    interface budget table
      ├─ checks.js         readouts, consistency verdict, ceiling checks
      └─ staleness.js      staleness budget bar
```

**Why the markup stays in one file.** Prose and the four inline SVG diagrams are content,
not behaviour, and they are what the page renders at rest — moving them into JS templates
would buy tidiness at the cost of a blank frame on load. Behaviour and styling are split;
the document is a document. If you do want partials later, `vite-plugin-handlebars` with a
`partialDirectory` is a build-time drop-in that leaves the output static.

---

## The maths, and where it comes from

Everything numeric traces to a primary source. The constants live in `src/lib/format.js`
with the citation on each one.

| Figure | Value | Source |
|---|---|---|
| Lifetime-buffer header | 16 bytes | RIB manual §4.2.3 |
| Segments | `N = 3 + Lifetime / Cycle-time` | RIB manual §4.2.3 |
| Segment size | symbol sum, rounded up to a multiple of 8 | RIB manual §4.2.3 |
| VMM shared memory | 8 MB | RIB manual §4.2.3 |
| Lifetime | default 10 ms, minimum 1 ms, no maximum | RIB manual §6.1 (`RIB_App -l`) |
| Cyclic interrupt OBs | 20 total, ~16 per direction | ROXSIE limitations |
| Topic rate | > 0 and ≤ 1000 Hz | ROXSIE YAML config reference |
| Complex types | avoid above 100 Hz | ROXSIE limitations |
| String / sequence | 254-byte array / exactly 64 elements | ROXSIE limitations |

The manual's own worked example — lifetime 3 ms, cycle 1 ms → 6 segments — is reproduced
exactly by `segmentCount()`. The `Math.ceil` is ours: a fractional segment cannot exist.

### Two figures that are derived, not published

Both are labelled in the page itself. Do not quote them as Siemens numbers.

1. **Per-message byte sizes** (`src/data/messages.js`) are computed from ROXSIE's documented
   fixed-size mapping — `string` → 254 bytes, `sequence<T>` → 64 elements, `Header` → 262 —
   summed field by field and rounded to 8. Per-field padding the generator may insert is not
   modelled. Check against the generated SCL before designing a machine around them.
2. **The memcpy cost** in the staleness budget (`MEMCPY_MS` in `src/lib/model.js`) is an
   order-of-magnitude placeholder. It exists so the bar shows the transport is a rounding
   error next to the sampling boundaries; it is not a measurement.

### Sources

- RIB Programming Manual, A5E52046002-AD, 01/2025
- ROXSIE required hardware & software V4, and service bundles V4 — Siemens entry 109987809
- <https://developer.siemens.com/roxsie/> — overview, requirements, limitations, usage,
  YAML config structure, command line tool, setup, troubleshooting, changelog

---

## Theming

`tokens.css` covers the three states a page actually sees: an explicit `data-theme="light"`
or `data-theme="dark"` on `<html>`, and the default *system* setting which stamps nothing and
is separated only by `prefers-color-scheme`. Define new colours as tokens on bare `:root`
first, then override them in both dark blocks — a colour whose only definition sits inside a
media query renders one theme's text on the other theme's ground.

The canvas timeline and the inline SVG ring hold literal colours read from the tokens at
draw time, so they are repainted on a theme flip (`onThemeChange` in `main.js`).

---

## Publishing rules

This copy is published on a public website as unofficial study notes. It deliberately carries
no Siemens commercial or internally classified material: the service-bundle and pricing block
from the claude.ai version was removed, and must not be reintroduced. Cite only public sources
(Siemens Industry Online Support entries, developer.siemens.com) in the footer.
