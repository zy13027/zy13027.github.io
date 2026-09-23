/**
 * Limits and arithmetic taken from the RIB programming manual (A5E52046002-AD)
 * and the ROXSIE limitations page. Every constant here is a published figure —
 * if you change one, change the citation in README.md with it.
 */

/** Lifetime-buffer header: version(2) + type(2) + count(4) + size(4) + lastValid(4). */
export const HEADER_BYTES = 16;

/** RIB §4.2.3 — "The maximum size of VMM shared memory is 8 MB." */
export const VMM_MAX_BYTES = 8 * 1024 * 1024;

/** ROXSIE limitations — a Software Controller offers 20 cyclic interrupt OBs in total. */
export const MAX_CYCLIC_OBS = 20;

/** ROXSIE limitations — up to 16 topics per direction. */
export const MAX_OBS_PER_DIRECTION = 16;

/** YAML config reference — rate must be > 0.0 and <= 1000.0. */
export const MAX_TOPIC_RATE_HZ = 1000;

/**
 * Above this rate, complex types (strings, sequences, nested structures) are
 * documented as a data-loss and cycle-time risk.
 */
export const COMPLEX_TYPE_RATE_HZ = 100;

/** Beyond this the ring is unreadable, so the drawing caps out and says so. */
export const RING_DRAW_CAP = 56;

/** RIB §4.2.3 — segment size is the symbol sum rounded up to the next multiple of 8. */
export const align8 = (bytes) => Math.ceil(bytes / 8) * 8;

/** Writer cycle implied by a topic rate. */
export const cycleMs = (rateHz) => 1000 / rateHz;

/**
 * RIB §4.2.3 — Number-of-Segments = 3 + Lifetime / Cycle-time.
 * The manual's worked example (lifetime 3 ms, cycle 1 ms) gives 6; so does this.
 * The ceiling is ours: a fractional segment cannot exist.
 */
export const segmentCount = (lifetimeMs, cycle) => 3 + Math.ceil(lifetimeMs / cycle);

/** RIB §4.2.3 — Size = Header + Number-of-Segments * Segment-size. */
export const bufferBytes = (segments, segmentSize) => HEADER_BYTES + segments * segmentSize;

/**
 * Time a just-published element is guaranteed untouched: the writer needs a full
 * lap minus the element it is standing on before it can overwrite it.
 */
export const holdMs = (segments, cycle) => (segments - 1) * cycle;

export function formatBytes(n) {
  if (n >= 1048576) return `${(n / 1048576).toFixed(2)} MB`;
  if (n >= 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${n} B`;
}
