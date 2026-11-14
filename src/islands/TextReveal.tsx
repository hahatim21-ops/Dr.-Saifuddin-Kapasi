import { LazyMotion, domAnimation, m, useReducedMotion } from 'motion/react';
import { createElement, type ReactNode } from 'react';
import { BLUR_MAX, DUR, EASE, MOVE, STAGGER } from '../lib/motion';

type Tag = 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div';

interface Props {
  /** Text to reveal word by word. Wrap one word in *asterisks* for the italic green accent. */
  text: string;
  as?: Tag;
  className?: string;
  /** Seconds before the first word starts. */
  delay?: number;
  /** 'load' plays on hydration (hero); 'view' plays once when scrolled into view. */
  trigger?: 'load' | 'view';
  /** Seconds between words (60–80ms). */
  stagger?: number;
  id?: string;
}

type Word = { text: string; accent: boolean };

function parse(text: string): Word[] {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => {
      const match = w.match(/^\*(.+)\*([.,;:!?]*)$/);
      return match ? { text: match[1] + match[2], accent: true } : { text: w, accent: false };
    });
}

/**
 * Words appear one by one: blur 8px → 0, up 12px, 80ms apart, 600ms each.
 * Reduced motion: rendered in place, no animation (CSS also forces visibility).
 */
export default function TextReveal({
  text,
  as = 'h2',
  className,
  delay = 0,
  trigger = 'view',
  stagger = STAGGER.words,
  id,
}: Props) {
  const reduce = useReducedMotion();
  const words = parse(text);
  const plain = text.replace(/\*/g, '');

  const hidden = { opacity: 0, y: MOVE.sm, filter: `blur(${BLUR_MAX}px)` };
  const shown = { opacity: 1, y: 0, filter: 'blur(0px)' };

  const children: ReactNode[] = [];
  words.forEach((word, i) => {
    const t = { duration: DUR.reveal, ease: EASE, delay: delay + i * stagger };
    const motionProps =
      reduce
        ? { initial: false as const }
        : trigger === 'load'
          ? { initial: hidden, animate: shown, transition: t }
          : { initial: hidden, whileInView: shown, viewport: { once: true, amount: 0.6 }, transition: t };

    const inner = word.accent ? <em className="accent">{word.text}</em> : word.text;
    children.push(
      <m.span
        key={i}
        data-reveal-word=""
        style={{ display: 'inline-block', willChange: reduce ? undefined : 'transform, opacity, filter' }}
        {...motionProps}
      >
        {inner}
      </m.span>
    );
    if (i < words.length - 1) children.push(' ');
  });

  return (
    <LazyMotion features={domAnimation} strict>
      {createElement(
        as,
        { className, id, 'aria-label': plain },
        <span aria-hidden="true">{children}</span>
      )}
    </LazyMotion>
  );
}
