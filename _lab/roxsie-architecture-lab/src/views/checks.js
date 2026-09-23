/** Simulator readouts, the consistency verdict, and the interface ceiling checks. */
import { formatBytes, MAX_CYCLIC_OBS, MAX_OBS_PER_DIRECTION, VMM_MAX_BYTES, COMPLEX_TYPE_RATE_HZ } from '../lib/format.js';
import { consistencyVerdict, interfaceTotals, topicMetrics } from '../lib/model.js';
import { cssVar } from '../lib/theme.js';

export function renderReadouts({ store, snapshot, elements }) {
  const { topics, selected, lifetime, readWindow } = store.state;
  const topic = topics[selected];
  if (!topic) {
    elements.segments.textContent = '—';
    elements.hold.textContent = '—';
    elements.margin.textContent = '—';
    return;
  }

  const m = topicMetrics(topic, lifetime);
  elements.segments.textContent = m.segments;
  elements.hold.textContent = `${m.hold.toFixed(2)} ms`;
  elements.margin.textContent = `${m.margin >= 0 ? '+' : ''}${m.margin.toFixed(2)} ms`;
  elements.margin.className = `v ${m.margin >= 0 ? 'good' : 'bad'}`;
  elements.torn.textContent = snapshot.tornReads;
  elements.torn.className = `v ${snapshot.tornReads > 0 ? 'bad' : 'good'}`;

  const verdict = consistencyVerdict({
    readWindowMs: readWindow,
    lifetimeMs: lifetime,
    cycle: m.cycle,
    hold: m.hold,
    margin: m.margin,
  });
  elements.verdict.className = `verdict ${verdict.level}`;
  elements.verdictText.innerHTML = verdict.html;
}

export function renderChecks({ store, elements }) {
  const { topics, lifetime } = store.state;
  const totals = interfaceTotals(topics, lifetime);

  elements.obs.textContent = `${topics.length} / ${MAX_CYCLIC_OBS}`;
  elements.obs.className = `v ${
    topics.length >= MAX_CYCLIC_OBS ? 'bad' : topics.length >= MAX_OBS_PER_DIRECTION ? 'warn' : 'good'
  }`;

  elements.perDirection.textContent = `${totals.r2p} / ${totals.p2r}`;
  elements.perDirection.className = `v ${
    totals.r2p > MAX_OBS_PER_DIRECTION || totals.p2r > MAX_OBS_PER_DIRECTION ? 'bad' : 'good'
  }`;

  elements.memory.textContent = `${formatBytes(totals.bytes)} / 8 MB`;
  elements.memory.className = `v ${
    totals.bytes > VMM_MAX_BYTES ? 'bad' : totals.bytes > VMM_MAX_BYTES / 2 ? 'warn' : 'good'
  }`;

  elements.rate.textContent = totals.maxRate ? `${totals.maxRate} Hz` : '—';
  elements.rate.className = `v ${
    totals.maxRate > 1000 ? 'bad' : totals.maxRate > COMPLEX_TYPE_RATE_HZ ? 'warn' : 'good'
  }`;

  if (!topics.length) {
    elements.verdict.className = 'verdict';
    elements.verdict.style.borderLeftColor = cssVar('--stroke');
    elements.verdictText.textContent = 'Add a topic to size the interface.';
    return;
  }

  elements.verdict.style.borderLeftColor = '';
  if (totals.issues.length) {
    elements.verdict.className = `verdict ${totals.severity}`;
    elements.verdictText.innerHTML = totals.issues.join(' ');
  } else {
    elements.verdict.className = 'verdict ok';
    elements.verdictText.innerHTML = `<b>Inside every published limit.</b> ${topics.length} topics, ${formatBytes(totals.bytes)} of shared memory, highest rate ${totals.maxRate} Hz.`;
  }
}
