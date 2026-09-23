// Pure numeric, geometry and colour helpers used by the path-lab simulator.
// None of these touch DOM or module state — split out of the simulator's
// closing <script> verbatim so the stateful engine in simulator.js stays
// focused on the model / runner / rendering it actually owns.

export function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
export function lerp(a, b, t) { return a + (b - a) * t; }
export function d2r(d) { return d * Math.PI / 180; }
export function r2d(r) { return r * 180 / Math.PI; }
export function fmt(n, d) { d = d === undefined ? 0 : d; return (Math.round(n * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d); }

export function circCenterArc(sx, sy, cx, cy, arcDeg, pathChoice) {
  var radius = Math.hypot(sx - cx, sy - cy);
  var a0 = Math.atan2(sy - cy, sx - cx);
  var sweep = d2r(arcDeg) * (pathChoice === 1 ? -1 : 1);
  return { cx: cx, cy: cy, radius: radius, a0: a0, sweep: sweep, ex: cx + radius * Math.cos(a0 + sweep), ey: cy + radius * Math.sin(a0 + sweep), invalid: radius < 1e-6 };
}
export function circTwoPtRadius(sx, sy, ex, ey, radius, pathChoice) {
  var dx = ex - sx, dy = ey - sy, d = Math.hypot(dx, dy);
  if (d < 1e-6) return { cx: sx, cy: sy, radius: 0, a0: 0, sweep: 0, invalid: true };
  var invalid = radius < d / 2 - 1e-6;
  var rr = Math.max(radius, d / 2 + 1e-3);
  var mx = (sx + ex) / 2, my = (sy + ey) / 2;
  var h = Math.sqrt(Math.max(0, rr * rr - (d / 2) * (d / 2)));
  var ux = -dy / d, uy = dx / d;
  var centers = [{ x: mx + ux * h, y: my + uy * h }, { x: mx - ux * h, y: my - uy * h }];
  var wantShort = (pathChoice === 0 || pathChoice === 1), wantCCW = (pathChoice === 0 || pathChoice === 2);
  var best = null;
  centers.forEach(function (c) {
    var a0 = Math.atan2(sy - c.y, sx - c.x), a1 = Math.atan2(ey - c.y, ex - c.x);
    var ccw = a1 - a0; while (ccw <= 0) ccw += 2 * Math.PI;
    var isShortCCW = ccw <= Math.PI;
    var shortSweep = isShortCCW ? ccw : ccw - 2 * Math.PI;
    var longSweep = isShortCCW ? ccw - 2 * Math.PI : ccw;
    var cand = wantShort ? shortSweep : longSweep;
    var isCCW = cand > 0;
    if (isCCW === wantCCW && !best) best = { cx: c.x, cy: c.y, radius: rr, a0: a0, sweep: cand };
  });
  if (!best) { var c = centers[0], a0 = Math.atan2(sy - c.y, sx - c.x), ccw = 0; best = { cx: c.x, cy: c.y, radius: rr, a0: a0, sweep: ccw }; invalid = true; }
  best.invalid = invalid; best.ex = ex; best.ey = ey;
  return best;
}
export function circThreePt(sx, sy, ax, ay, ex, ey) {
  var d = 2 * (sx * (ay - ey) + ax * (ey - sy) + ex * (sy - ay));
  if (Math.abs(d) < 1e-6) return { cx: (sx + ex) / 2, cy: (sy + ey) / 2, radius: Math.hypot(ex - sx, ey - sy) / 2, a0: 0, sweep: 0, invalid: true };
  var s2 = sx * sx + sy * sy, a2 = ax * ax + ay * ay, e2 = ex * ex + ey * ey;
  var cx = (s2 * (ay - ey) + a2 * (ey - sy) + e2 * (sy - ay)) / d;
  var cy = (s2 * (ex - ax) + a2 * (sx - ex) + e2 * (ax - sx)) / d;
  var radius = Math.hypot(sx - cx, sy - cy);
  var a0 = Math.atan2(sy - cy, sx - cx), a1 = Math.atan2(ey - cy, ex - cx), aux = Math.atan2(ay - cy, ax - cx);
  function norm(a) { a %= 2 * Math.PI; if (a < 0) a += 2 * Math.PI; return a; }
  var relAux = norm(aux - a0), relEnd = norm(a1 - a0);
  var sweep = (relAux <= relEnd) ? relEnd : relEnd - 2 * Math.PI;
  return { cx: cx, cy: cy, radius: radius, a0: a0, sweep: sweep, invalid: false };
}
export function sampleArc(g, n) {
  var pts = [];
  for (var i = 0; i <= n; i++) { var t = i / n, ang = g.a0 + g.sweep * t; pts.push({ x: g.cx + g.radius * Math.cos(ang), y: g.cy + g.radius * Math.sin(ang) }); }
  return pts;
}
export function sampleLine(sx, sy, ex, ey, n) {
  var pts = []; for (var i = 0; i <= n; i++) { var t = i / n; pts.push({ x: lerp(sx, ex, t), y: lerp(sy, ey, t) }); } return pts;
}

export function polyLen(pts) { var l = 0; for (var i = 1; i < pts.length; i++) l += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); return l; }
export function trimEnd(pts, frac) { var keep = Math.max(2, Math.round(pts.length * (1 - frac))); return pts.slice(0, keep); }
export function trimStart(pts, frac) { var drop = Math.max(0, Math.round(pts.length * frac)); return pts.slice(Math.min(drop, pts.length - 2)); }
export function quadFillet(p0, ctrl, p1, n) {
  var out = []; for (var i = 0; i <= n; i++) { var t = i / n, mt = 1 - t; out.push({ x: mt * mt * p0.x + 2 * mt * t * ctrl.x + t * t * p1.x, y: mt * mt * p0.y + 2 * mt * t * ctrl.y + t * t * p1.y }); } return out;
}

export function hexRGB(h) {
  h = h.replace('#', '');
  if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
  var n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function colLerp(c1, c2, t) {
  var a = hexRGB(c1), b = hexRGB(c2);
  return 'rgb(' + Math.round(lerp(a[0], b[0], t)) + ',' + Math.round(lerp(a[1], b[1], t)) + ',' + Math.round(lerp(a[2], b[2], t)) + ')';
}
export function niceStep(v) { var p = Math.pow(10, Math.floor(Math.log10(v || 1))); var n = v / p; var m = n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10; return m * p; }
