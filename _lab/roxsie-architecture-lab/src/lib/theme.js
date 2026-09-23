/**
 * Theme plumbing. The page has three states, not two: an explicit choice stamps
 * data-theme on <html>, and the default "system" setting stamps nothing, so only
 * prefers-color-scheme separates light from dark. tokens.css covers all three.
 */
const root = document.documentElement;
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

/** Read a design token at its current computed value — canvas needs real colours. */
export const cssVar = (name) => getComputedStyle(root).getPropertyValue(name).trim();

export const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initThemeToggle(button) {
  if (!button) return;
  button.addEventListener('click', () => {
    const effective = root.getAttribute('data-theme') || (darkQuery.matches ? 'dark' : 'light');
    root.setAttribute('data-theme', effective === 'dark' ? 'light' : 'dark');
  });
}

/** Canvas and inline SVG hold literal colours, so they must be redrawn on a theme flip. */
export function onThemeChange(handler) {
  new MutationObserver(handler).observe(root, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
  darkQuery.addEventListener('change', handler);
}
