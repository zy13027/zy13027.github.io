import { qs, qsa } from '../lib/dom.js';
import { DETAIL } from '../data/diagram-detail.js';

/* ============================================================
   S2 — THREE TECHNOLOGY OBJECTS (diagram interactivity)
   ============================================================ */
export function init(){
  var detailEl = qs("#diagramDetail");
  if(!detailEl) return;

  var boxes = qsa(".to-box");
  function select(id){
    boxes.forEach(function(b){
      var on = b.id === id;
      b.classList.toggle("is-selected", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    detailEl.innerHTML = DETAIL[id] || "";
  }
  boxes.forEach(function(b){
    b.addEventListener("click", function(){ select(b.id); });
    b.addEventListener("keydown", function(e){
      if(e.key === "Enter" || e.key === " "){
        e.preventDefault();
        select(b.id);
      }
    });
  });
  select("box-interpreter");
}
