// Interpreter (executes the program, one command at a time) and the tick / animation
// scheduling loop that drives it. Moved verbatim from the artifact's simulator <script>.
import { PROGRAM, MAX_IMMEDIATE_PER_CYCLE } from '../../data/simulator-program.js';
import { state, reducedMotion, rowEls, P2 } from './state.js';
import { renderAll, renderCoreOnly } from './render.js';
import { pushNote } from './errors.js';
import { enqueueMotion, attachHeldBox, releaseHeldBox, completeActiveMotion } from './motion.js';
import { draw } from './canvas.js';

export function isActivePhase() {
  return state.programState === "Running" || state.programState === "Initialising" || state.programState === "Stopping";
}

export function advanceInterpreterIndex() {
  state.interpreterIndex = state.interpreterIndex + 1 <= 18 ? state.interpreterIndex + 1 : 18;
  tickInterpreterLoop();
}

export function beginTimedWait(ticks, onDone) {
  state.blockedOnTimer = true;
  state.pendingTicks = ticks;
  state.afterTimer = onDone;
  state.blockedCmdIndex = state.interpreterIndex;
}

export function executeCommand(cmd) {
  switch (cmd.n) {
    case 0: return; // InitStart, marker only
    case 1: beginTimedWait(2, function () { }); return;
    case 2: beginTimedWait(4, function () { state.axesHomed = true; }); return;
    case 3:
      state.programInitialized = true;
      state.programState = "Stopped";
      state.programActive = false;
      pushNote("Initialisation complete. Program ready at *** PICK CYCLE ***.");
      state.interpreterIndex = 4;
      renderAll();
      return "haltInit";
    case 4: return;
    case 5: case 6: case 9: case 10: case 11: case 14:
      enqueueMotion(cmd.n);
      if (cmd.trans === "done") { state.blockedOnMotion = true; state.blockedCmdIndex = cmd.n; }
      return;
    case 7: state.gripperClosed = true; attachHeldBox(); return;
    case 8: beginTimedWait(3, function () { /* part gripped sensed */ }); return;
    case 12: state.gripperClosed = false; releaseHeldBox(); return;
    case 13:
      state.productCounter++;
      return;
    case 15:
      if (state.cycleStopRequested) { state.interpreterIndex = 17; }
      else { state.interpreterIndex = 16; }
      return "jump";
    case 16: state.interpreterIndex = 4; return "jump";
    case 17: state.cycleStopRequested = false; return;
    case 18: beginTimedWait(2, function () {
      state.programState = "Stopped";
      state.programActive = false;
    }); return;
  }
}

export function tickInterpreterLoop() {
  if (!isActivePhase()) return;
  if (state.blockedOnMotion || state.blockedOnTimer) return;
  var singlestep = state.programMode === "singlestep";
  var guard = 0, flashed = [];
  var maxIter = singlestep ? 1 : MAX_IMMEDIATE_PER_CYCLE;
  while (guard < maxIter) {
    guard++;
    var cmd = PROGRAM[state.interpreterIndex];
    if (!cmd) break;
    flashed.push(cmd.n);
    var res = executeCommand(cmd);
    if (res === "haltInit") { flashRows(flashed); renderAll(); return; }
    if (cmd.motion && singlestep && !state.blockedOnMotion) {
      // Single step forces every transition to "When command done": no
      // blending partner is ever allowed to queue up behind this move.
      state.blockedOnMotion = true;
      state.blockedCmdIndex = cmd.n;
    }
    if (state.blockedOnMotion || state.blockedOnTimer) { break; }
    if (res === "jump") { continue; }
    if (cmd.trans === "immediate" || cmd.trans === "fixed") { state.interpreterIndex = Math.min(18, state.interpreterIndex + 1); continue; }
    if (cmd.trans === "next") { state.interpreterIndex = Math.min(18, state.interpreterIndex + 1); break; }
    if (cmd.trans === "done") { break; }
    break;
  }
  flashRows(flashed);
  renderAll();
}

export function flashRows(indices) {
  if (indices.length < 2) return;
  indices.forEach(function (n) {
    var row = rowEls[n];
    if (row) { row.classList.add("sim-row--flash"); }
  });
  setTimeout(function () {
    indices.forEach(function (n) { var row = rowEls[n]; if (row) row.classList.remove("sim-row--flash"); });
  }, reducedMotion ? 1 : 260);
}

/* ================= tick / animation scheduling ================= */
var TICK_MS = 150;

export function doTick() {
  if (!isActivePhase()) { return; }
  if (state.blockedOnTimer) {
    state.pendingTicks--;
    if (state.pendingTicks <= 0) {
      state.blockedOnTimer = false;
      var fn = state.afterTimer; state.afterTimer = null;
      var idx = state.blockedCmdIndex; state.blockedCmdIndex = -1;
      if (fn) fn();
      advanceInterpreterIndex();
      renderAll();
      return;
    }
    renderCoreOnly();
    return;
  }
  if (state.blockedOnMotion) { renderCoreOnly(); return; }
  if (state.programMode === "singlestep") {
    if (state.awaitStep) { state.awaitStep = false; tickInterpreterLoop(); }
    else { renderCoreOnly(); }
    return;
  }
  tickInterpreterLoop();
}

export function updateBelt(dtMs) {
  if (!isActivePhase()) return;
  var speed = 0.028 * (state.override / 100); // mm per ms at 100%
  state.beltBoxes.forEach(function (b) { b.x += speed * dtMs; });
  state.beltBoxes = state.beltBoxes.filter(function (b) { return b.x < P2.x + 260; });
  state.lastBeltSpawn += dtMs;
  if (state.lastBeltSpawn > 2600 && state.override > 0) {
    state.lastBeltSpawn = 0;
    state.beltBoxes.push({ x: -30 });
  }
}

export function updateMotion(dtMs) {
  if (!isActivePhase()) return;
  if (state.activeMotion && state.override > 0 && isFinite(state.activeMotion.dur)) {
    var m = state.activeMotion;
    m.prog = Math.min(1, m.prog + dtMs / m.dur);
    var e = m.prog < 0.5 ? 2 * m.prog * m.prog : 1 - Math.pow(-2 * m.prog + 2, 2) / 2;
    state.pos = {
      x: m.from.x + (m.target.x - m.from.x) * e,
      z: m.from.z + (m.target.z - m.from.z) * e
    };
    if (m.prog >= 1) { completeActiveMotion(); }
  }
}

var rafId = null, tmId = null, lastTs = 0;
function frame(ts) {
  if (!lastTs) lastTs = ts;
  var dt = ts - lastTs; lastTs = ts;
  if (dt > 0) {
    updateMotion(dt);
    updateBelt(dt);
  }
  if (ts - lastTickTs >= TICK_MS) { lastTickTs = ts; doTick(); }
  draw();
  rafId = requestAnimationFrame(frame);
}
var lastTickTs = 0;

function scheduleReduced() {
  doTick();
  updateBelt(TICK_MS);
  draw();
  tmId = setTimeout(scheduleReduced, TICK_MS);
}

export function startLoop() {
  if (reducedMotion) {
    if (!tmId) scheduleReduced();
  } else {
    if (!rafId) rafId = requestAnimationFrame(frame);
  }
}
