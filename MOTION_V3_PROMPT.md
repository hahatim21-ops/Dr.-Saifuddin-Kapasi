Read BRIEF.md.md, TODO.md and MOTION_PROMPT.md first. Motion v2 is fully built
(see TODO.md → "Motion v2"). The site works, but it now has too many effects
competing for attention, five long pins on the home page, and about 40fps on
desktop under a 4× CPU throttle. This job is Motion v3: EDIT, DON'T ADD. Make the
motion calmer, faster to read and smoother. Keep the brand, colours, fonts, copy,
placeholders and every accessibility guardrail from MOTION_PROMPT.md.

GOAL IN ONE LINE
A visitor (event organiser, college, client) should feel "premium and composed",
never "waiting for animations". Motion should guide the eye to the next thing to
read, then get out of the way.

STEP 0 — RESTORE POINT
Commit the current state as "motion-v2-final" and work on a new branch
"motion-v3". Don't delete code you remove; keep it in git history only.

STEP 1 — NAVIGATION (src/data/site.json, src/components/Nav.astro)
- Desktop top bar: About · Speaking · Books · Insights, plus the brass
  "Invite to speak" button on the right. Remove Frameworks from the top bar.
- Tablet: Speaking · Books · Insights + button (as now).
- Menu overlay: trim from 8 to 6 items: About, Speaking & Training, Books,
  Frameworks, Insights, Contact. Achievements and Students stay as pages but are
  linked from the About page (a short "Recognition" and "For students" block
  with links) and from the footer's Explore column.
- "Books" currently points to /#books. Create a simple /books index page
  (both covers, one-line pitch each, links to /books/[slug]) and point the nav
  there, so clicking Books from an inner page doesn't trigger a curtain wipe
  into the middle of the long home page.
- Active-link state and the "NN / NN · Section" counter must still be correct
  after these changes.

STEP 2 — HOME PAGE LENGTH (src/pages/index.astro) — stop and ask me before doing this
Propose (don't apply yet) trimming the home page from 13 sections to about 10:
- Thinking tools → replace the pinned section with a 2-line teaser and a link
  to /frameworks (the full draw stays on that page).
- Achievements → a compact single row of the 3 newest frames + "See all".
Show me the proposed order and wait for my OK.

STEP 3 — ONE SIGNATURE, NOT SIX
Keep the travelling prism as the site's single signature motion. Then:
- Remove the brass thread in the left gutter (src/lib/thread.ts and its
  markup). It duplicates the nav progress hairline and the section counter.
- Film grain: keep the static paper texture, stop animating it.
- Custom cursor: keep the dot + ring, but show labels only on the Speaking
  track ("Drag") and gallery photos ("View"). No labels on ordinary cards.
- Loader: cut to 1.2s max. If the hero portrait and fonts are already cached,
  skip it. It must never delay LCP; measure before/after.
- Keep: rotating eyebrow, clock, marquee, magnetic buttons, page curtain.

STEP 4 — PIN BUDGET (max 3 long pins on home)
- Keep pinned: Manifesto, the Arc, the Speaking horizontal track.
- Manifesto pin: shorten from ~150vh to ~100vh of scroll.
- Arc: the pin must release within ~1.5 viewport heights per chapter; make the
  year odometer snap to each entry instead of drifting between them.
- Hero "sheet slides over" stays (it's short).
- Thinking tools (if still on home): no pin. Draw each stage as it enters.
- No pin anywhere may feel "stuck": test with a fast trackpad flick and with
  keyboard PageDown. Use ScrollTrigger anticipatePin: 1 on every pin.

STEP 5 — MOTION HIERARCHY (three tiers, applied consistently)
Tier 1 — cinematic, scrubbed: only the prism, Manifesto, Arc, Books covers,
Speaking track.
Tier 2 — section reveals: SplitText line reveals ONLY on h1 and section h2s.
Remove data-split from h3s, eyebrows, small labels and body copy. Body copy and
cards get a simple fade-up (y: 16px → 0, opacity 0 → 1, 0.6s, expo.out).
Clip-path image wipes only on large photos (hero, gallery, about portrait);
small images just fade.
Tier 3 — UI feedback: 0.15–0.2s, the "inflect" ease.
Update src/lib/motion.ts and BRIEF section 5b to describe these tiers.

STEP 6 — TIMING AND FEEL
- Reveal triggers: start at 'top 80%' (not 88%), so content finishes moving
  before it reaches reading height.
- Durations: headings 0.9s, body 0.6s, chars only on the hero name. Any
  staggered group must finish within 0.6s total, however many items it has
  (use stagger: { amount: 0.4 } instead of fixed per-item staggers).
- Add fastScrollEnd: true and preventOverlaps: true to one-shot reveals so a
  fast scroll completes them instantly instead of leaving half-faded content.
- After a page transition, start the hero/heading reveals only when the
  curtain has finished lifting (no animations running under the curtain).
- Scrub smoothing: keep 0.8 for Tier 1; use scrub: true (no lag) for the nav
  progress hairline.

STEP 7 — SMOOTH SCROLL (Lenis in src/lib/scroll.ts)
- Try lerp 0.12 vs a duration-based setup (duration 1.1, easing
  t => Math.min(1, 1.001 - Math.pow(2, -10 * t))). Pick the one that feels less
  floaty on a trackpad and tell me which and why.
- Anchor links: offset by the nav height so headings don't hide under it.
- Call lenis.stop() while the menu overlay, the achievement lightbox or any
  modal is open, and lenis.start() when it closes.

STEP 8 — PERFORMANCE (target ≥55fps desktop, ≥50fps phone at 4× throttle)
- Prism glow: if it uses SVG filters (feGaussianBlur) or CSS filter: blur on the
  fixed layer, replace them with a pre-blurred radial-gradient element. Animate
  only transform and opacity on the prism.
- Pause every idle loop (prism breathing, marquee, clock, rotating eyebrow)
  when it's off-screen or the tab is hidden.
- Cursor: gsap.quickTo only, no getBoundingClientRect inside rAF.
- will-change only during a tween; remove it on complete.
- Heavy scenes (Speaking track, collage, prism timeline) are created only when
  near the viewport, and their ScrollTriggers are refreshed once, not per image.

STEP 9 — PHONES (375–430px)
- No pins at all. No cursor, no prism travel, no velocity skew.
- Reveals are fade-ups only (y 12px, 0.5s). Line splits only on h1.
- Check the phone dock and the bottom tagline bar never overlap content or
  each other, and that the dock doesn't jitter on iOS address-bar resize.

GUARDRAILS (unchanged from MOTION_PROMPT.md)
JS off = everything visible. prefers-reduced-motion = no loader, pins, scrub,
cursor, marquee or Lenis. Keyboard reaches everything in pinned sections in
reading order. Animate only transform, opacity, clip-path (and filter only if
already cheap). Lighthouse mobile: Performance 90+, Accessibility 100, CLS < 0.1,
LCP < 2.5s.

HOW TO WORK
Do the steps in order and STOP after steps 1, 2 (proposal only), 4 and 8 for my
review. At each stop: run npm run build, then tell me in a few lines
- what you removed, what you changed, and what you kept
- how it behaves at 390px and 1440px
- fps at 4× throttle and Lighthouse mobile (median of 3), before → after.
Keep TODO.md up to date with a "Motion v3" section.
