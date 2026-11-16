/**
 * The brass thread (home page, desktop only). One brass line runs down the left
 * gutter from the manifesto to the footer, bending like the inflection curve
 * at each section boundary. It draws itself as you scroll — its glowing tip
 * stays about 60% down the screen — and each section's node lights up, with
 * its number, as the tip passes. A faint guide shows the route ahead.
 *
 * Cheap per frame: the line is drawn once and revealed with a rectangular
 * clip-path (applied by the compositor, no repaint of the page-tall SVG); the
 * tip is two small HTML dots moved with transforms. Decorative only
 * (aria-hidden, pointer-events none). Phones, tablets and reduced motion don't
 * get it; JS off has nothing to hide.
 */
import { ScrollTrigger, registerScene } from './scroll';

const NS = 'http://www.w3.org/2000/svg';
const TIP_AT = 0.6; // fraction of the viewport height where the tip sits

const svgEl = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}) => {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
};
const div = (className: string) => {
  const el = document.createElement('div');
  el.className = className;
  return el;
};

registerScene('thread', ({ desktop }) => {
  if (!desktop || !document.querySelector('[data-hero]')) return;
  const footer = document.querySelector<HTMLElement>('[data-site-footer]');
  if (!footer) return;

  // The sections the nav counts, after the hero.
  const sections = [...document.querySelectorAll<HTMLElement>('main > section, main [data-section]')].filter(
    (el) => el.dataset.section || el.querySelector('.eyebrow')
  );
  if (sections.length < 3) return;

  // Static guide + nodes; the solid line in its own clipped layer; the tip.
  const layer = div('thread');
  layer.setAttribute('aria-hidden', 'true');
  const base = svgEl('svg', { focusable: 'false' });
  const guide = svgEl('path', { class: 'thread__guide' });
  const nodesG = svgEl('g');
  base.append(guide, nodesG);
  const reveal = div('thread__reveal');
  const lineSvg = svgEl('svg', { focusable: 'false' });
  const line = svgEl('path', { class: 'thread__line' });
  lineSvg.append(line);
  reveal.append(lineSvg);
  const halo = div('thread__halo');
  const tip = div('thread__tip');
  layer.append(base, reveal, halo, tip);
  document.body.append(layer);

  let xs: Float32Array = new Float32Array(0);
  let ys: Float32Array = new Float32Array(0);
  let height = 0;
  let startY = 0;
  let endY = 0;
  let nodes: { el: SVGGElement; y: number; lit: boolean }[] = [];
  let vh = window.innerHeight;
  let lastTip = -1;

  const top = (el: Element) => el.getBoundingClientRect().top + window.scrollY;

  const build = () => {
    vh = window.innerHeight;
    const content = document.querySelector<HTMLElement>('main .container-content');
    const contentLeft = content
      ? content.getBoundingClientRect().left + parseFloat(getComputedStyle(content).paddingLeft)
      : 64;
    const gx = Math.max(14, Math.round(contentLeft / 2));
    const amp = Math.min(26, Math.round(gx * 0.45));
    const labels = contentLeft >= 72;

    // Waypoints: each section top after the hero, then into the footer.
    const pts = sections.slice(1).map((el, i) => ({ x: gx + (i % 2 ? amp : 0), y: top(el) + 36, n: i + 2 }));
    pts.push({ x: gx, y: top(footer) + 28, n: 0 });
    startY = pts[0].y;
    endY = pts[pts.length - 1].y;
    height = Math.ceil(document.documentElement.scrollHeight);
    const width = gx * 2 + amp + 40;
    layer.style.width = `${width}px`;
    layer.style.height = `${height}px`;
    for (const s of [base, lineSvg]) {
      s.setAttribute('width', String(width));
      s.setAttribute('height', String(height));
      s.setAttribute('viewBox', `0 0 ${width} ${height}`);
    }

    // Mostly straight, bending near each node — flat, then the inflection.
    let d = `M${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1];
      const b = pts[i];
      const dy = b.y - a.y;
      d += ` C${a.x} ${a.y + dy * 0.72} ${b.x} ${b.y - dy * 0.16} ${b.x} ${b.y}`;
    }
    guide.setAttribute('d', d);
    line.setAttribute('d', d);

    // Sample the path once (it only ever goes down), so scrolling is a binary search.
    const total = line.getTotalLength();
    const n = Math.min(2400, Math.max(2, Math.ceil(total / 6)));
    xs = new Float32Array(n);
    ys = new Float32Array(n);
    for (let k = 0; k < n; k++) {
      const p = line.getPointAtLength((k * total) / (n - 1));
      xs[k] = p.x;
      ys[k] = p.y;
    }

    // Section nodes (and their numbers, when the gutter is wide enough).
    nodesG.replaceChildren();
    nodes = pts.slice(0, -1).map((p) => {
      const g = svgEl('g', { class: 'thread__node', transform: `translate(${p.x} ${p.y})` }) as SVGGElement;
      g.append(svgEl('circle', { r: 4 }));
      if (labels) {
        const t = svgEl('text', { x: 12, y: 4 });
        t.textContent = String(p.n).padStart(2, '0');
        g.append(t);
      }
      nodesG.append(g);
      return { el: g, y: p.y, lit: false };
    });
    lastTip = -1;
  };

  const render = (scroll: number) => {
    if (!ys.length) return;
    const tipY = Math.round(scroll + vh * TIP_AT);
    if (tipY === lastTip) return;
    lastTip = tipY;
    // Reveal the drawn line down to the tip (compositor-only clip).
    reveal.style.clipPath = `inset(0 0 ${Math.max(0, height - tipY)}px 0)`;
    // Tip position: the path's x at the tip's height.
    let lo = 0;
    let hi = ys.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (ys[mid] < tipY) lo = mid + 1;
      else hi = mid;
    }
    const on = tipY > startY && tipY < endY;
    const t = `translate3d(${xs[lo]}px, ${tipY}px, 0)`;
    tip.style.transform = t;
    halo.style.transform = t;
    tip.style.opacity = halo.style.opacity = on ? '1' : '0';
    for (const nd of nodes) {
      const lit = tipY >= nd.y;
      if (lit !== nd.lit) {
        nd.lit = lit;
        nd.el.classList.toggle('is-lit', lit);
      }
    }
  };

  ScrollTrigger.create({
    start: 0,
    end: 'max',
    refreshPriority: -20, // after pins have added their spacing
    onRefresh: (self) => {
      build();
      render(self.scroll());
    },
    onUpdate: (self) => render(self.scroll()),
  });
  build();
  render(window.scrollY);

  return () => layer.remove();
});
