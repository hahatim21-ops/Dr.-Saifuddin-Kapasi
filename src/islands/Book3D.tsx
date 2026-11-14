import { LazyMotion, domAnimation, m, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { useEffect, useRef, type PointerEvent } from 'react';
import { MOVE, TILT_MAX } from '../lib/motion';

export interface Book3DProps {
  /** Pre-optimised sources from Astro's getImage (AVIF + WebP srcsets). */
  avifSrcset: string;
  webpSrcset: string;
  fallbackSrc: string;
  width: number;
  height: number;
  alt: string;
  sizes: string;
}

/**
 * A book cover with a spine highlight, a page block behind it and a soft shadow.
 * - Scroll-driven rise (one of the site's three scroll effects): the cover moves
 *   from 24px below to its place as it travels into view. Transform only.
 * - Tilt under the pointer, desktop only — (hover: hover) and (pointer: fine):
 *   up to 6° on each axis, 180ms, eases back to flat when the pointer leaves.
 * Reduced motion: no rise, no tilt.
 */
export default function Book3D(props: Book3DProps) {
  const wrap = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const fine = useRef(false);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({ target: wrap, offset: ['start end', 'start 45%'] });
  const y = useTransform(scrollYProgress, [0, 1], [MOVE.lg, 0]);

  useEffect(() => {
    fine.current = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  }, []);

  const tilt = (e: PointerEvent<HTMLDivElement>) => {
    if (reduce || !fine.current || !body.current || e.pointerType !== 'mouse') return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5; // −0.5 … 0.5
    const py = (e.clientY - r.top) / r.height - 0.5;
    const ry = Math.max(-1, Math.min(1, px * 2)) * TILT_MAX;
    const rx = Math.max(-1, Math.min(1, -py * 2)) * TILT_MAX;
    body.current.style.transitionDuration = '180ms';
    body.current.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
  };
  const reset = () => {
    if (!body.current) return;
    body.current.style.transitionDuration = '600ms';
    body.current.style.transform = '';
  };

  return (
    <LazyMotion features={domAnimation} strict>
      <div ref={wrap} className="book3d" onPointerMove={tilt} onPointerLeave={reset}>
        <m.div data-motion="" className="book3d__rise" style={{ y: reduce ? 0 : y }}>
          <div ref={body} className="book3d__body">
            <span className="book3d__pages" aria-hidden="true" />
            <picture>
              <source type="image/avif" srcSet={props.avifSrcset} sizes={props.sizes} />
              <source type="image/webp" srcSet={props.webpSrcset} sizes={props.sizes} />
              <img
                className="book3d__cover"
                src={props.fallbackSrc}
                width={props.width}
                height={props.height}
                alt={props.alt}
                loading="lazy"
                decoding="async"
              />
            </picture>
            <span className="book3d__spine" aria-hidden="true" />
          </div>
        </m.div>
      </div>
    </LazyMotion>
  );
}
