import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { GS } from '../lib/motion';

type Sources = { avif: string; webp: string; fallback: string; width: number; height: number };
type FlipPlugin = typeof import('gsap/Flip').Flip;

// Same GSAP instance as the engine (src/lib/scroll.ts). Flip loads on demand.
gsap.registerPlugin(ScrollTrigger);
let flipPromise: Promise<FlipPlugin> | null = null;
const loadFlip = () =>
  (flipPromise ??= import('gsap/Flip').then(({ Flip }) => {
    gsap.registerPlugin(Flip);
    return Flip;
  }));

export type Achievement = {
  id: string;
  title: string;
  meta: string; // "Issuer · 2024"
  alt: string;
  placeholder: boolean;
  kind: string; // award | honour | feature
  thumb: Sources;
  full: Sources;
};

interface Props {
  items: Achievement[];
  label: string;
  placeholderLabel: string;
  /** Phones: show as a swipe row (home page). The /achievements page uses a grid everywhere. */
  swipeOnPhones?: boolean;
  /** /achievements: filter buttons (All, Awards, Honours, Features). */
  filters?: { value: string; label: string }[];
  filterLabel?: string;
  emptyLabel?: string;
}

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Achievements wall + viewer (Motion v2: GSAP, no Motion library).
 * Wall: framed images (thin frame, matte, soft shadow). As the wall enters, the
 * frames drop in with a slight rotation and settle straight, 80ms apart.
 * On /achievements the Awards / Honours / Features filter re-flows the wall
 * with Flip. JS off: every frame is visible (start states are runtime only).
 * Viewer: a native <dialog> opened with showModal() — focus is trapped by the
 * browser, Esc closes, focus returns to the frame that opened it. The image
 * grows out of the clicked frame (Flip) and shrinks back into it on close.
 * ← / → keys, buttons and touch swipe move between items.
 * Reduced motion: no drop-in, no Flip; the viewer simply appears.
 */
export default function AchievementLightbox({
  items,
  label,
  placeholderLabel,
  swipeOnPhones = true,
  filters,
  filterLabel = 'Show',
  emptyLabel = 'Nothing here yet.',
}: Props) {
  const [filter, setFilter] = useState('all');
  const visible = filter === 'all' ? items : items.filter((a) => a.kind === filter);
  const dialog = useRef<HTMLDialogElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const lbImg = useRef<HTMLImageElement>(null);
  const [open, setOpen] = useState<number | null>(null);
  const swipeX = useRef<number | null>(null);
  const flip = useRef<FlipPlugin | null>(null);
  const flipState = useRef<ReturnType<FlipPlugin['getState']> | null>(null);
  const zoomFrom = useRef<HTMLImageElement | null>(null);
  const closing = useRef(false);
  const n = visible.length;

  // Flip loads on demand (shared with the rest of the site via the engine).
  useEffect(() => {
    if (reducedMotion()) return;
    loadFlip().then((F) => (flip.current = F));
  }, []);

  // Frames drop in with a slight rotation and settle straight, 80ms apart.
  useEffect(() => {
    const ul = list.current;
    if (!ul || reducedMotion()) return;
    const frames = ul.querySelectorAll('.aw__item');
    const tween = gsap.from(frames, {
      y: -36,
      rotation: (i: number) => (i % 2 ? 3 : -3.5),
      opacity: 0,
      duration: GS.dur.reveal,
      ease: 'back.out(1.4)',
      stagger: GS.stagger.frames,
      scrollTrigger: { trigger: ul, start: 'top 85%', once: true },
    });
    return () => {
      tween.scrollTrigger?.kill();
      tween.progress(1).kill();
    };
  }, []);

  // Filter change: re-flow the wall with Flip (entering frames fade in).
  const choose = (value: string) => {
    if (value === filter) return;
    const F = flip.current;
    if (F && list.current) flipState.current = F.getState(list.current.querySelectorAll('.aw__item'));
    setFilter(value);
  };
  useLayoutEffect(() => {
    const F = flip.current;
    const state = flipState.current;
    flipState.current = null;
    if (!F || !state || !list.current) return;
    F.from(state, {
      targets: list.current.querySelectorAll('.aw__item'),
      duration: 0.6,
      ease: 'expo.out',
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out' }),
    });
  }, [filter]);

  const show = useCallback((i: number, from?: HTMLImageElement | null) => {
    zoomFrom.current = from ?? null;
    setOpen(i);
    const d = dialog.current;
    if (d && !d.open) {
      d.showModal();
      (window as any).__lenis?.stop();
    }
  }, []);

  // Opening: the large image grows out of the clicked frame.
  useLayoutEffect(() => {
    const F = flip.current;
    const img = lbImg.current;
    const from = zoomFrom.current;
    zoomFrom.current = null;
    if (!F || !img || !from || open === null) return;
    gsap.from(img, { ...F.fit(img, from, { scale: true, getVars: true }), duration: 0.6, ease: 'expo.out', clearProps: 'transform' });
  }, [open]);

  // Closing: shrink back into the current item's frame, then close.
  const close = () => {
    const d = dialog.current;
    if (!d || closing.current) return;
    const F = flip.current;
    const img = lbImg.current;
    const frame = open !== null ? list.current?.querySelectorAll<HTMLImageElement>('.aw__frame img')[open] : null;
    if (!F || !img || !frame) {
      d.close();
      return;
    }
    closing.current = true;
    gsap
      .timeline({
        onComplete: () => {
          closing.current = false;
          d.close();
          gsap.set([img, d], { clearProps: 'transform,opacity' });
        },
      })
      .to(img, { ...F.fit(img, frame, { scale: true, getVars: true }), duration: 0.45, ease: 'power3.inOut' }, 0)
      .to(d, { opacity: 0, duration: 0.3, ease: 'power1.in' }, 0.15);
  };
  const step = (dir: number) => setOpen((i) => (i === null ? i : (i + dir + n) % n));

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    const onClose = () => {
      setOpen(null);
      (window as any).__lenis?.start();
    };
    // Esc: animate back into the frame instead of vanishing.
    const onCancel = (e: Event) => {
      if (!flip.current) return;
      e.preventDefault();
      close();
    };
    d.addEventListener('close', onClose);
    d.addEventListener('cancel', onCancel);
    return () => {
      d.removeEventListener('close', onClose);
      d.removeEventListener('cancel', onCancel);
    };
  });

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') step(1);
    if (e.key === 'ArrowLeft') step(-1);
  };
  const onDown = (e: PointerEvent) => {
    if (e.pointerType === 'touch') swipeX.current = e.clientX;
  };
  const onUp = (e: PointerEvent) => {
    if (swipeX.current === null) return;
    const dx = e.clientX - swipeX.current;
    swipeX.current = null;
    if (Math.abs(dx) > 48) step(dx < 0 ? 1 : -1);
  };
  // Click on the dark backdrop (outside the panel) closes.
  const onBackdrop = (e: MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget) close();
  };

  const cur = open !== null ? visible[open] : null;

  return (
    <>
      {filters && (
        <div className="aw-filters" role="group" aria-label={filterLabel}>
          {filters.map((f) => {
            const count = f.value === 'all' ? items.length : items.filter((a) => a.kind === f.value).length;
            return (
              <button
                key={f.value}
                type="button"
                className="aw-filter"
                aria-pressed={filter === f.value}
                onClick={() => choose(f.value)}
              >
                {f.label} <span className="aw-filter__count">{count}</span>
              </button>
            );
          })}
        </div>
      )}
      {visible.length === 0 && <p className="aw-empty">{emptyLabel}</p>}
      <ul ref={list} className={`aw${swipeOnPhones ? ' aw--swipe' : ''}`} role="list" aria-label={label} tabIndex={swipeOnPhones ? 0 : undefined}>
        {visible.map((a, i) => (
          <li key={a.id} className="aw__item" data-flip-id={a.id}>
            <button
              type="button"
              className="aw__frame"
              onClick={(e) => show(i, e.currentTarget.querySelector('img'))}
              aria-haspopup="dialog"
              data-cursor="View"
            >
              <span className="aw__matte">
                <picture>
                  <source type="image/avif" srcSet={a.thumb.avif} sizes="(min-width: 1024px) 360px, (min-width: 768px) 44vw, 76vw" />
                  <source type="image/webp" srcSet={a.thumb.webp} sizes="(min-width: 1024px) 360px, (min-width: 768px) 44vw, 76vw" />
                  <img src={a.thumb.fallback} width={a.thumb.width} height={a.thumb.height} alt={a.alt} loading="lazy" decoding="async" />
                </picture>
              </span>
              <span className="sr-only">, open larger view</span>
            </button>
            <p className="aw__title">{a.title}</p>
            <p className="aw__meta">
              {a.meta}
              {a.placeholder && <span className="placeholder-tag ml-2">{placeholderLabel}</span>}
            </p>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialog}
        className="lb"
        aria-label={cur ? cur.title : label}
        onKeyDown={onKey}
        onClick={onBackdrop}
        data-lenis-prevent=""
      >
        {cur && open !== null && (
          <div className="lb__panel" onPointerDown={onDown} onPointerUp={onUp} onPointerCancel={() => (swipeX.current = null)}>
            <div className="lb__top">
              <p className="lb__count" aria-live="polite">
                {open + 1} / {n}
              </p>
              <button type="button" className="lb__btn" onClick={close} aria-label="Close" autoFocus>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <figure className="lb__figure">
              <picture>
                <source type="image/avif" srcSet={cur.full.avif} sizes="(min-width: 1024px) 70vw, 94vw" />
                <source type="image/webp" srcSet={cur.full.webp} sizes="(min-width: 1024px) 70vw, 94vw" />
                <img ref={lbImg} key={cur.id} src={cur.full.fallback} width={cur.full.width} height={cur.full.height} alt={cur.alt} />
              </picture>
              <figcaption>
                <span className="lb__title">{cur.title}</span>
                <span className="lb__meta">{cur.meta}</span>
              </figcaption>
            </figure>
            {n > 1 && (
              <div className="lb__nav">
                <button type="button" className="lb__btn" onClick={() => step(-1)} aria-label="Previous">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M19 12H5M11 6l-6 6 6 6" />
                  </svg>
                </button>
                <button type="button" className="lb__btn" onClick={() => step(1)} aria-label="Next">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}
      </dialog>
    </>
  );
}
