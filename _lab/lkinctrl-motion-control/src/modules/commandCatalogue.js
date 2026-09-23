// Commands section: the filterable/searchable command-family catalogue.
// Lifted verbatim from the artifact's reference-section closing <script>.

import { $, $all, esc } from './util/dom.js';
import { CMD_FAMILIES } from '../data/commands.js';

export function initCommandCatalogue() {
  function renderCmd() {
    var pillsEl = $('#rf-cmd-pills'), searchEl = $('#rf-cmd-search'), gridEl = $('#rf-cmd-grid');
    if (!gridEl) return;
    var activePill = pillsEl ? pillsEl.querySelector('.pill.on') : null;
    var fam = activePill ? activePill.getAttribute('data-fam') : 'all';
    var q = (searchEl ? searchEl.value : '').toLowerCase();
    var list = CMD_FAMILIES.filter(function (f) {
      if (fam !== 'all' && f.id !== fam) return false;
      if (!q) return true;
      var hay = (f.name + ' ' + f.chips.join(' ') + ' ' + f.summary + ' ' + f.rules.join(' ') + ' ' + f.params.join(' ')).toLowerCase();
      return hay.indexOf(q) > -1;
    });
    var totalChips = CMD_FAMILIES.reduce(function (n, f) { return n + f.chips.length; }, 0);
    var shownChips = list.reduce(function (n, f) { return n + f.chips.length; }, 0);
    $('#rf-cmd-count').textContent = 'Showing ' + list.length + ' of ' + CMD_FAMILIES.length + ' families · ' + shownChips + ' / ' + totalChips + ' command types';
    gridEl.innerHTML = list.map(function (f) {
      return '<article class="card pad rf-fam"><h4>' + esc(f.name) + ' <span class="tag">' + f.chapter + '</span></h4>'
        + (f.chips.length ? '<div class="rf-chiprow">' + f.chips.map(function (c) { return '<span class="rf-chip">cmdType ' + esc(c) + '</span>'; }).join('') + '</div>' : '')
        + '<p>' + f.summary + '</p>'
        + (f.params.length ? '<ul>' + f.params.map(function (p) { return '<li>' + p + '</li>'; }).join('') + '</ul>' : '')
        + (f.detail || '')
        + (f.rules.length ? '<ul>' + f.rules.map(function (r) { return '<li>' + r + '</li>'; }).join('') + '</ul>' : '')
        + '</article>';
    }).join('') || '<p style="color:var(--text-dim)">No command family matches.</p>';
  }
  var cmdPills = $('#rf-cmd-pills');
  if (cmdPills) {
    cmdPills.addEventListener('click', function (e) {
      var b = e.target.closest('.pill'); if (!b) return;
      $all('.pill', cmdPills).forEach(function (p) { p.classList.remove('on'); });
      b.classList.add('on'); renderCmd();
    });
  }
  var cmdSearch = $('#rf-cmd-search');
  if (cmdSearch) { cmdSearch.addEventListener('input', renderCmd); }
  if ($('#rf-cmd-grid')) renderCmd();
}
