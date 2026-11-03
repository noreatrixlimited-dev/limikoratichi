// Equations for explainers: TeX → glyph outlines → animated on the canvas (write-on, fade, transforms).
// Typesetting by MathJax (Apache-2.0, node_modules/mathjax-full). Animation code written for this studio.
//
//   import * as M from '../mathfx.js';
//   setup: const a = await M.tex('a^2 + b^2 = c^2'), b = await M.tex('c = \\sqrt{a^2 + b^2}');
//   draw:  M.draw(ctx, a, { x: 640, y: 360, size: 90, t, start: 0.5, preset: 'write', dur: 1.5, color: '#fff' });
//          M.transform(ctx, a, b, p, { x: 640, y: 360, size: 90 })      // p 0→1: matching symbols travel, others fade
//          M.box(ctx, a, [0, 2], { x, y, size, p, color: '#ffd23f' })   // highlight glyphs 0..2 with a drawn box
//          await a.find('b^2') → [i0, i1] glyph range of a sub-expression typed the same way (in setup)
//
// Units: an equation is measured in em (1 em = `size` px). (x, y) is the anchor (align: center|left|right, baseline middle).

let ready = null;
function loadMathJax() {
  if (ready) return ready;
  ready = new Promise((res, rej) => {
    window.MathJax = { svg: { fontCache: 'none' }, startup: { typeset: false, pageReady: () => window.MathJax.startup.defaultPageReady().then(res) }, options: { enableMenu: false } };
    const s = document.createElement('script');
    s.src = new URL('./node_modules/mathjax-full/es5/tex-svg-full.js', import.meta.url).href;
    s.onerror = () => rej(new Error('mathjax-full missing: cd frames && npm install'));
    document.head.appendChild(s);
  });
  return ready;
}

/** Typeset TeX into glyphs: [{ path: Path2D, m: DOMMatrix (glyph units → em), key, bbox: {x,y,w,h} (em), len }] */
export async function tex(src, { display = true } = {}) {
  await loadMathJax();
  const node = window.MathJax.tex2svg(src, { display });
  const svg = node.querySelector('svg');
  const host = document.createElement('div');
  host.style.cssText = 'position:absolute;left:0;top:0;visibility:hidden;font-size:100px';
  host.appendChild(svg); document.body.appendChild(host);
  const vb = svg.viewBox.baseVal, toUnits = svg.getScreenCTM().inverse();
  const glyphs = [];
  const unit = 1 / 1000;  // MathJax SVG units: 1000 per em
  for (const el of svg.querySelectorAll('path, rect')) {
    if (el.closest('defs')) continue;
    const ctm = toUnits.multiply(el.getScreenCTM());
    const m = new DOMMatrix([ctm.a * unit, ctm.b * unit, ctm.c * unit, ctm.d * unit, (ctm.e - vb.x) * unit, (ctm.f - vb.y) * unit]);
    let d, key;
    if (el.tagName === 'rect') {
      const x = +el.getAttribute('x') || 0, y = +el.getAttribute('y') || 0, w = +el.getAttribute('width'), h = +el.getAttribute('height');
      d = `M${x} ${y}H${x + w}V${y + h}H${x}Z`; key = 'rule';
    } else { d = el.getAttribute('d'); key = el.getAttribute('data-c') || 'path'; }
    if (!d) continue;
    const bb = el.getBBox();
    const corners = [[bb.x, bb.y], [bb.x + bb.width, bb.y], [bb.x, bb.y + bb.height], [bb.x + bb.width, bb.y + bb.height]].map(([px, py]) => m.transformPoint(new DOMPoint(px, py)));
    const xs = corners.map((c) => c.x), ys = corners.map((c) => c.y);
    const box = { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
    glyphs.push({ path: new Path2D(d), m, key, bbox: box, len: 3.2 * (bb.width + bb.height) });
  }
  host.remove();
  const eq = { src, glyphs, width: vb.width * unit, height: vb.height * unit };
  eq.find = (sub, nth = 0) => findSub(eq, sub, nth);
  return eq;
}

// locate a sub-expression by typesetting it alone and matching its symbol sequence
const subCache = new Map();
async function findSub(eq, sub, nth) {
  if (!subCache.has(sub)) subCache.set(sub, await tex(sub));
  const keys = subCache.get(sub).glyphs.map((g) => g.key), all = eq.glyphs.map((g) => g.key);
  let hit = -1;
  for (let i = 0, k = 0; i <= all.length - keys.length; i++) if (keys.every((c, j) => all[i + j] === c)) { if (k++ === nth) { hit = i; break; } }
  return hit < 0 ? null : [hit, hit + keys.length - 1];
}

const clamp = (x) => Math.max(0, Math.min(1, x));
const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

function origin(eq, { x = 0, y = 0, size = 80, align = 'center' }) {
  const ox = align === 'left' ? x : align === 'right' ? x - eq.width * size : x - (eq.width * size) / 2;
  return [ox, y - (eq.height * size) / 2];
}

function paintGlyph(ctx, g, ox, oy, size, { color, alpha = 1, write = 1, stroke = null, lineWidth = 0.022, extra = null }) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.translate(ox, oy); ctx.scale(size, size);
  if (extra) ctx.transform(extra.a, extra.b, extra.c, extra.d, extra.e, extra.f);
  ctx.transform(g.m.a, g.m.b, g.m.c, g.m.d, g.m.e, g.m.f);
  ctx.globalAlpha *= alpha;
  if (write < 1) {
    // write-on: the outline draws first, then the fill floods in (pen, then ink)
    const s = clamp(write / 0.6), f = clamp((write - 0.5) / 0.5);
    const lw = (lineWidth * 1000) / Math.max(1e-6, Math.hypot(g.m.a, g.m.b) * 1000);
    ctx.lineWidth = lw; ctx.strokeStyle = stroke || color; ctx.lineJoin = 'round';
    ctx.setLineDash([g.len * s, g.len]); ctx.stroke(g.path);
    if (f > 0) { ctx.globalAlpha *= f; ctx.fillStyle = color; ctx.fill(g.path); }
  } else { ctx.fillStyle = color; ctx.fill(g.path); if (stroke) { ctx.setLineDash([]); ctx.lineWidth = (lineWidth * 1000) / Math.max(1e-6, Math.hypot(g.m.a, g.m.b) * 1000); ctx.strokeStyle = stroke; ctx.stroke(g.path); } }
  ctx.restore();
}

/** Draw an equation, optionally animated in. preset: 'write' | 'fade' | 'rise' | 'pop' | 'none'. colors: { glyphIndex: color } */
export function draw(ctx, eq, o = {}) {
  const { t = 1e9, start = 0, dur = 1.2, preset = 'write', color = '#ffffff', colors = {}, size = 80, lag = 0.6, stroke = null, from = 0, to = eq.glyphs.length - 1 } = o;
  const [ox, oy] = origin(eq, o);
  const n = to - from + 1;
  for (let i = from; i <= to; i++) {
    const g = eq.glyphs[i];
    // each glyph has its own window; lag 0 = all together, 1 = strictly one after another
    const k = i - from, w = dur / (1 + lag * (n - 1)), s0 = start + k * w * lag;
    const p = preset === 'none' ? 1 : clamp((t - s0) / w);
    if (p <= 0) continue;
    const c = colors[i] || color, e = ease(p);
    if (preset === 'write') paintGlyph(ctx, g, ox, oy, size, { color: c, write: p, stroke });
    else if (preset === 'fade') paintGlyph(ctx, g, ox, oy, size, { color: c, alpha: e, stroke });
    else if (preset === 'rise') paintGlyph(ctx, g, ox, oy + (1 - e) * size * 0.3, size, { color: c, alpha: e, stroke });
    else if (preset === 'pop') {
      const cx = g.bbox.x + g.bbox.w / 2, cy = g.bbox.y + g.bbox.h / 2, sc = 0.3 + 0.7 * (1 + 2.2 * Math.pow(e - 1, 3) + 1.2 * Math.pow(e - 1, 2));
      paintGlyph(ctx, g, ox, oy, size, { color: c, alpha: clamp(p * 2), stroke, extra: new DOMMatrix().translate(cx, cy).scale(sc).translate(-cx, -cy) });
    } else paintGlyph(ctx, g, ox, oy, size, { color: c, stroke });
  }
}

/** Glyph pairing between two equations: same symbol, in reading order (k-th 'b' ↔ k-th 'b'). Overrides: { aIndex: bIndex } */
export function match(a, b, overrides = {}) {
  const pairs = new Map(Object.entries(overrides).map(([i, j]) => [+i, +j]));
  const usedB = new Set(pairs.values());
  for (let i = 0; i < a.glyphs.length; i++) {
    if (pairs.has(i)) continue;
    const key = a.glyphs[i].key;
    if (key === 'path' || key === 'rule') continue;
    const j = b.glyphs.findIndex((g, jj) => g.key === key && !usedB.has(jj));
    if (j >= 0) { pairs.set(i, j); usedB.add(j); }
  }
  return pairs;
}

/** Morph equation a into b at progress p (0→1). Matched glyphs travel on an arc; the rest fade out / fade in. */
export function transform(ctx, a, b, p, o = {}) {
  const { color = '#ffffff', colorB = color, size = 80, pairs = match(a, b, o.overrides), arc = 0.25 } = o;
  const [ax, ay] = origin(a, o), [bx, by] = origin(b, o.toAt || o);
  const e = ease(clamp(p));
  const matchedB = new Set(pairs.values());
  a.glyphs.forEach((g, i) => {
    if (pairs.has(i)) {
      const h = b.glyphs[pairs.get(i)];
      // interpolate the glyph's matrix (its symbol shape is the same), plus a little lift so paths don't cross flat
      const m = new DOMMatrix([
        g.m.a + (h.m.a - g.m.a) * e, g.m.b + (h.m.b - g.m.b) * e, g.m.c + (h.m.c - g.m.c) * e, g.m.d + (h.m.d - g.m.d) * e,
        g.m.e + ax / size + (h.m.e + bx / size - g.m.e - ax / size) * e, g.m.f + ay / size + (h.m.f + by / size - g.m.f - ay / size) * e - Math.sin(Math.PI * e) * arc * (i % 2 ? 1 : -1) * 0.5,
      ]);
      paintGlyph(ctx, { ...g, m }, 0, 0, size, { color: mixColor(color, colorB, e) });
    } else paintGlyph(ctx, g, ax, ay, size, { color, alpha: 1 - clamp(e * 1.8) });
  });
  b.glyphs.forEach((h, j) => { if (!matchedB.has(j)) paintGlyph(ctx, h, bx, by, size, { color: colorB, alpha: clamp((e - 0.45) / 0.55) }); });
}

/** Draw a highlight box around glyphs [i0, i1] (p = 0→1 draws it on). */
export function box(ctx, eq, [i0, i1], o = {}) {
  const { size = 80, p = 1, color = '#ffd23f', pad = 0.12, width = 4, fill = null } = o;
  const [ox, oy] = origin(eq, o);
  const gs = eq.glyphs.slice(i0, i1 + 1);
  const x0 = Math.min(...gs.map((g) => g.bbox.x)) - pad, x1 = Math.max(...gs.map((g) => g.bbox.x + g.bbox.w)) + pad;
  const y0 = Math.min(...gs.map((g) => g.bbox.y)) - pad, y1 = Math.max(...gs.map((g) => g.bbox.y + g.bbox.h)) + pad;
  const X = ox + x0 * size, Y = oy + y0 * size, W = (x1 - x0) * size, H = (y1 - y0) * size, per = 2 * (W + H);
  ctx.save();
  if (fill) { ctx.globalAlpha = clamp(p) * 0.35; ctx.fillStyle = fill; ctx.fillRect(X, Y, W, H); ctx.globalAlpha = 1; }
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineJoin = 'round';
  ctx.setLineDash([per * ease(clamp(p)), per]); ctx.beginPath(); ctx.roundRect(X, Y, W, H, 8); ctx.stroke();
  ctx.restore();
  return { x: X, y: Y, w: W, h: H };
}

function mixColor(a, b, t) {
  if (a === b) return a;
  const h = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
  const [r1, g1, b1] = h(a), [r2, g2, b2] = h(b);
  return `rgb(${Math.round(r1 + (r2 - r1) * t)},${Math.round(g1 + (g2 - g1) * t)},${Math.round(b1 + (b2 - b1) * t)})`;
}
