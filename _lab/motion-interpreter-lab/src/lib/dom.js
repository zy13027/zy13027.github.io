/* ============================================================
   UTILITIES
   ============================================================ */
export function qs(sel, root){ return (root||document).querySelector(sel); }
export function qsa(sel, root){ return Array.prototype.slice.call((root||document).querySelectorAll(sel)); }

/* run a page module in isolation: a fault in one module (e.g. a
   missing element, or a canvas API issue in an unusual host) must
   never stop the rest of the page's modules from initialising */
export function safeRun(fn){
  try{ fn(); }catch(e){ if(window.console && console.error) console.error(e); }
}
