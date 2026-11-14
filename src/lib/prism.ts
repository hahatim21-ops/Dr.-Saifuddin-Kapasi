/**
 * The travelling prism (desktop only). One scrubbed segment per pair of
 * waypoints: the prism moves from stop i to stop i+1 while stop i+1 travels
 * from where stop i was "docked" to its own docked position.
 *
 * Waypoint attributes (all optional except data-prism-stop):
 *   data-prism-stop="name"
 *   data-prism-scale="1"        size multiplier (base width 360px)
 *   data-prism-beam="0.3"       incoming beam opacity 0–1
 *   data-prism-spectrum="0"     spectrum split 0–1 (scales the rays out)
 *   data-prism-rotate="0"       degrees
 *   data-prism-opacity="1"      0 hides it (fade-out stop)
 *   data-prism-anchor="center"  left | center | right of the waypoint box
 *   data-prism-dx / -dy="0"     px offsets
 *   data-prism-vy="0.5"         viewport height fraction where it docks
 *   data-prism-hold="0"         stay docked for N vh of scroll (or "section":
 *                               the closest section's height minus one viewport)
 *   data-prism-beam-to / -rotate-to / -scale-to
 *                               values reached by the end of the hold
 *
 * A gentle 6s breathing glow is its only idle loop. Phones, tablets and
 * reduced motion get static prisms placed inside sections instead.
 */
import { gsap, ScrollTrigger, registerScene } from './scroll';
import { GS } from './motion';

type Stop = {
  el: HTMLElement;
  scale: number;
  beam: number;
  spectrum: number;
  rotate: number;
  opacity: number;
  anchor: 'left' | 'center' | 'right';
  dx: number;
  dy: number;
  vy: number;
  hold: number | 'section';
  beamTo: number;
  rotateTo: number;
  scaleTo: number;
};

const num = (v: string | undefined, d: number) => (v === undefined || v === '' ? d : Number(v));

function readStop(el: HTMLElement): Stop {
  const d = el.dataset;
  return {
    el,
    scale: num(d.prismScale, 1),
    beam: num(d.prismBeam, 0.3),
    spectrum: num(d.prismSpectrum, 0),
    rotate: num(d.prismRotate, 0),
    opacity: num(d.prismOpacity, 1),
    anchor: (d.prismAnchor as Stop['anchor']) || 'center',
    dx: num(d.prismDx, 0),
    dy: num(d.prismDy, 0),
    vy: num(d.prismVy, 0.5),
    hold: d.prismHold === 'section' ? 'section' : num(d.prismHold, 0),
    beamTo: num(d.prismBeamTo, num(d.prismBeam, 0.3)),
    rotateTo: num(d.prismRotateTo, num(d.prismRotate, 0)),
    scaleTo: num(d.prismScaleTo, num(d.prismScale, 1)),
  };
}

registerScene('prism', ({ desktop }) => {
  const layer = document.querySelector<HTMLElement>('[data-prism-layer]');
  const stops = [...document.querySelectorAll<HTMLElement>('[data-prism-stop]')].map(readStop);
  if (!layer || !desktop || stops.length === 0) return;

  const fly = layer.querySelector<HTMLElement>('[data-prism-fly]')!;
  const beam = layer.querySelector<SVGGElement>('[data-prism-part="beam"]')!;
  const spectrum = layer.querySelector<SVGGElement>('[data-prism-part="spectrum"]')!;
  const breath = layer.querySelector<HTMLElement>('[data-prism-breath]')!;
  layer.classList.add('is-active');
  document.documentElement.classList.add('has-prism');

  const absCenterY = (s: Stop) => {
    const r = s.el.getBoundingClientRect();
    return r.top + window.scrollY + r.height / 2;
  };
  const x = (s: Stop) => {
    const r = s.el.getBoundingClientRect();
    const base = s.anchor === 'left' ? r.left : s.anchor === 'right' ? r.right : r.left + r.width / 2;
    return base + s.dx;
  };
  /** Scroll position at which this stop is docked (its centre at vy). */
  // Clamped to the page's scroll range, so a stop near the very bottom (the
  // footer sign-off) still docks.
  const dockScroll = (s: Stop) =>
    gsap.utils.clamp(0, ScrollTrigger.maxScroll(window), absCenterY(s) - window.innerHeight * s.vy);
  /** Where the prism sits on screen at a stop's dock moment. */
  const dockY = (s: Stop) => absCenterY(s) - dockScroll(s) + s.dy;

  /** Scroll length a stop stays docked for. */
  const holdPx = (s: Stop) => {
    if (s.hold === 'section') {
      const sec = s.el.closest('[data-prism-hold-host]') ?? s.el.closest('section');
      return sec ? Math.max(0, sec.getBoundingClientRect().height - window.innerHeight) : 0;
    }
    return (window.innerHeight * s.hold) / 100;
  };
  /** State on arrival at a stop … */
  const vars = (s: Stop) => ({
    x: () => x(s),
    y: () => dockY(s),
    scale: s.scale,
    rotation: s.rotate,
    autoAlpha: s.opacity,
  });

  gsap.set(fly, { xPercent: -45, yPercent: -52, transformOrigin: '45% 52%', ...vars(stops[0]) });
  // Rays start at the prism's exit point, so drawing them 0% → n% grows the
  // spectrum outward from the glass.
  const rays = spectrum.querySelectorAll('path');
  const split = (s: Stop) => `0% ${Math.round(s.spectrum * 100)}%`;
  gsap.set(beam, { opacity: stops[0].beam });
  gsap.set(spectrum, { opacity: stops[0].spectrum });
  gsap.set(rays, { drawSVG: split(stops[0]) });

  // One master timeline whose time is measured in scroll pixels. Every hold and
  // travel segment sits on it at its scroll position, so a jump (back/forward,
  // anchor link, fast flick) always renders the right segment last. Separate
  // scrubbed triggers could finish on the same frame and leave the prism at
  // the wrong stop.
  let master: gsap.core.Timeline | null = null;
  let origin = 0;
  const fixed = (s: Stop, end = false) => ({
    x: x(s),
    y: dockY(s),
    scale: end ? s.scaleTo : s.scale,
    rotation: end ? s.rotateTo : s.rotate,
    autoAlpha: s.opacity,
  });
  const build = () => {
    if (master) {
      gsap.killTweensOf(master);
      master.kill();
    }
    const tl = gsap.timeline({ paused: true, defaults: { ease: 'none', immediateRender: false } });
    origin = dockScroll(stops[0]);
    stops.forEach((a, i) => {
      const dock = dockScroll(a) - origin;
      const hold = holdPx(a);
      // Hold: docked in place while beam / rotation / scale ease to their to values.
      if (hold > 0) {
        tl.fromTo(fly, fixed(a), { ...fixed(a, true), duration: hold }, dock).fromTo(
          beam,
          { opacity: a.beam },
          { opacity: a.beamTo, duration: hold },
          dock
        );
      }
      const b = stops[i + 1];
      if (!b) return;
      // Travel: from the end of a's hold to b's dock.
      const at = dock + hold;
      const len = Math.max(1, dockScroll(b) - origin - at);
      tl.fromTo(fly, fixed(a, true), { ...fixed(b), duration: len }, at)
        .fromTo(beam, { opacity: a.beamTo }, { opacity: b.beam, duration: len }, at)
        .fromTo(spectrum, { opacity: a.spectrum }, { opacity: b.spectrum, duration: len }, at)
        .fromTo(rays, { drawSVG: split(a) }, { drawSVG: split(b), duration: len, stagger: len * 0.02 }, at);
    });
    // Initialise every tween now (DrawSVG measures each ray once, here) rather
    // than mid-scroll the first time the prism reaches a segment.
    tl.progress(1, true).progress(0, true);
    master = tl;
  };
  const sync = (immediate = false, scroll = window.scrollY) => {
    if (!master) return;
    const t = gsap.utils.clamp(0, master.duration(), scroll - origin);
    if (immediate) {
      gsap.killTweensOf(master);
      master.time(t);
    } else gsap.to(master, { time: t, duration: GS.scrub, ease: 'power3.out', overwrite: true });
  };

  ScrollTrigger.create({
    start: 0,
    end: 'max',
    refreshPriority: -10, // measure after pins have added their spacing
    onRefresh: () => {
      build();
      sync(true);
    },
    // self.scroll() is ScrollTrigger's cached value: no forced layout per frame.
    onUpdate: (self) => sync(false, self.scroll()),
  });
  build();
  sync(true);

  // The only idle loop: a slow 6s breath on the glow.
  gsap.fromTo(breath, { opacity: 0.55, scale: 0.94 }, { opacity: 1, scale: 1.06, duration: 3, ease: 'sine.inOut', yoyo: true, repeat: -1 });

  return () => {
    if (master) {
      gsap.killTweensOf(master);
      master.kill();
      master = null;
    }
    gsap.set([fly, beam, spectrum, ...rays], { clearProps: 'all' });
    layer.classList.remove('is-active');
    document.documentElement.classList.remove('has-prism');
  };
});
