Read BRIEF.md.md, TODO.md, MOTION_PROMPT.md and MOTION_V3_PROMPT.md first.
This job is Motion v4: bring the scroll effects and animations of the Onda
studio template into this site, re-cast in our brand (green / ivory / brass,
Cormorant Garamond + Source Sans 3). Take Onda's MOTION, not its look: no
purple, no Gabarito, no dark-site palette.

REFERENCE
- Live: https://onda-design-studio-website-template-v1.21st.app/
- Source (MIT): https://github.com/8bsite/design-studio-website-template
  (one HTML file). Clone it into a temp folder OUTSIDE this repo and read it
  for exact values. Onda runs on native CSS scroll timelines
  (animation-timeline / view-timeline) plus a tiny "motion-kit" script. We do
  NOT copy that approach: rebuild every effect with our existing engine
  (GSAP + ScrollTrigger + Lenis, scenes registered via registerScene in
  src/lib/tools.ts), so it works in Firefox and respects our guardrails.

STEP 0 — SET UP
- If .git/stale-index-lock-claude exists, delete it (a leftover lock file).
- src/ and public/ were restored from HEAD after going missing; check
  `git status` shows no unexpected changes beyond the files listed in STEP 1.
- HEAD is "Motion v3 step 9: phones" (the restore point). Create a branch
  "motion-v4" from it and work there; commit the STEP 1 files first as
  "motion-v4: hero, pillars, speaking (untested draft)".
- npm install, then npm run build to confirm the baseline builds.

STEP 1 — REVIEW AND FINISH WHAT IS ALREADY WRITTEN (not yet built or tested)
These files were rewritten without a build. Build, run `npm run dev`, and test
each at 1440×900, 1024×768, 768×1024 and 390×844, with reduced motion on and
off, and with JS disabled. Fix whatever is broken.

1a. src/components/home/Hero.astro — Onda hero with the prism.
  - Layout: eyebrow + clock row; intro (Currently / Previously + the two
    buttons) top-left; the giant name bottom-left, always two lines
    ("Saifuddin / Kapasi"), followed by a small brass triangle full stop
    (.hero__period); the lead line under the name; marquee strip at the bottom.
    The portrait was removed from the home hero (still on /about) and the
    portrait preload removed from src/pages/index.astro.
  - The "aperture" (.hero__stage) replaces Onda's purple ball: a hairline orbit
    ring with a brass moon (13s rotation, only while on screen via .is-live),
    a pre-blurred brass glow, and the line-art prism SVG at 1.5× the aperture,
    positioned so the glass is a centred 42% square. Intro: Onda's "swell"
    (scale 0.6 → 1, slight overshoot), then the beam draws in and the seven
    rays fan out (DrawSVG).
  - Desktop scroll (Onda's hero-aperture-move / -shrink / orbit-fade /
    tint-flood / intro-exit): ring and glow fade, beam and spectrum go out,
    the glass floods brass, and the stage translates + scales so the glass
    lands exactly on the full stop (geometry from offsetIn(), which ignores
    transforms). Scroll range: hero top at viewport top → full stop's centre
    at 15% of the viewport. The intro lifts 70px.
  - Hand-off: [data-hero-dock] is the travelling prism's first waypoint
    (src/lib/prism.ts), moved onto the full stop at runtime (refreshInit),
    opacity 0, data-prism-vy 0.15, so the travelling prism docks there at
    the exact scroll where the shrink ends and then rises into the Manifesto.
    Verify there is never a frame with two visible prisms, and no jump when
    the hidden traveller fades in.
  - Check: the name never collides with the ring at 1024–1920px; the spectrum
    fanning past the right edge never causes horizontal scroll; the full stop
    sits on the baseline after "Kapasi"; SplitText's aria-label still reads
    "Saifuddin Kapasi" (the full stop span is aria-hidden); the loader,
    PhoneDock and Base.astro still behave now that there is no [data-hero] img
    (they null-check it — confirm the engine still loads promptly and LCP is
    the name text, under 2.5s).
  - Judge the look. If the prism-as-full-stop reads badly, fall back to Onda's
    disc: a green circle aperture with the glowing prism inside it, shrinking
    into a green dot full stop. Show me both if unsure.

1b. src/components/home/Pillars.astro — Onda's "What we do" stacking cards.
  - Four large green cards on the ivory page (inverted from Onda because Books,
    the next section, is already green). Each: number, title, line, service
    as a pill tag, "Learn more →", and a "media" panel with a giant outlined
    brass numeral (Onda's cards have photos; we have none yet).
  - ≥768px and motion allowed: position sticky, top = clamp(80px,12svh,108px)
    + i × 14px. As card i+1 rises to its slot, card i scales 1 → 0.9 and a shade
    layer goes 0 → 0.55 (scrubbed). Start/end are computed from the cards'
    natural (un-stuck) positions because sticky elements can't be measured
    where they sit. Phones: plain list, no sticky (Motion v3: no pins on
    phones). Reduced motion: no sticky, no scaling.
  - The old version had a <details> fold on phones and a hover flood on
    desktop; those are gone. Make sure nothing else referenced them.

1c. src/components/home/Speaking.astro — Onda's "Selected work".
  - The existing pinned horizontal track stays. Added: the stage sits on a
    green plate (.speaking__plate) with ivory cards; header, intro, hint and
    meter re-coloured for green. Desktop: the plate's clip-path goes from
    inset(0 3.2% round 44px) to full as the section arrives (top bottom →
    top 15%). After the pin ends, a scrubbed exit (no extra pin, 0.7 viewport
    of scroll): cards sweep left, drop and rotate (-8° to about -36°, earlier
    cards fall further), clipped by the stage (overflow: clip) so they never
    cover the "Past audiences" foot.
  - Check the drag, keyboard focus-scrolling, counter and skew still work,
    and that the fall reverses cleanly when scrolling back up.

STOP after STEP 1: show me screenshots (1440 and 390) of the hero at scroll 0,
mid-shrink and docked, plus Pillars and Speaking, and wait for my OK.

STEP 2 — PORT THE REMAINING ONDA EFFECTS (one section at a time)
Use Onda's source for timings and ranges. Map:
- Manifesto ← Onda "statement" (#statement): line spans translate in from
  opposite sides as the section enters, and the full stop dot scales in.
  Keep our word-by-word light-up and the docked prism; add the line slides
  only if they don't fight the word reveal. The full stop becomes a brass
  triangle, matching the hero.
- Arc (Customers → Ventures → Institutions) ← Onda "method" (#method): a
  sticky ring/arc that draws itself as you scroll while each station swells
  and its step lights up in turn. Keep it within the existing Arc pin budget
  (≤ ~1.5 viewport heights per chapter) and keep the year odometer.
- Testimonials ← Onda "again" ("Never a one-off"): a turning wheel of cards
  with a heading rise, scrubbed on a sticky stage. Keyboard and screen-reader
  access must stay as good as the current Testimonials island.
- Gallery ← Onda "studio": photos "dealt" onto the table one after another
  (staggered translate + rotate from a stack, scrubbed).
- Insights ← Onda "journal": each article image revealed with a clip-path
  wipe and the list items fading in on a sticky frame.
- Contact ← Onda "contact": the big line changes weight as it scrolls in and
  a dot scales in. Cormorant is loaded only at 600/700 (not a variable font):
  either fake it with a crossfade between the two weights, or swap to a scale
  + letter-spacing change; do not add a variable font without asking me.
- Footer: Onda's footer re-uses the hero aperture at a smaller size; end with
  the travelling prism at the existing footer waypoint instead.
- Numbers and Books: no Onda equivalent; leave them as they are.
After each section: npm run build, check 1440 and 390, then move on. STOP
after Arc and after Testimonials for my review.

GUARDRAILS (unchanged — these win over Onda)
- JS off = everything visible and readable. Reduced motion = no loader,
  pins, sticky stacks, scrub, cursor, marquee, orbit or Lenis.
- Phones (≤767px): no pins and no sticky stacks, fade-ups only, no prism
  travel. Keyboard reaches everything, in reading order, inside pinned
  sections.
- Animate only transform, opacity and clip-path. No CSS/SVG blur filters on
  moving layers. will-change only while tweening.
- Every idle loop (orbit, marquee, clock, roles, breathing) pauses off-screen
  and in hidden tabs.
- Max 3 long GSAP pins on home (Manifesto, Arc, Speaking). Sticky CSS stacks
  count as pins for "feels stuck" testing: try a fast trackpad flick and
  keyboard PageDown on every one.
- Astro ClientRouter: every scene must survive a page change and come back
  (registerScene handles this — don't add raw listeners outside scenes).
- Targets: ≥55fps desktop, ≥50fps phone at 4× CPU throttle; Lighthouse mobile
  Performance 90+, Accessibility 100, CLS < 0.1, LCP < 2.5s.

HOW TO REPORT
At each stop: what you changed, removed and kept; how it behaves at 390px and
1440px; fps at 4× throttle and Lighthouse mobile (median of 3) before → after;
screenshots. Keep TODO.md up to date with a "Motion v4" section, and update
the BRIEF's motion section and src/lib/motion.ts comments to describe v4.
Commit after each finished section with a clear message.
