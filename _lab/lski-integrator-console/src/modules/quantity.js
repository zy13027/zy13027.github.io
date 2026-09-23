// Quantity-structure, constants and runtime-configuration tables: static render, no
// interactivity. Moved verbatim from the artifact's reference <script> (one of several
// independent features that script held).
import { elx } from './util/dom.js';
import { QUANTITY, CONSTANTS, RUNTIME } from '../data/quantity.js';

export function initQuantity() {
  var qtbody = document.getElementById("rf-quantity-tbody");
  if (qtbody) {
    QUANTITY.forEach(function (r) {
      var tr = elx("tr");
      r.forEach(function (v, i) { tr.appendChild(elx("td", i === 0 ? null : "num", v)); });
      qtbody.appendChild(tr);
    });
  }

  var ctbody = document.getElementById("rf-const-tbody");
  if (ctbody) {
    CONSTANTS.forEach(function (r) {
      var tr = elx("tr");
      tr.appendChild(elx("td", null, r[0]));
      tr.appendChild(elx("td", null, r[1]));
      ctbody.appendChild(tr);
    });
  }

  var rtbody = document.getElementById("rf-runtime-tbody");
  if (rtbody) {
    RUNTIME.forEach(function (r) {
      var tr = elx("tr");
      tr.appendChild(elx("td", null, r[0]));
      tr.appendChild(elx("td", null, r[1]));
      rtbody.appendChild(tr);
    });
  }
}
