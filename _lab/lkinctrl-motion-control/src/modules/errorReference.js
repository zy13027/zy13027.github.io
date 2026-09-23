// Errors section: the group-filterable, searchable status/error identifier table.
// Lifted verbatim from the artifact's reference-section closing <script>.

import { $, $all, esc } from './util/dom.js';
import { ERR_GROUPS, ERR_ROWS } from '../data/errors.js';

export function initErrorReference() {
  function renderErr() {
    var pillsEl = $('#rf-err-pills'), searchEl = $('#rf-err-search'), body = $('#rf-err-body');
    if (!body) return;
    var activePill = pillsEl ? pillsEl.querySelector('.pill.on') : null;
    var grp = activePill ? activePill.getAttribute('data-grp') : 'all';
    var q = (searchEl ? searchEl.value : '').toLowerCase();
    var rows = ERR_ROWS.filter(function (r) {
      if (grp !== 'all' && r[0] !== grp) return false;
      if (!q) return true;
      return (r[1] + ' ' + r[2] + ' ' + r[3]).toLowerCase().indexOf(q) > -1;
    });
    body.innerHTML = rows.map(function (r) {
      var g = ERR_GROUPS.filter(function (x) { return x.id === r[0]; })[0];
      var kind = r[4] === 'E' ? '<span class="tag rf-tag-e">ERROR</span>' : '<span class="tag rf-tag-s">STATUS</span>';
      return '<tr><td>' + esc(g ? g.label : r[0]) + '</td><td>' + esc(r[1]) + '</td><td>' + esc(r[2]) + '</td><td>' + kind + '</td><td>' + esc(r[3]) + '</td></tr>';
    }).join('') || '<tr><td colspan="5" style="color:var(--text-dim)">No matching identifier.</td></tr>';
    $('#rf-err-count').textContent = rows.length + ' / ' + ERR_ROWS.length + ' identifiers';
  }
  var errPills = $('#rf-err-pills');
  if (errPills) {
    var html = '<button type="button" class="pill on" data-grp="all">All · ' + ERR_ROWS.length + '</button>';
    ERR_GROUPS.forEach(function (g) {
      var n = ERR_ROWS.filter(function (r) { return r[0] === g.id; }).length;
      html += '<button type="button" class="pill" data-grp="' + g.id + '">' + esc(g.label) + ' (' + g.chapter + ') · ' + n + '</button>';
    });
    errPills.innerHTML = html;
    errPills.addEventListener('click', function (e) {
      var b = e.target.closest('.pill'); if (!b) return;
      $all('.pill', errPills).forEach(function (p) { p.classList.remove('on'); });
      b.classList.add('on'); renderErr();
    });
  }
  var errSearch = $('#rf-err-search');
  if (errSearch) { errSearch.addEventListener('input', renderErr); }
  if ($('#rf-err-body')) renderErr();
}
