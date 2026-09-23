/**
 * Every derived engineering number lives here, away from the DOM. If you want to
 * check the maths against the manual, this is the only file you need to read.
 */
import {
  align8,
  bufferBytes,
  cycleMs,
  holdMs,
  segmentCount,
  COMPLEX_TYPE_RATE_HZ,
  MAX_CYCLIC_OBS,
  MAX_OBS_PER_DIRECTION,
  MAX_TOPIC_RATE_HZ,
  VMM_MAX_BYTES,
} from './format.js';
import { isComplex, isWide, messageBytes } from '../data/messages.js';

/** Buffer geometry for one topic at the current global lifetime. */
export function topicMetrics(topic, lifetimeMs) {
  const cycle = cycleMs(topic.rate);
  const segment = align8(messageBytes(topic.type));
  const segments = segmentCount(lifetimeMs, cycle);
  return {
    cycle,
    segment,
    segments,
    bytes: bufferBytes(segments, segment),
    hold: holdMs(segments, cycle),
    margin: holdMs(segments, cycle) - lifetimeMs,
    wide: isWide(topic.type),
    fastComplex: topic.rate > COMPLEX_TYPE_RATE_HZ && isComplex(topic.type),
  };
}

/** Roll the whole interface up and test it against every published ceiling. */
export function interfaceTotals(topics, lifetimeMs) {
  const metrics = topics.map((t) => topicMetrics(t, lifetimeMs));
  const bytes = metrics.reduce((a, m) => a + m.bytes, 0);
  const segmentSum = metrics.reduce((a, m) => a + m.segment, 0);
  const r2p = topics.filter((t) => t.direction === 'r2p').length;
  const p2r = topics.length - r2p;
  const maxRate = topics.reduce((a, t) => Math.max(a, t.rate), 0);
  const fastComplex = metrics.filter((m) => m.fastComplex).length;

  const issues = [];
  if (topics.length >= MAX_CYCLIC_OBS) {
    issues.push(
      `<b>${topics.length} topics needs ${topics.length} cyclic interrupt OBs</b> — the Software Controller only has ${MAX_CYCLIC_OBS}, and your own program needs some of them.`,
    );
  } else if (topics.length >= MAX_OBS_PER_DIRECTION) {
    issues.push(
      `<b>${topics.length} of ${MAX_CYCLIC_OBS} cyclic interrupt OBs used</b> — little room left for the rest of the program.`,
    );
  }
  if (r2p > MAX_OBS_PER_DIRECTION || p2r > MAX_OBS_PER_DIRECTION) {
    issues.push(`More than ${MAX_OBS_PER_DIRECTION} topics in one direction.`);
  }
  if (bytes > VMM_MAX_BYTES) {
    issues.push('<b>Exceeds the 8 MB VMM shared-memory cap.</b>');
  }
  if (fastComplex) {
    issues.push(
      `${fastComplex} topic${fastComplex > 1 ? 's run' : ' runs'} complex types above ${COMPLEX_TYPE_RATE_HZ} Hz — documented as a data-loss and cycle-time risk.`,
    );
  }

  const severity =
    bytes > VMM_MAX_BYTES || topics.length >= MAX_CYCLIC_OBS ? 'bad' : issues.length ? 'warn' : 'ok';

  return { metrics, bytes, segmentSum, r2p, p2r, maxRate, issues, severity };
}

/**
 * Consistency of a single read, per the RIB read algorithm: note the time, read
 * LastValidBufferElementIndex, read the element, note the time again. Consistent
 * if less than one lifetime elapsed.
 */
export function consistencyVerdict({ readWindowMs, lifetimeMs, cycle, hold, margin }) {
  if (readWindowMs >= lifetimeMs) {
    return {
      level: 'bad',
      html: `<b>Torn reads.</b> The reader takes ${readWindowMs.toFixed(2)} ms but the lifetime is only ${lifetimeMs} ms, so every sample must be discarded and retried. Raise the lifetime with <code>RIB_App -l</code>, or make the read cheaper.`,
    };
  }
  if (readWindowMs >= cycle) {
    return {
      level: 'warn',
      html: `<b>Reader slower than the publish rate.</b> Each read takes ${readWindowMs.toFixed(2)} ms against a ${cycle.toFixed(2)} ms cycle, so the consumer cannot see every update. Data is consistent but you are dropping samples.`,
    };
  }
  if (readWindowMs > lifetimeMs * 0.6) {
    return {
      level: 'warn',
      html: `<b>Thin margin.</b> The read uses ${Math.round((readWindowMs / lifetimeMs) * 100)}% of the lifetime. The RIB manual advises against running near the limit — clock accuracy and memory management will eat what is left.`,
    };
  }
  return {
    level: 'ok',
    html: `<b>Consistent.</b> The reader finishes in ${readWindowMs.toFixed(2)} ms, well inside the ${lifetimeMs} ms lifetime, and the writer cannot return to a segment for ${hold.toFixed(2)} ms — ${margin.toFixed(2)} ms of headroom.`,
  };
}

/**
 * End-to-end staleness before the message reaches DDS.
 *
 * The asymmetry is documented in the YAML reference: under ros2_to_plc, `rate`
 * "configures PLC interrupt cycle"; under plc_to_ros2 it "configures both PLC
 * interrupt and ROS 2 timer callback". So one direction has a single sampling
 * boundary and the other has two, on clocks that are never phase-locked.
 *
 * The memcpy figure is an order-of-magnitude placeholder, not a Siemens spec —
 * it exists so the bar shows the transport is a rounding error.
 */
export const MEMCPY_MS = 0.002;

export function stalenessBudget(topic, tokens) {
  const cycle = cycleMs(topic.rate);
  if (topic.direction === 'r2p') {
    return {
      total: cycle,
      boundaries: 1,
      segments: [
        { label: 'DDS to the node', ms: null, colour: tokens.crit, note: 'outside RIB' },
        { label: 'memcpy', ms: MEMCPY_MS, colour: tokens.accent, note: 'order of magnitude, not a spec' },
        { label: `PLC samples at ${topic.rate} Hz`, ms: cycle, colour: tokens.info, note: 'up to one cycle of age' },
      ],
      html: `<b>One sampling boundary.</b> The subscriber writes on arrival, so RIB adds at most one PLC cycle — <b>${cycle.toFixed(2)} ms</b> worst case. Whatever DDS costs before that is yours to measure.`,
    };
  }
  return {
    total: 2 * cycle,
    boundaries: 2,
    segments: [
      { label: `PLC writes at ${topic.rate} Hz`, ms: cycle, colour: tokens.accent, note: 'up to one cycle of age' },
      { label: 'memcpy', ms: MEMCPY_MS, colour: tokens.info, note: 'order of magnitude, not a spec' },
      { label: `ROS timer at ${topic.rate} Hz`, ms: cycle, colour: tokens.accent, note: 'independent clock' },
      { label: 'DDS onward', ms: null, colour: tokens.crit, note: 'outside RIB' },
    ],
    html: `<b>Two sampling boundaries on independent clocks.</b> Worst-case age before the message even reaches DDS is <b>${(2 * cycle).toFixed(2)} ms</b> (typical about ${cycle.toFixed(2)} ms), and it drifts as the two clocks beat against each other. The memory copy is not the problem — the sampling is.`,
  };
}

export { MAX_TOPIC_RATE_HZ };
