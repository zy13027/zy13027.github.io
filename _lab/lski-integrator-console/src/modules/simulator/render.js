// Reads `state` back onto the page: pointers, readouts, core outputs, queue, error
// buffer and button enablement. Moved verbatim from the artifact's simulator <script>.
import { PROGRAM } from '../../data/simulator-program.js';
import { state, dom, rowEls, arrowI, arrowM, fmt1 } from './state.js';
import { isActivePhase } from './engine.js';
import { opmodeLabel } from './controls.js';

export function renderPointers() {
  PROGRAM.forEach(function (cmd) {
    rowEls[cmd.n].classList.remove("sim-row--interp", "sim-row--motion");
    arrowI[cmd.n].classList.remove("on");
    arrowM[cmd.n].classList.remove("on");
  });
  var i = state.interpreterIndex;
  if (rowEls[i]) { rowEls[i].classList.add("sim-row--interp"); arrowI[i].classList.add("on"); }
  var mIdx = state.activeMotion ? state.activeMotion.cmdIndex : (state.blockedOnMotion ? state.blockedCmdIndex : null);
  if (mIdx != null && rowEls[mIdx]) { rowEls[mIdx].classList.add("sim-row--motion"); arrowM[mIdx].classList.add("on"); }
}

export function renderReadout() {
  dom.elAxisX.textContent = fmt1(state.pos.x) + " mm";
  dom.elAxisZ.textContent = fmt1(state.pos.z) + " mm";
  dom.elAxisA.textContent = fmt1(state.a) + "°";
  dom.elGripperPill.textContent = state.gripperClosed ? "Closed" : "Open";
  dom.elGripperPill.classList.toggle("on", state.gripperClosed);
}

export function statusWord() {
  if (state.errors.length && !state.errors[0].note && (Date.now() - state.errors[0].t) < 1800) {
    return state.errors[0].code;
  }
  if (state.operationMode === "manual" || state.operationMode === "nooperation") {
    if (state.programState !== "Not initialised" && isActivePhase()) return "16#7100";
  }
  if (!state.firstCallDone && isActivePhase()) { state.firstCallDone = true; return "16#7001"; }
  if (isActivePhase()) return "16#7002";
  return "16#7000";
}

export function renderCore() {
  dom.elOutState.textContent = state.programState;
  dom.elOutProgmode.textContent = state.programMode === "automatic" ? "Automatic (1)" : "Single step (2)";
  dom.elOutOpmode.textContent = opmodeLabel();
  dom.elOutOverride.textContent = state.override + "%";
  setBool(dom.elOutActive, state.programActive);
  setBool(dom.elOutInit, state.programInitialized);
  setBool(dom.elOutFaststop, state.fastStopActive, true);
  setBool(dom.elOutCyclestop, state.cycleStopRequested);
  dom.elOutStatus.textContent = statusWord();
  dom.elOutStatus.classList.toggle("sim-err", dom.elOutStatus.textContent.indexOf("16#8") === 0 || dom.elOutStatus.textContent === "16#7100");
}
export function setBool(el, v, dangerWhenTrue) {
  el.textContent = v ? "TRUE" : "FALSE";
  el.classList.toggle("sim-true", v && !dangerWhenTrue);
  el.classList.toggle("sim-err", v && !!dangerWhenTrue);
}

export function renderCoreOnly() { renderCore(); renderReadout(); }

export function renderQueue() {
  var items = [];
  if (state.activeMotion) {
    var c = PROGRAM[state.activeMotion.cmdIndex];
    items.push('<div class="sim-queue-item"><span class="sim-q-num">' + state.activeMotion.cmdIndex + '</span><span>' + c.name + ' — executing</span></div>');
  }
  state.queuedMotion.forEach(function (q) {
    var c = PROGRAM[q.cmdIndex];
    items.push('<div class="sim-queue-item"><span class="sim-q-num">' + q.cmdIndex + '</span><span>' + c.name + ' — queued</span></div>');
  });
  dom.elQueue.innerHTML = items.length ? items.join("") : '<p class="sim-empty">Empty</p>';
}

export function renderErrbuf() {
  if (!state.errors.length) { dom.elErrbuf.innerHTML = '<p class="sim-empty">No entries</p>'; return; }
  dom.elErrbuf.innerHTML = state.errors.map(function (e) {
    var cls = e.note ? "sim-errbuf-item sim-errbuf-item--note" : "sim-errbuf-item";
    var head = e.note ? e.code : (e.code + (e.name ? " · " + e.name : ""));
    return '<div class="' + cls + '"><span class="sim-errbuf-code">' + head + '</span><span class="sim-errbuf-msg">' + e.msg + '</span></div>';
  }).join("");
}

export function renderAll() {
  renderPointers();
  renderCore();
  renderReadout();
  renderQueue();
  updateButtonStates();
}

export function updateButtonStates() {
  var busy = state.programState === "Running" || state.programState === "Initialising" || state.programState === "Stopping";
  dom.btnInit.disabled = busy;
  dom.btnStart.disabled = busy || state.programState === "Interrupted";
  dom.btnInterrupt.disabled = !(state.programState === "Running" || state.programState === "Initialising");
  dom.btnContinue.disabled = state.programState !== "Interrupted";
  dom.btnStop.disabled = state.programState === "Not initialised" || state.programState === "Stopped" || state.programState === "Fast stopped";
  dom.btnCyclestop.disabled = state.programState !== "Running";
  dom.btnFaststop.disabled = state.programState === "Not initialised" || state.programState === "Fast stopped";
  dom.btnStep.disabled = state.programMode !== "singlestep" || !isActivePhase();
}
