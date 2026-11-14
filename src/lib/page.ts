/**
 * Run a setup function once per page — robustly.
 *
 * Astro fires `astro:page-load` on the first load and after every client-side
 * navigation. But module scripts load in parallel, so a script that is still
 * downloading (e.g. one that imports GSAP) can miss the first event. This
 * helper runs `fn` straight away if the DOM is ready, and on every later
 * page-load, but never twice for the same page (keyed on the <body>, which the
 * router replaces on each navigation).
 */
const ranOn = new WeakMap<() => void, HTMLElement>();

export function onPageLoad(fn: () => void) {
  const run = () => {
    if (ranOn.get(fn) === document.body) return;
    ranOn.set(fn, document.body);
    fn();
  };
  document.addEventListener('astro:page-load', run);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();
}
