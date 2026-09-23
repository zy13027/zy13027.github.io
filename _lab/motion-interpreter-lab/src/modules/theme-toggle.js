import { qs } from '../lib/dom.js';
import { storeGet, storeSet } from '../lib/storage.js';

/* ============================================================
   THEME TOGGLE
   ============================================================ */
export function init(){
  var root = document.documentElement;
  var btn = qs("#themeToggle");
  var saved = storeGet("mil-theme");
  if(saved === "light" || saved === "dark") root.setAttribute("data-theme", saved);
  function current(){
    var attr = root.getAttribute("data-theme");
    if(attr) return attr;
    var dark = false;
    try{ dark = window.matchMedia("(prefers-color-scheme: dark)").matches; }catch(e){}
    return dark ? "dark" : "light";
  }
  if(btn){
    btn.addEventListener("click", function(){
      var next = current() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      storeSet("mil-theme", next);
    });
  }
}
