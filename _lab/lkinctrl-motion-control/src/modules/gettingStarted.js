// Getting-started section: the Scenario 1 / 2 / 3 PathData tab switcher.
// Lifted verbatim from the artifact's third closing <script>.

export function initGettingStarted() {
  var root = document.getElementById('gettingstarted');
  if (!root) return;
  var btns = root.querySelectorAll('.gs-tabbar [data-gstab]');
  var panels = {
    s1: document.getElementById('gs-tab-s1'),
    s2: document.getElementById('gs-tab-s2'),
    s3: document.getElementById('gs-tab-s3')
  };
  btns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var key = btn.getAttribute('data-gstab');
      btns.forEach(function (b) {
        var on = (b === btn);
        b.classList.toggle('on', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      Object.keys(panels).forEach(function (k) {
        if (panels[k]) panels[k].hidden = (k !== key);
      });
    });
  });
}
