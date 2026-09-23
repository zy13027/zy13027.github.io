// Worked-scenario tabs (#scenarios section).
export function initScenarios(){
  /* ---------------- scenario tabs ---------------- */
  var scnBtns = document.querySelectorAll("[data-rf-scn]");
  var scnPanels = document.querySelectorAll("[data-rf-scnpanel]");
  scnBtns.forEach(function(btn){
    btn.addEventListener("click", function(){
      var id = btn.getAttribute("data-rf-scn");
      scnBtns.forEach(function(b){ b.classList.toggle("rf-on", b === btn); });
      scnPanels.forEach(function(p){ p.hidden = p.getAttribute("data-rf-scnpanel") !== id; });
    });
  });
}
