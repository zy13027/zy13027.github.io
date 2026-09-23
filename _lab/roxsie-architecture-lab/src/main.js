/**
 * ROXSIE Architecture Lab — entry point.
 *
 * Wiring only: build the store, bind the views, run the animation loop. All the
 * engineering arithmetic is in src/lib/model.js and src/sim/lifetime-buffer.js,
 * and neither of those touches the DOM.
 */
import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/sim.css';

import { createStore } from './lib/store.js';
import { createLifetimeBuffer } from './sim/lifetime-buffer.js';
import { topicMetrics } from './lib/model.js';
import { cycleMs, RING_DRAW_CAP } from './lib/format.js';
import { initThemeToggle, onThemeChange, prefersReducedMotion } from './lib/theme.js';
import { AMR_PRESET } from './data/presets.js';

import { renderRing } from './views/ring.js';
import { createTrace } from './views/trace.js';
import { bindControls } from './views/controls.js';
import { bindTopicForm, populateTypeSelect, renderTopicTable } from './views/topic-table.js';
import { renderChecks, renderReadouts } from './views/checks.js';
import { renderStaleness } from './views/staleness.js';

const $ = (id) => document.getElementById(id);

/* ── elements ──────────────────────────────────────────────────────────── */
const el = {
  ring: $('ring'),
  trace: $('trace'),
  play: $('simPlay'),
  step: $('simStep'),
  controls: { rate: $('ctlRate'), lifetime: $('ctlLife'), readWindow: $('ctlRead'), speed: $('ctlSpeed') },
  labels: { rate: $('vRate'), cycle: $('vCycle'), lifetime: $('vLife'), readWindow: $('vRead'), speed: $('vSpeed') },
  readouts: {
    segments: $('roN'),
    hold: $('roHold'),
    margin: $('roMargin'),
    torn: $('roTorn'),
    verdict: $('verdict'),
    verdictText: $('verdictText'),
  },
  form: {
    direction: $('addDir'),
    type: $('addType'),
    rate: $('addRate'),
    add: $('btnAdd'),
    clear: $('btnClear'),
    preset: $('btnPreset'),
  },
  table: {
    body: $('topicBody'),
    footer: { segment: $('ftSeg'), bytes: $('ftBytes'), note: $('ftNote') },
  },
  checks: {
    obs: $('chkOB'),
    perDirection: $('chkDir'),
    memory: $('chkMem'),
    rate: $('chkRate'),
    verdict: $('budgetVerdict'),
    verdictText: $('budgetText'),
  },
  staleness: { bar: $('bbar'), key: $('bkey'), heading: $('budTopic'), text: $('budText') },
};

/* ── state ─────────────────────────────────────────────────────────────── */
const store = createStore({
  topics: AMR_PRESET.map((t) => ({ ...t })),
  selected: 1, // Odometry at 50 Hz — the direction with two sampling boundaries
  lifetime: 10,
  readWindow: 0.4,
  slowdown: 100,
  running: true,
});

const sim = createLifetimeBuffer();
const drawTrace = createTrace(el.trace);

/** The view model every renderer works from. */
function viewModel() {
  const { topics, selected, lifetime, readWindow } = store.state;
  const topic = topics[selected];
  return {
    hasTopic: Boolean(topic),
    topic,
    lifetime,
    readWindow,
    metrics: topic ? topicMetrics(topic, lifetime) : { cycle: 1, segments: 4, segment: 8, bytes: 48 },
    snapshot: sim.snapshot,
  };
}

function resetSimulation() {
  const vm = viewModel();
  if (!vm.hasTopic) return;
  sim.reset({
    segments: Math.min(vm.metrics.segments, RING_DRAW_CAP),
    cycle: vm.metrics.cycle,
    lifetime: vm.lifetime,
    readWindow: vm.readWindow,
  });
}

function paintSimulation() {
  const vm = viewModel();
  renderRing(el.ring, vm);
  drawTrace(vm);
  renderReadouts({ store, snapshot: vm.snapshot, elements: el.readouts });
}

function paintBudget() {
  renderTopicTable({ store, body: el.table.body, footer: el.table.footer, onChange: handleChange });
  renderChecks({ store, elements: el.checks });
  renderStaleness({ store, elements: el.staleness });
}

/* ── controls ──────────────────────────────────────────────────────────── */
const controls = bindControls({
  store,
  elements: el.controls,
  onChange: () => handleChange({ reselect: false }),
});

function handleChange({ reselect = false } = {}) {
  if (reselect) controls.syncFromSelection();
  resetSimulation();
  controls.renderLabels(el.labels);
  paintBudget();
  paintSimulation();
}

populateTypeSelect(el.form.type, 'nav_msgs/msg/Odometry');
bindTopicForm({ store, elements: el.form, onChange: handleChange });
initThemeToggle($('themeBtn'));

el.play.addEventListener('click', () => {
  const running = !store.state.running;
  store.set({ running });
  el.play.textContent = running ? 'Pause' : 'Play';
  if (running) {
    lastFrame = 0;
    requestAnimationFrame(frame);
  }
});

el.step.addEventListener('click', () => {
  store.set({ running: false });
  el.play.textContent = 'Play';
  const topic = store.state.topics[store.state.selected];
  sim.advance(cycleMs(topic ? topic.rate : 100) / 4);
  paintSimulation();
});

/* ── loop ──────────────────────────────────────────────────────────────── */
let lastFrame = 0;

function frame(timestamp) {
  if (!store.state.running) return;
  if (!lastFrame) lastFrame = timestamp;
  const deltaReal = Math.min(80, timestamp - lastFrame);
  lastFrame = timestamp;
  sim.advance(deltaReal / store.state.slowdown);
  paintSimulation();
  requestAnimationFrame(frame);
}

/* ── boot ──────────────────────────────────────────────────────────────── */
controls.syncFromSelection();
controls.readInitial();
resetSimulation();
// Give the trace a little history so the first paint is not an empty lane.
sim.advance(viewModel().metrics.cycle * 5);
handleChange({ reselect: false });

// Canvas and inline SVG carry literal colours, so repaint them on a theme flip.
onThemeChange(paintSimulation);

if (prefersReducedMotion()) {
  store.set({ running: false });
  el.play.textContent = 'Play';
} else {
  requestAnimationFrame(frame);
}
