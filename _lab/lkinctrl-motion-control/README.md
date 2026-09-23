# Path Motion Control

An interactive guide to the Siemens LKinCtrl kinematics control library (Siemens Industry Online
Support, Entry ID 109755891, LKinCtrl V5.3, 04/2026), covering the `LKinCtrl_MC_MovePath`
function block that drives a TO Kinematics from a PathData command list — plus the standalone
power/reset/home/jog/pick-and-place blocks, conveyor tracking, flags, and the full PathData
field, command, flag-mode and error-identifier reference. The centrepiece is the Path lab: an
editable PathData command list, rendered live against a small Cartesian model you can run,
interrupt, continue and single-step.

This repo is a WebStorm / Vite reorganisation of a single-file Claude artifact into modules. The
page's behaviour is unchanged — every element, every stylesheet rule and every script was moved
out of one HTML file into the structure below, not rewritten.

## Running it

```
npm install
npm run dev       # http://localhost:5173
npm run build      # production build into dist/
npm run preview    # serve the production build locally
```

Because the code is ES modules, **opening `index.html` straight from disk will not work** —
browsers block module imports over the `file://` protocol. Always go through the Vite dev
server. In WebStorm: open `package.json` and click the ▶ run icon next to `"dev"`.

## File map

```
index.html                          Document shell: <head> + @include lines + the module entry script
vite.config.js                      base: './' and the local @include partial-stitching plugin
package.json                        scripts (dev/build/preview/artifact) + the one dependency (vite)
tools/build-artifact.mjs            Re-inlines a production build into dist/artifact.html
public/
  icon.svg                          Favicon (vector) — the LKinCtrl library icon
  favicon.ico                       16/32/48 px icon for older browsers
  apple-touch-icon.png              180×180 home-screen icon
src/
  main.js                           Entry point: imports every stylesheet (cascade order), then
                                     boots every feature module (original script order)
  partials/
    masthead.html                   The hero banner
    topbar.html                     Sticky section nav + theme button
    footer.html                     Page footer / credit line
  sections/                         One file per <section id="…">, in page order
    concept.html                    §1 What LKinCtrl is and how it's built
    movepath.html                   §2 LKinCtrl_MC_MovePath interface and operating modes
    simulator.html                  §3 Path lab — the interactive PathData simulator (markup only;
                                     its own <style> block moved to styles/sections/sim.css)
    gettingstarted.html             The demo project's scenarios, screens and reconstructed
                                     PathData listings, read out of the shipped TIA project
    pathdata.html                   §2.3 PathData field reference (search box + table)
    commands.html                   §3 Command catalogue (filter pills + search + cards)
    flags.html                      §3.10 Flag / ValueFlag timing-mode reference
    tracking.html                   §3.7 Conveyor tracking (static reference)
    standalone.html                 §4–5 Standalone FBs (static reference)
    errors.html                     §6–7 Errors, status & configuration tags (filter + search)
    traps.html                      Field notes — static, plus the page's own credit line
  styles/
    tokens.css                      Every custom property: light, prefers-color-scheme dark, and
                                     [data-theme="dark"]
    base.css                        The Artifact runtime's injected reset + element defaults
                                     (body, h1–h4, p, a, code/.mono, table, button, focus, reduced-motion)
    layout.css                      .wrap, .sec, masthead, topbar/nav, footer
    components.css                  .card .pad .grid .box(.caution/.notice) .pill(.on) .tag
                                     .scrollx .num .eyebrow .lede .themebtn
    sections/
      pc.css                        #concept + #movepath (`pc-` prefix) — one shared <style> block
                                     in the source, kept as one file
      sim.css                       #simulator (`sim-` prefix)
      gs.css                        #gettingstarted (`gs-` prefix)
      rf.css                        The seven reference sections, #pathdata…#traps (`rf-` prefix)
                                     — one shared <style> block in the source, kept as one file
  modules/
    conceptMovepath.js              initConceptMovepath() — interface-table P-Type filter +
                                     operating-mode tabs (§ concept/movepath)
    simulator.js                    initSimulator() — the Path lab: model, timeline/geometry
                                     build, run/interrupt/continue/stop/step state machine, list
                                     + canvas rendering, all event wiring
    gettingStarted.js               initGettingStarted() — the Scenario 1/2/3 tab switcher
    pathDataReference.js            initPathDataReference() — PathData field search table
    commandCatalogue.js             initCommandCatalogue() — command-family filter + search
    flagModes.js                    initFlagModes() — flag-mode reference search table
    errorReference.js               initErrorReference() — error/status group filter + search
    theme.js                        initTheme() — light/dark toggle, persisted to localStorage
    scrollspy.js                    initScrollspy() — top-nav current-section highlighter
    util/
      dom.js                        $ / $all / esc — shared by the four reference modules
      geometry.js                   Pure numeric/geometry/colour helpers used by the simulator
                                     (circle fits, arc/line sampling, blend fillets, colour lerp)
  data/
    pathdata-fields.js               PD_FIELDS — 53 PathData field entries
    commands.js                     CMD_FAMILIES — the 13 command families covering the
                                     library's 29 cmdType values
    flags.js                        FLAG_MODES — the 14 flagMode reference entries
    errors.js                       ERR_GROUPS + ERR_ROWS — 204 status/error identifiers,
                                     grouped by the block that raises them
```

## Conventions

- **Partial includes.** `index.html` pulls in every partial and section with
  `<!-- @include src/path/to/file.html -->`, expanded by a small Vite plugin
  (`vite.config.js`) at both dev and build time — the page is fully present at first paint,
  with no runtime fetch. Includes may nest; a missing include fails the build with a clear error.
- **CSS cascade order is load-bearing.** `main.js` imports the stylesheets in exactly the order
  their `<style>` blocks appeared in the original document: tokens → base → layout → components
  → each section's own block, in page order. Don't reorder these imports.
- **Colour only via tokens** — every colour is a `var(--…)` custom property from `tokens.css`,
  defined for light mode, `prefers-color-scheme: dark`, and an explicit `[data-theme="dark"]`
  override (the theme button sets the latter and remembers it in `localStorage`).
- **`init…()` modules.** Each module lifted from one of the artifact's closing `<script>` IIFEs
  exports a single `init…()` that runs that IIFE's body; `main.js` calls them in the original
  script order. Module scripts are deferred, so the DOM is complete before any `init…()` runs —
  matching the originals, which executed after their own markup.
- **Class/id prefixes per section:** `pc-` (concept/movepath), `sim-` (Path lab), `gs-` (getting
  started), `rf-` (the seven reference sections).

## The icon

Traced from the Siemens LKinCtrl library icon (an articulated arm over a gantry frame): plate
`#00C1B6`, linework `#000028`.

## Re-publishing as an artifact

```
npm run artifact
```

runs `vite build` and then `tools/build-artifact.mjs`, which inlines the built CSS as a single
`<style>` block and the built JS as a single `<script type="module">`, strips the document
wrapper (`<!doctype>`, `<html>`, `<head>`, `<body>`) and the favicon `<link>`s, and writes
`dist/artifact.html`. It has no document wrapper because that's what the Claude Artifact runtime
supplies at publish time — an artifact is a fragment, not a full page — and it carries no favicon
links because an artifact's tab icon comes from the publish call's `icon` parameter instead.

## Sources

Drawn from the LKinCtrl V5.3 manual (Siemens Industry Online Support, Entry ID 109755891,
04/2026) and its Getting Started manual, as credited on the page itself (Traps section) and in
the footer. `support.industry.siemens.com → 109755891`. This page is a reading aid for quick
lookup — not a substitute for the manual, which remains the authority for anything
safety-relevant or version-specific.
