// Nav-link scroll-spy. Moved verbatim from the artifact's closing <script> (the second
// half, which shared one IIFE with the theme toggle now split into theme.js).
export function initScrollspy() {
  var links = [].slice.call(document.querySelectorAll('.topbar .navlink'));
  var targets = links.map(function (a) { return document.querySelector(a.getAttribute('href')) }).filter(Boolean);
  if ('IntersectionObserver' in window && targets.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.classList.toggle('cur', a.getAttribute('href') === '#' + en.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    targets.forEach(function (t) { io.observe(t) });
  }
}
