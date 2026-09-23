// Interpreter simulator: entry point. Ties together the sub-modules this feature was
// split into (state, program list, colours, motion, interpreter engine, controls,
// rendering, canvas) because the artifact's single 877-line simulator <script> exceeds
// the ~700-line-per-file guideline. Call order matches the artifact's own top-to-bottom
// execution order.
import { cacheDom } from './state.js';
import { buildProgramList } from './program-list.js';
import { readColours, watchTheme } from './colours.js';
import { startLoop } from './engine.js';
import { wireControls } from './controls.js';
import { renderAll } from './render.js';
import { draw } from './canvas.js';

export function initSimulator() {
  var root = document.getElementById("simulator");
  if (!root) return;

  cacheDom();
  buildProgramList();
  readColours(draw);
  watchTheme(function () { readColours(draw); });
  startLoop();
  wireControls();

  /* ================= initial paint ================= */
  renderAll();
  draw();
}
