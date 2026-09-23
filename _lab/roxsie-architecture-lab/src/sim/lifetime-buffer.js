/**
 * The lifetime-buffer model — pure, no DOM, no colours. Everything the ring and
 * the trace draw comes out of here, which makes the maths reviewable on its own.
 *
 * Writer (RIB §4.2.4): take the next segment, confirm its lifetime has expired,
 * write, then publish by updating LastValidBufferElementIndex.
 * Reader (RIB §4.2.5): note the time, read the index, read that segment, note the
 * time again; consistent only if less than one lifetime elapsed.
 *
 * Nothing makes the writer wait for the reader. A slow consumer gets torn data and
 * retries — it degrades into a retry loop, never back-pressure.
 */
export function createLifetimeBuffer() {
  let config = { segments: 6, cycle: 1, lifetime: 3, readWindow: 0.1 };
  let t = 0;
  let lastIndex = 0;
  let published = [];
  let nextWrite = 0;
  let nextRead = 0;
  let events = [];
  let tornReads = 0;

  /** Prime the ring so the very first frame already shows a working buffer. */
  function reset(next) {
    config = { ...config, ...next };
    const { segments, cycle } = config;
    t = 0;
    nextWrite = 0;
    nextRead = 0;
    lastIndex = segments - 1;
    events = [];
    tornReads = 0;
    published = Array.from({ length: segments }, (_, i) => -(segments - i) * cycle);
  }

  function advance(deltaMs) {
    const { segments, cycle, lifetime, readWindow } = config;
    const end = t + deltaMs;

    while (nextWrite <= end) {
      lastIndex = (lastIndex + 1) % segments;
      published[lastIndex] = nextWrite;
      events.push({ kind: 'write', t: nextWrite });
      nextWrite += cycle;
    }

    // The consumer samples at the same rate; readWindow is how long one read takes.
    while (nextRead + cycle <= end) {
      nextRead += cycle;
      const torn = readWindow >= lifetime;
      events.push({ kind: 'read', t: nextRead, duration: readWindow, torn, index: lastIndex });
      if (torn) tornReads += 1;
    }

    t = end;

    // Keep enough history to fill the widest trace window, and no more.
    const keep = Math.max(10 * cycle, 4 * lifetime + 4 * cycle);
    events = events.filter((e) => e.t > t - keep);
  }

  return {
    reset,
    advance,
    get snapshot() {
      return { t, lastIndex, published, events, tornReads, ...config };
    },
  };
}
