// What happens to an ant nest in heavy rain · facts Short (02), vertical 1080×1920, driven by the voice cues.
// v2 shots: nest city under a thatched mound (strike) · flash-forward raft (gap) · backup plan (promise) ·
// pine-needle roof shedding rain · raised rim around the door · sealing the door · water draining past side rooms ·
// eggs carried up into the mound · flood · ants linking · raft forming with a timer · hairs trapping air ·
// raft cross-section (queen in the middle) · drifting weeks · landing · outro. Every shot has camera motion; cuts get a short flash + zoom punch (facts effect level 2).
import * as K from '../../.claude/skills/limiko-studio/frames/shortkit.js';   // format kit: formats/02-facts-science/shorts.md

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
    const shaft = [[540, SURF - 150], [540, SURF - 60], [540, SURF], [522, 760], [560, 900], [502, 1050], [540, 1200], [520, 1380], [560, 1560], [540, 1720]];
    const chambers = [
      { x: 770, y: 830, rx: 115, ry: 52, via: [[556, 880], [680, 835]] },
      { x: 310, y: 1010, rx: 125, ry: 56, via: [[508, 1035], [410, 1015]] },
      { x: 790, y: 1265, rx: 120, ry: 54, via: [[534, 1240], [690, 1262]] },
      { x: 320, y: 1525, rx: 150, ry: 66, via: [[548, 1505], [440, 1520]] },   // queen
      { x: 770, y: 1690, rx: 135, ry: 58, via: [[545, 1700], [650, 1694]] },   // nursery
      { x: 600, y: SURF - 62, rx: 78, ry: 28, via: [[560, SURF - 62]] },        // warm, dry top of the mound
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
      // thatched mound: a dome of pine needles, layered like tiles
      c.save(); c.beginPath(); c.ellipse(540, SURF + 4, 250, 170, 0, Math.PI, 0); c.closePath(); c.clip();
      c.fillStyle = '#7a5a34'; c.fillRect(280, SURF - 180, 520, 190);
      for (let i = 0; i < 1400; i++) { const a = Math.PI + r() * Math.PI, rr = Math.sqrt(r()) * 250, x = 540 + Math.cos(a) * rr, y = SURF + Math.sin(a) * rr * 0.68;
        const ang = a + Math.PI / 2 + (r() - 0.5) * 0.6; c.strokeStyle = ['#a77b45', '#8a6236', '#c4975a', '#6b4a2a'][Math.floor(r() * 4)]; c.lineWidth = 2.2;
        c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(ang) * 22, y + Math.sin(ang) * 22); c.stroke(); }
      c.restore();
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
    const cuts = [[0, 'nest'], [c('gap') + 0.1, 'glimpse'], [c('promise'), 'nest'], [c('roof'), 'roof'], [c('rim'), 'rim'], [c('plug') - 0.05, 'nest'],
      [c('link'), 'link'], [c('raft'), 'raft'], [c('hairs'), 'hairs'], [c('queen'), 'section'], [c('drift'), 'drift'],
      [c('drift') + 0.55 * (c('outro') - c('drift')), 'land'], [c('outro'), 'outro']];
    let shot = cuts[0][1], cutAt = 0;
    for (const [ct, nm] of cuts) if (t >= ct) { shot = nm; cutAt = ct; }
    const since = t - cutAt, punch = 1 + 0.07 * Math.exp(-since * 10);

    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    ({ nest, glimpse, roof, rim, link, raft, hairs, section, drift: driftShot, land, outro })[shot === 'drift' ? 'drift' : shot](ctx, W, H, L, T, t, S, c, I, E, drift, punch, since);

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

function label(ctx, text, x, y, t, start, size = 58, color = '#ffd23f', hold = 99) { K.label(ctx, text, x, y, t, start, size, color, { hold }); }

// ============================================================================================ shots
function nest(ctx, W, H, L, T, t, S, c, I, E, drift, punch) {
  const TOP = SURF - 150;   // door at the top of the mound
  // camera path across the cross-section (each beat its own framing; always moving)
  const keys = [
    [0, 540, 900, 0.95], [c('gap') - 0.1, 540, 980, 1.08],
    [c('promise'), 540, 760, 1.05], [c('roof') - 0.05, 540, 600, 1.35],
    [c('plug') - 0.1, 540, TOP + 20, 2.6], [c('drain') - 0.2, 540, TOP + 40, 2.8],
    [c('drain') + 0.3, 560, 1150, 1.0], [c('up') - 0.2, 560, 1000, 1.05],
    [c('up') + 0.3, 600, 1500, 1.2], [c('flood') - 0.3, 580, 640, 1.45],
    [c('flood') + 0.4, 540, 1000, 0.95], [c('link'), 540, 980, 0.9],
  ];
  const ts = keys.map((k) => k[0]);
  const o = { x: I(t, ts, keys.map((k) => k[1]), E), y: I(t, ts, keys.map((k) => k[2]), E), zoom: I(t, ts, keys.map((k) => k[3]), E) };
  cam(ctx, W, H, T, o, drift(), punch, () => {
    sky(ctx, W, -700, SURF);
    const flash = Math.max(0, 1 - Math.abs(t - 0.3) / 0.12) + Math.max(0, 1 - Math.abs(t - (c('flood') + 0.1)) / 0.12);
    if (flash > 0) { ctx.fillStyle = `rgba(230,240,255,${0.7 * flash})`; ctx.fillRect(-300, -700, W + 600, SURF + 700); }
    ctx.fillStyle = '#2c1c12'; ctx.fillRect(-600, SURF, W + 1200, H + 1200 - SURF);
    ctx.fillStyle = '#4a3020'; ctx.fillRect(-600, SURF, 600, H - SURF); ctx.fillRect(W, SURF, 600, H - SURF);
    // grass first, then the soil + mound image over it
    ctx.strokeStyle = '#3f6b2e'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    for (const g of S.grass) { if (Math.abs(g.x - 540) < 250) continue; ctx.beginPath(); ctx.moveTo(g.x, SURF); ctx.quadraticCurveTo(g.x + Math.sin(t * 3 + g.ph) * 10, SURF - g.h / 2, g.x + Math.sin(t * 3 + g.ph) * 16, SURF - g.h); ctx.stroke(); }
    ctx.fillStyle = '#4b7a34'; ctx.fillRect(-600, SURF - 6, W + 1200, 10);
    ctx.drawImage(S.soil, 0, 0);
    // raised rim around the door
    ctx.fillStyle = '#5b3d24'; ctx.beginPath(); ctx.ellipse(540, TOP + 6, 46, 20, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#1f130b'; ctx.beginPath(); ctx.ellipse(540, TOP + 2, 20, 8, 0, 0, L.TAU); ctx.fill();
    // rain running off the dome (drops slide down the thatch)
    if (t < c('flood') + 0.5) for (let i = 0; i < 26; i++) {
      const p = ((t * 0.6 + i / 26) % 1), side = i % 2 ? 1 : -1, a = Math.PI * (1.5 + side * (0.06 + p * 0.44));
      ctx.fillStyle = 'rgba(190,225,255,0.85)'; ctx.beginPath(); ctx.arc(540 + Math.cos(a) * 252, SURF + Math.sin(a) * 172, 5, 0, L.TAU); ctx.fill();
    }
    // water: drainage stream (drain beat), rising water table, then the flood
    const rise = I(t, [c('up'), c('up') + 1.2, c('flood')], [H + 10, 1700, 1300], E);
    const flood = I(t, [c('flood') + 0.3, c('link') - 0.4], [rise, TOP - 140], { ease: 'in' });
    const level = Math.min(rise, flood);
    const wc = S.water.getContext('2d');
    wc.globalCompositeOperation = 'source-over'; wc.clearRect(0, 0, W, H);
    const wg = wc.createLinearGradient(0, level, 0, H); wg.addColorStop(0, 'rgba(70,150,230,0.9)'); wg.addColorStop(1, 'rgba(20,70,150,0.95)');
    wc.fillStyle = wg; wc.fillRect(0, level, W, H - level);
    wc.strokeStyle = 'rgba(210,235,255,0.9)'; wc.lineWidth = 5; wc.beginPath(); wc.moveTo(0, level); wc.lineTo(W, level); wc.stroke();
    wc.globalCompositeOperation = 'destination-in'; wc.drawImage(S.mask, 0, 0); wc.globalCompositeOperation = 'source-over';
    ctx.drawImage(S.water, 0, 0);
    if (t > c('drain') && t < c('up') + 0.4) {   // water slips down the main tunnel, past the side rooms
      const k = Math.min(1, (t - c('drain')) / 0.6) * Math.max(0, Math.min(1, (c('up') + 0.4 - t) / 0.6));
      for (let i = 0; i < 40; i++) { const sx = ((t - c('drain')) * 420 + i * (S.main.len / 40)) % S.main.len; const [x, y] = S.at(S.main, sx);
        if (y > SURF - 60) { ctx.fillStyle = `rgba(110,180,245,${0.9 * k})`; ctx.beginPath(); ctx.ellipse(x, y, 9, 16, 0, 0, L.TAU); ctx.fill(); } }
      if (t > c('drain') + 0.8 && t < c('up')) { ctx.fillStyle = `rgba(255,210,63,${k})`; ctx.font = '900 64px Inter'; ctx.textAlign = 'center'; for (const yy of [900, 1250, 1600]) ctx.fillText('↓', 470, yy + Math.sin(t * 6) * 8); }
    }
    if (flood < SURF + 20) {
      ctx.fillStyle = 'rgba(60,130,200,0.55)'; ctx.fillRect(-300, flood, W + 600, H - flood + 400);
      ctx.strokeStyle = 'rgba(220,240,255,0.8)'; ctx.lineWidth = 6; ctx.beginPath();
      for (let x = -300; x <= W + 300; x += 20) ctx.lineTo(x, flood + Math.sin(x * 0.02 + t * 4) * 8); ctx.stroke();
    }
    // the seal: soil pellets fill the door
    const n = Math.floor(I(t, [c('plug') + 0.4, c('drain') - 0.2], [0, 7]));
    const pel = [[-12, -2], [10, -3], [0, -8], [-6, 4], [8, 4], [-14, -9], [14, -9]];
    ctx.fillStyle = '#7a5434';
    for (let i = 0; i < n; i++) { ctx.beginPath(); ctx.arc(540 + pel[i][0], TOP + 2 + pel[i][1], 7, 0, L.TAU); ctx.fill(); }
    if (t > c('plug') && t < c('drain')) {
      const p = ((t - c('plug')) * 0.9) % 1, y = TOP + 90 - p * 80;
      ant(ctx, L, 540, y, 16, -Math.PI / 2, t); ctx.fillStyle = '#7a5434'; ctx.beginPath(); ctx.arc(540, y - 26, 8, 0, L.TAU); ctx.fill();
    }
    // chambers: the queen, the nursery, the warm top room
    const qc = S.chambers[3];
    if (level > qc.y - 20) ant(ctx, L, qc.x - 10, qc.y + 12, 24, 0.1, t * 0.3, { queen: true });
    const nur = S.chambers[4], top = S.chambers[5], left = Math.round(I(t, [c('up'), c('flood') - 0.4], [S.eggs.length, 0]));
    ctx.fillStyle = '#fbf6ea';
    S.eggs.slice(0, left).forEach((e) => { ctx.beginPath(); ctx.ellipse(nur.x + e.x * 0.9, nur.y + 18 + e.y * 0.5, 9, 6, e.a, 0, L.TAU); ctx.fill(); });
    S.eggs.slice(left).forEach((e) => { ctx.beginPath(); ctx.ellipse(top.x + e.x * 0.5, top.y + 10 + e.y * 0.25, 8, 5.5, e.a, 0, L.TAU); ctx.fill(); });
    for (const w of S.walkers) { const [x, y, a] = S.at(w.R, w.ph + t * w.sp); if (y < level - 10 && y > SURF - 40) ant(ctx, L, x, y, 11, a + (w.sp < 0 ? Math.PI : 0), t); }
    if (t > c('up') && t < c('flood') + 1) for (const k of S.carriers) {
      const s = S.main.len - ((k.ph + (t - c('up')) * k.sp) % S.main.len); const [x, y, a] = S.at(S.main, s);
      if (y < level - 10) ant(ctx, L, x, y, 13, a + Math.PI, t, { carry: true });
    }
    rain(ctx, W, L, t, S, -700, Math.min(SURF - 150, flood));
  });
  if (t < c('gap')) label(ctx, 'RAIN-PROOF CITY', W / 2, H * 0.3, t, 0.5, 84);
  if (t > c('promise') && t < c('roof')) label(ctx, 'BACKUP PLAN?', W / 2, H * 0.3, t, c('promise') + 0.3, 92);
  if (t > c('plug') && t < c('drain')) label(ctx, 'DOOR SEALED', W / 2, H * 0.3, t, c('plug') + 0.6, 84);
  if (t > c('drain') && t < c('up')) label(ctx, 'WATER DRAINS PAST', W / 2, H * 0.3, t, c('drain') + 0.5, 76, '#5cc8ff');
  if (t > c('up') && t < c('flood')) label(ctx, 'EGGS GO UP', W / 2, H * 0.3, t, c('up') + 0.5, 84, '#ffffff');
  if (t > c('flood') + 0.3) label(ctx, 'THE RAIN WINS', W / 2, H * 0.3, t, c('flood') + 0.4, 92, '#5cc8ff');
}

function roof(ctx, W, H, L, T, t, S, c, I, E, drift, punch, since) {
  const dur = c('rim') - c('roof');
  cam(ctx, W, H, T, { x: 540, y: I(since, [0, dur], [900, 980]), zoom: I(since, [0, dur], [1.0, 1.2], E) }, drift(), punch, () => {
    sky(ctx, W, -600, 1200, '#2a3646', '#56677c');
    ctx.fillStyle = '#3f6b2e'; ctx.fillRect(-300, 1200, W + 600, 1400);
    // a big dome of layered needles, drawn row by row like roof tiles
    const R = 460;
    ctx.save(); ctx.beginPath(); ctx.ellipse(540, 1200, R, R * 0.72, 0, Math.PI, 0); ctx.closePath(); ctx.clip();
    ctx.fillStyle = '#6b4a2a'; ctx.fillRect(0, 700, W, 520);
    const rr = L.rng(77);
    for (let row = 0; row < 16; row++) for (let i = 0; i < 46; i++) {
      const a = Math.PI + (i + (row % 2) * 0.5) / 46 * Math.PI, k = 1 - row / 16, x = 540 + Math.cos(a) * R * k, y = 1200 + Math.sin(a) * R * 0.72 * k;
      const ang = a + Math.PI / 2 + 0.35 + (rr() - 0.5) * 0.5;
      ctx.strokeStyle = ['#b98a50', '#9a7040', '#d4a868', '#7a5530'][Math.floor(rr() * 4)]; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(ang) * 58, y + Math.sin(ang) * 58); ctx.stroke();
    }
    ctx.restore();
    // drops hit the dome and run down its curve to the ground
    for (let i = 0; i < 34; i++) {
      const p = ((since * 0.55 + i / 34) % 1), side = i % 2 ? 1 : -1, a0 = 0.06 + (i % 7) * 0.05, a = Math.PI * (1.5 + side * (a0 + p * (0.5 - a0)));
      const x = 540 + Math.cos(a) * (R + 6), y = 1200 + Math.sin(a) * (R * 0.72 + 6);
      ctx.fillStyle = 'rgba(200,232,255,0.95)'; ctx.beginPath(); ctx.ellipse(x, y, 9, 12, a, 0, L.TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(200,232,255,0.35)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(540, 1200, R + 6, a - side * 0.08, a, side < 0); ctx.stroke();
    }
    rain(ctx, W, L, t, S, -600, 1100);
  });
  label(ctx, 'PINE-NEEDLE ROOF', W / 2, H * 0.3, t, c('roof') + 0.6, 84);
}

function rim(ctx, W, H, L, T, t, S, c, I, E, drift, punch, since) {
  const dur = c('plug') - c('rim');
  cam(ctx, W, H, T, { x: I(since, [0, dur], [500, 580]), y: 1000, zoom: I(since, [0, dur], [1.15, 1.3], E) }, drift(), punch, () => {
    sky(ctx, W, -600, 1000, '#2a3646', '#56677c');
    ctx.fillStyle = '#5b3d24'; ctx.fillRect(-300, 1000, W + 600, 1600);
    ctx.fillStyle = '#4b7a34'; ctx.fillRect(-300, 992, W + 600, 14);
    // sheet of rainwater flowing along the ground from both sides
    for (const side of [-1, 1]) for (let i = 0; i < 9; i++) {
      const p = ((since * 0.7 + i / 9) % 1), x = 540 + side * (560 - p * 420), y = 984 - Math.max(0, 1 - Math.abs(x - 540) / 200) * 70;
      ctx.strokeStyle = 'rgba(120,190,250,0.9)'; ctx.lineWidth = 10; ctx.lineCap = 'round';
      const dx = -side * 40; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dx, y - (Math.abs(x - 540) < 200 ? side * 0 : 0)); ctx.stroke();
      if (Math.abs(x - 540) < 170) { ctx.strokeStyle = 'rgba(120,190,250,0.7)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(540, 1000, 190, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); }
    }
    // the raised rim and the door in the middle
    ctx.fillStyle = '#7a5434'; ctx.beginPath(); ctx.moveTo(380, 1000); ctx.quadraticCurveTo(440, 880, 500, 910); ctx.lineTo(500, 1000); ctx.fill();
    ctx.beginPath(); ctx.moveTo(700, 1000); ctx.quadraticCurveTo(640, 880, 580, 910); ctx.lineTo(580, 1000); ctx.fill();
    ctx.fillStyle = '#1f130b'; ctx.fillRect(500, 910, 80, 600);
    ant(ctx, L, 540, 1060 + Math.sin(t * 2) * 10, 20, -Math.PI / 2, t);
    // arrows: water goes around, not in
    ctx.fillStyle = '#ffd23f'; ctx.font = '900 80px Inter'; ctx.textAlign = 'center';
    ctx.fillText('↷', 420, 850 + Math.sin(t * 5) * 6); ctx.fillText('↶', 660, 850 + Math.sin(t * 5) * 6);
    rain(ctx, W, L, t, S, -600, 980, 0.7);
  });
  label(ctx, 'RAISED RIM', W / 2, H * 0.3, t, c('rim') + 0.5, 92);
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
  const pr = I(since, [0, c('promise') - c('gap') - 0.3], [0.3, 1]);
  cam(ctx, W, H, T, { x: 540, y: 1000, zoom: 1.25 - 0.1 * pr }, drift(), punch, () => { waterScene(ctx, W, L, t, 1000); raftForming(ctx, W, L, t, S, pr); rain(ctx, W, L, t, S, -600, 1000, 0.6); });
  ctx.fillStyle = 'rgba(255,200,80,0.12)'; ctx.fillRect(0, 0, W, H);      // warm "flash-forward" tint
  label(ctx, '100,000 ANTS', W / 2, H * 0.3, t, c('gap') + 0.4, 96);
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
  label(ctx, 'JAWS → LEGS', W / 2, H * 0.3, t, c('link') + 0.9, 84);
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
  label(ctx, 'QUEEN', W / 2, H * 0.3, t, c('queen') + 0.4, 100);
  label(ctx, 'DRY IN THE MIDDLE', W / 2, H * 0.3 + 110, t, c('queen') + 1.0, 64, '#ffffff');
}

function driftShot(ctx, W, H, L, T, t, S, c, I, E, drift, punch, since) {
  const dur = 0.55 * (c('outro') - c('drift')), p = Math.min(1, since / dur);
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
  const d = Math.max(1, Math.round(I(since, [0.4, dur - 0.3], [1, 3])));
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.beginPath(); ctx.roundRect(W / 2 - 200, H * 0.24, 400, 120, 30); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.font = '900 84px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(`WEEK ${d}`, W / 2, H * 0.24 + 62);
}

function land(ctx, W, H, L, T, t, S, c, I, E, drift, punch, since) {
  const dur = 0.45 * (c('outro') - c('drift'));
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
  label(ctx, 'START AGAIN', W / 2, H * 0.3, t, c('drift') + 0.55 * (c('outro') - c('drift')) + 0.5, 92);
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
function captions(ctx, W, H, L, t, S) { K.captions(ctx, W, H, L, t, S.tl, { lang: S.props.lang }); }
