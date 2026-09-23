// Command reference: search, filter by group, and render the command table.
// Moved verbatim from the artifact's reference <script> (one of several independent
// features that script held).
import { elx } from './util/dom.js';
import { COMMANDS, GROUP_LABEL } from '../data/commands.js';

export function initCommands() {
  function renderCommands() {
    var tbody = document.getElementById("rf-cmd-tbody");
    if (!tbody) return;
    var q = (document.getElementById("rf-cmd-search").value || "").toLowerCase();
    var group = document.querySelector("#rf-cmd-tabs .pill.on").getAttribute("data-group");
    var rows = COMMANDS.filter(function (c) {
      if (group !== "all" && c[0] !== group) return false;
      if (!q) return true;
      return (c[1] + " " + c[2]).toLowerCase().indexOf(q) > -1;
    });
    tbody.innerHTML = "";
    rows.forEach(function (c) {
      var tr = elx("tr");
      tr.appendChild(elx("td", null, c[1]));
      var tdg = elx("td");
      tdg.appendChild(elx("span", "rf-grouptag", GROUP_LABEL[c[0]]));
      tr.appendChild(tdg);
      tr.appendChild(elx("td", null, c[2]));
      tbody.appendChild(tr);
    });
    document.getElementById("rf-cmd-count").textContent = rows.length + " of " + COMMANDS.length + " commands";
  }
  var cmdTabs = document.querySelectorAll(".rf-cmd-tab");
  cmdTabs.forEach(function (t) {
    t.addEventListener("click", function () {
      cmdTabs.forEach(function (x) { x.classList.remove("on"); });
      t.classList.add("on");
      renderCommands();
    });
  });
  var cmdSearch = document.getElementById("rf-cmd-search");
  if (cmdSearch) cmdSearch.addEventListener("input", renderCommands);
  renderCommands();
}
