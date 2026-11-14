/**
 * Motion tokens (BRIEF §5b) — the single source for React islands.
 * Mirrors the CSS custom properties in src/styles/global.css.
 * Rules: one easing; 150–200ms taps, 500–700ms reveals, ≤1.2s hero line/count-ups;
 * move 12–24px; scale 0.98–1.04; blur ≤8px; tilt ≤6°; stagger 60–80ms; play once.
 */
export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
export const EASE_CSS = 'cubic-bezier(0.22, 1, 0.36, 1)';

/** Durations in seconds (motion uses seconds). */
export const DUR = {
  tap: 0.18,
  fade: 0.2,
  reveal: 0.6,
  line: 1.2,
  count: 1.2,
  crossfade: 0.7,
} as const;

/** Stagger between items in a group, in seconds. */
export const STAGGER = {
  words: 0.08, // hero name: 80ms apart
  items: 0.07,
  frames: 0.08, // achievement frames: 80ms apart
} as const;

/** Travel distances in px. */
export const MOVE = { sm: 12, md: 16, lg: 24 } as const;
export const BLUR_MAX = 8; // px
export const SCALE_IN = 1.04;
export const TILT_MAX = 6; // degrees

/** Hero load sequence, in seconds from first paint. */
export const HERO = {
  name: 0.1,
  tagline: 0.4,
  portrait: 0.6,
  line: 0.8,
  actions: 1.0,
} as const;

/** Testimonial crossfade interval (ms). Pauses on hover and focus. */
export const TESTIMONIAL_INTERVAL = 8000;

export const transition = (duration: number = DUR.reveal, delay = 0) => ({
  duration,
  delay,
  ease: EASE,
});

/**
 * True when the device asks for less motion: reveals then show instantly.
 */
export function shouldSkipReveal(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Fine pointer + hover capable (desktop). Tilt and drift only run here. */
export function isFinePointer(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}
