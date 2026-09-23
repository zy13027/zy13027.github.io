/**
 * Rolling timeline. Writer publish ticks on the upper lane with the lifetime
 * envelope of the newest element; reader sampling windows on the lower lane,
 * green when they finish inside the lifetime and red when they do not.
 *
 * Only the newest publish gets an envelope drawn — at 1000 Hz with a 50 ms
 * lifetime every tick would overlap into mush.
 */
import { cssVar } from '../lib/theme.js';

const LANE_WRITER = 44;
const LANE_READER = 148;
const LEFT_GUTTER = 46;
const MONO = '11px "JetBrains Mono", ui-monospace, monospace';

export function createTrace(canvas) {
  const ctx = canvas.getContext('2d');

  return function draw({ snapshot, metrics, lifetime, readWindow, hasTopic }) {
    const W = canvas.width;
    const H = canvas.height;
    if (!hasTopic) {
      ctx.clearRect(0, 0, W, H);
      return;
    }

    const { cycle } = metrics;
    const span = Math.max(4 * cycle, 2.5 * lifetime);
    const t1 = snapshot.t;
    const t0 = t1 - span;
    const x = (ms) => LEFT_GUTTER + ((ms - t0) / span) * (W - 66);

    const bg = cssVar('--surface-2');
    const stroke = cssVar('--stroke');
    const accent = cssVar('--accent');
    const ink = cssVar('--ink');
    const sub = cssVar('--ink-subtle');
    const weak = cssVar('--ink-weak');
    const err = cssVar('--err');
    const ok = cssVar('--ok');

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    ctx.font = MONO;
    ctx.textBaseline = 'middle';

    // Lanes.
    ctx.fillStyle = weak;
    ctx.textAlign = 'left';
    ctx.letterSpacing = '1px';
    ctx.fillText('WRITER', 8, 18);
    ctx.fillText('READER', 8, 122);
    ctx.letterSpacing = '0px';

    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(LEFT_GUTTER, LANE_WRITER + 18);
    ctx.lineTo(W - 14, LANE_WRITER + 18);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(LEFT_GUTTER, LANE_READER + 18);
    ctx.lineTo(W - 14, LANE_READER + 18);
    ctx.stroke();
    ctx.globalAlpha = 0.45;
    ctx.beginPath();
    ctx.moveTo(8, 104);
    ctx.lineTo(W - 14, 104);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Publish ticks.
    const writes = snapshot.events.filter((e) => e.kind === 'write');
    writes.forEach((e) => {
      const px = x(e.t);
      if (px < LEFT_GUTTER - 2 || px > W - 12) return;
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, LANE_WRITER - 14);
      ctx.lineTo(px, LANE_WRITER + 18);
      ctx.stroke();
    });

    const newest = writes[writes.length - 1];
    if (newest) {
      const ax = Math.max(LEFT_GUTTER, x(newest.t));
      const bx = Math.min(W - 12, x(newest.t + lifetime));
      ctx.strokeStyle = accent;
      ctx.globalAlpha = 0.32;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(ax, LANE_WRITER + 30);
      ctx.lineTo(Math.max(ax + 2, bx), LANE_WRITER + 30);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.fillStyle = sub;
    ctx.textAlign = 'left';
    ctx.fillText(
      `publish ticks · lifetime of the newest element (${lifetime} ms)`,
      LEFT_GUTTER,
      LANE_WRITER + 46,
    );

    // Reader windows.
    snapshot.events
      .filter((e) => e.kind === 'read')
      .forEach((e) => {
        let a = x(e.t);
        let b = x(e.t + e.duration);
        if (b < LEFT_GUTTER - 2 || a > W - 12) return;
        a = Math.max(a, LEFT_GUTTER);
        b = Math.min(b, W - 12);
        const width = Math.max(2, b - a);
        ctx.fillStyle = e.torn ? err : ok;
        ctx.globalAlpha = 0.7;
        ctx.fillRect(a, LANE_READER - 12, width, 24);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = e.torn ? err : ok;
        ctx.lineWidth = 1;
        ctx.strokeRect(a, LANE_READER - 12, width, 24);
      });

    const torn = readWindow >= lifetime;
    ctx.fillStyle = torn ? err : sub;
    ctx.fillText(
      torn
        ? 'read window ≥ lifetime — torn, discard and retry'
        : 'read window inside lifetime — consistent',
      LEFT_GUTTER,
      LANE_READER + 40,
    );

    // Now marker and axis.
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(x(snapshot.t), 10);
    ctx.lineTo(x(snapshot.t), H - 26);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = weak;
    ctx.textAlign = 'right';
    ctx.fillText(`${span.toFixed(1)} ms window`, W - 14, H - 9);
    ctx.textAlign = 'left';
    ctx.fillText(`t = ${snapshot.t.toFixed(1)} ms`, LEFT_GUTTER, H - 9);
  };
}
