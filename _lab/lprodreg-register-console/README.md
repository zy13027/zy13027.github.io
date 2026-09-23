# Product Register Console

An interactive guide to the Siemens **LProdReg** — Library Product Register — application
library, part of the Robot Control Suite (Siemens Industry Online Support entry ID
**109782462**, LProdReg V3.2, 04/2026). It walks through the library's client/server
architecture, its eleven flow-object blocks, the `LProdReg_RegisterManager` wrapper, the
HMI faceplate and cross-PLC operation, and includes a live pick-and-place simulation: a
conveyor line where products and containers are detected, tracked, prioritised and picked
by a virtual actuator, with the register table filling and emptying as it runs.

This repo is a WebStorm/Vite reorganisation of a single-file page originally published as
a Claude Artifact — the same markup, styles and behaviour, split into modules that are
easier to read and edit, upgraded from classic scripts to ES modules.

## Running it

```
npm install
npm run dev
```

Then open `http://localhost:5173`. Because the code is ES modules loaded via
`<script type="module">` and stitched together by a Vite plugin, **opening `index.html`
straight from disk will not work** — the browser will not resolve the module imports or
the `@include` partials over a `file://` URL. Always go through the Vite dev server.

In WebStorm: open `package.json` and click the ▶ run icon next to the `dev` script.

Other scripts:

```
npm run build     # production build into dist/
npm run preview   # serve the production build locally, for a final check
npm run artifact  # build, then re-inline it into dist/artifact.html
```

## File map

```
index.html                    Document shell: <head> plus @include lines for every
                               partial and section, and the module entry script.
vite.config.js                Vite config, plus the local "@include" plugin that stitches
                               HTML partials into index.html at dev and build time.
package.json                  Scripts and the one dependency (Vite).
src/
  main.js                     Imports every stylesheet in cascade order, then boots every
                               feature module in the original script order.
  partials/
    masthead.html             The hero banner (title, eyebrow, lede, meta pills).
    topbar.html                Sticky nav bar with section links and the theme button.
    footer.html                Closing credits strip.
  sections/
    concept.html               #concept — what LProdReg does, its architecture, the FO
                                naming schema, conveyor- vs. station-based tasks, benefits.
    flowobjects.html           #flowobjects — the flow-object catalogue: footprint charts
                                and a pill-switched detail panel per block.
    simulator.html              #simulator — the live pick-and-place simulation markup
                                (canvas, controls, register table, monitor log).
    manager.html                #manager — the FB LProdReg_RegisterManager interface,
                                configuration structure, DB layout, PLC tags and types.
    engineering.html            #engineering — step-by-step engineering workflow.
    faceplate.html               #faceplate — the HMI faceplate LProdReg_Hmi_Main.
    scenarios.html               #scenarios — worked application scenarios, tabbed.
    crossplc.html                #crossplc — cross-PLC conveyor/actuator operation.
    errors.html                  #errors — the error/warning identifier table (data is
                                in src/data/errors.json, not inline in this file).
    traps.html                   #traps — field notes / common pitfalls.
  styles/
    tokens.css                  Every custom property: light values, the dark
                                prefers-color-scheme block, and the dark data-theme block.
    base.css                    The Artifact runtime's reset (carried by hand, since
                                there is no runtime here) plus element defaults: body,
                                headings, p, a, table/th/td, button/select/input, focus,
                                reduced-motion.
    layout.css                  .wrap, .sec, masthead, topbar, nav link states.
    components.css              .card .pad .grid .box(.caution/.notice) .pill(.on) .tag
                                .mono .scrollx .num .eyebrow .lede .themebtn.
    sections/<name>.css         Each section's own <style> block, moved verbatim. (The
                                original artifact's per-section style blocks each covered
                                more than one <section>; they are split here strictly
                                along the section boundaries the source CSS comments
                                already marked, with no rule content changed.)
  modules/
    theme.js                    initTheme() — light/dark toggle, persisted to
                                localStorage, following the OS preference otherwise.
    scrollspy.js                initScrollspy() — highlights the current section's link
                                in the topbar nav via IntersectionObserver.
    flowobjects.js               initFlowObjects() — pill switcher for the flow-object
                                detail panels.
    scenarios.js                 initScenarios() — the worked-scenario tab switcher.
    errors.js                    initErrors() — search/category/severity filtering over
                                the error & warning table; imports src/data/errors.json.
    simulator.js                  initSimulator() — the live pick-and-place simulation:
                                spawning, sensor detection, the actuator pick/place state
                                machine, and the canvas renderer.
  data/
    errors.json                 The ~215 error/warning identifiers (id, hex status code,
                                severity, category, message), lifted out of the artifact's
                                inline <script type="application/json" id="rf-err-data">
                                data block.
tools/
  build-artifact.mjs            Re-inlines a production build into dist/artifact.html.
public/
  icon.svg, favicon.ico, apple-touch-icon.png   The favicon set.
```

## Conventions

- **Partial includes.** `<!-- @include path/to/file.html -->` in `index.html` is expanded
  by a small Vite plugin at both dev and build time — there is no client-side fetch, so
  the page is fully present at first paint. Includes may nest.
- **CSS cascade order is load-bearing.** `src/main.js` imports the stylesheets in exactly
  the order the original `<style>` blocks appeared in the published artifact: tokens →
  base → layout → components → one file per section, in page order. Don't reorder these
  imports without checking for cascade-order regressions (later rules can quietly override
  earlier ones with the same specificity).
- **Colour only via tokens.** Every colour in the page is a `var(--…)` custom property
  defined in `tokens.css`, redefined for dark mode under both a `prefers-color-scheme`
  media query and an explicit `[data-theme="dark"]` override. Never hard-code a colour in
  a component or section stylesheet.
- **`init…()` modules.** Every feature module exports one `init<Feature>()` function whose
  body is exactly the original artifact's IIFE, called once from `main.js`. Module scripts
  are deferred by nature, so the DOM is always complete by the time `init` runs — same
  guarantee the originals had from running after their own inline markup.
- **Class/id prefixes per section**, inherited from the original authors: `pc-` (concept /
  flow-object catalogue), `sim-` (live simulator), `rf-` (the manager-onward "reference"
  sections: manager, engineering, faceplate, scenarios, crossplc, errors, traps).

## The icon

Traced from the Siemens library icon set supplied for this project: a sensor detecting a
product on a conveyor, on the shared plate colour `#00C1B6` with `#000028` linework. The
same square geometry (200×200 viewBox, 8-unit corner radius) is used across every library
in the set, so the three favicon files — `icon.svg`, `favicon.ico` (16/32/48),
`apple-touch-icon.png` (180×180) — read consistently with the sibling library consoles.

## Re-publishing as an artifact

```
npm run artifact
```

builds the site and writes `dist/artifact.html`: the built CSS inlined as a `<style>`
block, the built JS inlined as a `<script type="module">`, and no document wrapper — no
`<!doctype>`, `<html>`, `<head>` or `<body>` tags, and no favicon `<link>`s. That's
intentional: a Claude Artifact is a fragment that the Artifact runtime wraps in its own
document, and its tab icon comes from the publish call's `icon` parameter rather than a
`<link rel="icon">`. `<title>` and the Google Fonts `<link>`s are kept, since the runtime
does not supply those itself.

## Sources

The page credits itself, in its own footer and section eyebrows, to:

- The **LProdReg** library manual, **V3.2**, **04/2026** — Siemens Industry Online Support
  entry [**109782462**](https://support.industry.siemens.com/cs/ww/en/view/109782462).
- The library's **V20 example project** (TIA Portal V20), for the worked engineering
  workflow and scenarios.
