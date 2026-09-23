// Reads the theme's CSS custom properties into COL at paint time, and re-reads them
// whenever the theme changes — kept exactly as the artifact's simulator <script> did it.
// `onChange` lets the caller (index.js) trigger a redraw without this module importing
// canvas.js directly.
import { COL } from './state.js';

export function readColours(onChange) {
  var cs = getComputedStyle(document.documentElement);
  function g(n) { return cs.getPropertyValue(n).trim(); }
  Object.assign(COL, {
    text: g("--text"), text2: g("--text-2"), textDim: g("--text-dim"),
    line: g("--line"), lineSoft: g("--line-soft"),
    surface: g("--surface"), surface2: g("--surface-2"), surface3: g("--surface-3"),
    accent: g("--accent"), accent2: g("--accent-2"),
    pink: g("--pink"), blue: g("--blue"), amber: g("--amber"),
    ok: g("--ok"), warn: g("--warn"), err: g("--err")
  });
  if (onChange) onChange();
}

export function watchTheme(onChange) {
  try {
    new MutationObserver(function () { readColours(onChange); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    if (window.matchMedia) { matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () { readColours(onChange); }); }
  } catch (e) { }
}
