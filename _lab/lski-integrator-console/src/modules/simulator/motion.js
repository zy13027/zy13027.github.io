// Motion engine: queues and animates kinematics moves, and the pick/place box effects
// tied to them. Moved verbatim from the artifact's simulator <script>.
import { PROGRAM } from '../../data/simulator-program.js';
import { P1, P2, P3, state, reducedMotion, clampZ, placeZ, dist } from './state.js';
import { renderQueue, renderAll } from './render.js';
import { advanceInterpreterIndex } from './engine.js';

var BASE_SPEED = 230; // mm/s at 100% override

export function computeTarget(n) {
  if (n === 5) return { x: P1.x, z: P1.z };
  if (n === 6) return { x: P2.x, z: P2.z };
  if (n === 9) return { x: state.pos.x, z: clampZ(state.pos.z + 120) };
  if (n === 10) return { x: P3.x, z: P3.z };
  if (n === 11) return { x: 410, z: placeZ(state.stackDisplay.length) };
  if (n === 14) return { x: state.pos.x, z: clampZ(state.pos.z + 120) };
  return { x: state.pos.x, z: state.pos.z };
}

export function enqueueMotion(cmdIndex) {
  var target = computeTarget(cmdIndex);
  var item = { cmdIndex: cmdIndex, target: target };
  if (!state.activeMotion) {
    startActiveMotion(item);
  } else {
    state.queuedMotion.push(item);
  }
  renderQueue();
}
export function startActiveMotion(item) {
  var d = dist(state.pos, item.target);
  var speed = BASE_SPEED * (state.override / 100);
  var dur = speed > 0 ? Math.max(220, (d / speed) * 1000) : Infinity;
  state.activeMotion = { cmdIndex: item.cmdIndex, from: { x: state.pos.x, z: state.pos.z }, target: item.target, dur: dur, prog: 0 };
  if (reducedMotion) { finishActiveMotionNow(); }
}
export function finishActiveMotionNow() {
  if (!state.activeMotion) return;
  var m = state.activeMotion;
  state.pos = { x: m.target.x, z: m.target.z };
  completeActiveMotion();
}
export function completeActiveMotion() {
  var m = state.activeMotion;
  if (!m) return;
  var outgoingCmd = PROGRAM[m.cmdIndex];
  var blended = outgoingCmd.trans === "next" && state.queuedMotion.length > 0;
  state.pathHistory.push({ x: m.target.x, z: m.target.z, blended: blended });
  if (state.pathHistory.length > 14) state.pathHistory.shift();
  handlePlacePickEffects(m.cmdIndex);
  state.activeMotion = null;
  if (state.blockedOnMotion && state.blockedCmdIndex === m.cmdIndex) {
    state.blockedOnMotion = false;
    state.blockedCmdIndex = -1;
    advanceInterpreterIndex();
  }
  if (state.queuedMotion.length > 0) {
    var next = state.queuedMotion.shift();
    startActiveMotion(next);
  }
  renderAll();
}
function handlePlacePickEffects(cmdIndex) {
  // gripper attach happens on SetOutput (cmd 7/12), but visually snap held box position after cmd6 arrival
  if (cmdIndex === 6) {
    // arrived at pick point; nothing yet, wait for gripper close command
  }
}

export function attachHeldBox() {
  var best = null, bestD = 9999;
  state.beltBoxes.forEach(function (b) {
    var d = Math.abs(b.x - P2.x);
    if (d < bestD) { bestD = d; best = b; }
  });
  if (best && bestD < 60) {
    state.beltBoxes = state.beltBoxes.filter(function (b) { return b !== best; });
    state.heldBox = { picked: true };
  } else {
    state.heldBox = { picked: true };
  }
}
export function releaseHeldBox() {
  if (state.stackDisplay.length >= 9) state.stackDisplay = [];
  state.stackDisplay.push({});
  state.heldBox = null;
}
