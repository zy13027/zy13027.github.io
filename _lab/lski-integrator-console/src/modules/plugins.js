// Plugin explorer: search, filter by kind, sort, and render the plugin table.
// Moved verbatim from the artifact's reference <script> (one of several independent
// features that script held; split out because it shares nothing with the command
// reference, status codes, quantity or traps logic beyond the `elx` helper).
import { elx } from './util/dom.js';
import { PLUGINS, PLUGIN_MAX, KIND_LABEL } from '../data/plugins.js';

function fmtKb(v) { return (v % 1 === 0 ? v : v.toFixed(1)) + " kB"; }

export function initPlugins() {
  function renderPlugins() {
    var tbody = document.getElementById("rf-plugin-tbody");
    if (!tbody) return;
    var q = (document.getElementById("rf-plugin-search").value || "").toLowerCase();
    var kind = document.getElementById("rf-plugin-chips").querySelector(".pill.on").getAttribute("data-kind");
    var sort = document.getElementById("rf-plugin-sort").value;
    var rows = PLUGINS.filter(function (p) {
      if (kind !== "all" && p.k !== kind) return false;
      if (!q) return true;
      var hay = (p.n + " " + p.fn + " " + p.blk.join(" ") + " " + p.cfg + " " + (p.trap || "")).toLowerCase();
      return hay.indexOf(q) > -1;
    });
    rows.sort(function (a, b) {
      if (sort === "name") return a.n.localeCompare(b.n);
      return b[sort] - a[sort];
    });
    tbody.innerHTML = "";
    rows.forEach(function (p) {
      var tr = elx("tr", "rf-plugin-row");

      var tdName = elx("td");
      tdName.appendChild(elx("div", null, p.n));
      var kb = elx("span", "rf-kind " + p.k, KIND_LABEL[p.k]);
      kb.style.marginTop = "5px";
      var wrap = elx("div"); wrap.style.marginTop = "5px"; wrap.appendChild(kb);
      tdName.appendChild(wrap);
      tr.appendChild(tdName);

      var tdBlk = elx("td");
      p.blk.forEach(function (b) { tdBlk.appendChild(elx("span", "rf-blk", b)); });
      tr.appendChild(tdBlk);

      var tdFn = elx("td");
      var fnwrap = elx("div", "rf-fnwrap", p.fn);
      tdFn.appendChild(fnwrap);
      if (p.trap) {
        var trap = elx("div", "rf-trap");
        trap.appendChild(elx("b", null, "Trap"));
        trap.appendChild(document.createTextNode(p.trap));
        tdFn.appendChild(trap);
      }
      tr.appendChild(tdFn);

      var tdCfg = elx("td");
      tdCfg.appendChild(elx("span", "rf-cfg", p.cfg));
      tr.appendChild(tdCfg);

      var tdBars = elx("td");
      var bars = elx("div", "rf-bars");
      [["code", "Code", p.code], ["data", "Data", p.data], ["load", "Load", p.load]].forEach(function (m) {
        var line = elx("div", "rf-bar-line");
        line.appendChild(elx("span", null, m[1]));
        var track = elx("div", "rf-bar-track");
        var fill = elx("div", "rf-bar-fill");
        var pct = Math.max(2, (m[2] / PLUGIN_MAX[m[0]]) * 100);
        fill.style.width = pct + "%";
        track.appendChild(fill);
        line.appendChild(track);
        line.appendChild(elx("span", "rf-bar-val", fmtKb(m[2])));
        bars.appendChild(line);
      });
      tdBars.appendChild(bars);
      tr.appendChild(tdBars);

      tbody.appendChild(tr);
    });
    document.getElementById("rf-plugin-count").textContent = rows.length + " of " + PLUGINS.length + " plugins";
  }

  var pluginChips = document.querySelectorAll("#rf-plugin-chips .rf-chip");
  pluginChips.forEach(function (c) {
    c.addEventListener("click", function () {
      pluginChips.forEach(function (x) { x.classList.remove("on"); });
      c.classList.add("on");
      renderPlugins();
    });
  });
  var pluginSearch = document.getElementById("rf-plugin-search");
  if (pluginSearch) pluginSearch.addEventListener("input", renderPlugins);
  var pluginSort = document.getElementById("rf-plugin-sort");
  if (pluginSort) pluginSort.addEventListener("change", renderPlugins);
  renderPlugins();
}
