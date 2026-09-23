// Simulator state, DOM cache and small geometry helpers, shared privately between the
// simulator's own sub-modules (nothing here is imported outside src/modules/simulator/).
// The `state`, `dom`, `COL`, `rowEls`, `arrowI` and `arrowM` objects are singletons —
// the same role the artifact's simulator <script> gave them as closure variables of its
// one IIFE.
//
// Moved verbatim from the artifact's simulator <script>, split out because the original
// 877-line IIFE exceeds the ~700-line-per-file guideline.

/* ================= geometry ================= */
export var AXIS = { xMin: 0, xMax: 500, zMin: 0, zMax: 260 };
export var HOME = { x: 250, z: 260 };
export var P1 = { x: 90, z: 190 };   // pick approach
export var P2 = { x: 90, z: 40 };    // pick
export var P3 = { x: 410, z: 190 };  // place approach
export function clampX(v) { return Math.min(AXIS.xMax, Math.max(AXIS.xMin, v)); }
export function clampZ(v) { return Math.min(AXIS.zMax, Math.max(AXIS.zMin, v)); }
export function placeZ(stackLen) { return Math.min(170, 90 + stackLen * 15); }

export var CW = 800, CH = 420, MARGIN = 64, BEAM_Y = 92, TABLE_Y = 352;
export function toCanvas(xmm, zmm) {
  var cx = MARGIN + (xmm / AXIS.xMax) * (CW - 2 * MARGIN);
  var ext = AXIS.zMax - zmm;
  var cy = BEAM_Y + (ext / AXIS.zMax) * (TABLE_Y - BEAM_Y);
  return { x: cx, y: cy };
}
export function dist(a, b) { var dx = a.x - b.x, dz = a.z - b.z; return Math.sqrt(dx * dx + dz * dz); }
export function fmt1(n) { return n.toFixed(1); }

/* ================= state ================= */
export var state = {
  programState: "Not initialised",   // Not initialised | Initialising | Stopped | Running | Interrupted | Stopping | Fast stopped
  prevPhase: null,
  programMode: "automatic",          // automatic | singlestep
  operationMode: "automatic",        // full | automatic | manual | testrun | nooperation
  motionEnable: false,
  override: 100,
  programInitialized: false,
  programActive: false,
  fastStopActive: false,
  cycleStopRequested: false,
  axesHomed: false,
  interpreterIndex: 0,
  pos: { x: HOME.x, z: HOME.z },
  a: 0,
  gripperClosed: false,
  productCounter: 0,
  stackDisplay: [],
  beltBoxes: [],
  heldBox: null,
  activeMotion: null,                // {cmdIndex, from, target, dur, t0, blendIn}
  queuedMotion: [],                  // [{cmdIndex, target}]
  pathHistory: [],                   // [{x,z,blended}]
  pendingTicks: 0,
  blockedOnTimer: false,
  blockedOnMotion: false,
  blockedCmdIndex: -1,
  afterTimer: null,
  errors: [],
  firstCallDone: false,
  awaitStep: false,
  aborted: false,
  abortPos: null,
  lastBeltSpawn: 0
};

export var reducedMotion = false;
try { reducedMotion = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { }

/* ================= colours (theme-aware, read at paint time) ================= */
export var COL = {};

/* ================= DOM cache ================= */
export var dom = {};
var $ = function (id) { return document.getElementById(id); };

export function cacheDom() {
  dom.elProglist = $("sim-proglist");
  dom.elCanvas = $("sim-canvas");
  dom.ctx = dom.elCanvas.getContext("2d");
  dom.elAxisX = $("sim-axis-x"); dom.elAxisZ = $("sim-axis-z"); dom.elAxisA = $("sim-axis-a");
  dom.elGripperPill = $("sim-gripper-pill");
  dom.elOutState = $("sim-out-state"); dom.elOutProgmode = $("sim-out-progmode"); dom.elOutOpmode = $("sim-out-opmode");
  dom.elOutOverride = $("sim-out-override"); dom.elOutActive = $("sim-out-active"); dom.elOutInit = $("sim-out-init");
  dom.elOutFaststop = $("sim-out-faststop"); dom.elOutCyclestop = $("sim-out-cyclestop"); dom.elOutStatus = $("sim-out-status");
  dom.elQueue = $("sim-queue"); dom.elErrbuf = $("sim-errbuf");
  dom.elSinglestepNote = $("sim-singlestep-note");
  dom.btnInit = $("sim-btn-init"); dom.btnStart = $("sim-btn-start"); dom.btnInterrupt = $("sim-btn-interrupt");
  dom.btnContinue = $("sim-btn-continue"); dom.btnStop = $("sim-btn-stop"); dom.btnCyclestop = $("sim-btn-cyclestop");
  dom.btnFaststop = $("sim-btn-faststop"); dom.btnStep = $("sim-btn-step");
  dom.btnModeAuto = $("sim-mode-auto"); dom.btnModeSingle = $("sim-mode-single");
  dom.selOpmode = $("sim-opmode"); dom.btnME = $("sim-me-toggle");
  dom.inputOverride = $("sim-override"); dom.elOverrideValue = $("sim-override-value");
}

/* ================= per-row DOM refs, populated by program-list.js ================= */
export var rowEls = {}, arrowI = {}, arrowM = {};
