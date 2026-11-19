/**
 * Motion tokens for GSAP (BRIEF §5b). Mirrored as CSS custom properties in
 * src/styles/global.css (--ease-expo, --ease-ui, …).
 *
 * Motion v3 — three tiers, applied consistently:
 *   Tier 1 · cinematic, scrubbed (scrub 0.8): only the travelling prism, the
 *            Manifesto, the Arc, the book covers and the Speaking track.
 *   Tier 2 · section reveals, one-shot at 'top 80%': SplitText line reveals
 *            only on h1 and section h2s (0.9s); everything else (body, cards,
 *            small images) a fade-up 16px → 0, opacity 0 → 1, 0.6s, expo.out
 *            (CSS [data-reveal]); clip-path wipes only on large photos (hero,
 *            gallery, about portrait). Any group finishes within 0.6s of
 *            stagger + its duration (stagger amount ≤ 0.4s). fastScrollEnd.
 *   Tier 3 · UI feedback: 0.15–0.2s, the "inflect" ease.
 * Characters split only on the hero name.
 *
 * Motion v4 — Onda's motion in our brand (GSAP + ScrollTrigger + Lenis only;
 * no CSS scroll timelines). Tier 1 now also holds:
 *   Hero      the prism aperture shrinks onto the brass full stop after
 *             "Kapasi" (scrub, x/y power1.inOut, scale power3.in), and the
 *             travelling prism lifts off from there. Desktop only.
 *   Pillars   Onda's stacked cards: CSS sticky from 768px (no GSAP pin), the
 *             card underneath scales 1 → 0.9 and darkens 0 → 0.55 (scrub: true).
 *   Speaking  the green plate opens from inset(0 3.2% round 44px) to full
 *             width; after the pinned track, the cards tilt and fall out of
 *             the plate (scrub, power1.in). Desktop only.
 * Budgets: ≤ 3 GSAP pins on home (now 2: Manifesto, Speaking — the hero no
 * longer pins; it scrubs while scrolling away); sticky stacks
 * count toward the "feels stuck" test; phones get fade-ups only.
 */
export const GS = {
  ease: { ui: 'inflect', reveal: 'expo.out', strong: 'power4.out' },
  dur: { ui: 0.18, heading: 0.9, body: 0.6, reveal: 1.0, revealLong: 1.2, chars: 0.9, count: 1.2, curtain: 0.8, loaderMax: 1.2 },
  stagger: { chars: 0.025, words: 0.04, lines: 0.08, frames: 0.08 },
  /** Scrub smoothing in seconds (0.6–1). */
  scrub: 0.8,
  /** Magnetic pull, px. */
  magnetic: 8,
  /** Velocity skew cap, degrees. */
  skewMax: 3,
} as const;

/**
 * Motion v1 tokens (Motion/React islands that are driven by interaction).
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
