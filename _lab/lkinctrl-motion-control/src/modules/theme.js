// Theme toggle (light / dark), persisted to localStorage.
// Lifted verbatim from the artifact's closing <script> — split out of the
// combined theme + scrollspy IIFE, since the two features share no state.

export function initTheme() {
  var root = document.documentElement, btn = document.getElementById('themeBtn');
  function pref() { try { return localStorage.getItem('lkinctrl-theme'); } catch (e) { return null; } }
  var saved = pref(); if (saved === 'dark' || saved === 'light') { root.setAttribute('data-theme', saved); }
  function label() {
    var cur = root.getAttribute('data-theme');
    var dark = cur ? cur === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    btn.textContent = dark ? 'Light' : 'Dark';
  }
  if (btn) {
    label();
    btn.addEventListener('click', function () {
      var cur = root.getAttribute('data-theme');
      var dark = cur ? cur === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
      var next = dark ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('lkinctrl-theme', next); } catch (e) { }
      label();
    });
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', label);
  }
}
