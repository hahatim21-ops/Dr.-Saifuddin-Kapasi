import { LazyMotion, domAnimation, m, useReducedMotion } from 'motion/react';
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react';
import { DUR, EASE, MOVE, STAGGER } from '../lib/motion';

type Sources = { avif: string; webp: string; fallback: string; width: number; height: number };

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

/**
 * Achievements wall + viewer.
 * Wall: framed images (thin frame, matte, soft shadow) that rise 24px into place
 * 80ms apart, once; lift 4px with a deeper shadow on hover (desktop pointer).
 * Viewer: a native <dialog> opened with showModal() — focus is trapped by the
 * browser, Esc closes, focus returns to the frame that opened it. Fades in over
 * 200ms. ← / → keys, buttons and touch swipe move between items.
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
  const reduce = useReducedMotion();
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState<number | null>(null);
  const swipeX = useRef<number | null>(null);
  const n = visible.length;

  const show = useCallback((i: number) => {
    setOpen(i);
    const d = dialog.current;
    if (d && !d.open) {
      d.showModal();
      (window as any).__lenis?.stop();
    }
  }, []);
  const close = () => dialog.current?.close();
  const step = (dir: number) => setOpen((i) => (i === null ? i : (i + dir + n) % n));

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    const onClose = () => {
      setOpen(null);
      (window as any).__lenis?.start();
    };
    d.addEventListener('close', onClose);
    return () => d.removeEventListener('close', onClose);
  }, []);

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

  const reveal = (i: number) =>
    reduce
      ? { initial: false as const }
      : {
          initial: { opacity: 0, y: MOVE.lg },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, amount: 0.25 },
          transition: { duration: DUR.reveal, ease: EASE, delay: (i % 3) * STAGGER.frames },
        };

  const cur = open !== null ? visible[open] : null;

  return (
    <LazyMotion features={domAnimation} strict>
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
                onClick={() => setFilter(f.value)}
              >
                {f.label} <span className="aw-filter__count">{count}</span>
              </button>
            );
          })}
        </div>
      )}
      {visible.length === 0 && <p className="aw-empty">{emptyLabel}</p>}
      <ul className={`aw${swipeOnPhones ? ' aw--swipe' : ''}`} role="list" aria-label={label} tabIndex={swipeOnPhones ? 0 : undefined}>
        {visible.map((a, i) => (
          <m.li key={a.id} className="aw__item" data-motion="" {...reveal(i)}>
            <button type="button" className="aw__frame" onClick={() => show(i)} aria-haspopup="dialog">
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
          </m.li>
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
                <img key={cur.id} src={cur.full.fallback} width={cur.full.width} height={cur.full.height} alt={cur.alt} />
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
    </LazyMotion>
  );
}
