// Flags section: the searchable flagMode reference table.
// Lifted verbatim from the artifact's reference-section closing <script>.

import { $, esc } from './util/dom.js';
import { FLAG_MODES } from '../data/flags.js';

export function initFlagModes() {
  function renderFlags(q) {
    q = (q || '').toLowerCase();
    var rows = FLAG_MODES.filter(function (m) { return !q || (m[0] + ' ' + m[1] + ' ' + m[2]).toLowerCase().indexOf(q) > -1; });
    var body = $('#rf-flag-body');
    if (!body) return;
    body.innerHTML = rows.map(function (m) {
      return '<tr><td class="num">' + m[0] + '</td><td class="mono">' + esc(m[1]) + '</td><td>' + esc(m[2]) + '</td></tr>';
    }).join('') || '<tr><td colspan="3" style="color:var(--text-dim)">No matching flag mode.</td></tr>';
    $('#rf-flag-count').textContent = rows.length + ' / ' + FLAG_MODES.length + ' flag modes';
  }
  var flagSearch = $('#rf-flag-search');
  if (flagSearch) { flagSearch.addEventListener('input', function () { renderFlags(flagSearch.value); }); renderFlags(''); }
}
