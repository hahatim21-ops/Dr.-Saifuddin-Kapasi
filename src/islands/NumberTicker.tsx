import { useEffect, useRef } from 'react';
import { easeInflect } from '../lib/ease';
import { DUR } from '../lib/motion';

interface Props {
  value: number;
  suffix?: string;
  /** Seconds to wait after entering view (for a gentle 70ms stagger across the strip). */
  delay?: number;
}

/**
 * Counts from 0 to `value` once, over 1.2s on the site easing, when it scrolls
 * into view. The final number is server-rendered (so it is right without
 * JavaScript and for search engines); screen readers get it once via sr-only
 * text while the animated digits are aria-hidden. Width is reserved with
 * tabular figures so nothing shifts. Reduced motion: shows the final value.
 */
export default function NumberTicker({ value, suffix = '', delay = 0 }: Props) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const wrap = el.closest('[data-ticker]');
    if (reduce || !('IntersectionObserver' in window)) {
      wrap?.setAttribute('data-ready', '');
      return;
    }

    el.textContent = '0';
    wrap?.setAttribute('data-ready', '');
    let raf = 0;
    let timer = 0;

    const run = () => {
      const start = performance.now();
      const ms = DUR.count * 1000;
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / ms);
        el.textContent = String(Math.round(easeInflect(p) * value));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect(); // play once
          timer = window.setTimeout(run, delay * 1000);
        }
      },
      { threshold: 0.6 }
    );
    io.observe(el);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [value, delay]);

  return (
    <span data-ticker="" className="ticker">
      <span className="sr-only">
        {value}
        {suffix}
      </span>
      <span aria-hidden="true">
        <span ref={ref} className="ticker__digits" style={{ minWidth: `${String(value).length}ch` }}>
          {value}
        </span>
        {suffix}
      </span>
    </span>
  );
}
