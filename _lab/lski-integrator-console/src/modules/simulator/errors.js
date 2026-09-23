// Error-buffer logging. Moved verbatim from the artifact's simulator <script>.
import { state } from './state.js';
import { renderErrbuf } from './render.js';

export function pushError(code, name, msg) {
  state.errors.unshift({ code: code, name: name, msg: msg, t: Date.now() });
  if (state.errors.length > 8) state.errors.length = 8;
  renderErrbuf();
}
export function pushNote(msg) {
  state.errors.unshift({ code: "—", name: null, msg: msg, note: true, t: Date.now() });
  if (state.errors.length > 8) state.errors.length = 8;
  renderErrbuf();
}
