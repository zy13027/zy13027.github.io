// PathData section: the searchable field-reference table.
// Lifted verbatim from the artifact's reference-section closing <script>.

import { $, esc } from './util/dom.js';
import { PD_FIELDS } from '../data/pathdata-fields.js';

export function initPathDataReference() {
  function renderPD(q) {
    q = (q || '').toLowerCase();
    var rows = PD_FIELDS.filter(function (f) { return !q || f[0].toLowerCase().indexOf(q) > -1 || f[2].toLowerCase().indexOf(q) > -1; });
    var body = $('#rf-pd-body');
    if (!body) return;
    body.innerHTML = rows.map(function (f) {
      return '<tr><td class="mono rf-path">' + esc(f[0]) + '</td><td class="mono">' + esc(f[1]) + '</td><td>' + esc(f[2]) + '</td></tr>';
    }).join('') || '<tr><td colspan="3" style="color:var(--text-dim)">No matching fields.</td></tr>';
    $('#rf-pd-count').textContent = rows.length + ' / ' + PD_FIELDS.length + ' fields';
  }
  var pdSearch = $('#rf-pd-search');
  if (pdSearch) { pdSearch.addEventListener('input', function () { renderPD(pdSearch.value); }); renderPD(''); }
}
