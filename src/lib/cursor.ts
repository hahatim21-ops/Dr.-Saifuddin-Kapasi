/**
 * Custom cursor (desktop fine pointers only, never with reduced motion).
 * - A small ink dot plus a brass ring that follows with lerp.
 * - Over [data-cursor="Label"] the ring grows and shows the label
 *   ("Read", "View", "Open", "Drag"); over other links/buttons it grows a little.
 * - The native cursor stays on inputs, textareas and selects (ours hides there).
 * - Purely decorative: aria-hidden, pointer-events none. Focus outlines unchanged.
 * - Site-wide on desktop fine pointers.
 */
import { gsap, registerScene } from './scroll';

const NATIVE = 'input, textarea, select, [contenteditable="true"]';
const INTERACTIVE = 'a, button, [role="button"], summary, label';

registerScene('cursor', ({ desktop }) => {
  if (!desktop) return;

  const root = document.documentElement;
  const dot = document.createElement('div');
  const ring = document.createElement('div');
  const label = document.createElement('span');
  dot.className = 'cursor-dot';
  ring.className = 'cursor-ring';
  label.className = 'cursor-ring__label';
  ring.append(label);
  for (const el of [dot, ring]) {
    el.setAttribute('aria-hidden', 'true');
    document.body.append(el);
  }
  root.classList.add('has-cursor');

  gsap.set([dot, ring], { xPercent: -50, yPercent: -50, x: -100, y: -100, opacity: 0 });
  const dotX = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3' });
  const dotY = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3' });
  const ringX = gsap.quickTo(ring, 'x', { duration: 0.55, ease: 'power3' });
  const ringY = gsap.quickTo(ring, 'y', { duration: 0.55, ease: 'power3' });

  let shown = false;
  const move = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    dotX(e.clientX);
    dotY(e.clientY);
    ringX(e.clientX);
    ringY(e.clientY);
    if (!shown) {
      shown = true;
      gsap.to([dot, ring], { opacity: 1, duration: 0.2 });
    }
  };

  let state = '';
  const over = (e: PointerEvent) => {
    const t = e.target as Element | null;
    if (!t) return;
    const native = t.closest(NATIVE);
    const labelled = t.closest<HTMLElement>('[data-cursor]');
    const interactive = t.closest(INTERACTIVE);
    const next = native ? 'native' : labelled ? `label:${labelled.dataset.cursor}` : interactive ? 'link' : '';
    if (next === state) return;
    state = next;
    // data-cursor-tone="light": the label sits on a green surface, so invert it.
    ring.classList.toggle('is-light', !!labelled && labelled.dataset.cursorTone === 'light');
    ring.classList.toggle('is-label', next.startsWith('label:'));
    ring.classList.toggle('is-link', next === 'link');
    label.textContent = next.startsWith('label:') ? next.slice(6) : '';
    gsap.to([dot, ring], { opacity: native ? 0 : 1, duration: 0.18, overwrite: 'auto' });
  };
  const leaveWindow = () => {
    shown = false;
    gsap.to([dot, ring], { opacity: 0, duration: 0.2 });
  };
  const down = () => gsap.to(ring, { scale: 0.85, duration: 0.15 });
  const up = () => gsap.to(ring, { scale: 1, duration: 0.3, ease: 'inflect' });

  window.addEventListener('pointermove', move, { passive: true });
  document.addEventListener('pointerover', over, { passive: true });
  document.documentElement.addEventListener('pointerleave', leaveWindow);
  window.addEventListener('pointerdown', down);
  window.addEventListener('pointerup', up);

  return () => {
    window.removeEventListener('pointermove', move);
    document.removeEventListener('pointerover', over);
    document.documentElement.removeEventListener('pointerleave', leaveWindow);
    window.removeEventListener('pointerdown', down);
    window.removeEventListener('pointerup', up);
    dot.remove();
    ring.remove();
    root.classList.remove('has-cursor');
  };
});
