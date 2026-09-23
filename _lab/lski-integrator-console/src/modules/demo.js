// Demo-project tabs: toggle between the 01_Basic and 02_Advanced panels.
// Moved verbatim from the artifact's reference <script> (one of several independent
// features that script held).
export function initDemo() {
  var demoTabs = document.querySelectorAll(".rf-demo-tab");
  demoTabs.forEach(function (t) {
    t.addEventListener("click", function () {
      demoTabs.forEach(function (x) { x.classList.remove("on"); });
      t.classList.add("on");
      var target = t.getAttribute("data-target");
      ["rf-demo-basic", "rf-demo-advanced"].forEach(function (id) {
        var panel = document.getElementById(id);
        if (panel) panel.hidden = (id !== target);
      });
    });
  });
}
