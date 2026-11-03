// What happens to an ant nest in heavy rain · facts Short (02), vertical 1080×1920, driven by the voice cues.
// Shots: nest cross-section (strike, gap, seal, carry, flood) · flash-forward raft (promise) · ants linking ·
// raft forming with a timer · macro hairs trapping air · raft cross-section (queen in the middle) · drifting days ·
// landing and a new nest · outro. Every shot has camera motion; cuts get a short flash + zoom punch (facts effect level 2).
import { drawText } from '../../.claude/skills/limiko-studio/frames/textfx.js';

const SURF = 600;                       // ground level in the nest world
const SOIL = ['#5b3d24', '#4a3020', '#3a2518', '#2c1c12'];
const ANT = '#3a1d10', ANT_HI = '#7a3b1e';

export default {
  dim: '2d', fps: 30, width: 1080, height: 1920,
  defaultProps: { lang: 'en', voice: '/films/ant-nest-rain/out/voice-en', draft: false },
  async setup({ W, H, L, props }) {
    const tl = await (await fetch(`${props.voice}/timeline.json`)).json();
    const r = L.rng(42);
    const mk = (fn) => { const c = document.createElement('canvas'); c.width = W; c.height = H; fn(c.getContext('2d')); return c; };

    // ---- nest layout (world = 1080×1920) -------------------------------------------------------
    const shaft = [[540, SURF], [522, 760], [560, 900], [502, 1050], [540, 1200], [520, 1380], [560, 1560], [540, 1720]];
    const chambers = [
      { x: 770, y: 830, rx: 115, ry: 52, via: [[556, 880], [680, 835]] },
      { x: 310, y: 1010, rx: 125, ry: 56, via: [[508, 1035], [410, 1015]] },
      { x: 790, y: 1265, rx: 120, ry: 54, via: [[534, 1240], [690, 1262]] },
      { x: 320, y: 1525, rx: 150, ry: 66, via: [[548, 1505], [440, 1520]] },   // queen
      { x: 770, y: 1690, rx: 135, ry: 58, via: [[545, 1700], [650, 1694]] },   // nursery
    ];
    const tunnelShape = (c, color, extra = 0) => {
      c.strokeStyle = color; c.fillStyle = color; c.lineCap = 'round'; c.lineJoin = 'round';
      c.lineWidth = 38 + extra; c.beginPath(); shaft.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke();
      c.lineWidth = 30 + extra;
      for (const ch of chambers) {
        c.beginPath(); const pts = [shaft.reduce((a, b) => (Math.abs(b[1] - ch.via[0][1]) < Math.abs(a[1] - ch.via[0][1]) ? b : a)), ...ch.via, [ch.x, ch.y]];
        pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke();
        c.beginPath(); c.ellipse(ch.x, ch.y, ch.rx + extra / 2, ch.ry + extra / 2, 0, 0, L.TAU); c.fill();
      }
    };
    const soil = mk((c) => {
      const g = c.createLinearGradient(0, SURF, 0, H); SOIL.forEach((s, i) => g.addColorStop(i / (SOIL.length - 1), s));
      c.fillStyle = g; c.fillRect(0, SURF, W, H - SURF);
      for (let i = 0; i < 2600; i++) { const y = SURF + r() * (H - SURF); c.fillStyle = L.rgba(r() > 0.5 ? '#8a6040' : '#20140c', 0.25 + r() * 0.35); c.beginPath(); c.arc(r() * W, y, 1 + r() * 4, 0, L.TAU); c.fill(); }
      for (let i = 0; i < 40; i++) { c.fillStyle = L.rgba('#9a8a78', 0.5); c.beginPath(); c.ellipse(r() * W, SURF + 60 + r() * (H - SURF - 60), 8 + r() * 22, 6 + r() * 14, r() * 3, 0, L.TAU); c.fill(); }
      // roots
      c.strokeStyle = L.rgba('#6b4a2a', 0.8); c.lineCap = 'round';
      for (let i = 0; i < 9; i++) { let x = 60 + r() * 960, y = SURF; c.lineWidth = 5; c.beginPath(); c.moveTo(x, y); for (let k = 0; k < 7; k++) { x += (r() - 0.5) * 60; y += 30 + r() * 40; c.lineTo(x, y); c.lineWidth *= 0.8; } c.stroke(); }
      tunnelShape(c, '#1f130b', 10); tunnelShape(c, '#2b1a10');
    });
    const mask = mk((c) => tunnelShape(c, '#ffffff', 2));
    const water = mk(() => {});
    const grass = Array.from({ length: 90 }, () => ({ x: r() * W, h: 18 + r() * 40, ph: r() * 6 }));
    const drops = Array.from({ length: 260 }, () => ({ x: r() * W, ph: r(), sp: 1400 + r() * 700, len: 30 + r() * 40 }));

    // ants walking the tunnels: a point list per route
    const route = (pts) => { const seg = []; let len = 0; for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push([pts[i - 1], pts[i], l]); len += l; } return { seg, len }; };
    const at = (R, s) => { s = ((s % R.len) + R.len) % R.len; for (const [a, b, l] of R.seg) { if (s <= l) { const u = s / l; return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, Math.atan2(b[1] - a[1], b[0] - a[0])]; } s -= l; } const [a, b] = R.seg[R.seg.length - 1]; return [b[0], b[1], Math.atan2(b[1] - a[1], b[0] - a[0])]; };
    const main = route(shaft);
    const branch = chambers.map((ch) => route([...ch.via, [ch.x, ch.y]]));
    const walkers = Array.from({ length: 34 }, (_, i) => ({ R: i % 3 ? main : branch[i % 5], ph: r() * 2000, sp: (r() > 0.5 ? 1 : -1) * (40 + r() * 50) }));
    const carriers = Array.from({ length: 16 }, () => ({ ph: r() * main.len, sp: 120 + r() * 60 }));
    const eggs = Array.from({ length: 34 }, () => ({ x: (r() - 0.5) * 200, y: (r() - 0.5) * 60, a: r() * 3 }));

    // raft ants (side view on the flood surface)
    const raftAnts = Array.from({ length: 700 }, () => {
      const u = Math.sqrt(r()), a = r() * L.TAU;
      return { sx: r() * W, sy: 1040 + r() * 380, tx: 540 + Math.cos(a) * u * 360, ty: 1010 + Math.sin(a) * u * 34, d: r() * 0.45, s: 5 + r() * 3, a: r() * 6 };
    });
    // linking grid
    const grid = []; for (let row = 0; row < 6; row++) for (let col = 0; col < 9; col++) grid.push({ x: 120 + col * 105 + (row % 2) * 52, y: 820 + row * 62, i: grid.length, sx: (r() - 0.5) * 1400 + 540, sy: 1500 + r() * 300 });
    const bubbles = Array.from({ length: 40 }, () => ({ x: r(), y: r(), s: 4 + r() * 14, sp: 30 + r() * 60 }));
    return { tl, cues: tl.cues, duration: tl.duration + 1.4, audio: `${props.voice}/voice.m4a`, soil, mask, water, grass, drops, main, branch, walkers, carriers, eggs, at, chambers, raftAnts, grid, bubbles };
  },

  draw(ctx, W, H, L, T, t, S) {
    const c = (k) => S.tl.cues[k] ?? 1e9;
    const I = T.interpolate, E = { ease: 'inOut' };
    const drift = (amt = 1) => ({ dx: Math.sin(t * 0.31) * 10 * amt, dy: Math.cos(t * 0.23) * 8 * amt, rot: Math.sin(t * 0.17) * 0.006 * amt });

    // ---- which shot ---------------------------------------------------------------------------------
    const cuts = [[0, 'nest'], [c('promise') + 0.25, 'glimpse'], [c('seal') - 0.1, 'nest'], [c('link'), 'link'], [c('raft'), 'raft'],
      [c('hairs'), 'hairs'], [c('queen'), 'section'], [c('drift'), 'drift'], [c('land'), 'land'], [c('outro'), 'outro']];
    let shot = cuts[0][1], cutAt = 0;
    for (const [ct, nm] of cuts) if (t >= ct) { shot = nm; cutAt = ct; }
    const since = t - cutAt, punch = 1 + 0.07 * Math.exp(-since * 10);

    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    ({ nest, glimpse, link, raft, hairs, section, drift: driftShot, land, outro })[shot === 'drift' ? 'drift' : shot](ctx, W, H, L, T, t, S, c, I, E, drift, punch, since);

    // flash on cuts (not at t=0)
    if (cutAt > 0 && since < 0.14) { ctx.fillStyle = `rgba(255,255,255,${0.55 * (1 - since / 0.14)})`; ctx.fillRect(0, 0, W, H); }
    captions(ctx, W, H, L, t, S);
    if (S.props.draft) { ctx.font = '900 30px Inter'; ctx.fillStyle = 'rgba(255,70,70,0.9)'; ctx.textAlign = 'left'; ctx.fillText('DRAFT', 30, 50); }
  },
};

// ======================================================================================== drawing helpers
function ant(ctx, L, x, y, s, a, t, { color = ANT, carry = false, queen = false } = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(a); const k = s / 10;
  if (s < 6) { ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(0, 0, 1.6 * s, 0.7 * s, 0, 0, L.TAU); ctx.fill(); ctx.restore(); return; }
  const w = Math.sin(t * 22 + x * 0.1) * 0.5;
  ctx.strokeStyle = color; ctx.lineWidth = Math.max(1, 1.3 * k); ctx.lineCap = 'round';
  for (let i = -1; i <= 1; i++) for (const sd of [-1, 1]) { const sw = (i % 2 === 0 ? w : -w) * sd; ctx.beginPath(); ctx.moveTo(i * 3 * k, 0); ctx.lineTo((i * 5 + sw * 4) * k, sd * 7 * k); ctx.lineTo((i * 7 + sw * 6) * k, sd * 11 * k); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(9 * k, -1 * k); ctx.quadraticCurveTo(15 * k, -6 * k, 18 * k, -5 * k); ctx.moveTo(9 * k, 1 * k); ctx.quadraticCurveTo(15 * k, 6 * k, 18 * k, 5 * k); ctx.stroke();
  const qs = queen ? 1.6 : 1;
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.ellipse(-9 * k * qs, 0, 6.5 * k * qs, 4.6 * k * qs, 0, 0, L.TAU); ctx.fill();   // gaster
  ctx.beginPath(); ctx.ellipse(0, 0, 4 * k, 2.6 * k, 0, 0, L.TAU); ctx.fill();                      // thorax
  ctx.beginPath(); ctx.ellipse(7.5 * k, 0, 3.4 * k, 3 * k, 0, 0, L.TAU); ctx.fill();                // head
  ctx.fillStyle = L.rgba(ANT_HI, 0.6); ctx.beginPath(); ctx.ellipse(-10 * k * qs, -1.8 * k * qs, 3 * k * qs, 1.4 * k * qs, 0, 0, L.TAU); ctx.fill();
  if (carry) { ctx.fillStyle = '#fbf6ea'; ctx.beginPath(); ctx.ellipse(13 * k, 0, 4.2 * k, 2.8 * k, 0.3, 0, L.TAU); ctx.fill(); }
  ctx.restore();
}

function cam(ctx, W, H, T, o, d, punch, draw) { T.camera(ctx, W, H, { x: o.x + d.dx, y: o.y + d.dy, zoom: o.zoom * punch, rot: d.rot }, draw); }

function rain(ctx, W, L, t, S, top, bottom, alpha = 1) {
  ctx.strokeStyle = `rgba(200,220,255,${0.45 * alpha})`; ctx.lineWidth = 3; ctx.lineCap = 'round';
  for (const d of S.drops) { const y = top + ((t * d.sp + d.ph * 3000) % (bottom - top + 200)) - 100; if (y > bottom) continue; ctx.beginPath(); ctx.moveTo(d.x + 6, y); ctx.lineTo(d.x, y + d.len); ctx.stroke(); }
}

function sky(ctx, W, top, bottom, a = '#1d2633', b = '#3b4a5c') { const g = ctx.createLinearGradient(0, top, 0, bottom); g.addColorStop(0, a); g.addColorStop(1, b); ctx.fillStyle = g; ctx.fillRect(-200, top, W + 400, bottom - top); }

function label(ctx, text, x, y, t, start, size = 58, color = '#ffd23f', hold = 99) {
  drawText(ctx, text, { x, y, t, start, preset: 'popBounce', size, font: 'Inter, sans-serif', weight: 900, color, stroke: '#000', strokeW: 10, unit: 'word', stagger: 0.05, dur: 0.4, hold });
}

// ============================================================================================ shots
function nest(ctx, W, H, L, T, t, S, c, I, E, drift, punch) {
  // camera path across the cross-section
  const keys = [
    [0, 540, 960, 0.98], [c('gap') - 0.2, 540, 1040, 1.12], [c('gap') + 0.4, 420, 1480, 1.55], [c('promise'), 400, 1500, 1.7],
    [c('seal') - 0.1, 540, 650, 2.5], [c('carry') - 0.2, 540, 640, 2.75], [c('carry') + 0.3, 600, 1450, 1.2], [c('carry') + 2.6, 600, 1300, 1.2], [c('flood') - 0.3, 600, 900, 1.15],
    [c('flood') + 0.4, 540, 1100, 1.0], [c('link'), 540, 1050, 0.92],
  ];
  const ts = keys.map((k) => k[0]);
  const o = { x: I(t, ts, keys.map((k) => k[1]), E), y: I(t, ts, keys.map((k) => k[2]), E), zoom: I(t, ts, keys.map((k) => k[3]), E) };
  cam(ctx, W, H, T, o, drift(), punch, () => {
    sky(ctx, W, -600, SURF);
    const flash = Math.max(0, 1 - Math.abs(t - 0.35) / 0.12) + Math.max(0, 1 - Math.abs(t - (c('flood') + 0.1)) / 0.12);
    if (flash > 0) { ctx.fillStyle = `rgba(230,240,255,${0.7 * flash})`; ctx.fillRect(-200, -600, W + 400, SURF + 600); }
    ctx.fillStyle = '#2c1c12'; ctx.fillRect(-600, SURF, W + 1200, H + 1200 - SURF);   // soil beyond the frame edges
    ctx.fillStyle = '#4a3020'; ctx.fillRect(-600, SURF, 600, H - SURF); ctx.fillRect(W, SURF, 600, H - SURF);
    ctx.drawImage(S.soil, 0, 0);
    // grass line
    ctx.strokeStyle = '#3f6b2e'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    for (const g of S.grass) { ctx.beginPath(); ctx.moveTo(g.x, SURF); ctx.quadraticCurveTo(g.x + Math.sin(t * 3 + g.ph) * 10, SURF - g.h / 2, g.x + Math.sin(t * 3 + g.ph) * 16, SURF - g.h); ctx.stroke(); }
    ctx.fillStyle = '#4b7a34'; ctx.fillRect(0, SURF - 6, W, 10);
    // mound around the entrance
    ctx.fillStyle = '#6b4a2c'; ctx.beginPath(); ctx.ellipse(540, SURF, 120, 34, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#1f130b'; ctx.beginPath(); ctx.ellipse(540, SURF - 4, 22, 9, 0, 0, L.TAU); ctx.fill();

    // water: rain seeping in from the top, the water table rising, then the full flood
    const seep = I(t, [0.2, c('seal')], [SURF, 760]);
    const rise = I(t, [c('carry'), c('carry') + 1.2, c('flood')], [H + 10, 1700, 1260], E);
    const flood = I(t, [c('flood') + 0.3, c('link') - 0.4], [rise, SURF - 120], { ease: 'in' });
    const level = Math.min(rise, flood);
    const wc = S.water.getContext('2d');
    // paint all the water, then keep only what is inside the tunnels (one mask pass)
    wc.globalCompositeOperation = 'source-over'; wc.clearRect(0, 0, W, H);
    const wg = wc.createLinearGradient(0, level, 0, H); wg.addColorStop(0, 'rgba(70,150,230,0.9)'); wg.addColorStop(1, 'rgba(20,70,150,0.95)');
    wc.fillStyle = wg; wc.fillRect(0, level, W, H - level);
    wc.fillStyle = 'rgba(90,160,230,0.8)'; wc.fillRect(0, SURF - 10, W, seep - SURF + 10);
    wc.strokeStyle = 'rgba(210,235,255,0.9)'; wc.lineWidth = 5; wc.beginPath(); wc.moveTo(0, level); wc.lineTo(W, level); wc.stroke();
    wc.globalCompositeOperation = 'destination-in'; wc.drawImage(S.mask, 0, 0); wc.globalCompositeOperation = 'source-over';
    ctx.drawImage(S.water, 0, 0);
    if (flood < SURF + 20) { // the surface itself goes under
      ctx.fillStyle = 'rgba(60,130,200,0.55)'; ctx.fillRect(-200, flood, W + 400, H - flood + 200);
      ctx.strokeStyle = 'rgba(220,240,255,0.8)'; ctx.lineWidth = 6; ctx.beginPath();
      for (let x = -200; x <= W + 200; x += 20) ctx.lineTo(x, flood + Math.sin(x * 0.02 + t * 4) * 8); ctx.stroke();
    }
    // the seal: soil pellets fill the entrance
    const n = Math.floor(I(t, [c('seal') + 0.4, c('carry') - 0.3], [0, 7]));
    const pel = [[-12, -2], [10, -3], [0, -8], [-6, 4], [8, 4], [-14, -9], [14, -9]];
    ctx.fillStyle = '#7a5434';
    for (let i = 0; i < n; i++) { ctx.beginPath(); ctx.arc(540 + pel[i][0], SURF + pel[i][1], 7, 0, L.TAU); ctx.fill(); }
    if (t > c('seal') && t < c('carry')) {
      const p = ((t - c('seal')) * 0.9) % 1, y = 700 - p * 90;
      ant(ctx, L, 535, y, 16, -Math.PI / 2, t); ctx.fillStyle = '#7a5434'; ctx.beginPath(); ctx.arc(535, y - 26, 8, 0, L.TAU); ctx.fill();
    }
    // chambers: queen and the nursery
    const qc = S.chambers[3];
    if (level > qc.y - 20) ant(ctx, L, qc.x - 10, qc.y + 12, 24, 0.1, t * 0.3, { queen: true });
    const nur = S.chambers[4], left = Math.round(I(t, [c('carry'), c('flood') - 0.5], [S.eggs.length, 0]));
    ctx.fillStyle = '#fbf6ea';
    S.eggs.slice(0, left).forEach((e) => { ctx.beginPath(); ctx.ellipse(nur.x + e.x * 0.9, nur.y + 18 + e.y * 0.5, 9, 6, e.a, 0, L.TAU); ctx.fill(); });
    const up = S.chambers[0];
    S.eggs.slice(left).forEach((e) => { ctx.beginPath(); ctx.ellipse(up.x + e.x * 0.8, up.y + 16 + e.y * 0.45, 8, 5.5, e.a, 0, L.TAU); ctx.fill(); });
    // walkers, and the carriers during "carry"
    for (const w of S.walkers) { const [x, y, a] = S.at(w.R, w.ph + t * w.sp); if (y < level - 10) ant(ctx, L, x, y, 11, a + (w.sp < 0 ? Math.PI : 0), t); }
    if (t > c('carry') && t < c('flood') + 1) for (const k of S.carriers) {
      const s = S.main.len - ((k.ph + (t - c('carry')) * k.sp) % S.main.len); const [x, y, a] = S.at(S.main, s);
      if (y < level - 10) ant(ctx, L, x, y, 13, a + Math.PI, t, { carry: true });
    }
    if (t < c('promise')) rain(ctx, W, L, t, S, -600, SURF);
    else if (t > c('seal') - 0.2) rain(ctx, W, L, t, S, -600, Math.min(SURF, flood));
  });
  // on-screen numbers for the gap
  if (t > c('gap') && t < c('promise') + 0.2) label(ctx, '100,000 ANTS', W / 2, H * 0.3, t, c('gap') + 0.35, 92);
  if (t > c('carry') + 0.5 && t < c('flood')) label(ctx, 'EGGS GO UP', W / 2, H * 0.3, t, c('carry') + 0.6, 76, '#ffffff');
  if (t > c('flood') + 0.3) label(ctx, 'FLOOD', W / 2, H * 0.3, t, c('flood') + 0.4, 110, '#5cc8ff');
}

function waterScene(ctx, W, L, t, line, top = -600) {
  sky(ctx, W, top, line, '#4a5868', '#8796a6');
  const g = ctx.createLinearGradient(0, line, 0, 2400); g.addColorStop(0, '#3f7fb5'); g.addColorStop(1, '#0f2e52');
  ctx.fillStyle = g; ctx.fillRect(-300, line, W + 600, 2600);
  ctx.strokeStyle = 'rgba(230,245,255,0.7)'; ctx.lineWidth = 5; ctx.beginPath();
  for (let x = -300; x <= W + 300; x += 18) ctx.lineTo(x, line + Math.sin(x * 0.018 + t * 2.2) * 7 + Math.sin(x * 0.05 - t * 3) * 3); ctx.stroke();
}

function raftForming(ctx, W, L, t, S, pr) {
  // grass tips poking out of the flood
  ctx.strokeStyle = '#4b7a34'; ctx.lineWidth = 6;
  for (let i = 0; i < 14; i++) { const x = 40 + i * 76; ctx.beginPath(); ctx.moveTo(x, 1030); ctx.quadraticCurveTo(x + 8, 990, x + Math.sin(t + i) * 10, 960); ctx.stroke(); }
  ctx.fillStyle = L.rgba('#3a1d10', 0.85 * Math.min(1, pr * 1.4)); ctx.beginPath(); ctx.ellipse(540, 1012, 380 * Math.min(1, 0.3 + pr), 40, 0, 0, L.TAU); ctx.fill();
  for (const a of S.raftAnts) {
    const p = Math.max(0, Math.min(1, (pr - a.d) / 0.5)), e = 1 - Math.pow(1 - p, 3);
    const x = a.sx + (a.tx - a.sx) * e, y = a.sy + (a.ty - a.sy) * e + (1 - e) * Math.sin(t * 3 + a.a) * 10;
    ant(ctx, L, x, y, a.s, a.a + t * (1 - e), t);
  }
}

function glimpse(ctx, W, H, L, T, t, S, c, I, E, drift, punch, since) {
  const pr = I(since, [0, c('seal') - c('promise') - 0.4], [0.2, 1]);
  cam(ctx, W, H, T, { x: 540, y: 1000, zoom: 1.25 - 0.1 * pr }, drift(), punch, () => { waterScene(ctx, W, L, t, 1000); raftForming(ctx, W, L, t, S, pr); rain(ctx, W, L, t, S, -600, 1000, 0.6); });
  ctx.fillStyle = 'rgba(255,200,80,0.12)'; ctx.fillRect(0, 0, W, H);      // warm "flash-forward" tint
  label(ctx, '2 MINUTES', W / 2, H * 0.3, t, c('promise') + 0.5, 100);
}

function link(ctx, W, H, L, T, t, S, c, I, E, drift, punch, since) {
  const dur = c('raft') - c('link');
  cam(ctx, W, H, T, { x: 540, y: 960, zoom: I(since, [0, dur], [1.6, 1.0], E) }, drift(), punch, () => {
    waterScene(ctx, W, L, t, 800);
    for (const g of S.grid) {
      const st = g.i * (dur * 0.7 / S.grid.length), p = Math.max(0, Math.min(1, (since - st) / 0.6)), e = 1 - Math.pow(1 - p, 3);
      if (p <= 0) continue;
      const x = g.sx + (g.x - g.sx) * e, y = g.sy + (g.y - g.sy) * e;
      ant(ctx, L, x, y, 26, (1 - e) * 1.2 + (g.i % 2 ? Math.PI : 0) * 0 + 0.0, t);
      if (p >= 1) { // jaws-to-legs grips: small bright links to the neighbours
        ctx.strokeStyle = 'rgba(255,210,63,0.9)'; ctx.lineWidth = 4;
        const nb = S.grid[g.i + 1]; if (nb && Math.abs(nb.y - g.y) < 1 && since > st + 0.7 + 0.05) { ctx.beginPath(); ctx.moveTo(x + 45, y); ctx.lineTo(nb.x - 35, nb.y); ctx.stroke(); }
      }
    }
  });
  label(ctx, 'JAWS → LEGS', W / 2, H * 0.3, t, c('link') + 0.8, 84);
}

function raft(ctx, W, H, L, T, t, S, c, I, E, drift, punch, since) {
  const dur = c('hairs') - c('raft'), pr = I(since, [0, dur - 0.5], [0, 1]);
  cam(ctx, W, H, T, { x: 540, y: I(since, [0, dur], [1080, 1010]), zoom: I(since, [0, dur], [1.0, 1.18], E) }, drift(), punch, () => { waterScene(ctx, W, L, t, 1000); raftForming(ctx, W, L, t, S, pr); });
  // timer
  const sec = Math.round(I(since, [0, dur - 0.5], [0, 100]));
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.beginPath(); ctx.roundRect(W / 2 - 170, H * 0.24, 340, 120, 30); ctx.fill();
  ctx.fillStyle = '#ffd23f'; ctx.font = '900 84px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(`${sec} s`, W / 2, H * 0.24 + 62);
}

function hairs(ctx, W, H, L, T, t, S, c, I, E, drift, punch, since) {
  const dur = c('queen') - c('hairs');
  cam(ctx, W, H, T, { x: 540, y: 960, zoom: I(since, [0, dur], [1.0, 1.15], E) }, drift(0.6), punch, () => {
    waterScene(ctx, W, L, t, 760);
    // macro ant body, half under water, with hairs and a silver air layer
    ctx.save(); ctx.translate(540, 860);
    const air = 0.6 + 0.4 * Math.sin(t * 4);
    ctx.strokeStyle = `rgba(235,250,255,${0.85})`; ctx.lineWidth = 16; ctx.beginPath(); ctx.ellipse(-80, 40, 300, 175, 0, 0.05, Math.PI - 0.05); ctx.stroke();
    ctx.fillStyle = '#3a1d10'; ctx.beginPath(); ctx.ellipse(-80, 20, 280, 160, 0, 0, L.TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(260, 0, 110, 80, 0, 0, L.TAU); ctx.fill();
    ctx.fillStyle = 'rgba(160,80,40,0.5)'; ctx.beginPath(); ctx.ellipse(-120, -40, 150, 50, -0.1, 0, L.TAU); ctx.fill();
    ctx.strokeStyle = '#6b3a20'; ctx.lineWidth = 3;
    for (let i = 0; i < 70; i++) { const a = Math.PI * 0.05 + (i / 70) * Math.PI * 1.9, x = -80 + Math.cos(a) * 280, y = 20 + Math.sin(a) * 160; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * 34, y + Math.sin(a) * 34 + Math.sin(t * 2 + i) * 3); ctx.stroke(); }
    // shimmering air film below the waterline
    ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(150,220,255,${0.35 * air})`; ctx.lineWidth = 34;
    ctx.beginPath(); ctx.ellipse(-80, 40, 318, 192, 0, 0.15, Math.PI - 0.15); ctx.stroke(); ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
    ctx.fillStyle = 'rgba(230,248,255,0.7)';
    for (const b of S.bubbles) { const y = 1900 - ((t * b.sp + b.y * 1200) % 1100); ctx.beginPath(); ctx.arc(b.x * W, y, b.s, 0, L.TAU); ctx.fill(); }
  });
  label(ctx, 'TRAPPED AIR', W / 2, H * 0.3, t, c('hairs') + 0.9, 92, '#bfe8ff');
}

function section(ctx, W, H, L, T, t, S, c, I, E, drift, punch, since) {
  const dur = c('drift') - c('queen');
  cam(ctx, W, H, T, { x: I(since, [0, dur], [500, 580]), y: 960, zoom: I(since, [0, dur], [1.1, 1.25], E) }, drift(), punch, () => {
    waterScene(ctx, W, L, t, 900);
    // raft layers: bottom ants under the line with bubbles, top layers, a dry middle with the young and the queen
    const bob = Math.sin(t * 1.6) * 6;
    ctx.save(); ctx.translate(0, bob);
    for (let row = 0; row < 4; row++) for (let i = 0; i < 18; i++) { const x = 120 + i * 48 + (row % 2) * 24, y = 950 - row * 30; ant(ctx, L, x, y, 12, (i + row) % 2 ? 0 : Math.PI, t * 0.2); }
    ctx.fillStyle = 'rgba(230,248,255,0.8)'; for (let i = 0; i < 26; i++) { ctx.beginPath(); ctx.arc(120 + i * 32, 975 + (i % 3) * 6, 5, 0, L.TAU); ctx.fill(); }
    ctx.fillStyle = '#fbf6ea'; for (let i = 0; i < 16; i++) { ctx.beginPath(); ctx.ellipse(440 + (i % 8) * 26, 832 - Math.floor(i / 8) * 18, 11, 7, 0.3, 0, L.TAU); ctx.fill(); }
    ant(ctx, L, 640, 826, 26, 0.05, t * 0.2, { queen: true });
    ctx.restore();
  });
  label(ctx, 'QUEEN + YOUNG', W / 2, H * 0.3, t, c('queen') + 0.5, 84);
  label(ctx, 'DRY IN THE MIDDLE', W / 2, H * 0.3 + 110, t, c('queen') + 1.0, 64, '#ffffff');
}

function driftShot(ctx, W, H, L, T, t, S, c, I, E, drift, punch, since) {
  const dur = c('land') - c('drift'), p = since / dur;
  const day = 0.5 + 0.5 * Math.cos(p * Math.PI * 2 * 3);   // three day/night cycles
  cam(ctx, W, H, T, { x: 540, y: 980, zoom: I(since, [0, dur], [1.05, 0.95]) }, drift(), punch, () => {
    sky(ctx, W, -600, 1000, L.mixHex('#0b1020', '#5ea0d8', day), L.mixHex('#1a2238', '#bcd9ee', day));
    const sa = p * Math.PI * 6; ctx.fillStyle = day > 0.5 ? '#ffd23f' : '#e8ecf5';
    ctx.beginPath(); ctx.arc(540 + Math.cos(sa) * 420, 600 - Math.abs(Math.sin(sa)) * 380, 46, 0, L.TAU); ctx.fill();
    const g = ctx.createLinearGradient(0, 1000, 0, 2400); g.addColorStop(0, L.mixHex('#123050', '#3f7fb5', day)); g.addColorStop(1, '#0a1e36');
    ctx.fillStyle = g; ctx.fillRect(-300, 1000, W + 600, 2600);
    ctx.strokeStyle = 'rgba(230,245,255,0.5)'; ctx.lineWidth = 4; ctx.beginPath(); for (let x = -300; x <= W + 300; x += 18) ctx.lineTo(x, 1000 + Math.sin(x * 0.02 + t * 2) * 6); ctx.stroke();
    const rx = I(p, [0, 1], [120, 900]);
    ctx.fillStyle = '#3a1d10'; ctx.beginPath(); ctx.ellipse(rx, 1004 + Math.sin(t * 2) * 4, 110, 16, 0, 0, L.TAU); ctx.fill();
  });
  const d = Math.max(1, Math.round(I(since, [0.4, dur - 0.3], [1, 14])));
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.beginPath(); ctx.roundRect(W / 2 - 200, H * 0.24, 400, 120, 30); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.font = '900 84px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(`DAY ${d}`, W / 2, H * 0.24 + 62);
}

function land(ctx, W, H, L, T, t, S, c, I, E, drift, punch, since) {
  const dur = c('outro') - c('land');
  cam(ctx, W, H, T, { x: I(since, [0, dur], [460, 640]), y: 1060, zoom: I(since, [0, dur], [1.1, 1.3], E) }, drift(), punch, () => {
    sky(ctx, W, -600, 1000, '#5ea0d8', '#cfe6f5');
    waterScene(ctx, W, L, t, 1000, 1000);
    ctx.fillStyle = '#4b7a34'; ctx.beginPath(); ctx.moveTo(560, 1000); ctx.quadraticCurveTo(700, 940, 1300, 930); ctx.lineTo(1300, 2400); ctx.lineTo(620, 2400); ctx.fill();
    ctx.fillStyle = '#5b3d24'; ctx.beginPath(); ctx.moveTo(600, 1040); ctx.quadraticCurveTo(720, 975, 1300, 965); ctx.lineTo(1300, 2400); ctx.lineTo(640, 2400); ctx.fill();
    ctx.fillStyle = '#3a1d10'; ctx.beginPath(); ctx.ellipse(500, 1006, 130, 16, 0, 0, L.TAU); ctx.fill();
    for (let i = 0; i < 60; i++) { const p = Math.max(0, Math.min(1, (since - i * 0.03) / 1.4)); const x = 520 + p * (300 + (i % 7) * 30), y = 1000 - p * 40 + (i % 5) * 6; if (p > 0) ant(ctx, L, x, y, 9, -0.1, t); }
    // a new tunnel digs down
    const dig = I(since, [0.8, dur], [0, 1]);
    ctx.strokeStyle = '#1f130b'; ctx.lineWidth = 26; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(880, 975);
    const pts = [[880, 975], [860, 1100], [900, 1220], [870, 1340]]; let need = dig * 3;
    for (let i = 1; i < pts.length && need > 0; i++) { const u = Math.min(1, need); ctx.lineTo(pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * u, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * u); need -= 1; }
    ctx.stroke();
  });
  label(ctx, 'NEW CITY', W / 2, H * 0.3, t, c('land') + 0.9, 92);
}

function outro(ctx, W, H, L, T, t, S, c, I, E, drift, punch, since) {
  cam(ctx, W, H, T, { x: 540, y: 1000, zoom: 1.0 + since * 0.03 }, drift(), punch, () => {
    const g = ctx.createRadialGradient(540, 900, 50, 540, 900, 1200); g.addColorStop(0, '#2a1a10'); g.addColorStop(1, '#0a0604');
    ctx.fillStyle = g; ctx.fillRect(-200, -200, W + 400, H + 400);
    for (let i = 0; i < 9; i++) ant(ctx, L, ((since * 160 + i * 140) % (W + 200)) - 100, 900 + Math.sin(i) * 30, 24, 0, t, { color: '#c8743a' });
    ctx.fillStyle = 'rgba(255,210,63,0.12)'; ctx.beginPath(); ctx.arc(540, 900, 420, 0, L.TAU); ctx.fill();
  });
}

// =========================================================================================== captions
function captions(ctx, W, H, L, t, S) {
  const caps = S.tl.captions || [];
  const cap = caps.find((cp, i) => t >= cp.start - 0.05 && t < (caps[i + 1] ? Math.min(caps[i + 1].start - 0.05, cp.end + 0.4) : cp.end + 0.8));
  if (!cap) return;
  const toks = cap.words || [];
  ctx.font = '900 70px Inter, sans-serif'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  // up to two lines, centred, in the safe area (above the Shorts buttons and caption bar)
  const maxW = W * 0.86, lines = [[]]; let lw = 0;
  for (const w of toks) { const s = (w.word || w.text), wd = ctx.measureText(s).width + 24; if (lw + wd > maxW && lines[lines.length - 1].length) { lines.push([]); lw = 0; } lines[lines.length - 1].push({ ...w, s, wd }); lw += wd; }
  const y0 = H * 0.66 - (lines.length - 1) * 42;
  lines.forEach((ln, li) => {
    let x = W / 2 - ln.reduce((a, b) => a + b.wd, 0) / 2;
    for (const w of ln) {
      const on = t >= w.start - 0.02 && t < (w.end ?? w.start + 0.3) + 0.05, pop = on ? 1.08 : 1;
      ctx.save(); ctx.translate(x + w.wd / 2, y0 + li * 84); ctx.scale(pop, pop);
      ctx.lineWidth = 14; ctx.strokeStyle = '#000'; ctx.lineJoin = 'round'; ctx.strokeText(w.s, -(w.wd - 24) / 2, 0);
      ctx.fillStyle = on ? '#ffd23f' : '#ffffff'; ctx.fillText(w.s, -(w.wd - 24) / 2, 0);
      ctx.restore(); x += w.wd;
    }
  });
}
