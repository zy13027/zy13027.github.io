// Traps list: render the symptom/fix pairs. Moved verbatim from the artifact's
// reference <script> (one of several independent features that script held).
import { elx } from './util/dom.js';
import { TRAPS } from '../data/traps.js';

export function initTraps() {
  var trapList = document.getElementById("rf-traps-list");
  if (trapList) {
    TRAPS.forEach(function (t) {
      var item = elx("div", "rf-trapitem");
      var s = elx("div", "rf-symptom");
      s.appendChild(elx("b", null, "Symptom"));
      s.appendChild(document.createTextNode(t[0]));
      var f = elx("div", "rf-fix");
      f.appendChild(elx("b", null, "Fix"));
      f.appendChild(document.createTextNode(t[1]));
      item.appendChild(s); item.appendChild(f);
      trapList.appendChild(item);
    });
  }
}
