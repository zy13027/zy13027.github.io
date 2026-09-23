// Builds pane A's program list markup and caches each row's pointer-arrow elements.
// Moved verbatim from the artifact's simulator <script>.
import { PROGRAM, TRANS_LABEL } from '../../data/simulator-program.js';
import { dom, rowEls, arrowI, arrowM } from './state.js';

function paramHTML(cmd) {
  if (cmd.kind === "label") return '<span class="sim-cmdparams sim-label-text">' + cmd.text + '</span>';
  if (cmd.kind === "ref") return '<span class="sim-cmdparams"><span class="sim-ref-text">→ ' + cmd.refText + '</span>' + (cmd.suffix || "") + '</span>';
  return '<span class="sim-cmdparams">' + cmd.text + '</span>';
}

export function buildProgramList() {
  var html = "";
  for (var i = 0; i < PROGRAM.length; i++) {
    var cmd = PROGRAM[i];
    var numStr = cmd.n < 10 ? ("0" + cmd.n) : String(cmd.n);
    html += '<div class="sim-row" id="sim-row-' + cmd.n + '" data-idx="' + cmd.n + '">'
      + '<div class="sim-gutter">'
      + '<span class="sim-arrow-i" id="sim-arrow-i-' + cmd.n + '" aria-hidden="true"></span>'
      + '<span class="sim-arrow-m" id="sim-arrow-m-' + cmd.n + '" aria-hidden="true"></span>'
      + '</div>'
      + '<div class="sim-cmdnum">' + numStr + '</div>'
      + '<div class="sim-cmdtext"><span class="sim-cmdname">' + cmd.name + '</span>' + paramHTML(cmd) + '</div>'
      + '</div>';
    if (i < PROGRAM.length - 1) {
      html += '<div class="sim-transition sim-transition--' + cmd.trans + '" data-after="' + cmd.n + '">'
        + '<span class="sim-t-icon"></span><span class="sim-t-label">' + TRANS_LABEL[cmd.trans] + '</span></div>';
    }
  }
  dom.elProglist.innerHTML = html;

  PROGRAM.forEach(function (cmd) {
    rowEls[cmd.n] = document.getElementById("sim-row-" + cmd.n);
    arrowI[cmd.n] = document.getElementById("sim-arrow-i-" + cmd.n);
    arrowM[cmd.n] = document.getElementById("sim-arrow-m-" + cmd.n);
  });
}
