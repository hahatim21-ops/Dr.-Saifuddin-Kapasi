import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import gsap from 'gsap';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';

// Same GSAP instance as the engine (src/lib/scroll.ts); registering twice is a no-op.
gsap.registerPlugin(DrawSVGPlugin);
import { GS, TESTIMONIAL_INTERVAL } from '../lib/motion';

export type Quote = {
  id: string;
  quote: string;
  name: string;
  role: string;
  placeholder: boolean;
};

interface Props {
  quotes: Quote[];
  label: string;
  placeholderLabel: string;
}

/**
 * One large centred quote at a time, crossfading (700ms, opacity only) every 8s.
 * Motion v3: each new quote fades up (Tier 2),
 * a big brass quote mark draws itself, and a thin ring around the pause button
 * shows the 8s timer (the ring's CSS animation *is* the timer, so pausing
 * freezes both together).
 * The only looping motion on the site, so it is careful:
 * - pauses on hover and on keyboard focus anywhere inside, and has a visible
 *   pause/play button (WCAG 2.2.2);
 * - only rotates while on screen and the tab is visible; never with reduced
 *   motion (and the fade becomes instant there);
 * - previous/next buttons, numbered dots and touch swipe on phones;
 * - all quotes share one grid cell, so the block never changes height.
 * Screen readers: announcements are off while rotating, polite once paused.
 */
export default function Testimonials({ quotes, label, placeholderLabel }: Props) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false); // user pressed pause
  const [hovering, setHovering] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [reduce, setReduce] = useState(false);
  const root = useRef<HTMLElement>(null);
  const swipeX = useRef<number | null>(null);
  const n = quotes.length;

  const go = useCallback((to: number) => setIndex(((to % n) + n) % n), [n]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduce(mq.matches);
    const onChange = () => setReduce(mq.matches);
    mq.addEventListener('change', onChange);

    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.4 });
    if (root.current) io.observe(root.current);
    return () => {
      mq.removeEventListener('change', onChange);
      io.disconnect();
    };
  }, []);

  const rotating = !paused && !hovering && !focused && visible && !reduce && n > 1;

  // Seen once: the first reveal plays when the carousel first comes into view.
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (visible) setSeen(true);
  }, [visible]);

  // Each new quote: lines rise out of masks; the quote mark draws itself.
  const stage = useRef<HTMLDivElement>(null);
  const mark = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (!seen || reduce) return;
    const p = stage.current?.querySelectorAll<HTMLElement>('.tq__quote p')[index];
    const paths = mark.current?.querySelectorAll('path');
    const tl = gsap.timeline();
    if (paths?.length) {
      tl.fromTo(paths, { drawSVG: '0%', fillOpacity: 0 }, { drawSVG: '100%', duration: 0.9, ease: 'power2.inOut', stagger: 0.12 }, 0).to(
        paths,
        { fillOpacity: 1, duration: 0.5, ease: 'power1.out' },
        0.7
      );
    }
    // Motion v3 (Tier 2): the new quote fades up — line splits are for headings.
    if (p) tl.from(p, { opacity: 0, y: 16, duration: GS.dur.body, ease: GS.ease.reveal, clearProps: 'opacity,transform' }, 0.1);
    return () => {
      tl.kill();
      if (p) gsap.set(p, { clearProps: 'opacity,transform' });
    };
  }, [index, seen, reduce]);

  const onPointerDown = (e: PointerEvent) => {
    if (e.pointerType === 'touch') swipeX.current = e.clientX;
  };
  const onPointerUp = (e: PointerEvent) => {
    if (swipeX.current === null) return;
    const dx = e.clientX - swipeX.current;
    swipeX.current = null;
    if (Math.abs(dx) > 48) go(index + (dx < 0 ? 1 : -1));
  };

  return (
    <section
      ref={root}
      className="tq"
      aria-roledescription="carousel"
      aria-label={label}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocused(false);
      }}
    >
      <svg ref={mark} className="tq__mark" viewBox="0 0 92 64" aria-hidden="true" focusable="false">
        <path d="M30 6 C16 13 7 25 7 40 C7 51 13 58 22 58 C30 58 36 52 36 44 C36 36 30 31 23 31 C20 31 18 32 17 33 C18 24 24 16 33 11 Z" />
        <path d="M76 6 C62 13 53 25 53 40 C53 51 59 58 68 58 C76 58 82 52 82 44 C82 36 76 31 69 31 C66 31 64 32 63 33 C64 24 70 16 79 11 Z" />
      </svg>
      <div
        ref={stage}
        className="tq__stage"
        aria-live={rotating ? 'off' : 'polite'}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (swipeX.current = null)}
      >
        {quotes.map((q, i) => {
          const active = i === index;
          return (
            <figure
              key={q.id}
              className={`tq__slide${active ? ' is-active' : ''}`}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${n}`}
              aria-hidden={!active}
              style={reduce ? { transition: 'none' } : undefined}
            >
              <blockquote className="tq__quote">
                <p>{q.quote}</p>
              </blockquote>
              <figcaption className="tq__by">
                <span className="tq__name">{q.name}</span>
                <span className="tq__role">{q.role}</span>
                {q.placeholder && <span className="placeholder-tag">{placeholderLabel}</span>}
              </figcaption>
            </figure>
          );
        })}
      </div>

      {n > 1 && (
        <div className="tq__controls">
          <button type="button" className="tq__btn" onClick={() => go(index - 1)} aria-label="Previous quote">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M11 6l-6 6 6 6" />
            </svg>
          </button>
          <div className="tq__dots">
            {quotes.map((q, i) => (
              <button
                key={q.id}
                type="button"
                className="tq__dot"
                aria-label={`Show quote ${i + 1} of ${n}`}
                aria-current={i === index ? 'true' : undefined}
                onClick={() => go(i)}
              >
                <span />
              </button>
            ))}
          </div>
          <button type="button" className="tq__btn" onClick={() => go(index + 1)} aria-label="Next quote">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
          {!reduce && (
            <button
              type="button"
              className="tq__btn tq__btn--pause"
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? 'Play testimonials' : 'Pause testimonials'}
              aria-pressed={paused}
            >
              {/* The 8s timer: when the ring completes, the next quote shows. */}
              <svg className="tq__ring" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
                <circle
                  key={index}
                  cx="24"
                  cy="24"
                  r="22.5"
                  pathLength={1}
                  style={{ animationDuration: `${TESTIMONIAL_INTERVAL}ms`, animationPlayState: rotating ? 'running' : 'paused' }}
                  onAnimationEnd={() => go(index + 1)}
                />
              </svg>
              {paused ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M8 5.5v13l10-6.5z" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <rect x="6.5" y="5.5" width="3.5" height="13" rx="1" />
                  <rect x="14" y="5.5" width="3.5" height="13" rx="1" />
                </svg>
              )}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
