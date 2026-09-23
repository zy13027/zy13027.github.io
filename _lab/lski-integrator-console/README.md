# Kinematics Integrator Console

An interactive guide to the Siemens SIMATIC Kinematics Integrator (LSKI) V4.1 library —
Siemens Industry Online Support entry **109802248**. It walks the library from first
principles (the program table, transitions, interpreter/motion pointers, parallel
sequences) through its block architecture, operation modes and integration steps, to a
full plugin, command and status-code reference, a cost-on-the-CPU breakdown, the demo
project and a set of field-tested traps. A live simulator in the middle of the page lets
you drive a simulated interpreter through a real 19-command LSKI program against an
animated Cartesian portal.

This repository is a WebStorm/Vite rebuild of a single-file HTML artifact, reorganised
into ES modules, HTML partials and per-concern stylesheets. The rendered page is
unchanged; only the source layout is.

## Running it

```
npm install
npm run dev       # http://localhost:5173
npm run build     # production build into dist/
npm run preview   # serve the production build locally
```

Because the code is ES modules (`<script type="module">`), **opening `index.html`
straight from disk will not work** — the browser blocks module imports over the
`file://` protocol. Always go through the Vite dev server. In WebStorm: open
`package.json` and click ▶ next to the `dev` script.

## File map

```
index.html                     document shell: <head> + @include lines + module entry script
vite.config.js                 base './', plus the local @include plugin
package.json
tools/build-artifact.mjs       re-inlines the Vite build into dist/artifact.html

public/
  icon.svg                     favicon, vector
  favicon.ico                  16/32/48 multi-size
  apple-touch-icon.png         180x180

src/
  main.js                      entry: imports every stylesheet, then boots every feature module

  partials/
    masthead.html               the hero band (title, standards, eyebrow)
    topbar.html                 sticky section nav + theme button
    footer.html                 source line + Siemens Industry Online Support link

  sections/                     one file per <section id="…">, markup only, in page order
    concepts.html                1. How LSKI thinks — program table, transitions, pointers, sequences
    architecture.html            2. Block map — click a block to see its interface
    simulator.html                3. Watch the interpreter run — the live simulator
    modes.html                    4. Who gets to do what — operation-mode capability matrix
    integrate.html                 5. Bringing LSKI into a project — 10-step integration flow
    plugins.html                   6. Plugin explorer — searchable/sortable plugin table
    commands.html                   7. Command reference — the 76 program commands
    status.html                      8. Status & error codes — Table 20-1 / 20-2
    quantity.html                     9. What it costs on the CPU — retain memory, constants
    demo.html                         10. The Getting Started demo project
    traps.html                         11. What bites people first

  styles/
    tokens.css                  every custom property: light + both dark blocks
    base.css                    the Artifact-runtime reset + element defaults (body, h1-h4, p, a,
                                 code, table, button, focus, reduced-motion)
    layout.css                  .wrap, .sec, masthead, topbar
    components.css              .card .pad .grid .box(.caution/.notice) .pill(.on) .tag .mono
                                 .scrollx .num .eyebrow .lede .themebtn
    sections/
      concepts-architecture.css  cx- namespace — shared by concepts, architecture, modes AND
                                  integrate (see Conventions below for why it's one file)
      simulator.css               sim- namespace — the simulator section only
      reference.css                rf- namespace — shared by plugins, commands, status, quantity,
                                    demo AND traps

  modules/
    theme.js                    the theme toggle
    scrollspy.js                 the nav-link scroll-spy
    architecture-detail.js        architecture diagram: block -> detail panel
    operation-modes.js             operation-mode capability matrix
    plugins.js                      plugin explorer: search/filter/sort/render
    commands.js                      command reference: search/filter/render
    status.js                         status/error code search + render
    quantity.js                        quantity-structure / constants / runtime tables (static)
    demo.js                             demo-project tab toggle
    traps.js                             traps list render
    util/
      dom.js                     shared `elx()` DOM-building helper
    simulator/                   the interpreter simulator, split into one file per concern
                                  because the artifact's single simulator <script> (877 lines)
                                  exceeds the ~700-line guideline for one file
      index.js                    initSimulator() — orchestrates the rest in original script order
      state.js                     state singleton, DOM cache, geometry helpers
      program-list.js               builds pane A's program list, caches row/arrow elements
      colours.js                     reads theme CSS custom properties at paint time
      errors.js                      error-buffer logging (pushError/pushNote)
      motion.js                      motion queue/animation + pick/place box effects
      engine.js                      interpreter (executeCommand) + tick/animation loop
      controls.js                    button/select/range wiring + one-shot autoplay demo
      render.js                      state -> DOM (pointers, readouts, core outputs, queue, errors)
      canvas.js                      2D canvas drawing (frame, belt, pallet, trail, gantry)

  data/                          large literal tables lifted out of the feature modules above
    simulator-program.js         the 19-command program the simulator interprets
    architecture-details.js       per-block detail-panel HTML
    operation-modes.js             operation-mode capability data
    plugins.js                      plugin explorer table (Table 1-4/1-5)
    commands.js                      command reference table (Table 19-1/19-2/19-3)
    status-codes.js                  status/error code tables (Table 20-1/20-2)
    quantity.js                       quantity-structure, constants and runtime tables
    traps.js                           the twelve symptom/fix pairs
```

## Conventions

- **Partial includes.** `index.html` pulls in every partial and section with
  `<!-- @include src/partials/masthead.html -->`-style comments, expanded at both dev-
  and build-time by a small Vite plugin in `vite.config.js` (`transformIndexHtml`,
  order `'pre'`) — there is no runtime fetch, so the page is fully present at first
  paint, same as the original single-file artifact. Includes can nest, and the dev
  server does a full reload when an included file changes.
- **CSS cascade order is load-bearing.** `main.js` imports stylesheets in exactly the
  order their `<style>` blocks appeared in the source artifact: tokens → base → layout
  → components → sections. Don't reorder those imports.
- **One CSS file can serve several sections.** The original artifact's authorship
  wasn't one `<style>` block per section: the `cx-` block (concepts/architecture author)
  covers concepts, architecture, modes *and* integrate, and the `rf-` block (reference
  author) covers plugins, commands, status, quantity, demo *and* traps. Rather than
  paste the same rules into four or six separate files, each shared block stays as one
  file in `src/styles/sections/`, named after the block, not the section.
- **Colour only via tokens** — every colour in `styles/` and in canvas-drawing code
  reads a `--token` from `tokens.css` (canvas code reads it live via
  `getComputedStyle`, so it re-paints correctly on a theme change).
- **`init…()` modules.** Every module in `src/modules/` exports an `init<Feature>()`
  function; `main.js` calls each one once, in the artifact's original `<script>` order.
  Module scripts are deferred, so the DOM is already complete when each `init` runs.
- **Class/id prefixes per feature author:** `cx-` (concepts/architecture/modes/integrate),
  `sim-` (the simulator), `rf-` (plugins/commands/status/quantity/demo/traps).

## A note on section/script ordering

The artifact was assembled from several authors' sections, and two of them ended up
split across the assembly: the concepts/architecture author's `<style>` block sits
right before the concepts section (its normal place), but that same author's `<script>`
was pushed down to just after the integrate section, because the simulator section was
inserted between architecture and modes during assembly. This repo follows the
*artifact's* actual order for both CSS cascade and script execution — not the tidier
order you'd get from the partial source files — since the artifact file is the ground
truth.

## The icon

Traced as a vector from the Siemens library icon supplied for LSKI: a control panel with
a kinematics glyph and a command list, in a rounded-square plate. Plate `#00C1B6`,
linework `#000028`.

## Re-publishing as an artifact

```
npm run artifact
```

runs `vite build` and then `tools/build-artifact.mjs`, which inlines the built CSS as a
`<style>` block and the built JS as a `<script type="module">` block into
`dist/artifact.html`, strips the `<!doctype>`/`<html>`/`<head>`/`<body>` wrapper and the
favicon `<link>`s (an Artifact's tab icon comes from the publish call's `icon`
parameter, not a linked file), and keeps `<title>` and the Google Fonts links. The
result is a fragment ready to hand back to Claude's Artifact tool — no document wrapper,
because the Artifact runtime supplies its own.

## Sources

Sourced from the **SIMATIC S7-1500T Kinematics Integrator (LSKI) V4.1** manual, its HMI
manual and its Getting Started manual — Siemens Industry Online Support entry
**109802248**, V4.1, 04/2026 — cross-checked against the
**LSKI_V4_1_0_GettingStarted_TiaPrj_V20** demo project. Tables and command/status lists
are reproduced as the manual states them, including a couple of the manual's own
inconsistencies (noted on the page itself, in the Traps and Demo sections). This page is
a reading aid, not a substitute for the manuals.
