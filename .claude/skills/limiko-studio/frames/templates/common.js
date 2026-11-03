// Shared pieces for data-driven templates: themes per format, moving backgrounds, language-aware fonts.
// Every template obeys the studio rules: the camera always moves (slow drift + breathing zoom), and text works in
// English and Telugu (props.lang = 'en' | 'te').

export const THEMES = {
  kids:     { bg: ['#fff4d6', '#ffd6e7'], ink: '#2b2d42', accent: '#ff6b6b', accent2: '#4ecdc4', card: '#ffffff', shapes: 'blobs',  enter: 'popBounce', exit: 'fadeDown', weight: 900, pace: 1.25 },
  facts:    { bg: ['#0f1b2d', '#16325c'], ink: '#f4f7fb', accent: '#ffd23f', accent2: '#5cc8ff', card: '#1c2e4a', shapes: 'grid',   enter: 'maskRise',  exit: 'fadeUp',   weight: 800, pace: 1.0 },
  history:  { bg: ['#2a1d12', '#5a3a1e'], ink: '#f6e7c8', accent: '#e0a84f', accent2: '#b5543b', card: '#3b2817', shapes: 'dust',   enter: 'blurIn',    exit: 'fade',     weight: 700, pace: 1.15, serif: true },
  gaming:   { bg: ['#0b0614', '#2b0f4a'], ink: '#ffffff', accent: '#ffb347', accent2: '#b14cff', card: '#1a0f2e', shapes: 'streaks',enter: 'stamp',     exit: 'glitch',   weight: 900, pace: 0.8 },
  business: { bg: ['#f6f8fb', '#e3e9f2'], ink: '#0f172a', accent: '#2563eb', accent2: '#10b981', card: '#ffffff', shapes: 'grid',   enter: 'fadeUp',    exit: 'fade',     weight: 800, pace: 1.0 },
  mystery:  { bg: ['#05070a', '#141b24'], ink: '#d9e2ec', accent: '#9bd1ff', accent2: '#c0392b', card: '#0e141b', shapes: 'dust',   enter: 'typewriter',exit: 'fade',     weight: 700, pace: 1.3 },
};

export const theme = (p) => ({ ...THEMES[p.theme] || THEMES.facts, ...(p.colors || {}) });

export function font(p, th, { serif = th.serif } = {}) {
  if (p.lang === 'te') return serif ? '"Noto Serif Telugu", "Noto Sans Telugu", serif' : '"Noto Sans Telugu", Inter, sans-serif';
  return serif ? '"DejaVu Serif", Georgia, serif' : 'Inter, "DejaVu Sans", sans-serif';
}

// a gentle always-moving camera: drift + breathing zoom (directing.md §0)
export function drift(t, W, H, amount = 1) {
  return { x: W / 2 + Math.sin(t * 0.21) * 14 * amount, y: H / 2 + Math.cos(t * 0.17) * 9 * amount, zoom: 1.03 + Math.sin(t * 0.35) * 0.015 * amount, rot: Math.sin(t * 0.13) * 0.004 * amount };
}

// background with depth layers that move under the camera
export function background(ctx, W, H, t, th, T, L) {
  const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, th.bg[0]); g.addColorStop(1, th.bg[1]);
  ctx.fillStyle = g; ctx.fillRect(-W, -H, W * 3, H * 3);
  const r = L.rng(7);
  ctx.save();
  if (th.shapes === 'blobs') {
    for (let i = 0; i < 9; i++) {
      const x = r() * W, y = r() * H, s = 40 + r() * 120, c = i % 2 ? th.accent : th.accent2;
      ctx.fillStyle = L.rgba(c, 0.16); ctx.beginPath();
      ctx.arc(x + Math.sin(t * 0.4 + i) * 20, y + Math.cos(t * 0.33 + i) * 16, s, 0, L.TAU); ctx.fill();
    }
  } else if (th.shapes === 'grid') {
    ctx.strokeStyle = L.rgba(th.accent2, 0.09); ctx.lineWidth = 1;
    const step = Math.round(Math.min(W, H) / 12), off = (t * 12) % step;
    for (let x = -step + off; x < W + step; x += step) { ctx.beginPath(); ctx.moveTo(x, -H); ctx.lineTo(x, H * 2); ctx.stroke(); }
    for (let y = -step + off * 0.6; y < H + step; y += step) { ctx.beginPath(); ctx.moveTo(-W, y); ctx.lineTo(W * 2, y); ctx.stroke(); }
  } else if (th.shapes === 'streaks') {
    for (let i = 0; i < 26; i++) {
      const y = r() * H, len = 120 + r() * 380, sp = 300 + r() * 600, x = ((r() * W + t * sp) % (W + len)) - len;
      ctx.strokeStyle = L.rgba(i % 3 ? th.accent2 : th.accent, 0.22); ctx.lineWidth = 2 + r() * 3;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y - len * 0.18); ctx.stroke();
    }
  } else { // dust motes drifting in light
    const lg = ctx.createRadialGradient(W * 0.7, H * 0.1, 0, W * 0.7, H * 0.1, W * 0.8);
    lg.addColorStop(0, L.rgba(th.accent, 0.22)); lg.addColorStop(1, L.rgba(th.accent, 0)); ctx.fillStyle = lg; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 70; i++) {
      const x = (r() * W + Math.sin(t * 0.2 + i) * 30 + t * 6) % W, y = (r() * H - t * (4 + r() * 8) + H * 4) % H;
      ctx.fillStyle = L.rgba(th.ink, 0.08 + r() * 0.18); ctx.beginPath(); ctx.arc(x, y, 0.8 + r() * 2.2, 0, L.TAU); ctx.fill();
    }
  }
  ctx.restore();
}

export function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }

// wrap text to a width (word-based; Telugu words are kept whole)
export function wrap(ctx, text, maxW) {
  const words = String(text).split(/\s+/), lines = []; let cur = '';
  for (const w of words) { const s = cur ? cur + ' ' + w : w; if (ctx.measureText(s).width > maxW && cur) { lines.push(cur); cur = w; } else cur = s; }
  if (cur) lines.push(cur); return lines;
}

export const scale = (W, H) => Math.min(W, H) / 720;   // 1 at 1280×720 and at 720×1280
