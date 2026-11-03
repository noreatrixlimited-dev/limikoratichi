// Text animations ("kinetic type") for canvas scenes. Written for this studio; every preset is a pure function of time.
//
//   import { drawText, PRESETS } from '../textfx.js';
//   drawText(ctx, 'Hello friends!', { x: 640, y: 360, t, start: 1.0, preset: 'popBounce', size: 72,
//            font: 'Inter', color: '#fff', stroke: '#000', unit: 'word', stagger: 0.06, dur: 0.5, hold: 2.0, exit: 'fadeDown' });
//
// unit: 'grapheme' (letters; Telugu syllables are kept whole), 'word', or 'line'.
// Timing: each unit enters at start + i*stagger over `dur`; after `hold` seconds the exit preset plays (reversed timing).
// Presets work for English and Telugu (use font L.FONT.te for Telugu).

const TAU = Math.PI * 2;
const clamp = (x) => Math.max(0, Math.min(1, x));
const E = {
  out: (x) => 1 - (1 - x) ** 3,
  inOut: (x) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2),
  back: (x) => 1 + 2.7 * (x - 1) ** 3 + 1.7 * (x - 1) ** 2,
  elastic: (x) => (x === 0 || x === 1 ? x : 2 ** (-10 * x) * Math.sin((x * 10 - 0.75) * (TAU / 3)) + 1),
  bounce: (x) => {
    const n = 7.5625, d = 2.75;
    if (x < 1 / d) return n * x * x; if (x < 2 / d) return n * (x -= 1.5 / d) * x + 0.75;
    if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + 0.9375; return n * (x -= 2.625 / d) * x + 0.984375;
  },
};
const rnd = (i, k = 0) => { const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return s - Math.floor(s); };

export function units(text, unit, lang) {
  if (unit === 'line') return [text];
  if (unit === 'word') return text.split(/(\s+)/).filter((s) => s.length);
  if (typeof Intl !== 'undefined' && Intl.Segmenter) return [...new Intl.Segmenter(lang || 'en', { granularity: 'grapheme' }).segment(text)].map((s) => s.segment);
  return [...text];
}

// Each preset maps progress p (0→1, eased inside) and unit index → a transform for that unit.
// Return { a: alpha, dx, dy, sx, sy, rot, blur, color, extra(ctx, box) }
export const PRESETS = {
  fade:          (p) => ({ a: E.out(p) }),
  fadeUp:        (p) => ({ a: E.out(p), dy: (1 - E.out(p)) * 0.6 }),
  fadeDown:      (p) => ({ a: E.out(p), dy: -(1 - E.out(p)) * 0.6 }),
  slideLeft:     (p) => ({ a: clamp(p * 2), dx: (1 - E.out(p)) * 2.5 }),
  slideRight:    (p) => ({ a: clamp(p * 2), dx: -(1 - E.out(p)) * 2.5 }),
  dropIn:        (p) => ({ a: clamp(p * 3), dy: -(1 - E.bounce(p)) * 2.2 }),
  popBounce:     (p) => ({ a: clamp(p * 3), sx: E.back(p), sy: E.back(p) }),
  elasticPop:    (p) => ({ a: clamp(p * 4), sx: E.elastic(p), sy: E.elastic(p) }),
  zoomIn:        (p) => ({ a: E.out(p), sx: 2.6 - 1.6 * E.out(p), sy: 2.6 - 1.6 * E.out(p) }),
  stamp:         (p, i) => ({ a: clamp(p * 5), sx: 3 - 2 * E.out(p), sy: 3 - 2 * E.out(p), dx: p > 0.6 && p < 0.85 ? (rnd(i, 1) - 0.5) * 0.08 : 0 }),
  rotateIn:      (p) => ({ a: E.out(p), rot: (1 - E.back(p)) * -0.9, dy: (1 - E.out(p)) * 0.4 }),
  flipUp:        (p) => ({ a: clamp(p * 2), sy: Math.max(0.02, E.back(p)), dy: (1 - E.out(p)) * 0.25 }),
  blurIn:        (p) => ({ a: E.out(p), blur: (1 - E.out(p)) * 18 }),
  trackingIn:    (p) => ({ a: E.out(p), spread: (1 - E.out(p)) * 0.9 }),
  maskRise:      (p) => ({ a: 1, dy: (1 - E.out(p)) * 1.1, mask: true }),
  typewriter:    (p) => ({ a: p > 0 ? 1 : 0, cursor: p > 0 && p < 1 }),
  wave:          (p, i, t) => ({ a: E.out(p), dy: -Math.sin(t * 6 - i * 0.6) * 0.12 * E.out(p) }),
  jelly:         (p, i, t) => ({ a: E.out(p), sx: 1 + Math.sin(t * 9 + i) * 0.06, sy: 1 - Math.sin(t * 9 + i) * 0.06 }),
  glitch:        (p, i, t) => {
    const g = p < 1 || rnd(Math.floor(t * 12), i) > 0.93;
    return { a: p > 0 ? 1 : 0, dx: g ? (rnd(Math.floor(t * 24), i) - 0.5) * 0.25 : 0, rgb: g ? 0.06 : 0 };
  },
  neonFlicker:   (p, i, t) => ({ a: p < 1 ? (rnd(Math.floor(t * 20), i) > 0.45 ? 1 : 0.15) : 1, neon: true }),
  highlight:     (p) => ({ a: 1, marker: E.out(p) }),
  karaoke:       (p) => ({ a: 1, fill: E.inOut(p) }),
  underline:     (p) => ({ a: 1, underline: E.out(p) }),
  boxReveal:     (p) => ({ a: p > 0.5 ? 1 : 0, box: p < 0.5 ? E.out(p * 2) : 1 - E.out((p - 0.5) * 2), boxSide: p < 0.5 ? 'grow' : 'shrink' }),
  shake:         (p, i, t) => ({ a: 1, dx: (1 - p) * Math.sin(t * 70 + i) * 0.06, dy: (1 - p) * Math.cos(t * 63 + i) * 0.04 }),
};

export const PRESET_INFO = {
  fade: 'plain fade', fadeUp: 'rise + fade (all-purpose)', fadeDown: 'fall + fade (exits)', slideLeft: 'slide in from the right',
  slideRight: 'slide in from the left', dropIn: 'falls and bounces (kids)', popBounce: 'pops with overshoot (kids, gaming)',
  elasticPop: 'springy pop (cartoon)', zoomIn: 'shrinks in from big (titles)', stamp: 'slams down with a jolt (gaming hits)',
  rotateIn: 'swings in (playful)', flipUp: 'flips up like a card', blurIn: 'focuses in (cinematic, history)',
  trackingIn: 'letters gather from wide spacing (cinematic titles)', maskRise: 'rises out of a line (clean, documentary)',
  typewriter: 'typed one unit at a time (facts, mystery)', wave: 'keeps waving (songs, kids)', jelly: 'wobbles (cartoon)',
  glitch: 'digital glitch (gaming, tech, horror)', neonFlicker: 'neon sign flicker (gaming, night)',
  highlight: 'marker sweeps behind the text (facts)', karaoke: 'colour fills with the voice (lyrics, kids)',
  underline: 'underline draws on (facts)', boxReveal: 'colour box wipes on, text appears (news, facts)', shake: 'settles from a shake (impact)',
};

/**
 * Draw animated text at time t. Returns the total time the text needs (enter + hold + exit) for scheduling.
 */
export function drawText(ctx, text, o) {
  const { x = 0, y = 0, t = 0, start = 0, preset = 'fadeUp', exit = null, size = 64, font = 'Inter', weight = 900,
    color = '#ffffff', stroke = null, strokeW = 0, accent = '#ffd23f', unit = 'word', stagger = 0.05, dur = 0.5, hold = 2,
    align = 'center', lang = 'en', shadow = null } = o;
  const parts = units(text, unit, lang);
  ctx.save();
  ctx.font = `${weight} ${size}px ${font}`; ctx.textBaseline = 'middle';
  const widths = parts.map((s) => ctx.measureText(s).width);
  const total = widths.reduce((a, b) => a + b, 0);
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  const enterEnd = start + dur + stagger * (parts.length - 1);
  const exitStart = enterEnd + hold;
  const fx = PRESETS[preset] || PRESETS.fadeUp, xfx = exit ? PRESETS[exit] || PRESETS.fadeDown : null;
  for (let i = 0; i < parts.length; i++) {
    const s = parts[i], w = widths[i];
    if (!s.trim()) { cx += w; continue; }
    let p = clamp((t - start - i * stagger) / dur);
    let f = fx(p, i, t);
    if (xfx && t >= exitStart) {
      const q = clamp((t - exitStart - (parts.length - 1 - i) * stagger) / dur);
      const g = xfx(1 - q, i, t); f = { ...f, a: Math.min(f.a ?? 1, g.a ?? 1), dx: (f.dx || 0) + (g.dx || 0), dy: (f.dy || 0) + (g.dy || 0), blur: g.blur || f.blur };
    }
    if (preset === 'typewriter' && p <= 0) { cx += w; continue; }
    const a = f.a ?? 1;
    if (a <= 0.001 && !f.box) { cx += w; continue; }
    const ux = cx + w / 2 + (f.dx || 0) * size + (f.spread || 0) * (i - parts.length / 2) * size * 0.6;
    const uy = y + (f.dy || 0) * size;
    ctx.save();
    if (f.mask) { ctx.beginPath(); ctx.rect(cx - size, y - size * 0.75, w + size * 2, size * 1.3); ctx.clip(); }
    // decorations behind
    if (f.marker) { ctx.fillStyle = accent; ctx.globalAlpha = 0.85; ctx.fillRect(cx - 4, y - size * 0.32, (w + 8) * f.marker, size * 0.64); }
    if (f.box !== undefined) {
      ctx.fillStyle = accent; const bw = (w + 10) * f.box;
      ctx.fillRect(f.boxSide === 'grow' ? cx - 5 : cx - 5 + (w + 10) - bw, y - size * 0.5, bw, size);
    }
    ctx.translate(ux, uy); ctx.rotate(f.rot || 0); ctx.scale(f.sx ?? 1, f.sy ?? 1);
    ctx.globalAlpha = a;
    if (f.blur) ctx.filter = `blur(${f.blur.toFixed(1)}px)`;
    if (shadow) { ctx.shadowColor = shadow; ctx.shadowBlur = size * 0.25; ctx.shadowOffsetY = size * 0.06; }
    if (f.neon) { ctx.shadowColor = accent; ctx.shadowBlur = size * 0.5; }
    ctx.textAlign = 'center';
    if (stroke && strokeW) { ctx.lineJoin = 'round'; ctx.strokeStyle = stroke; ctx.lineWidth = strokeW; ctx.strokeText(s, 0, 0); }
    if (f.rgb) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = '#ff0040'; ctx.fillText(s, -f.rgb * size, 0); ctx.fillStyle = '#00e5ff'; ctx.fillText(s, f.rgb * size, 0);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.fillStyle = f.neon ? '#ffffff' : color; ctx.fillText(s, 0, 0);
    if (f.fill !== undefined && f.fill > 0) {                       // karaoke: accent colour wipes left→right
      ctx.save(); ctx.beginPath(); ctx.rect(-w / 2, -size, w * f.fill, size * 2); ctx.clip(); ctx.fillStyle = accent; ctx.fillText(s, 0, 0); ctx.restore();
    }
    ctx.restore();
    if (f.underline) { ctx.fillStyle = accent; ctx.fillRect(cx, y + size * 0.45, w * f.underline, Math.max(3, size * 0.07)); }
    if (f.cursor && i === parts.length - 1) { ctx.fillStyle = color; ctx.fillRect(cx + w + 4, y - size * 0.4, Math.max(3, size * 0.06), size * 0.8); }
    cx += w;
  }
  ctx.restore();
  return (exitStart - start) + (xfx ? dur + stagger * (parts.length - 1) : 0);
}
