// Architecture diagram: clicking a block shows its interface in the detail panel.
// Moved verbatim from the artifact's concepts/architecture <script> (the first half,
// which shared one IIFE with the operation-modes logic now split into operation-modes.js).
import { archDetails } from '../data/architecture-details.js';

export function initArchitectureDetail() {
  var archButtons = Array.prototype.slice.call(document.querySelectorAll('.cx-node[data-detail]'));
  var archPanel = document.getElementById('cx-detail-panel');

  function selectArchNode(id) {
    archButtons.forEach(function (b) {
      var on = b.getAttribute('data-detail') === id;
      b.classList.toggle('cx-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    if (archPanel && archDetails[id]) archPanel.innerHTML = archDetails[id];
  }

  archButtons.forEach(function (b) {
    b.addEventListener('click', function () { selectArchNode(b.getAttribute('data-detail')); });
  });
  if (archPanel) selectArchNode('core');
}
