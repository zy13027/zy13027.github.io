// Button / select / range control wiring, plus the one-shot autoplay demo.
// Moved verbatim from the artifact's simulator <script>.
import { state, dom, HOME } from './state.js';
import { renderAll, renderCoreOnly } from './render.js';
import { pushError, pushNote } from './errors.js';
import { tickInterpreterLoop, isActivePhase } from './engine.js';

export function operationAllowsRun() {
  if (state.operationMode === "manual" || state.operationMode === "nooperation") return { ok: false, code: "16#8105", name: "ERR_INVALID_OPERATION_MODE", msg: "Operation mode '" + opmodeLabel() + "' does not permit program execution." };
  if (state.operationMode === "testrun" && !state.motionEnable) return { ok: false, code: "16#8103", name: "ERR_MISSING_MOTION_ENABLE", msg: "Test run requires motion enable to be TRUE before the program can run." };
  return { ok: true };
}
export function opmodeLabel() {
  return { full: "Full operation", automatic: "Automatic", manual: "Manual", testrun: "Test run", nooperation: "No operation" }[state.operationMode];
}

export function wireControls() {
  var btnInit = dom.btnInit, btnStart = dom.btnStart, btnInterrupt = dom.btnInterrupt,
    btnContinue = dom.btnContinue, btnStop = dom.btnStop, btnCyclestop = dom.btnCyclestop,
    btnFaststop = dom.btnFaststop, btnStep = dom.btnStep;
  var btnModeAuto = dom.btnModeAuto, btnModeSingle = dom.btnModeSingle;
  var selOpmode = dom.selOpmode, btnME = dom.btnME;
  var inputOverride = dom.inputOverride, elOverrideValue = dom.elOverrideValue;
  var elSinglestepNote = dom.elSinglestepNote;

  btnInit.addEventListener("click", function () {
    onUserInteract();
    if (state.programState === "Running" || state.programState === "Initialising" || state.programState === "Stopping") {
      pushNote("Initialize refused: a program is already active. Stop it first.");
      return;
    }
    state.fastStopActive = false;
    state.aborted = false;
    state.programInitialized = false;
    state.axesHomed = false;
    state.interpreterIndex = 0;
    state.programState = "Initialising";
    state.blockedOnMotion = false; state.blockedOnTimer = false; state.pendingTicks = 0;
    state.activeMotion = null; state.queuedMotion = [];
    state.pathHistory = [];
    state.pos = { x: HOME.x, z: HOME.z };
    renderAll();
    tickInterpreterLoop();
  });

  btnStart.addEventListener("click", function () {
    onUserInteract();
    if (state.programState === "Running" || state.programState === "Initialising" || state.programState === "Stopping") { return; }
    if (state.programState === "Interrupted") { pushNote("Start refused: program is interrupted. Use Continue."); return; }
    if (!state.programInitialized) {
      pushError("16#8704", "ERR_AXIS_NOT_HOMED", "At least one axis is not homed. Run Initialize before Start.");
      return;
    }
    if (state.fastStopActive) {
      pushNote("Start refused: a fast stop is held. Initialize to clear it.");
      return;
    }
    var check = operationAllowsRun();
    if (!check.ok) { pushError(check.code, check.name, check.msg); return; }
    state.interpreterIndex = 4;
    state.programState = "Running";
    state.programActive = true;
    state.cycleStopRequested = false;
    state.firstCallDone = false;
    renderAll();
    tickInterpreterLoop();
  });

  btnInterrupt.addEventListener("click", function () {
    onUserInteract();
    if (state.programState !== "Running" && state.programState !== "Initialising") { return; }
    state.prevPhase = state.programState;
    state.programState = "Interrupted";
    renderAll();
  });
  btnContinue.addEventListener("click", function () {
    onUserInteract();
    if (state.programState !== "Interrupted") { return; }
    state.programState = state.prevPhase || "Running";
    renderAll();
    tickInterpreterLoop();
  });

  btnStop.addEventListener("click", function () {
    onUserInteract();
    if (state.programState === "Not initialised" || state.programState === "Stopped" || state.programState === "Fast stopped") { return; }
    state.queuedMotion = [];
    state.blockedOnMotion = false; state.blockedOnTimer = false; state.pendingTicks = 0;
    state.interpreterIndex = 17;
    state.programState = "Stopping";
    pushNote("Stop pressed: running the stop routine from *** STOP ROUTINE ***.");
    renderAll();
    tickInterpreterLoop();
  });

  btnCyclestop.addEventListener("click", function () {
    onUserInteract();
    if (state.programState !== "Running") { return; }
    state.cycleStopRequested = true;
    pushNote("Cycle stop requested. The product in hand will finish; the next pass branches to the stop routine.");
    renderAll();
  });

  btnFaststop.addEventListener("click", function () {
    onUserInteract();
    if (state.programState === "Not initialised" || state.programState === "Fast stopped") { return; }
    if (state.activeMotion) {
      state.abortPos = { x: state.pos.x, z: state.pos.z };
      state.aborted = true;
    }
    state.activeMotion = null;
    state.queuedMotion = [];
    state.blockedOnMotion = false; state.blockedOnTimer = false; state.pendingTicks = 0;
    state.fastStopActive = true;
    state.programState = "Fast stopped";
    state.programActive = false;
    pushNote("Fast stop: motion halted immediately, stop routine skipped, program aborted.");
    renderAll();
  });

  btnStep.addEventListener("click", function () {
    onUserInteract();
    if (state.programMode !== "singlestep") { return; }
    if (!isActivePhase()) { return; }
    state.awaitStep = true;
  });

  btnModeAuto.addEventListener("click", function () {
    onUserInteract();
    state.programMode = "automatic";
    btnModeAuto.classList.add("on"); btnModeAuto.setAttribute("aria-pressed", "true");
    btnModeSingle.classList.remove("on"); btnModeSingle.setAttribute("aria-pressed", "false");
    elSinglestepNote.hidden = true;
    renderAll();
  });
  btnModeSingle.addEventListener("click", function () {
    onUserInteract();
    state.programMode = "singlestep";
    btnModeSingle.classList.add("on"); btnModeSingle.setAttribute("aria-pressed", "true");
    btnModeAuto.classList.remove("on"); btnModeAuto.setAttribute("aria-pressed", "false");
    elSinglestepNote.hidden = false;
    renderAll();
  });

  selOpmode.addEventListener("change", function () {
    onUserInteract();
    state.operationMode = selOpmode.value;
    if (isActivePhase()) {
      var check = operationAllowsRun();
      if (!check.ok) {
        pushError(check.code, check.name, check.msg);
        state.queuedMotion = [];
        state.interpreterIndex = 17;
        state.programState = "Stopping";
        state.blockedOnMotion = false; state.blockedOnTimer = false;
        tickInterpreterLoop();
      }
    }
    renderAll();
  });

  btnME.addEventListener("click", function () {
    onUserInteract();
    state.motionEnable = !state.motionEnable;
    btnME.textContent = state.motionEnable ? "ON" : "OFF";
    btnME.classList.toggle("on", state.motionEnable);
    btnME.setAttribute("aria-pressed", state.motionEnable ? "true" : "false");
    if (!state.motionEnable && state.operationMode === "testrun" && state.programState === "Running") {
      pushError("16#8103", "ERR_MISSING_MOTION_ENABLE", "Motion enable dropped during Test run. Motion halted.");
      state.abortPos = { x: state.pos.x, z: state.pos.z };
      state.aborted = true;
      state.activeMotion = null; state.queuedMotion = [];
      state.blockedOnMotion = false; state.blockedOnTimer = false;
      state.programState = "Stopped";
      state.programActive = false;
    }
    renderAll();
  });

  inputOverride.addEventListener("input", function () {
    onUserInteract();
    state.override = parseInt(inputOverride.value, 10);
    elOverrideValue.textContent = state.override + "%";
    renderCoreOnly();
  });

  var autoplayTimer = null, userTouched = false, isAutoplaying = false;
  function onUserInteract() {
    if (isAutoplaying) return; // scripted autoplay clicks must not cancel themselves
    userTouched = true;
    if (autoplayTimer) { clearTimeout(autoplayTimer); autoplayTimer = null; }
  }
  autoplayTimer = setTimeout(function () {
    if (userTouched) return;
    isAutoplaying = true; btnInit.click(); isAutoplaying = false;
    autoplayTimer = setTimeout(function () {
      if (userTouched) return;
      isAutoplaying = true; btnStart.click(); isAutoplaying = false;
    }, 1400);
  }, 900);
}
