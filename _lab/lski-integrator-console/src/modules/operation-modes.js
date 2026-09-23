// Operation-mode capability table: pick a mode and toggle motion enable to see which
// capabilities open up. Moved verbatim from the artifact's concepts/architecture
// <script> (the second half, which shared one IIFE with the architecture-detail logic
// now split into architecture-detail.js).
import { modes } from '../data/operation-modes.js';

export function initOperationModes() {
  var capOrder = [
    { key: 'exec', name: 'Program execution & kinematics control', needsMEKey: 'execME' },
    { key: 'editor', name: 'Editor', needsMEKey: null },
    { key: 'teach', name: 'Teach kinematics', needsMEKey: 'teachME' },
    { key: 'config', name: 'Configuration', needsMEKey: null }
  ];

  var currentMode = 'full';
  var motionEnable = false;

  var modeBtns = Array.prototype.slice.call(document.querySelectorAll('.cx-modebtn'));
  var meBtn = document.getElementById('cx-metoggle');
  var meLabel = document.getElementById('cx-metoggle-label');
  var capsEl = document.getElementById('cx-caps');
  var roleEl = document.getElementById('cx-rolenote');

  function cellState(value, needsME) {
    if (value === 'no') return { cls: 'cx-dim', text: 'No' };
    if (needsME && !motionEnable) return { cls: 'cx-warn', text: 'Blocked' };
    return { cls: 'cx-ok', text: 'Yes' };
  }

  function renderModes() {
    var m = modes[currentMode];
    modeBtns.forEach(function (b) {
      var on = b.getAttribute('data-mode') === currentMode;
      b.classList.toggle('cx-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    if (capsEl) {
      capsEl.innerHTML = capOrder.map(function (c) {
        var needsME = c.needsMEKey ? m[c.needsMEKey] : false;
        var st = cellState(m[c.key], needsME);
        var sub = needsME ? (motionEnable ? 'needs motion enable &mdash; on' : 'needs motion enable &mdash; switch it on') : '';
        return '<div class="cx-capcard"><span class="cx-capname">' + c.name + '</span><span class="cx-capstate ' + st.cls + '">' + st.text + '</span>' +
          (sub ? '<span class="cx-capsub">' + sub + '</span>' : '') + '</div>';
      }).join('');
    }
    if (roleEl) roleEl.innerHTML = m.role;
  }

  modeBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      currentMode = b.getAttribute('data-mode');
      renderModes();
    });
  });

  if (meBtn) {
    meBtn.addEventListener('click', function () {
      motionEnable = !motionEnable;
      meBtn.setAttribute('aria-pressed', motionEnable ? 'true' : 'false');
      if (meLabel) meLabel.textContent = 'Motion enable: ' + (motionEnable ? 'on' : 'off');
      renderModes();
    });
  }

  renderModes();
}
