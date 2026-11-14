import { LazyMotion, domAnimation, m, useReducedMotion, useScroll } from 'motion/react';
import { useRef } from 'react';
import { DUR, EASE, MOVE, STAGGER } from '../lib/motion';

export type ArcEntry = {
  id: string;
  years: string;
  role: string;
  organisation: string;
  note?: string;
  current: boolean;
};

export type ArcChapter = {
  id: string;
  number: string;
  title: string;
  years: string;
  summary: string;
  callout?: { title: string; text: string };
  entries: ArcEntry[];
};

/**
 * The Arc (home §2): three chapters with sticky labels (≥768px) and a thin brass
 * line that fills as the reader scrolls — one of the site's three scroll-driven
 * effects. The section is never pinned and the scroll is never altered: the line
 * simply follows native scroll progress through the timeline (scaleY only).
 * Entries fade up 16px once as they enter. Reduced motion: line full, no reveals.
 */
export default function Timeline({ chapters }: { chapters: ArcChapter[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 70%', 'end 70%'] });

  const reveal = (i = 0) =>
    reduce
      ? { initial: false as const }
      : {
          initial: { opacity: 0, y: MOVE.md },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, amount: 0.35 },
          transition: { duration: DUR.reveal, ease: EASE, delay: i * STAGGER.items },
        };

  return (
    <LazyMotion features={domAnimation} strict>
      <div ref={ref} className="relative">
        {/* Track (hairline) + brass fill driven by scroll progress */}
        <div aria-hidden="true" className="absolute top-2 bottom-0 left-[5px] w-px bg-hairline md:left-[32%]">
          <m.div
            data-arc-fill=""
            className="absolute inset-0 origin-top bg-brass"
            style={{ scaleY: reduce ? 1 : scrollYProgress }}
          />
        </div>

        {chapters.map((chapter) => (
          <section
            key={chapter.id}
            aria-labelledby={`arc-${chapter.id}`}
            className="relative grid pb-16 last:pb-0 md:grid-cols-[32%_1fr] md:pb-28"
          >
            {/* Chapter label — sticky beside its entries on tablet and desktop */}
            <div className="pl-8 md:pl-0 md:pr-10">
              <m.div data-motion="" className="md:sticky md:top-28" {...reveal()}>
                <p className="text-small tabular-nums text-stone">({chapter.number})</p>
                <h3 id={`arc-${chapter.id}`} className="mt-1">
                  {chapter.title}
                </h3>
                <p className="mt-1 font-serif text-h3 font-semibold text-brass tabular-nums" aria-label={`Years: ${chapter.years}`}>
                  {chapter.years}
                </p>
                <p className="mt-4 max-w-[34ch] text-stone">{chapter.summary}</p>
              </m.div>
            </div>

            {/* Entries along the line */}
            <ol role="list" className="mt-10 space-y-10 pl-8 md:mt-0 md:pl-12">
              {chapter.entries.map((entry, i) => (
                <m.li key={entry.id} data-motion="" className="relative" {...reveal(i)}>
                  <span
                    aria-hidden="true"
                    className="absolute top-[0.4rem] left-[-2rem] size-[11px] rounded-full border border-brass bg-ivory md:left-[calc(-3rem-5px)]"
                  />
                  <p className="flex items-center gap-3 text-small tabular-nums text-stone">
                    {entry.years}
                    {entry.current && (
                      <span className="rounded-full border border-hairline px-2 py-px text-[0.8125rem] font-semibold text-green">
                        Now
                      </span>
                    )}
                  </p>
                  <h4 className="mt-1 text-[1.25rem] leading-snug">{entry.role}</h4>
                  <p>{entry.organisation}</p>
                  {entry.note && <p className="mt-2 max-w-[60ch] text-stone">{entry.note}</p>}
                </m.li>
              ))}

              {chapter.callout && (
                <m.li data-motion="" className="relative" {...reveal(chapter.entries.length)}>
                  <aside className="on-green rounded-card bg-green p-6 text-ivory sm:p-8">
                    <p className="eyebrow">{chapter.callout.title}</p>
                    <p className="mt-3 max-w-[48ch] font-serif text-h3 font-semibold leading-tight text-ivory">
                      {chapter.callout.text}
                    </p>
                  </aside>
                </m.li>
              )}
            </ol>
          </section>
        ))}
      </div>
    </LazyMotion>
  );
}
