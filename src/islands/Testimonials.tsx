import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import { TESTIMONIAL_INTERVAL } from '../lib/motion';

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

  useEffect(() => {
    if (!rotating) return;
    const t = window.setTimeout(() => {
      if (document.visibilityState === 'visible') go(index + 1);
    }, TESTIMONIAL_INTERVAL);
    return () => clearTimeout(t);
  }, [rotating, index, go]);

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
      <div
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
              <span className="tq__mark" aria-hidden="true">
                “
              </span>
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
