// Concept + MC_MovePath sections: interface-table P-Type filter and the
// operating-mode (Automatic / Single command) tab switcher.
// Lifted verbatim from the artifact's first closing <script> (already strict mode).

export function initConceptMovepath() {
  function onActivate(el, fn) {
    el.addEventListener('click', fn);
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        fn();
      }
    });
  }

  function setPressed(el, on) {
    el.classList.toggle('on', on);
    el.setAttribute('aria-pressed', on ? 'true' : 'false');
  }

  // Interface table filter
  try {
    var filterPills = Array.prototype.slice.call(document.querySelectorAll('[data-pc-filter]'));
    var table = document.getElementById('pc-iface-table');
    var emptyMsg = document.getElementById('pc-iface-empty');

    filterPills.forEach(function (pill) {
      onActivate(pill, function () {
        var filter = pill.getAttribute('data-pc-filter');
        filterPills.forEach(function (p) { setPressed(p, p === pill); });

        if (!table) { return; }
        var rows = table.querySelectorAll('tbody tr');
        var visibleData = 0;
        rows.forEach(function (row) {
          var ptype = row.getAttribute('data-ptype');
          var show = filter === 'all' || ptype === filter;
          row.hidden = !show;
          if (show && !row.classList.contains('pc-group-row')) { visibleData++; }
        });
        if (emptyMsg) { emptyMsg.hidden = visibleData !== 0; }
      });
    });
  } catch (err) { /* filtering is a convenience, table stays fully visible if it fails */ }

  // Operating-mode tabs
  try {
    var modePills = Array.prototype.slice.call(document.querySelectorAll('[data-pc-mode]'));
    var panels = {
      auto: document.getElementById('pc-mode-panel-auto'),
      single: document.getElementById('pc-mode-panel-single')
    };

    modePills.forEach(function (pill) {
      onActivate(pill, function () {
        var mode = pill.getAttribute('data-pc-mode');
        modePills.forEach(function (p) { setPressed(p, p === pill); });
        Object.keys(panels).forEach(function (key) {
          if (panels[key]) { panels[key].hidden = key !== mode; }
        });
      });
    });
  } catch (err) { /* both panels stay visible if this fails */ }
}
