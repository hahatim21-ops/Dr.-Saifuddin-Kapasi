Read BRIEF.md.md and TODO.md first. The site in this folder is already built
through Stage 4: an Astro 7 + Tailwind v4 + React-islands static site for
Dr. Saifuddin Kapasi, with all 12 home sections and 8 inner pages. Content is in
src/content and src/data, motion tokens are in src/styles/global.css and
src/lib/motion.ts, and Lenis and the reveals are set up in src/layouts/Base.astro.

THIS JOB
Give the site a cinematic, scroll-driven motion layer with the feel of these two
references. Don't rebuild the site and don't change its brand.
  - https://muhsingigani-portfolio.vercel.app/
  - https://sanika-joshi.vercel.app/
If you can open a browser, look at both at 1440px wide before starting. The
notes below describe what I saw.

KEEP: every page, section and content file; the colours (ivory #F6F1E7, ink
#1C1F1E, institution green #1F3D33, brass #B08D57, light brass #D4B483, stone
#6B665C); the fonts (Cormorant Garamond, Source Sans 3); accessibility; and the
placeholder system.
CHANGE: the motion. This prompt replaces BRIEF section 5b ("subtle by design").
Pinning, scrubbing, horizontal sections, a loader, a custom cursor and longer,
bolder animations are now allowed where listed below. Where this prompt and the
brief differ, this prompt wins. The big moments happen on institution green and
ivory. Never use black backgrounds, neon or glitch effects.

WHAT THE REFERENCES DO (inspected 14 Nov 2026)
Muhsin Gigani uses GSAP + ScrollTrigger + Lenis, a 2D-canvas plasma orb and
Motion islands:
- Loader: a big counter going from 000 to 100 ("Charging the core") before the
  site opens.
- One signature object (the orb) lives on a fixed layer and travels through the
  page. It sits centred in the hero, moves beside the manifesto and under a big
  year in the journey, then zooms to fill the screen as the transition into the
  next section.
- A giant display name across the hero, small mono labels and numbered sections
  (01 Manifesto, 02 About...). The nav highlights the active section and shows a
  live local clock.
- A manifesto paragraph whose words light up from grey to white as you scroll.
- "The Journey": a giant year stays pinned and changes as role cards scroll past
  on the right.
- Selected work as a numbered slider ("01 / 07") with a case-study overlay.
- A custom cursor, film grain and rotating words.
Sanika Joshi uses GSAP + ScrollTrigger + Three.js shaders:
- A percentage loader (0% to 100%) bottom-left on a solid-colour screen.
- A hero photo with a warm duotone, a WebGL shader and a "scroll" cue.
- The next section slides up over the hero like a sheet of paper.
- Colour-blocked bands (brown, then cream, then blue) as you move down, and
  ruled notebook lines.
- Huge section headings with cards overlapping them, work cards scattered and
  tilted like a collage, counters and a testimonial carousel.

STACK ADDITIONS
- Add gsap. All its plugins ship in the free npm package. Use ScrollTrigger,
  SplitText, DrawSVGPlugin, Flip and CustomEase. Don't add Three.js.
- Put the engine in one file, src/lib/scroll.ts. It registers the plugins once.
  It runs Lenis on desktop fine pointers, driven by gsap.ticker:
  lenis.on('scroll', ScrollTrigger.update), autoRaf off, lagSmoothing(0). It
  wraps every animation in gsap.matchMedia() with three contexts: desktop
  ((min-width:1024px) and (hover:hover) and (pointer:fine)), touch/small, and
  reduced motion.
- Astro ClientRouter: on astro:before-swap, revert every gsap context and kill
  all ScrollTriggers. On astro:page-load, create them again. Call
  ScrollTrigger.refresh() after document.fonts.ready and after lazy images load.
  Back/forward navigation must never leave stale pins.
- GSAP owns everything linked to scroll. Keep Motion only for islands driven by
  interaction (Testimonials, AchievementLightbox, Book3D tilt). Remove Motion
  from Timeline, TextReveal and NumberTicker where GSAP replaces it, so the
  bundle doesn't ship two libraries for the same job.
- Add new motion tokens in global.css and src/lib/motion.ts:
  - UI ease "inflect" = cubic-bezier(0.22,1,0.36,1)
  - reveal eases "expo.out" and "power4.out"
  - reveals 0.9-1.2s
  - char stagger 0.025s, line stagger 0.08s
  - scrub 0.6-1
  Rewrite BRIEF.md.md section 5b as "Motion v2" so the brief matches the code.

SITE-WIDE
1. Loader
   - Plays on the first visit per session only (sessionStorage).
   - Full-screen institution green. Brass Cormorant numerals count from 000 to
     100 at bottom-left.
   - The brass inflection line draws across the bottom as the progress bar,
     with a small light-brass caption: "Pioneering possibilities."
   - At 100 the green panel lifts away like a curtain (clip-path inset from the
     bottom) and the hero intro plays.
   - Total 1.8s or less. Progress is real, tied to fonts and the hero image.
   - A click or any key skips it. No ENTER gate.
   - Skipped entirely under reduced motion and on inner pages.
   - The hero HTML is rendered underneath from the start, so the page is never
     blank if JS fails.
2. The travelling prism
   This is the site's signature motion graphic, its answer to the orb.
   - An SVG prism with a soft glow on a fixed layer: pointer-events:none,
     aria-hidden. Reuse the geometry from src/components/Prism.astro.
   - One scrubbed ScrollTrigger timeline moves it through these stops:
     a. Small beside the hero name, with a faint white beam.
     b. Large and centred behind the manifesto. The beam brightens with scroll
        progress.
     c. Docked beside the Arc's year counter, turning slowly.
     d. At the Beyond Ideas cover, where the beam splits into the full spectrum
        (--color-spectrum-1 to 7) fanning across the green band.
     e. Fades out, then reappears small beside the footer sign-off.
   - A gentle 6s "breathing" glow is its only idle loop.
   - Desktop only. On phones and tablets it appears without motion in the hero
     and Books sections.
3. Section edges shaped like the inflection line: the top edge of each green
   band starts flat and bends upward as it scrolls into view (an SVG path or
   clip-path morph, scrubbed).
4. Headings: every h1 and h2 reveals with SplitText lines in masks (yPercent 110
   to 0); the hero name reveals by characters. Use SplitText's aria option so
   screen readers read whole words, and autoSplit + onSplit so a resize
   re-splits cleanly.
5. Images: a clip-path inset wipe reveal, with the inner image scaling from 1.15
   to 1. Light parallax (yPercent ±8) on large photos, desktop only.
6. Nav: a brass scroll-progress hairline along its bottom edge. On desktop, show
   the current section name and a counter ("03 / 13") and an active link state.
   Keep the existing hide-on-scroll-down behaviour and the phone dock.
7. Custom cursor, on desktop fine pointers only:
   - A small ink dot plus a brass ring that follows with lerp.
   - The ring grows and shows a label ("Read", "View", "Open", "Drag") over
     cards, photos and the horizontal track.
   - The native cursor stays on inputs, textareas and selects.
   - Hidden on touch and under reduced motion. Focus outlines are unchanged.
8. Magnetic primary buttons (pull of 8px at most), desktop only.
9. Page transitions: replace the 250ms fade with a green curtain wipe that
   carries the brass inflection line across, 800ms or less, using Astro view
   transitions. It is instant under reduced motion.
10. Film grain: animate the existing paper grain on green bands only (steps(),
    8fps, very faint).

HOME PAGE, SECTION BY SECTION
Each section describes desktop first, then phones.

1. Hero
   - The giant name "Saifuddin Kapasi" in Cormorant 700 (about clamp 4rem to
     12rem), letters rising out of masks. It is now the h1.
   - The existing sentence "...an architect of enduring institutions." sits
     under it as the lead, with "enduring" in green italic.
   - The eyebrow rotates Educator, Author, Advisor, Speaker: one word swaps
     every 2.5s with a mask slide and pauses when off-screen.
   - The portrait is revealed by a clip-path wipe, then settles. Give it a warm
     duotone grade in CSS.
   - A small live clock ("Mumbai · 21:27 IST") and a "Scroll" cue with a slow
     pulse.
   - The credibility names become a slow marquee that stops on hover/focus and
     is static under reduced motion.
   - On scroll, the hero pins and the next section slides up over it like a
     sheet of paper (24px rounded top, soft shadow) while the hero scales to
     0.94 and dims.
   - Phones: the same intro with no pin. The overlapping sheet is a simple
     negative margin + shadow.
2. Manifesto (new, between Hero and Arc)
   - A green band. Content goes in src/data/home.json.
   - His line "I believe institutions don't become enduring by chance, they are
     intentionally designed." set huge in Cormorant.
   - Pinned for about 150vh. Words scrub from 20% light brass to full ivory as
     you scroll, with the prism behind them.
   - Under it, in small type: "Ideas are easy. Impact is earned."
   - Phones: no pin. The words light up as the paragraph passes through the
     viewport.
3. The Arc (Muhsin's journey pattern)
   - The left column pins with a giant brass year that rolls like an odometer
     (1995 to 2026) as each timeline entry on the right passes the centre.
   - The chapter title (Customers, then Ventures, then Institutions) swaps with
     a mask slide, and the brass line fills.
   - The "Back where he learned" callout gets ruled exercise-book lines that
     draw in, plus a brass underline sweep.
   - Phones: vertical, with a small sticky year chip at the top of the timeline.
4. Numbers
   - Odometer digits roll into place once. Brass numerals scale from 0.9 to 1.
   - Keep the "Figures to be confirmed" tag.
5. Four pillars
   - Rows stagger in with the hairline drawing, with big outlined numerals
     (01)-(04).
   - On hover the row floods green from the left (clip-path), the text turns
     ivory and the arrow travels 12px.
   - Phones: tap expands the row.
6. Books
   - A green band with the inflection-shaped top edge.
   - A giant "Books" word moves horizontally behind the covers as you scroll
     (parallax).
   - Covers rise and rotate in from 12° to 0 (scrubbed). Keep the pointer tilt.
   - The prism arrives and splits its spectrum toward the Beyond Ideas cover.
   - The excerpt reveals line by line.
7. Thinking tools
   - Pinned. Each diagram draws stage by stage with DrawSVG as you scroll. The
     active stage lights up and its one-line meaning swaps in beside it. Then
     the second framework does the same.
   - Phones: a vertical stepper; each stage draws as it enters.
8. Speaking & training (Muhsin's selected-work pattern)
   - A pinned horizontal track of five large programme cards, with a "01 / 05"
     counter and a brass progress bar.
   - Cards tilt slightly in the scroll direction (skew of 3° at most, from
     scroll velocity).
   - "Past audiences" sits below.
   - Cards stay keyboard-focusable, and focusing one scrolls it into view.
   - Phones/tablets: the existing scroll-snap swipe row, plus the counter.
9. In the room (Sanika's collage)
   - A huge "In the room" heading sits behind.
   - The six photos start scattered and tilted (±4-8°) like prints on a desk and
     straighten into the grid as you scroll. Each column moves at a different
     parallax speed, and captions slide in.
   - Phones: the swipe row; each photo straightens as it enters.
10. What people say
    - Each new quote reveals line by line through masks.
    - A big brass quote mark draws itself.
    - A thin progress ring around the pause button shows the 8s timer.
11. Achievements
    - Frames drop in with a slight rotation and settle straight, 80ms apart.
    - The lightbox opens from the clicked frame using Flip (a shared-element
      zoom) and closes back into it.
12. Insights
    - On hover, a small preview card (title, date, first line) follows the
      cursor. The underline grows.
    - Phones: unchanged.
13. Contact + footer
    - A giant split heading: "Let's build something enduring." This is new
      display copy; put it in src/data/home.json.
    - A magnetic submit button.
    - The footer ends with "Saifuddin Kapasi" set edge to edge in huge
      Cormorant, revealed letter by letter as you reach the bottom, then "Ideas
      are easy. Impact is earned." word by word.
    - The prism reappears beside the sign-off.
    - A "Back to top" link that scrolls with Lenis.

INNER PAGES (lighter)
- All inner pages get the same page transition, split headings, clip-path image
  reveals and cursor.
- /achievements: the Awards / Honours / Features filter animates with Flip.
- /books/[slug]: the cover rises and tilts as on the home page.
- /frameworks: the same stage-by-stage draw.
- /about: the portrait gallery uses the collage-to-grid settle.

GUARDRAILS (non-negotiable)
- With JavaScript off, every word and image is visible. GSAP sets hidden start
  states only at runtime, never in the HTML or CSS. Keep the <noscript>
  overrides working.
- prefers-reduced-motion: no loader, no pins, no scrub, no cursor, no marquee,
  no prism travel, and Lenis is off. Content simply appears.
- Pinned and horizontal sections: all content is reachable by keyboard and
  screen reader in reading order, with no focus traps. Tab order matches what
  is visible.
- Animate only transform, opacity, clip-path and filter. Use will-change only
  while animating. Hold 60fps on a mid-range phone (Chrome DevTools 4× CPU
  throttle).
- Use ScrollTrigger.config({ ignoreMobileResize: true }) and no normalizeScroll.
  Never pin on phones except where this prompt says so.
- JS budget for the home page: about 180KB gzipped in total. Heavy parts (the
  horizontal track, the collage, the prism timeline) start only when near the
  viewport.
- Lighthouse on mobile: Performance 85+, Accessibility 95+, CLS under 0.1, LCP
  under 2.5s.
- Don't change copy, facts or placeholders except for the new display lines
  above. Keep TODO.md up to date.

HOW TO WORK
0. Before touching anything, make a restore point. Run git init if needed,
   commit everything as "v1-subtle", and work on a branch "motion-v2". If git
   can't be used, zip src/ to backups/v1-subtle.zip.
1. Engine: install gsap, build src/lib/scroll.ts and the new tokens, and update
   /style-test to show each primitive: split reveal, clip reveal, odometer,
   magnetic button, cursor, inflection-edge morph and prism. Stop for my review.
2. Loader, hero, nav, cursor and page transition. Stop.
3. Manifesto, Arc, Numbers and Pillars. Stop.
4. Books, Thinking tools and the Speaking track. Stop.
5. In the room, Testimonials, Achievements, Insights, Contact + footer. Stop.
6. Inner pages. Stop.
7. QA pass, then report the results:
   - widths 375, 390, 412, 768, 1024, 1280, 1440 and 1920
   - reduced motion, JS off and keyboard only
   - view-transition back/forward
   - 4× CPU throttle
   - Lighthouse scores
At each stop, run npm run build. Then tell me in a few lines what moves, when,
how it behaves at 390px and 1440px, and anything you had to tone down.
