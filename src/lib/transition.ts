/**
 * Page transition: a green curtain wipe carrying the brass inflection line.
 * Astro's ClientRouter still does the navigation (and back/forward); the page
 * swap itself has no view-transition animation (<html transition:animate="none">).
 *
 *   before-preparation  curtain rises from the bottom (clip-path), line draws  ≈ 0.3s
 *                       … the next page is fetched in parallel …
 *   after-swap          curtain lifts off the top, line runs out              ≈ 0.38s
 *
 * ≤ 800ms in total. Under reduced motion it does nothing (the swap is instant).
 * The curtain element persists across pages (transition:persist).
 */
import { gsap } from './scroll';

const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const curtain = () => document.querySelector<HTMLElement>('[data-curtain]');

let covering: Promise<void> | null = null;

function cover(): Promise<void> {
  const el = curtain();
  if (!el) return Promise.resolve();
  const line = el.querySelector<SVGPathElement>('[data-curtain-line]');
  return new Promise((resolve) => {
    gsap.killTweensOf([el, line]);
    gsap.set(el, { display: 'block', clipPath: 'inset(100% 0% 0% 0%)' });
    if (line) gsap.set(line, { drawSVG: '0% 0%' });
    gsap
      .timeline({ onComplete: resolve })
      .to(el, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.3, ease: 'power3.inOut' })
      .to(line ?? {}, { drawSVG: '0% 100%', duration: 0.3, ease: 'power2.inOut' }, 0.03);
  });
}

function reveal() {
  const el = curtain();
  if (!el || getComputedStyle(el).display === 'none') return;
  const line = el.querySelector<SVGPathElement>('[data-curtain-line]');
  gsap
    .timeline({ onComplete: () => gsap.set(el, { display: 'none', clearProps: 'clipPath' }) })
    .to(line ?? {}, { drawSVG: '100% 100%', duration: 0.3, ease: 'power2.in' }, 0)
    .to(el, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.36, ease: 'power3.inOut' }, 0.02);
}

document.addEventListener('astro:before-preparation', (event) => {
  if (reduce() || !curtain()) return;
  const e = event as Event & { loader: () => Promise<void> };
  const original = e.loader;
  e.loader = async () => {
    covering = cover();
    await Promise.all([covering, original()]);
  };
});

document.addEventListener('astro:after-swap', () => {
  if (!covering) return;
  covering = null;
  // Next frame: let the new page lay out under the curtain first.
  requestAnimationFrame(reveal);
});
