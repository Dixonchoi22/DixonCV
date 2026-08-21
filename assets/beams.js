// Animated connector beams for the automation diagram.
//
// A rewrite of the framer-motion AnimatedBeam in plain SVG. The original
// animated the gradient's x1/x2 from React state on every frame; SMIL does the
// same job declaratively, off the main thread, and stops costing anything when
// the element is off-screen — which matters here because the page already runs
// a WebGL loop behind it.
//
// One beam is two stacked paths: a static faint one so the wire reads even
// between pulses, and the same path stroked with a moving gradient.

const NS = 'http://www.w3.org/2000/svg';

function el(name, attrs = {}) {
  const node = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}

export function createBeams(container, links, options = {}) {
  const {
    pathColor = 'rgba(255,255,255,0.16)',
    pathWidth = 1.6,
    startColor = '#e08a5c',
    stopColor = '#6f9bd8',
  } = options;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const svg = el('svg', {
    fill: 'none',
    xmlns: NS,
    class: 'beams',
    'aria-hidden': 'true',
  });
  const defs = el('defs');
  svg.appendChild(defs);
  container.appendChild(svg);

  const beams = links.map((link, i) => {
    const id = `beam-grad-${i}`;
    const base = el('path', {
      stroke: pathColor,
      'stroke-width': pathWidth,
      'stroke-linecap': 'round',
    });
    const lit = el('path', {
      stroke: `url(#${id})`,
      'stroke-width': pathWidth + 0.4,
      'stroke-linecap': 'round',
    });

    const grad = el('linearGradient', {
      id,
      gradientUnits: 'userSpaceOnUse',
      x1: '0', x2: '0', y1: '0', y2: '0',
    });
    grad.appendChild(el('stop', { 'stop-color': startColor, 'stop-opacity': '0' }));
    grad.appendChild(el('stop', { 'stop-color': startColor }));
    grad.appendChild(el('stop', { offset: '0.325', 'stop-color': stopColor }));
    grad.appendChild(el('stop', { offset: '1', 'stop-color': stopColor, 'stop-opacity': '0' }));

    // Held on the gradient rather than restated per frame; updateGeometry
    // rewrites the `values` when the layout changes, and SMIL picks the new
    // keyframes up on its next repeat.
    const animX1 = el('animate', {
      attributeName: 'x1',
      dur: `${link.duration ?? 4 + i * 0.45}s`,
      repeatCount: 'indefinite',
      begin: `${link.delay ?? i * 0.35}s`,
      calcMode: 'spline',
      keyTimes: '0;1',
      keySplines: '0.16 1 0.3 1',
    });
    const animX2 = el('animate', {
      attributeName: 'x2',
      dur: `${link.duration ?? 4 + i * 0.45}s`,
      repeatCount: 'indefinite',
      begin: `${link.delay ?? i * 0.35}s`,
      calcMode: 'spline',
      keyTimes: '0;1',
      keySplines: '0.16 1 0.3 1',
    });
    grad.appendChild(animX1);
    grad.appendChild(animX2);
    defs.appendChild(grad);

    svg.appendChild(base);
    svg.appendChild(lit);

    if (reduceMotion) lit.setAttribute('opacity', '0');

    return { link, base, lit, animX1, animX2 };
  });

  function updateGeometry() {
    const box = container.getBoundingClientRect();
    if (!box.width || !box.height) return;

    svg.setAttribute('width', box.width);
    svg.setAttribute('height', box.height);
    svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);

    for (const beam of beams) {
      const { from, to, curvature = 0, reverse = false } = beam.link;
      const a = from.getBoundingClientRect();
      const b = to.getBoundingClientRect();

      let startX = a.left - box.left + a.width / 2;
      let startY = a.top - box.top + a.height / 2;
      let endX = b.left - box.left + b.width / 2;
      let endY = b.top - box.top + b.height / 2;

      // Centre-to-centre would draw the wire straight through both nodes, which
      // is what the framer-motion original does and why its demo hides it under
      // opaque circles. These nodes are translucent, so each end is pulled back
      // to its own edge instead: the wire meets the ring and stops.
      const gap = 7;
      const ra = Math.min(a.width, a.height) / 2 + gap;
      const rb = Math.min(b.width, b.height) / 2 + gap;
      const dx = endX - startX;
      const dy = endY - startY;
      const len = Math.hypot(dx, dy) || 1;
      startX += (dx / len) * ra;
      startY += (dy / len) * ra;
      endX -= (dx / len) * rb;
      endY -= (dy / len) * rb;

      const d = `M ${startX},${startY} Q ${(startX + endX) / 2},${startY - curvature} ${endX},${endY}`;
      beam.base.setAttribute('d', d);
      beam.lit.setAttribute('d', d);

      // The pulse travels along the beam's own bounding box rather than the
      // whole diagram, so a short wire and a long one pulse at the same speed
      // rather than the short one appearing to stall.
      const lo = Math.min(startX, endX);
      const hi = Math.max(startX, endX);
      const span = Math.max(hi - lo, 1);
      const pad = span * 0.35;

      const x1 = reverse ? [hi + pad, lo - pad] : [lo - pad, hi + pad];
      const x2 = reverse ? [hi + pad * 2, lo] : [lo, hi + pad * 2];

      beam.animX1.setAttribute('values', `${x1[0]};${x1[1]}`);
      beam.animX2.setAttribute('values', `${x2[0]};${x2[1]}`);
    }
  }

  const observer = new ResizeObserver(updateGeometry);
  observer.observe(container);
  updateGeometry();
  window.addEventListener('resize', updateGeometry);
  // Web fonts land after first paint and move the nodes; without this the
  // wires stay pinned to where the fallback font put them.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(updateGeometry);

  return function destroy() {
    observer.disconnect();
    window.removeEventListener('resize', updateGeometry);
    svg.remove();
  };
}
