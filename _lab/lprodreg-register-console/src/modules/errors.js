// Error & warning identifier table (#errors section): filters the ~215-entry catalogue
// by search text, category and severity. Data lives in src/data/errors.json (lifted out of
// the artifact's inline <script type="application/json" id="rf-err-data"> block) instead of
// being read from that DOM element.
import ERRORS from "../data/errors.json";

export function initErrors(){
  var DATA = ERRORS;

  var body = document.getElementById("rf-err-body");
  var empty = document.getElementById("rf-err-empty");
  var countEl = document.getElementById("rf-err-count");
  var searchEl = document.getElementById("rf-err-search");
  var catEl = document.getElementById("rf-err-cat");
  var sevBtns = document.querySelectorAll(".rf-err-sevbtns button");

  var cats = [];
  DATA.forEach(function(e){ if (cats.indexOf(e.cat) === -1) cats.push(e.cat); });
  cats.forEach(function(c){
    var o = document.createElement("option");
    o.value = c; o.textContent = c;
    catEl.appendChild(o);
  });

  function esc(s){
    return String(s).replace(/[&<>]/g, function(c){ return c === "&" ? "&amp;" : c === "<" ? "&lt;" : "&gt;"; });
  }

  var state = { sev: "", cat: "", q: "" };

  function render(){
    var q = state.q.trim().toLowerCase();
    var rows = DATA.filter(function(e){
      if (state.sev && e.sev !== state.sev) return false;
      if (state.cat && e.cat !== state.cat) return false;
      if (q && e.id.toLowerCase().indexOf(q) === -1 && e.msg.toLowerCase().indexOf(q) === -1) return false;
      return true;
    });

    var html = "";
    for (var i = 0; i < rows.length; i++){
      var e = rows[i];
      var dot = '<span class="rf-sev-dot ' + e.sev + '"></span>';
      html += '<tr><td class="rf-err-id">' + dot + esc(e.id) + '<div class="rf-err-cat">' + esc(e.cat) + '</div></td>' +
              '<td class="rf-err-hex">' + esc(e.hex) + '</td>' +
              '<td class="rf-err-msg">' + esc(e.msg) + '</td></tr>';
    }
    body.innerHTML = html;
    empty.hidden = rows.length !== 0;

    var errN = DATA.filter(function(e){ return e.sev === "err"; }).length;
    var warnN = DATA.filter(function(e){ return e.sev === "warn"; }).length;
    countEl.textContent = rows.length + " shown · " + errN + " errors · " + warnN + " warnings";
  }

  searchEl.addEventListener("input", function(){ state.q = searchEl.value; render(); });
  catEl.addEventListener("change", function(){ state.cat = catEl.value; render(); });
  sevBtns.forEach(function(btn){
    btn.addEventListener("click", function(){
      state.sev = btn.getAttribute("data-sev");
      sevBtns.forEach(function(b){ b.classList.toggle("rf-on", b === btn); });
      render();
    });
  });

  render();
}
