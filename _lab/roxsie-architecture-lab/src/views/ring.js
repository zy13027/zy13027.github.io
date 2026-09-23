/** The segment ring: writer head outside, reader tick inside, state by fill. */
import { cssVar } from '../lib/theme.js';
import { formatBytes, RING_DRAW_CAP } from '../lib/format.js';

const CX = 150;
const CY = 150;
const R_INNER = 62;
const R_OUTER = 110;
const LEGEND_X = 300;

const polar = (cx, cy, r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];

function wedgePath(cx, cy, r0, r1, a0, a1) {
  const p0 = polar(cx, cy, r1, a0);
  const p1 = polar(cx, cy, r1, a1);
  const p2 = polar(cx, cy, r0, a1);
  const p3 = polar(cx, cy, r0, a0);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return (
    `M${p0[0].toFixed(2)} ${p0[1].toFixed(2)}` +
    `A${r1} ${r1} 0 ${large} 1 ${p1[0].toFixed(2)} ${p1[1].toFixed(2)}` +
    `L${p2[0].toFixed(2)} ${p2[1].toFixed(2)}` +
    `A${r0} ${r0} 0 ${large} 0 ${p3[0].toFixed(2)} ${p3[1].toFixed(2)}Z`
  );
}

export function renderRing(svg, { snapshot, metrics, lifetime, readWindow, hasTopic }) {
  const mono = cssVar('--mono');
  if (!hasTopic) {
    svg.innerHTML = `<text x="220" y="150" text-anchor="middle" fill="${cssVar('--ink-weak')}" font-size="13" font-family="${mono}">Add a topic in the budget panel</text>`;
    return;
  }

  const drawn = Math.min(metrics.segments, RING_DRAW_CAP);
  const { cycle } = metrics;
  const accent = cssVar('--accent');
  const stroke = cssVar('--stroke');
  const ink = cssVar('--ink');
  const weak = cssVar('--ink-weak');
  const sub = cssVar('--ink-subtle');
  const err = cssVar('--err');
  const surface = cssVar('--surface-2');

  const gap = Math.min(0.035, ((Math.PI * 2) / drawn) * 0.16);
  const parts = [];

  for (let i = 0; i < drawn; i += 1) {
    const a0 = (i / drawn) * Math.PI * 2 - Math.PI / 2 + gap / 2;
    const a1 = ((i + 1) / drawn) * Math.PI * 2 - Math.PI / 2 - gap / 2;
    const age = snapshot.t - (snapshot.published[i] ?? -9999);
    const isLatest = i === snapshot.lastIndex;
    const freshness = Math.max(0, 1 - age / (drawn * cycle));

    let fill = surface;
    let opacity = 1;
    let width = 0.8;
    let edge = stroke;
    if (isLatest) {
      fill = accent;
      width = 1.6;
      edge = accent;
    } else if (age < lifetime) {
      fill = accent;
      opacity = 0.45;
      edge = accent;
    } else {
      fill = accent;
      opacity = 0.06 + 0.22 * freshness;
    }

    parts.push(
      `<path d="${wedgePath(CX, CY, R_INNER, R_OUTER, a0, a1)}" fill="${fill}" fill-opacity="${opacity.toFixed(2)}" stroke="${edge}" stroke-width="${width}"/>`,
    );

    if (drawn <= 26) {
      const mid = (a0 + a1) / 2;
      const [lx, ly] = polar(CX, CY, (R_INNER + R_OUTER) / 2, mid);
      parts.push(
        `<text x="${lx.toFixed(1)}" y="${(ly + 3.5).toFixed(1)}" text-anchor="middle" font-size="9.5" font-family="${mono}" fill="${isLatest ? cssVar('--accent-ink') : weak}">${i}</text>`,
      );
    }
  }

  // Writer head — the segment about to be overwritten.
  const writeIndex = (snapshot.lastIndex + 1) % drawn;
  const writeAngle = ((writeIndex + 0.5) / drawn) * Math.PI * 2 - Math.PI / 2;
  const [wx0, wy0] = polar(CX, CY, R_OUTER + 6, writeAngle);
  const [wx1, wy1] = polar(CX, CY, R_OUTER + 18, writeAngle);
  const [wlx, wly] = polar(CX, CY, R_OUTER + 30, writeAngle);
  parts.push(
    `<line x1="${wx1.toFixed(1)}" y1="${wy1.toFixed(1)}" x2="${wx0.toFixed(1)}" y2="${wy0.toFixed(1)}" stroke="${ink}" stroke-width="2"/>`,
    `<text x="${wlx.toFixed(1)}" y="${(wly + 3).toFixed(1)}" text-anchor="middle" font-size="9" font-family="${mono}" fill="${ink}">W</text>`,
  );

  // Reader tick — inside the ring, on the published segment. No label: it would
  // land on the centre readout, which already names the index it points at.
  const torn = readWindow >= lifetime;
  const readAngle = ((snapshot.lastIndex + 0.5) / drawn) * Math.PI * 2 - Math.PI / 2;
  const [rx0, ry0] = polar(CX, CY, R_INNER - 2, readAngle);
  const [rx1, ry1] = polar(CX, CY, R_INNER - 13, readAngle);
  parts.push(
    `<line x1="${rx1.toFixed(1)}" y1="${ry1.toFixed(1)}" x2="${rx0.toFixed(1)}" y2="${ry0.toFixed(1)}" stroke="${torn ? err : accent}" stroke-width="2.5"/>`,
  );

  const age = snapshot.t - (snapshot.published[snapshot.lastIndex] || 0);
  parts.push(
    `<text x="${CX}" y="${CY - 6}" text-anchor="middle" font-size="10" font-family="${mono}" fill="${weak}" letter-spacing="1">LASTVALID</text>`,
    `<text x="${CX}" y="${CY + 16}" text-anchor="middle" font-size="24" font-weight="700" font-family="${mono}" fill="${ink}">${snapshot.lastIndex}</text>`,
    `<text x="${CX}" y="${CY + 33}" text-anchor="middle" font-size="10" font-family="${mono}" fill="${sub}">age ${age.toFixed(2)} ms</text>`,
  );

  // Side legend.
  parts.push(
    `<text x="${LEGEND_X}" y="46" font-size="10" font-family="${mono}" fill="${weak}" letter-spacing="1">RING STATE</text>`,
  );
  [
    ['published now', accent, 1],
    ['inside lifetime', accent, 0.45],
    ['expired, reusable', accent, 0.12],
  ].forEach(([label, colour, alpha], i) => {
    const y = 64 + i * 21;
    parts.push(
      `<rect x="${LEGEND_X}" y="${y - 9}" width="12" height="12" fill="${colour}" fill-opacity="${alpha}" stroke="${stroke}"/>`,
      `<text x="${LEGEND_X + 19}" y="${y + 1}" font-size="11" font-family="${mono}" fill="${sub}">${label}</text>`,
    );
  });

  parts.push(
    `<line x1="${LEGEND_X}" y1="129" x2="${LEGEND_X + 12}" y2="129" stroke="${ink}" stroke-width="2"/>`,
    `<text x="${LEGEND_X + 19}" y="132" font-size="11" font-family="${mono}" fill="${sub}">W · writer, next up</text>`,
    `<line x1="${LEGEND_X}" y1="150" x2="${LEGEND_X + 12}" y2="150" stroke="${torn ? err : accent}" stroke-width="2.5"/>`,
    `<text x="${LEGEND_X + 19}" y="153" font-size="11" font-family="${mono}" fill="${sub}">reader, inner tick</text>`,

    `<text x="${LEGEND_X}" y="180" font-size="10" font-family="${mono}" fill="${weak}" letter-spacing="1">FORMULA</text>`,
    `<text x="${LEGEND_X}" y="198" font-size="11" font-family="${mono}" fill="${ink}">N = 3 + L/C</text>`,
    `<text x="${LEGEND_X}" y="214" font-size="11" font-family="${mono}" fill="${sub}">= 3 + ${lifetime}/${cycle.toFixed(2)}</text>`,
    // The substituted expression can run long, so the result gets its own line
    // rather than sitting beside it.
    `<text x="${LEGEND_X}" y="233" font-size="14" font-weight="700" font-family="${mono}" fill="${accent}">= ${metrics.segments}</text>`,
  );
  if (metrics.segments > RING_DRAW_CAP) {
    parts.push(
      `<text x="${LEGEND_X + 42}" y="233" font-size="9.5" font-family="${mono}" fill="${cssVar('--crit')}">ring drawn as ${RING_DRAW_CAP}</text>`,
    );
  }
  parts.push(
    `<text x="${LEGEND_X}" y="256" font-size="10" font-family="${mono}" fill="${weak}" letter-spacing="1">BUFFER</text>`,
    `<text x="${LEGEND_X}" y="274" font-size="13" font-weight="700" font-family="${mono}" fill="${ink}">${formatBytes(metrics.bytes)}</text>`,
    `<text x="${LEGEND_X}" y="290" font-size="10" font-family="${mono}" fill="${sub}">16 B header + ${metrics.segments} × ${metrics.segment} B</text>`,
  );

  svg.innerHTML = parts.join('');
}
