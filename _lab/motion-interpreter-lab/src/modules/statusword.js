import { qs } from '../lib/dom.js';
import { reducedMotion } from '../lib/motion.js';
import { visibility, observeVisibility } from '../lib/visibility.js';
import { STATUS, ERROR_BITS, WARNING_BITS, RIBBON_STEPS } from '../data/statusword.js';

/* ============================================================
   S7 — STATUSWORD DECODER
   ============================================================ */
export function init(){
  var statusBits = qs("#statusBits");
  if(!statusBits) return;

  function buildBoard(container, data, meaningEl){
    var cellsByKey = {};
    data.forEach(function(d){
      var cell = document.createElement("button");
      cell.type = "button";
      cell.className = "bit-cell";
      cell.setAttribute("aria-pressed","false");
      var x = document.createElement("span"); x.className="x"; x.textContent = d[0];
      var nm = document.createElement("span"); nm.className="nm"; nm.textContent = d[1];
      cell.appendChild(x); cell.appendChild(nm);
      cell.addEventListener("click", function(){
        var on = cell.getAttribute("aria-pressed") !== "true";
        cell.setAttribute("aria-pressed", on?"true":"false");
        if(meaningEl){
          meaningEl.innerHTML = on
            ? ("<b>"+d[0]+" "+d[1]+"</b> — " + (d[2] || "see the Function Manual for this bit."))
            : "Select a bit to see its meaning.";
        }
      });
      container.appendChild(cell);
      cellsByKey[d[0]] = cell;
    });
    return cellsByKey;
  }

  var statusMeaning = qs("#statusMeaning");
  var statusCells = buildBoard(statusBits, STATUS, statusMeaning);
  buildBoard(qs("#errorBits"), ERROR_BITS, null);
  buildBoard(qs("#warningBits"), WARNING_BITS, null);

  /* ---- handshake ribbon ---- */
  var ribbonEl = qs("#ribbon");

  var nodeEls = [], connEls = [];
  RIBBON_STEPS.forEach(function(s, i){
    if(i>0){
      var conn = document.createElement("div");
      conn.className = "ribbon-connector";
      ribbonEl.appendChild(conn);
      connEls.push(conn);
    }
    var node = document.createElement("div");
    node.className = "ribbon-step";
    var dot = document.createElement("span"); dot.className="node";
    var lbl = document.createElement("span"); lbl.className="lbl"; lbl.textContent = s.label;
    node.appendChild(dot); node.appendChild(lbl);
    ribbonEl.appendChild(node);
    nodeEls.push(node);
  });

  var ribbonTimer = null;
  function setBit(key, on){
    var cell = statusCells[key];
    if(!cell) return;
    cell.setAttribute("aria-pressed", on?"true":"false");
  }
  function playRibbon(){
    if(ribbonTimer) clearInterval(ribbonTimer);
    Object.keys(statusCells).forEach(function(k){ setBit(k,false); });
    nodeEls.forEach(function(n){ n.classList.remove("is-active"); });
    connEls.forEach(function(c){ c.classList.remove("is-done"); });
    var i = 0;
    function stepTo(idx){
      var s = RIBBON_STEPS[idx];
      nodeEls[idx].classList.add("is-active");
      if(idx>0) connEls[idx-1].classList.add("is-done");
      (s.clears||[]).forEach(function(k){ setBit(k,false); });
      (s.bits||[]).forEach(function(k){ setBit(k,true); });
    }
    stepTo(0);
    ribbonTimer = setInterval(function(){
      i++;
      if(i>=RIBBON_STEPS.length){ clearInterval(ribbonTimer); ribbonTimer=null; return; }
      stepTo(i);
    }, reducedMotion ? 1 : 900);
  }

  qs("#ribbonPlay").addEventListener("click", playRibbon);

  var played = false;
  observeVisibility(qs("#s7"), "s7");
  var checkOnce = setInterval(function(){
    if(!played && visibility.s7){
      played = true;
      playRibbon();
      clearInterval(checkOnce);
    }
  }, 300);
}
