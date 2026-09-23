// Status / error codes: search across both tables and render matching rows.
// Moved verbatim from the artifact's reference <script> (one of several independent
// features that script held).
import { elx } from './util/dom.js';
import { STATUS1, STATUS2 } from '../data/status-codes.js';

function statusRow(row, forceSev) {
  var sev = forceSev || row[3];
  var tr = elx("tr", "rf-sev-" + sev);
  var tdn = elx("td");
  var dot = elx("span", "rf-status-dot rf-sev-" + sev);
  tdn.appendChild(dot);
  tdn.appendChild(elx("span", "rf-status-name", row[0]));
  tr.appendChild(tdn);
  tr.appendChild(elx("td", "rf-status-val", row[1]));
  tr.appendChild(elx("td", null, row[2]));
  return tr;
}

export function initStatus() {
  function renderStatus() {
    var q = (document.getElementById("rf-status-search").value || "").toLowerCase();
    var tb1 = document.getElementById("rf-status1-tbody");
    var tb2 = document.getElementById("rf-status2-tbody");
    tb1.innerHTML = ""; tb2.innerHTML = "";
    var n1 = 0, n2 = 0;
    STATUS1.forEach(function (row) {
      var hay = (row[0] + " " + row[1] + " " + row[2]).toLowerCase();
      if (q && hay.indexOf(q) === -1) return;
      tb1.appendChild(statusRow(row)); n1++;
    });
    STATUS2.forEach(function (row) {
      var hay = (row[0] + " " + row[1] + " " + row[2]).toLowerCase();
      if (q && hay.indexOf(q) === -1) return;
      tb2.appendChild(statusRow(row, "err")); n2++;
    });
    document.getElementById("rf-status1-label").textContent = n1 + " of " + STATUS1.length + " rows";
    document.getElementById("rf-status2-label").textContent = n2 + " of " + STATUS2.length + " rows";
    document.getElementById("rf-status-count").textContent = (n1 + n2) + " of " + (STATUS1.length + STATUS2.length) + " codes";
  }
  var statusSearch = document.getElementById("rf-status-search");
  if (statusSearch) statusSearch.addEventListener("input", renderStatus);
  renderStatus();
}
