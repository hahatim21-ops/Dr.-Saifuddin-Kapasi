/**
 * Motion v2 engine — the one place GSAP, ScrollTrigger and Lenis are set up.
 *
 * - Registers plugins once (ScrollTrigger, SplitText, DrawSVGPlugin, CustomEase;
 *   Flip is loaded on demand by the scenes that need it, via `loadFlip()`).
 * - Lenis runs only on desktop fine pointers, driven by gsap.ticker
 *   (lenis.on('scroll', ScrollTrigger.update), autoRaf off, lagSmoothing(0)).
 * - Every animation lives inside gsap.matchMedia() with three contexts:
 *   desktop · touch/small · reduced motion. Scenes receive which one applies.
 * - Astro ClientRouter: astro:before-swap reverts every context and kills all
 *   ScrollTriggers; astro:page-load creates them again. ScrollTrigger.refresh()
 *   runs after document.fonts.ready and after lazy images load.
 *
 * Guardrail: hidden start states are only ever set here, at runtime. With JS off
 * nothing is hidden. html.motion-pending (added by an inline head script, with
 * a 2.5s failsafe) keeps split/clip targets invisible for the few frames before
 * this engine takes over, then is removed.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { CustomEase } from 'gsap/CustomEase';
import Lenis from 'lenis';
import { GS } from './motion';
import { onPageLoad } from './page';
import { sceneRegistry, registerScene, type MotionMode, type Scene, type SceneContext } from './scenes';
import { provide } from './tools';

gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin, CustomEase);
CustomEase.create('inflect', '0.22,1,0.36,1');
ScrollTrigger.config({ ignoreMobileResize: true });

// A refresh briefly re-parents pinned sections, which drops keyboard focus
// inside them (e.g. a card in the Speaking track). Put it back afterwards.
let focusBeforeRefresh: HTMLElement | null = null;
ScrollTrigger.addEventListener('refreshInit', () => {
  const el = document.activeElement;
  focusBeforeRefresh = el instanceof HTMLElement && el !== document.body ? el : null;
});
ScrollTrigger.addEventListener('refresh', () => {
  const el = focusBeforeRefresh;
  focusBeforeRefresh = null;
  if (el && el.isConnected && document.activeElement !== el) el.focus({ preventScroll: true });
});
gsap.defaults({ ease: GS.ease.reveal, duration: GS.dur.reveal });

export { gsap, ScrollTrigger, SplitText, DrawSVGPlugin };

/* -------------------------------------------------------------------------- */
/* Contexts                                                                   */
/* -------------------------------------------------------------------------- */

export const MQ = {
  desktop: '(min-width: 1024px) and (hover: hover) and (pointer: fine)',
  reduce: '(prefers-reduced-motion: reduce)',
} as const;

export type { MotionMode, SceneContext, Scene } from './scenes';
export { registerScene } from './scenes';

const scenes = sceneRegistry.scenes;
// Scenes registered after start-up (a late island, a lazily loaded module) run now.
sceneRegistry.onRegister = (name, scene) => {
  if (mm) runScene(name, scene);
};

let mm: gsap.MatchMedia | null = null;
let current: SceneContext | null = null;
let lenis: Lenis | null = null;

function runScene(name: string, scene: Scene) {
  if (!mm || !current) return;
  const ctx = current;
  // Each scene gets its own matchMedia entry so it reverts with the context.
  // gsap.matchMedia only calls back when at least one condition matches, so an
  // always-true "any" condition makes the touch context (neither desktop nor
  // reduce) run too; desktop/reduce changes still revert and re-run the scene.
  mm.add({ desktop: MQ.desktop, reduce: MQ.reduce, any: '(min-width: 0px)' }, (c) => {
    const { desktop, reduce } = c.conditions as { desktop: boolean; reduce: boolean };
    const mode: MotionMode = reduce ? 'reduce' : desktop ? 'desktop' : 'touch';
    try {
      return scene({ ...ctx, mode, desktop: mode === 'desktop', touch: mode === 'touch', reduce: mode === 'reduce' });
    } catch (err) {
      console.error(`[motion] scene "${name}" failed`, err);
    }
  });
}

/* -------------------------------------------------------------------------- */
/* Lenis (desktop fine pointers only, never with reduced motion)              */
/* -------------------------------------------------------------------------- */

function lenisTick(time: number) {
  lenis?.raf(time * 1000);
}

function setupLenis() {
  const want = matchMedia(MQ.desktop).matches && !matchMedia(MQ.reduce).matches;
  if (want && !lenis) {
    lenis = new Lenis({ autoRaf: false, lerp: 0.1, anchors: true, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(lenisTick);
    gsap.ticker.lagSmoothing(0);
  } else if (!want && lenis) {
    gsap.ticker.remove(lenisTick);
    lenis.destroy();
    lenis = null;
  }
  (window as unknown as { __lenis: Lenis | null }).__lenis = lenis;
}

export function getLenis() {
  return lenis;
}

/** Smooth scroll with Lenis when present, native otherwise. */
export function scrollToTarget(target: number | string | HTMLElement, offset = 0) {
  if (lenis) lenis.scrollTo(target as never, { offset });
  else {
    const y =
      typeof target === 'number'
        ? target
        : (typeof target === 'string' ? document.querySelector(target) : target)?.getBoundingClientRect().top ?? 0;
    window.scrollTo({ top: typeof target === 'number' ? y : y + window.scrollY + offset });
  }
}

/* -------------------------------------------------------------------------- */
/* Lifecycle                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Scenes that set up what is on screen at load run first, in one task. The
 * rest run one per task (yielding to the main thread in between), so start-up
 * never blocks input with one long task; then a single refresh measures
 * everything with all pins in place.
 */
const CRITICAL = ['loader', 'hero', 'nav', 'split', 'clip', 'cursor'];
let generation = 0;

const yieldThen = (fn: () => void) => {
  const s = (window as unknown as { scheduler?: { yield?: () => Promise<void> } }).scheduler;
  if (s?.yield) s.yield().then(fn);
  else setTimeout(fn, 0);
};

function start() {
  stop();
  const gen = generation;
  setupLenis();
  current = {
    mode: 'touch',
    desktop: false,
    touch: true,
    reduce: matchMedia(MQ.reduce).matches,
    lenis,
  };
  mm = gsap.matchMedia();
  const names = [...scenes.keys()];
  const first = CRITICAL.filter((n) => scenes.has(n));
  const rest = names.filter((n) => !CRITICAL.includes(n));
  first.forEach((n) => runScene(n, scenes.get(n)!));

  const finish = () => {
    document.documentElement.classList.remove('motion-pending');
    ScrollTrigger.refresh();
    // Refresh again once web fonts have settled; and when a size-less image lands.
    document.fonts?.ready.then(() => gen === generation && ScrollTrigger.refresh());
    scheduleRefreshOnImages();
  };
  const step = () => {
    if (gen !== generation) return; // the page changed meanwhile
    const name = rest.shift();
    if (name === undefined) return finish();
    const scene = scenes.get(name);
    if (scene) runScene(name, scene);
    yieldThen(step);
  };
  yieldThen(step);
}

function stop() {
  generation++;
  mm?.revert();
  mm = null;
  ScrollTrigger.getAll().forEach((t) => t.kill());
  ScrollTrigger.clearScrollMemory?.();
}

let refreshTimer = 0;
function queueRefresh() {
  clearTimeout(refreshTimer);
  refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 150);
}
/**
 * Lazy images only change the layout when they have no intrinsic size. Every
 * image on this site ships width + height (or sits in an aspect-ratio box), so
 * most loads need no refresh — and refreshing mid-scroll is expensive (forced
 * layouts, pinned sections re-measured), so only size-less images trigger one.
 */
function scheduleRefreshOnImages() {
  document.querySelectorAll<HTMLImageElement>('img[loading="lazy"]').forEach((img) => {
    if (img.complete || (img.hasAttribute('width') && img.hasAttribute('height'))) return;
    img.addEventListener('load', queueRefresh, { once: true });
  });
}

document.addEventListener('astro:before-swap', (e) => {
  stop();
  // Keep reveal targets hidden on the incoming page until scenes re-run.
  const next = (e as unknown as { newDocument: Document }).newDocument;
  if (!matchMedia(MQ.reduce).matches) next.documentElement.classList.add('motion-pending');
});
document.addEventListener('astro:after-swap', () => {
  document.documentElement.classList.add('js');
  lenis?.resize();
});
// Boot once per page, even if astro:page-load fired before this module loaded.
onPageLoad(() => {
  // Next frame normally; the timeout covers background tabs where rAF is paused.
  let done = false;
  const go = () => {
    if (done) return;
    done = true;
    start();
  };
  requestAnimationFrame(go);
  setTimeout(go, 60);
});
matchMedia(MQ.reduce).addEventListener('change', () => setupLenis());
matchMedia(MQ.desktop).addEventListener('change', () => setupLenis());

/* -------------------------------------------------------------------------- */
/* On-demand plugin                                                           */
/* -------------------------------------------------------------------------- */

let flipPromise: Promise<typeof import('gsap/Flip').Flip> | null = null;
/** Flip is only needed by the lightbox and filters, so it loads on first use. */
export function loadFlip() {
  flipPromise ??= import('gsap/Flip').then(({ Flip }) => {
    gsap.registerPlugin(Flip);
    return Flip;
  });
  return flipPromise;
}

/* ========================================================================== */
/* Primitives — each is a scene that only acts if its data attribute exists.  */
/* ========================================================================== */

/**
 * Split reveal: [data-split="lines"|"chars"|"words"]
 * Lines rise from yPercent 110 inside masks (0.08s stagger); chars 0.025s.
 * aria: 'auto' keeps whole words for screen readers; autoSplit + onSplit
 * re-split cleanly on resize or font load.
 */
type SplitVars = NonNullable<Parameters<typeof SplitText.create>[1]>;
const HEADING = /^H[1-6]$/;

/**
 * SplitText with accessible output everywhere. Headings may carry an
 * aria-label, so they use aria: 'auto'. Other elements (a <p> may not be
 * named) get aria: 'hidden' on the split pieces plus a screen-reader-only copy
 * of the text, re-added after every (auto) re-split; revert() removes it.
 */
export function splitText(el: HTMLElement, vars: SplitVars) {
  if (HEADING.test(el.tagName)) return SplitText.create(el, { ...vars, aria: 'auto' });
  const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim();
  const addTwin = () => {
    if (el.querySelector(':scope > .split-sr')) return;
    const twin = document.createElement('span');
    twin.className = 'sr-only split-sr';
    twin.textContent = text;
    el.append(twin);
  };
  const userOnSplit = vars.onSplit;
  const split = SplitText.create(el, {
    ...vars,
    aria: 'hidden',
    onSplit(self) {
      addTwin();
      return userOnSplit?.call(this, self);
    },
  });
  addTwin();
  return split;
}

registerScene('split', ({ reduce }) => {
  if (reduce) return;
  const splits: SplitText[] = [];
  const make = (el: HTMLElement) => {
    const kind = (el.dataset.split || 'lines') as 'lines' | 'chars' | 'words';
    const delay = Number(el.dataset.splitDelay || 0);
    const immediate = el.hasAttribute('data-split-now');
    splits.push(
      splitText(el, {
        type: kind === 'chars' ? 'lines,words,chars' : kind === 'words' ? 'lines,words' : 'lines',
        mask: kind === 'chars' ? 'lines' : kind,
        autoSplit: true,
        linesClass: 'split-line',
        onSplit(self) {
          const targets = kind === 'chars' ? self.chars : kind === 'words' ? self.words : self.lines;
          return gsap.from(targets, {
            yPercent: 110,
            duration: kind === 'chars' ? GS.dur.chars : GS.dur.reveal,
            ease: GS.ease.reveal,
            stagger: kind === 'chars' ? GS.stagger.chars : kind === 'words' ? GS.stagger.words : GS.stagger.lines,
            delay,
            // Capped just below the page's maximum scroll, so a line at the very
            // end of the page (the footer sign-off) still plays.
            scrollTrigger: immediate
              ? undefined
              : {
                  trigger: el,
                  start: () =>
                    Math.min(
                      ScrollTrigger.maxScroll(window) - 1,
                      el.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.88
                    ),
                  once: true,
                },
          });
        },
      })
    );
  };
  document.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
    if (el.hasAttribute('data-split-now')) return make(el);
    // Split lazily, well before the element reaches the screen: start-up stays
    // light, and the text is never seen unsplit.
    ScrollTrigger.create({ trigger: el, start: 'top bottom+=60%', once: true, onEnter: () => make(el) });
  });
  return () => splits.forEach((s) => s.revert());
});

/**
 * Clip reveal: [data-clip="up"|"left"|"right"] wraps an image. The wrapper
 * wipes open with clip-path inset; the inner image scales 1.15 → 1.
 * [data-parallax] on a large photo adds yPercent ±8 (desktop only).
 */
registerScene('clip', ({ reduce, desktop }) => {
  if (reduce) return;
  const insets: Record<string, string> = {
    up: 'inset(100% 0% 0% 0%)',
    down: 'inset(0% 0% 100% 0%)',
    left: 'inset(0% 100% 0% 0%)',
    right: 'inset(0% 0% 0% 100%)',
  };
  document.querySelectorAll<HTMLElement>('[data-clip]').forEach((wrap) => {
    const from = insets[wrap.dataset.clip || 'up'] ?? insets.up;
    const img = wrap.querySelector('img, svg, picture');
    const tl = gsap.timeline({
      scrollTrigger: wrap.hasAttribute('data-clip-now') ? undefined : { trigger: wrap, start: 'top 85%', once: true },
      delay: Number(wrap.dataset.clipDelay || 0),
    });
    tl.fromTo(wrap, { clipPath: from }, { clipPath: 'inset(0% 0% 0% 0%)', duration: GS.dur.revealLong, ease: GS.ease.strong });
    if (img) tl.fromTo(img, { scale: 1.15 }, { scale: 1, duration: GS.dur.revealLong + 0.2, ease: GS.ease.reveal }, 0);
  });
  if (!desktop) return;
  document.querySelectorAll<HTMLElement>('[data-parallax]').forEach((el) => {
    const amount = Number(el.dataset.parallax || 8);
    gsap.fromTo(
      el,
      { yPercent: -amount },
      {
        yPercent: amount,
        ease: 'none',
        scrollTrigger: { trigger: el.parentElement ?? el, start: 'top bottom', end: 'bottom top', scrub: GS.scrub },
      }
    );
  });
});

/**
 * Settle: [data-settle="-5"] — a photo that starts tilted like a print on a
 * desk (the value is its start angle in degrees) and straightens as it scrolls
 * into place: scrubbed on desktop, once on entry elsewhere.
 */
registerScene('settle', ({ reduce, desktop }) => {
  if (reduce) return;
  document.querySelectorAll<HTMLElement>('[data-settle]').forEach((el) => {
    const r = Number(el.dataset.settle || -5);
    if (desktop)
      gsap.fromTo(
        el,
        { rotation: r, y: 60, scale: 0.95 },
        {
          rotation: 0,
          y: 0,
          scale: 1,
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'top 30%', scrub: GS.scrub },
        }
      );
    else
      gsap.from(el, {
        rotation: r * 0.6,
        y: 24,
        duration: GS.dur.revealLong,
        scrollTrigger: { trigger: el, start: 'top 92%', once: true },
      });
  });
});

/* ---------------- Odometer ---------------- */

/**
 * Turns an element's number into rolling digit columns. The real value stays
 * in an sr-only span; the columns are aria-hidden. Returns a setter.
 */
export function createOdometer(el: HTMLElement, initial?: string) {
  const text = initial ?? el.textContent?.trim() ?? '0';
  const width = text.length;
  el.dataset.odoOriginal ??= el.innerHTML;
  const sr = document.createElement('span');
  sr.className = 'sr-only';
  sr.textContent = text;
  const wrap = document.createElement('span');
  wrap.className = 'odo';
  wrap.setAttribute('aria-hidden', 'true');
  const strips: HTMLElement[] = [];
  for (let i = 0; i < width; i++) {
    const col = document.createElement('span');
    col.className = 'odo__col';
    const strip = document.createElement('span');
    strip.className = 'odo__strip';
    for (let d = 0; d <= 9; d++) {
      const s = document.createElement('span');
      s.textContent = String(d);
      strip.append(s);
    }
    col.append(strip);
    wrap.append(col);
    strips.push(strip);
  }
  el.replaceChildren(sr, wrap);

  const set = (value: string | number, opts: { duration?: number; stagger?: number; immediate?: boolean } = {}) => {
    const str = String(value).padStart(width, '0').slice(-width);
    sr.textContent = String(value);
    strips.forEach((strip, i) => {
      const digit = Number(str[i]) || 0;
      const vars = { yPercent: -digit * 10 };
      if (opts.immediate) gsap.set(strip, vars);
      else
        gsap.to(strip, {
          ...vars,
          duration: opts.duration ?? GS.dur.count,
          ease: GS.ease.strong,
          delay: (opts.stagger ?? 0.06) * i,
          overwrite: true,
        });
    });
  };
  const restore = () => {
    if (el.dataset.odoOriginal !== undefined) el.innerHTML = el.dataset.odoOriginal;
  };
  set(text, { immediate: true }); // start by showing the element's own value
  return { set, restore, width };
}

/** [data-odometer]: rolls from zeros to its value once, as it enters. */
registerScene('odometer', ({ reduce }) => {
  if (reduce) return;
  const odos = [...document.querySelectorAll<HTMLElement>('[data-odometer]')].map((el) => {
    const value = el.textContent?.trim() ?? '0';
    const o = createOdometer(el, value);
    o.set('0'.repeat(o.width), { immediate: true });
    gsap.fromTo(el, { scale: 0.9 }, { scale: 1, duration: GS.dur.count, ease: GS.ease.reveal, scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: () => o.set(value) });
    return o;
  });
  return () => odos.forEach((o) => o.restore());
});

/* ---------------- Magnetic ---------------- */

/** [data-magnetic]: follows the pointer by at most 8px (desktop only). */
registerScene('magnetic', ({ desktop }) => {
  if (!desktop) return;
  const offs: Array<() => void> = [];
  document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
    const max = Number(el.dataset.magnetic || GS.magnetic);
    const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'inflect' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'inflect' });
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      xTo(gsap.utils.clamp(-1, 1, dx) * max);
      yTo(gsap.utils.clamp(-1, 1, dy) * max);
    };
    const leave = () => {
      xTo(0);
      yTo(0);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    offs.push(() => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
      gsap.set(el, { clearProps: 'x,y' });
    });
  });
  return () => offs.forEach((f) => f());
});

/* ---------------- Inflection edge ---------------- */

/**
 * [data-edge] (InflectionEdge.astro): the top edge of a green band. The HTML
 * ships the finished curve; at runtime it starts flat and bends upward,
 * scrubbed as the band scrolls into view. Only the path's numbers change, so
 * GSAP interpolates the d attribute directly (no morph plugin needed).
 */
registerScene('edge', ({ reduce }) => {
  if (reduce) return;
  document.querySelectorAll<SVGPathElement>('[data-edge] .edge__path').forEach((path) => {
    const curved = path.getAttribute('d')!;
    const flat = path.dataset.flat!;
    gsap.fromTo(
      path,
      { attr: { d: flat } },
      {
        attr: { d: curved },
        ease: 'none',
        scrollTrigger: {
          trigger: path.closest('[data-edge]'),
          start: 'top bottom',
          end: 'top 35%',
          scrub: GS.scrub,
        },
      }
    );
  });
});

/* Hand the tools to component scripts (src/lib/tools.ts live bindings). */
provide({ gsap, ScrollTrigger, SplitText, splitText, createOdometer, getLenis, scrollToTarget, loadFlip });
