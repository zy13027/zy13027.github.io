import { qs, qsa } from '../lib/dom.js';

/* ============================================================
   S6 — STEPPER
   ============================================================ */
export function init(){
  var steps = qsa("#stepper .step");
  if(!steps.length) return;
  steps.forEach(function(step){
    var head = qs(".step-head", step);
    head.addEventListener("click", function(){
      var open = step.getAttribute("data-open") === "true";
      step.setAttribute("data-open", open ? "false" : "true");
      head.setAttribute("aria-expanded", open ? "false" : "true");
    });
  });
}
