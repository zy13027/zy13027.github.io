import { qs, qsa } from '../lib/dom.js';
import { DATA, FAMILIES } from '../data/instructions.js';

/* ============================================================
   S5 — INSTRUCTION EXPLORER
   ============================================================ */
export function init(){
  var grid = qs("#instrGrid");
  if(!grid) return;

  var chipsEl = qs("#familyChips");
  var searchEl = qs("#instrSearch");
  var countEl = qs("#instrCount");
  var detailEl = qs("#instrDetail");
  var detailName = qs("#instrDetailName");
  var detailBadge = qs("#instrDetailBadge");
  var detailDesc = qs("#instrDetailDesc");

  var activeFamily = "ALL";
  var cells = [];

  DATA.forEach(function(d, idx){
    var cell = document.createElement("button");
    cell.type = "button";
    cell.className = "instr-cell";
    cell.dataset.idx = String(idx);
    var nm = document.createElement("span");
    nm.className = "nm"; nm.textContent = d[0];
    var fam = document.createElement("span");
    fam.className = "fam"; fam.textContent = d[1];
    cell.appendChild(nm); cell.appendChild(fam);
    cell.addEventListener("click", function(){ showDetail(idx); });
    grid.appendChild(cell);
    cells.push(cell);
  });

  FAMILIES.forEach(function(f){
    var chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip";
    chip.textContent = f;
    chip.setAttribute("aria-pressed", f==="ALL" ? "true":"false");
    chip.addEventListener("click", function(){
      activeFamily = f;
      qsa(".chip", chipsEl).forEach(function(c){ c.setAttribute("aria-pressed", c===chip ? "true":"false"); });
      applyFilter();
    });
    chipsEl.appendChild(chip);
  });

  function applyFilter(){
    var q = (searchEl.value||"").toLowerCase().trim();
    var shown = 0;
    cells.forEach(function(cell, idx){
      var d = DATA[idx];
      var famOk = activeFamily==="ALL" || d[1]===activeFamily;
      var qOk = !q || d[0].toLowerCase().indexOf(q)>=0 || d[2].toLowerCase().indexOf(q)>=0;
      var show = famOk && qOk;
      cell.hidden = !show;
      if(show) shown++;
    });
    countEl.textContent = shown + " of " + DATA.length + " instructions";
  }
  searchEl.addEventListener("input", applyFilter);

  function showDetail(idx){
    var d = DATA[idx];
    cells.forEach(function(c){ c.classList.toggle("is-active", c.dataset.idx===String(idx)); });
    detailEl.hidden = false;
    detailName.textContent = d[0];
    detailDesc.textContent = d[2];
    if(d[3]==="prep"){
      detailBadge.hidden = false;
      detailBadge.className = "run-badge prep";
      detailBadge.textContent = "Runs at: PREPARATION";
    }else if(d[3]==="exec"){
      detailBadge.hidden = false;
      detailBadge.className = "run-badge exec";
      detailBadge.textContent = "Runs at: EXECUTION";
    }else{
      detailBadge.hidden = true;
      detailBadge.textContent = "";
    }
  }

  applyFilter();
}
