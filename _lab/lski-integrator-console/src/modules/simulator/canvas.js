// Canvas drawing: frame, belt, pallet, path trail/preview and the gantry itself.
// Moved verbatim from the artifact's simulator <script> (each function now reads the
// 2D context off the shared `dom` object instead of a closure-cached `ctx` local).
import { state, dom, COL, CW, CH, MARGIN, BEAM_Y, TABLE_Y, toCanvas } from './state.js';

export function draw() {
  var ctx = dom.ctx;
  ctx.clearRect(0, 0, CW, CH);
  drawFrame();
  drawBelt();
  drawPallet();
  drawPreviewPath();
  drawTrail();
  drawGantry();
}

function drawFrame() {
  var ctx = dom.ctx;
  ctx.strokeStyle = COL.line; ctx.lineWidth = 3; ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(MARGIN - 14, BEAM_Y); ctx.lineTo(MARGIN - 14, TABLE_Y + 18);
  ctx.moveTo(CW - MARGIN + 14, BEAM_Y); ctx.lineTo(CW - MARGIN + 14, TABLE_Y + 18);
  ctx.moveTo(MARGIN - 20, BEAM_Y); ctx.lineTo(CW - MARGIN + 20, BEAM_Y);
  ctx.moveTo(20, TABLE_Y + 18); ctx.lineTo(CW - 20, TABLE_Y + 18);
  ctx.stroke();
  ctx.fillStyle = COL.textDim;
  ctx.font = "11px monospace";
  ctx.globalAlpha = 0.7;
  ctx.fillText("belt", 60, TABLE_Y + 34);
  ctx.fillText("pallet", CW - 120, TABLE_Y + 34);
  ctx.globalAlpha = 1;
}

function drawBox(cx, cy, w, h, fill) {
  var ctx = dom.ctx;
  ctx.fillStyle = fill;
  ctx.strokeStyle = COL.lineSoft;
  ctx.lineWidth = 1;
  var x = cx - w / 2, y = cy - h;
  if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, y, w, h, 2); ctx.fill(); ctx.stroke(); }
  else { ctx.fillRect(x, y, w, h); ctx.strokeRect(x, y, w, h); }
}

function drawBelt() {
  var ctx = dom.ctx;
  var y = TABLE_Y + 18;
  ctx.fillStyle = COL.surface3;
  ctx.fillRect(20, y - 8, 190, 8);
  state.beltBoxes.forEach(function (b) {
    var c = toCanvas(b.x, 0);
    drawBox(c.x, y, 22, 20, COL.amber);
  });
}

function drawPallet() {
  var baseX = toCanvas(410, 0).x, y = TABLE_Y + 18;
  var perRow = 3, gap = 26;
  state.stackDisplay.forEach(function (b, i) {
    var row = Math.floor(i / perRow), col = i % perRow;
    var cx = baseX - gap + col * gap;
    var cy = y - row * 20;
    drawBox(cx, cy, 22, 20, COL.accent2);
  });
}

function pathPoint(p) { return toCanvas(p.x, p.z); }

function drawTrail() {
  var ctx = dom.ctx;
  var pts = state.pathHistory.slice();
  var cur = { x: state.pos.x, z: state.pos.z, blended: false };
  var full = pts.concat([cur]);
  if (full.length < 2) return;
  var c0 = pathPoint(full[0]), c1 = pathPoint(full[full.length - 1]);
  var grad = ctx.createLinearGradient(c0.x, c0.y, c1.x, c1.y);
  grad.addColorStop(0, COL.accent);
  grad.addColorStop(1, COL.accent2);
  ctx.strokeStyle = grad;
  ctx.lineWidth = 3;
  ctx.lineJoin = "miter";
  ctx.beginPath();
  var start = pathPoint(full[0]);
  ctx.moveTo(start.x, start.y);
  for (var i = 1; i < full.length; i++) {
    var pt = pathPoint(full[i]);
    // Blending is a property of the vertex itself: a point reached via a
    // 'Next cycle' hand-off (with something already queued behind it)
    // rounds the corner here, toward whatever comes next.
    if (full[i].blended && i + 1 < full.length) {
      var nextPt = pathPoint(full[i + 1]);
      ctx.arcTo(pt.x, pt.y, nextPt.x, nextPt.y, 22);
    } else {
      ctx.lineTo(pt.x, pt.y);
    }
  }
  ctx.stroke();

  if (state.aborted && state.abortPos) {
    var ap = toCanvas(state.abortPos.x, state.abortPos.z);
    ctx.strokeStyle = COL.err; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ap.x - 6, ap.y - 6); ctx.lineTo(ap.x + 6, ap.y + 6);
    ctx.moveTo(ap.x + 6, ap.y - 6); ctx.lineTo(ap.x - 6, ap.y + 6);
    ctx.stroke();
  }
}

function drawPreviewPath() {
  var ctx = dom.ctx;
  var chain = [];
  if (state.activeMotion) chain.push(state.activeMotion.target);
  state.queuedMotion.forEach(function (q) { chain.push(q.target); });
  if (!chain.length) return;
  ctx.save();
  ctx.globalAlpha = 0.32;
  ctx.strokeStyle = COL.accent2;
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  var start = pathPoint(state.pos);
  ctx.moveTo(start.x, start.y);
  chain.forEach(function (p) { var c = pathPoint(p); ctx.lineTo(c.x, c.y); });
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function drawGantry() {
  var ctx = dom.ctx;
  var gp = toCanvas(state.pos.x, state.pos.z);
  var carriageY = BEAM_Y;
  ctx.fillStyle = COL.text2;
  ctx.fillRect(gp.x - 16, carriageY - 9, 32, 14);
  ctx.strokeStyle = COL.line; ctx.lineWidth = 1;
  ctx.strokeRect(gp.x - 16, carriageY - 9, 32, 14);

  ctx.strokeStyle = COL.textDim; ctx.lineWidth = 5; ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(gp.x, carriageY + 4);
  ctx.lineTo(gp.x, gp.y - 10);
  ctx.stroke();

  ctx.save();
  ctx.translate(gp.x, gp.y - 10);
  ctx.rotate(state.a * Math.PI / 180);
  ctx.strokeStyle = COL.text; ctx.lineWidth = 4; ctx.lineCap = "round";
  var open = state.gripperClosed ? 5 : 11;
  ctx.beginPath();
  ctx.moveTo(-open, 0); ctx.lineTo(-open, 14);
  ctx.moveTo(open, 0); ctx.lineTo(open, 14);
  ctx.stroke();
  if (state.gripperClosed || state.heldBox) {
    drawBoxAt(0, 20, COL.amber);
  }
  ctx.restore();
}
function drawBoxAt(x, y, fill) {
  var ctx = dom.ctx;
  ctx.fillStyle = fill; ctx.strokeStyle = COL.lineSoft; ctx.lineWidth = 1;
  var w = 20, h = 16;
  if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x - w / 2, y - h / 2, w, h, 2); ctx.fill(); ctx.stroke(); }
  else { ctx.fillRect(x - w / 2, y - h / 2, w, h); }
}
