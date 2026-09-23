// Tiny DOM helpers shared by the reference-section modules (PathData fields,
// Command catalogue, Flag modes, Errors). Lifted verbatim from the top of the
// artifact's reference-section closing <script>.

export function $(sel, ctx) {
  return (ctx || document).querySelector(sel);
}

export function $all(sel, ctx) {
  return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
}

export function esc(s) {
  return String(s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  });
}
