// Shared DOM-building helper used by the plugin explorer, command reference, status
// codes, quantity tables and traps modules. Moved verbatim (as `elx`) from the
// artifact's reference <script>, where every one of those features defined its own
// copy of the same function in the same closure.
export function elx(tag, cls, text) {
  var e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined && text !== null) e.textContent = text;
  return e;
}
