// Parametric character rig. One spec (JSON) → the same character in every view, expression and pose.
// drawCharacter(ctx, spec, { x, y, h, view, expr, pose })
//   x, y  : feet position on the ground
//   h     : total height in px
//   view  : 'front' | '34' | 'side' | 'back'
//   expr  : 'neutral' | 'happy' | 'sad' | 'angry' | 'surprised' | 'thinking'
//   pose  : 'stand' | 'wave' | 'walk' | 'point' | 'hero'
const TAU = Math.PI * 2;

const DEF = {
  build: { heads: 5, width: 1, belly: 0, head: 'round', neck: 0.18 },
  colors: { skin: '#e9b48a', hair: '#2a1a12', eyes: '#2a1a12', top: '#3a7bd5', bottom: '#2c3e50', shoes: '#3a2a20',
    accent: '#f2c14e', line: '#2a1a12', blush: '#ff8a8a', second: '#ffffff' },
  face: { eyes: 'round', eyeSize: 1, brows: 'soft', nose: 'small', mouth: 'smile', marks: [] },
  hair: { style: 'short', volume: 1 },
  ears: 'human',
  tail: null,
  outfit: { top: 'tunic', bottom: 'pants', sash: false, cape: null },
  accessories: [],
  line: 3,
};

function merge(a, b) {
  const o = { ...a };
  for (const k in b) o[k] = b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) ? merge(a[k] || {}, b[k]) : b[k];
  return o;
}

export function normalize(spec) { return merge(DEF, spec || {}); }

function shape(ctx, fn, fill, line, lw) {
  ctx.beginPath(); fn(); ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (line && lw) { ctx.strokeStyle = line; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); }
}
function limb(ctx, pts, w, col, line, lw) {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (line && lw) { ctx.strokeStyle = line; ctx.lineWidth = w + lw * 2; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); }
  ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
}

export function drawCharacter(ctx, specIn, o = {}) {
  const s = normalize(specIn);
  const { x = 0, y = 0, h = 400, view = 'front', expr = 'neutral', pose = 'stand', stride = null } = o;
  const C = s.colors, B = s.build, U = h / B.heads; // U = one head-height
  const lw = s.line * (h / 400);
  const L = C.line;
  const side = view === 'side', back = view === 'back', q = view === '34';
  const turn = side ? 1 : q ? 0.55 : 0; // 0 front … 1 profile
  const wid = B.width;
  const kidLike = B.heads <= 3.5;
  const hv = s.hair.volume || 1;

  // vertical landmarks (from feet up)
  const headR = U * 0.5;
  const headCy = y - h + headR;
  const neckY = headCy + headR * 0.92;
  const shoulderY = neckY + U * B.neck;
  const hipY = y - h * (kidLike ? 0.38 : 0.47);
  const torsoW = U * (kidLike ? 0.62 : 0.78) * wid * (1 - turn * 0.35);
  const hipW = torsoW * (0.85 + B.belly * 0.3);
  const legW = U * (kidLike ? 0.26 : 0.22) * wid;
  const armW = U * (kidLike ? 0.2 : 0.17) * wid;
  const faceDir = side ? 1 : q ? 1 : 0;

  ctx.save();

  // hair back volume (behind body)
  {
  const hx = x + faceDir * headR * 0.08;
  if (!back && ['long', 'bun', 'crown-locks', 'topknot', 'braid'].includes(s.hair.style)) {
    if (s.hair.style === 'long' || s.hair.style === 'crown-locks') shape(ctx, () => { ctx.moveTo(hx - headR * 1.05, headCy); ctx.quadraticCurveTo(hx - headR * 1.25 * hv, headCy + headR * 1.8, hx - headR * 0.6 - turn * headR * 0.6, headCy + headR * 2.2); ctx.lineTo(hx + headR * 0.6 - turn * headR * 1.4, headCy + headR * 2.2); ctx.quadraticCurveTo(hx + headR * 1.25 * hv * (1 - turn), headCy + headR * 1.8, hx + headR * 1.05, headCy); }, C.hair, L, lw);
    if (s.hair.style === 'braid') limb(ctx, [[hx - headR * 0.6 * (1 + turn), headCy + headR * 0.4], [hx - headR * 0.8 * (1 + turn), headCy + headR * 2.6]], headR * 0.35, C.hair, L, lw);
  }
  }
  // ---- cape (behind)
  if (s.outfit.cape) {
    shape(ctx, () => { ctx.moveTo(x - torsoW * 0.9, shoulderY); ctx.lineTo(x + torsoW * 0.9, shoulderY); ctx.quadraticCurveTo(x + torsoW * 1.5, (shoulderY + y) / 2, x + torsoW * 1.3 - turn * 30, y - U * 0.4); ctx.lineTo(x - torsoW * 1.3 - turn * 50, y - U * 0.4); ctx.quadraticCurveTo(x - torsoW * 1.5, (shoulderY + y) / 2, x - torsoW * 0.9, shoulderY); }, s.outfit.cape, L, lw);
  }
  // ---- tail (behind)
  if (s.tail) {
    const tx = x + (side ? -hipW * 0.8 : hipW * 0.7);
    shape(ctx, () => { ctx.moveTo(tx, hipY - U * 0.1); ctx.quadraticCurveTo(tx + U * 1.3 * (side ? -1 : 1), hipY - U * 0.2, tx + U * 1.0 * (side ? -1 : 1), hipY - U * 1.1); ctx.quadraticCurveTo(tx + U * 0.6 * (side ? -1 : 1), hipY - U * 0.3, tx, hipY + U * 0.15); }, s.tail.color || C.hair, L, lw);
    if (s.tail.tip) shape(ctx, () => { const ex = tx + U * 1.0 * (side ? -1 : 1), ey = hipY - U * 1.1; ctx.moveTo(ex, ey); ctx.quadraticCurveTo(ex - U * 0.15 * (side ? -1 : 1), ey + U * 0.35, ex - U * 0.28 * (side ? -1 : 1), ey + U * 0.4); ctx.quadraticCurveTo(ex - U * 0.05, ey + U * 0.1, ex, ey); }, s.tail.tip, null, 0);
  }

  // ---- legs
  const walk = stride ?? (pose === 'walk' ? 0.35 : 0);  // stride: -0.4…0.4 for walk cycles
  const legSpread = (pose === 'hero' ? 0.55 : 0.32) * hipW;
  const legs = side
    ? [[x - U * walk * 0.6, x + U * walk * 0.6]]
    : [[x - legSpread, x - legSpread - U * walk * 0.2], [x + legSpread, x + legSpread + U * walk * 0.2]];
  const legCol = s.outfit.bottom === 'dhoti' || s.outfit.bottom === 'skirt' || s.outfit.bottom === 'robe' ? C.skin : C.bottom;
  const legList = side ? [[x + U * walk * 0.5, 0], [x - U * walk * 0.5, 1]] : [[legs[0][0], 0], [legs[1][0], 1]];
  legList.forEach(([lx], i) => limb(ctx, [[lx, hipY], [lx + (side ? 0 : (i ? 4 : -4)), (hipY + y) / 2], [lx, y - U * 0.12]], legW, legCol, L, lw));
  legList.forEach(([lx]) => shape(ctx, () => ctx.ellipse(lx + (side ? U * 0.12 : 0), y - U * 0.07, U * (side ? 0.26 : 0.2), U * 0.1, 0, 0, TAU), C.shoes, L, lw));

  // ---- lower garment
  if (s.outfit.bottom === 'dhoti') {
    shape(ctx, () => { ctx.moveTo(x - hipW, hipY - U * 0.1); ctx.lineTo(x + hipW, hipY - U * 0.1); ctx.lineTo(x + hipW * 1.05, hipY + U * 1.1); ctx.quadraticCurveTo(x, hipY + U * 1.25, x - hipW * 1.05, hipY + U * 1.1); }, C.bottom, L, lw);
    ctx.strokeStyle = C.accent; ctx.lineWidth = lw * 1.4; ctx.beginPath(); ctx.moveTo(x - hipW * 1.05, hipY + U * 1.05); ctx.quadraticCurveTo(x, hipY + U * 1.2, x + hipW * 1.05, hipY + U * 1.05); ctx.stroke();
    ctx.strokeStyle = L; ctx.lineWidth = lw * 0.6; ctx.beginPath(); ctx.moveTo(x, hipY); ctx.lineTo(x - hipW * 0.2, hipY + U * 1.15); ctx.stroke();
  } else if (s.outfit.bottom === 'skirt' || s.outfit.bottom === 'robe') {
    const len = s.outfit.bottom === 'robe' ? y - hipY - U * 0.2 : U * 1.2;
    shape(ctx, () => { ctx.moveTo(x - hipW, hipY - U * 0.1); ctx.lineTo(x + hipW, hipY - U * 0.1); ctx.lineTo(x + hipW * 1.4, hipY + len); ctx.lineTo(x - hipW * 1.4, hipY + len); }, C.bottom, L, lw);
  } else {
    shape(ctx, () => { ctx.moveTo(x - hipW, hipY - U * 0.15); ctx.lineTo(x + hipW, hipY - U * 0.15); ctx.lineTo(x + hipW * 0.95, hipY + U * 0.35); ctx.lineTo(x - hipW * 0.95, hipY + U * 0.35); }, C.bottom, L, lw);
  }

  // ---- arms (pose)
  const sx = torsoW * 0.95;
  const arm = (dir, kind) => {
    const AL = kidLike ? 0.62 : 1;
    const shx = x + dir * sx * (side ? 0.2 : 1), shy = shoulderY + U * 0.12;
    let el, hd;
    if (kind === 'wave') { el = [shx + dir * U * 0.5 * AL, shy - U * 0.35 * AL]; hd = [shx + dir * U * 0.7 * AL, shy - U * 1.0 * AL]; }
    else if (kind === 'point') { el = [shx + dir * U * 0.6 * AL, shy + U * 0.05]; hd = [shx + dir * U * 1.25 * AL, shy - U * 0.05]; }
    else if (kind === 'hip') { el = [shx + dir * U * 0.55, shy + U * 0.55]; hd = [shx + dir * U * 0.15, hipY]; }
    else if (kind === 'hold') { el = [shx + dir * U * 0.35 * AL, shy + U * 0.7 * AL]; hd = [shx + dir * U * 0.55 * AL, shy + U * 0.55 * AL]; }
    else { const sw = pose === 'walk' ? dir * (stride ?? 0.35) * 0.7 : 0; el = [shx + dir * U * 0.18 * AL, shy + U * 0.75 * AL]; hd = [shx + dir * U * (0.22 + sw) * AL, shy + U * 1.45 * AL]; }
    const sleeve = s.outfit.top === 'none' || s.outfit.top === 'sash' ? C.skin : (s.outfit.sleeves === 'short' ? C.skin : C.top);
    limb(ctx, [[shx, shy], el, hd], armW, sleeve, L, lw);
    if (s.outfit.sleeves === 'short') limb(ctx, [[shx, shy], [L_(shx, el[0], 0.45), L_(shy, el[1], 0.45)]], armW * 1.15, C.top, L, lw);
    shape(ctx, () => ctx.arc(hd[0], hd[1], armW * 0.75, 0, TAU), C.skin, L, lw);
    return hd;
  };
  const L_ = (a, b, t) => a + (b - a) * t;
  const leftKind = pose === 'hero' ? 'hip' : 'down';
  const rightKind = pose === 'wave' ? 'wave' : pose === 'point' ? 'point' : pose === 'hero' ? 'hold' : 'down';

  // back arm first in side/34
  let handR, handL;
  if (side || q) { handL = arm(-1, leftKind); }

  // ---- torso
  const topCol = s.outfit.top === 'none' || s.outfit.top === 'sash' ? C.skin : C.top;
  shape(ctx, () => {
    ctx.moveTo(x - torsoW, shoulderY); ctx.quadraticCurveTo(x, shoulderY - U * 0.12, x + torsoW, shoulderY);
    ctx.lineTo(x + hipW * (1 + B.belly * 0.2), hipY); ctx.quadraticCurveTo(x, hipY + U * 0.12, x - hipW * (1 + B.belly * 0.2), hipY);
  }, topCol, L, lw);
  if (s.outfit.top === 'kurta' || s.outfit.top === 'robe') {
    shape(ctx, () => { ctx.moveTo(x - hipW, hipY - U * 0.05); ctx.lineTo(x + hipW, hipY - U * 0.05); ctx.lineTo(x + hipW * 1.15, hipY + U * 0.6); ctx.lineTo(x - hipW * 1.15, hipY + U * 0.6); }, C.top, L, lw);
  }
  if (s.outfit.top === 'armor') {
    ctx.strokeStyle = C.accent; ctx.lineWidth = lw * 1.2;
    for (let k = 1; k <= 3; k++) { const yy = L_(shoulderY, hipY, k / 4); ctx.beginPath(); ctx.moveTo(x - torsoW * 0.9, yy); ctx.quadraticCurveTo(x, yy + U * 0.08, x + torsoW * 0.9, yy); ctx.stroke(); }
    shape(ctx, () => ctx.ellipse(x - torsoW, shoulderY + U * 0.05, U * 0.28, U * 0.18, 0, 0, TAU), C.accent, L, lw);
    shape(ctx, () => ctx.ellipse(x + torsoW, shoulderY + U * 0.05, U * 0.28, U * 0.18, 0, 0, TAU), C.accent, L, lw);
  }
  if (s.outfit.sash) {
    ctx.strokeStyle = typeof s.outfit.sash === 'string' ? s.outfit.sash : C.accent; ctx.lineWidth = U * 0.16;
    ctx.beginPath(); ctx.moveTo(x - torsoW * 0.8, shoulderY + U * 0.05); ctx.lineTo(x + hipW * 0.8, hipY - U * 0.05); ctx.stroke();
  }
  if (s.outfit.belt !== false && s.outfit.bottom !== 'robe') { ctx.fillStyle = C.accent; ctx.fillRect(x - hipW, hipY - U * 0.14, hipW * 2, U * 0.1); }
  if (s.belly_patch) shape(ctx, () => ctx.ellipse(x + turn * torsoW * 0.3, L_(shoulderY, hipY, 0.6), torsoW * 0.55, (hipY - shoulderY) * 0.42, 0, 0, TAU), s.belly_patch, null, 0);

  // necklace
  if (s.accessories.includes('necklace')) { ctx.strokeStyle = C.accent; ctx.lineWidth = lw * 1.6; ctx.beginPath(); ctx.arc(x + turn * 6, shoulderY - U * 0.05, torsoW * 0.5, 0.35, Math.PI - 0.35); ctx.stroke(); }
  if (s.accessories.includes('garland')) { ctx.strokeStyle = s.garland || '#ff9f1c'; ctx.lineWidth = U * 0.1; ctx.setLineDash([U * 0.06, U * 0.04]); ctx.beginPath(); ctx.arc(x, shoulderY + U * 0.05, torsoW * 0.75, 0.25, Math.PI - 0.25); ctx.stroke(); ctx.setLineDash([]); }

  // front arm(s)
  if (!(side || q)) { handL = arm(-1, leftKind); }
  handR = arm(1, rightKind);

  // ---- held items
  const held = (name, hd) => {
    if (!hd) return;
    const [hx, hy] = hd;
    if (name === 'flute') { ctx.save(); ctx.translate(hx, hy); ctx.rotate(-0.25); ctx.fillStyle = '#c9a36b'; ctx.strokeStyle = L; ctx.lineWidth = lw * 0.6; ctx.beginPath(); ctx.roundRect(-U * 0.9, -U * 0.05, U * 1.5, U * 0.1, U * 0.05); ctx.fill(); ctx.stroke(); ctx.fillStyle = L; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(-U * 0.6 + k * U * 0.22, 0, U * 0.02, 0, TAU); ctx.fill(); } ctx.restore(); }
    if (name === 'mace') { limb(ctx, [[hx, hy + U * 0.3], [hx, hy - U * 1.2]], U * 0.08, '#8a5a2b', L, lw); shape(ctx, () => ctx.arc(hx, hy - U * 1.35, U * 0.32, 0, TAU), C.accent, L, lw); }
    if (name === 'trident') { limb(ctx, [[hx, y - U * 0.1], [hx, hy - U * 1.6]], U * 0.06, '#8a8a95', L, lw * 0.6); ctx.strokeStyle = '#b8b8c5'; ctx.lineWidth = U * 0.07; ctx.beginPath(); ctx.moveTo(hx - U * 0.3, hy - U * 2.0); ctx.quadraticCurveTo(hx - U * 0.3, hy - U * 1.6, hx, hy - U * 1.6); ctx.quadraticCurveTo(hx + U * 0.3, hy - U * 1.6, hx + U * 0.3, hy - U * 2.0); ctx.moveTo(hx, hy - U * 1.6); ctx.lineTo(hx, hy - U * 2.15); ctx.stroke(); }
    if (name === 'sword') { ctx.save(); ctx.translate(hx, hy); ctx.rotate(-0.5); ctx.fillStyle = '#d8dde6'; ctx.strokeStyle = L; ctx.lineWidth = lw * 0.6; ctx.beginPath(); ctx.moveTo(-U * 0.05, 0); ctx.lineTo(U * 0.05, 0); ctx.lineTo(U * 0.03, -U * 1.6); ctx.lineTo(0, -U * 1.75); ctx.lineTo(-U * 0.03, -U * 1.6); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = C.accent; ctx.fillRect(-U * 0.2, -U * 0.05, U * 0.4, U * 0.08); ctx.restore(); }
    if (name === 'bow') { ctx.strokeStyle = '#8a5a2b'; ctx.lineWidth = U * 0.07; ctx.beginPath(); ctx.arc(hx - U * 0.4, hy, U * 0.9, -1.1, 1.1); ctx.stroke(); ctx.strokeStyle = '#eee'; ctx.lineWidth = lw * 0.4; ctx.beginPath(); ctx.moveTo(hx - U * 0.4 + Math.cos(-1.1) * U * 0.9, hy + Math.sin(-1.1) * U * 0.9); ctx.lineTo(hx - U * 0.4 + Math.cos(1.1) * U * 0.9, hy + Math.sin(1.1) * U * 0.9); ctx.stroke(); }
    if (name === 'staff') limb(ctx, [[hx, y - U * 0.05], [hx, hy - U * 1.3]], U * 0.08, '#8a5a2b', L, lw * 0.6);
    if (name === 'book') shape(ctx, () => ctx.rect(hx - U * 0.25, hy - U * 0.2, U * 0.5, U * 0.38), C.accent, L, lw);
    if (name === 'lotus') { for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + (k - 2) * 0.45; shape(ctx, () => ctx.ellipse(hx + Math.cos(a) * U * 0.15, hy - U * 0.05 + Math.sin(a) * U * 0.15, U * 0.08, U * 0.18, a + Math.PI / 2, 0, TAU), '#ff8fb1', L, lw * 0.5); } }
  };
  const inR = s.accessories.find((a) => ['flute', 'mace', 'trident', 'sword', 'staff', 'book', 'lotus'].includes(a));
  const inL = s.accessories.find((a) => ['bow', 'shield'].includes(a));
  if (inR) held(inR, handR);
  if (inL === 'bow') held('bow', handL);
  if (inL === 'shield' && handL) shape(ctx, () => ctx.arc(handL[0] - U * 0.05, handL[1] - U * 0.2, U * 0.55, 0, TAU), C.accent, L, lw);

  // ---- neck + head
  limb(ctx, [[x + turn * 4, neckY - U * 0.05], [x + turn * 4, shoulderY]], U * 0.24, C.skin, L, lw * 0.8);
  const hx = x + faceDir * headR * 0.08;
  // ears (animal or human) behind the head outline
  if (s.ears === 'fox' || s.ears === 'cat') {
    const ear = (d) => shape(ctx, () => { ctx.moveTo(hx + d * headR * 0.85, headCy - headR * 0.2); ctx.lineTo(hx + d * headR * 0.75, headCy - headR * 1.45); ctx.lineTo(hx + d * headR * 0.15, headCy - headR * 0.75); }, C.hair, L, lw);
    if (!side) { ear(-1); ear(1); } else ear(-0.6);
  }
  // head shape
  const hw = headR * (s.build.head === 'oval' ? 0.86 : s.build.head === 'square' ? 1.0 : 0.96);
  shape(ctx, () => {
    if (s.build.head === 'square') ctx.roundRect(hx - hw, headCy - headR, hw * 2, headR * 2.02, headR * 0.45);
    else if (s.build.head === 'fox') { ctx.moveTo(hx - hw * 1.05, headCy - headR * 0.3); ctx.quadraticCurveTo(hx - hw, headCy - headR * 1.05, hx, headCy - headR); ctx.quadraticCurveTo(hx + hw, headCy - headR * 1.05, hx + hw * 1.05, headCy - headR * 0.3); ctx.quadraticCurveTo(hx + hw * 0.8 + turn * headR * 0.5, headCy + headR * 0.7, hx + turn * headR * 0.6, headCy + headR * 1.0); ctx.quadraticCurveTo(hx - hw * 0.8, headCy + headR * 0.7, hx - hw * 1.05, headCy - headR * 0.3); }
    else ctx.ellipse(hx, headCy, hw, headR * 1.02, 0, 0, TAU);
  }, C.skin, L, lw);
  if (s.muzzle && !back) shape(ctx, () => ctx.ellipse(hx + turn * headR * 0.35, headCy + headR * 0.45, headR * (0.5 - turn * 0.15), headR * 0.4, 0, 0, TAU), s.muzzle, null, 0);
  // human ears
  if (s.ears === 'human' && !back) {
    const ex = side ? hx - headR * 0.15 : hx + hw * (q ? -0.95 : 0.98);
    shape(ctx, () => ctx.ellipse(ex, headCy + headR * 0.1, headR * 0.16, headR * 0.26, 0, 0, TAU), C.skin, L, lw * 0.8);
    if (!side && !q) shape(ctx, () => ctx.ellipse(hx - hw * 0.98, headCy + headR * 0.1, headR * 0.16, headR * 0.26, 0, 0, TAU), C.skin, L, lw * 0.8);
    if (s.accessories.includes('earrings')) shape(ctx, () => ctx.arc(ex, headCy + headR * 0.42, headR * 0.09, 0, TAU), C.accent, L, lw * 0.5);
  }

  // ---- face
  if (!back) {
    const fx = hx + turn * headR * (side ? 0.45 : 0.28);
    const sp = headR * 0.38 * (1 - turn * 0.45);
    const ey = headCy + headR * 0.02;
    const es = headR * 0.16 * s.face.eyeSize * (kidLike ? 1.25 : 1);
    const eyeAt = (ex, far) => {
      const sq = expr === 'happy' ? 0.55 : expr === 'surprised' ? 1.25 : expr === 'sad' ? 0.85 : 1;
      const w = es * (far ? 0.75 : 1);
      if (expr === 'happy' && s.face.eyes !== 'dot') { ctx.strokeStyle = C.eyes; ctx.lineWidth = lw * 1.3; ctx.beginPath(); ctx.arc(ex, ey + es * 0.3, w, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); return; }
      if (s.face.eyes === 'dot') { shape(ctx, () => ctx.arc(ex, ey, es * 0.45, 0, TAU), C.eyes, null, 0); return; }
      if (s.face.eyes === 'almond') { shape(ctx, () => { ctx.moveTo(ex - w * 1.3, ey); ctx.quadraticCurveTo(ex, ey - es * 1.1 * sq, ex + w * 1.3, ey); ctx.quadraticCurveTo(ex, ey + es * 0.8 * sq, ex - w * 1.3, ey); }, '#ffffff', L, lw * 0.6); shape(ctx, () => ctx.arc(ex + turn * w * 0.3, ey, es * 0.5, 0, TAU), C.eyes, null, 0); return; }
      shape(ctx, () => ctx.ellipse(ex, ey, w, es * 1.2 * sq, 0, 0, TAU), C.eyes, null, 0);
      shape(ctx, () => ctx.arc(ex + w * 0.35, ey - es * 0.4, es * 0.32, 0, TAU), '#ffffff', null, 0);
    };
    if (side) eyeAt(fx + headR * 0.15, false);
    else { eyeAt(fx - sp, q); eyeAt(fx + sp, false); }
    // brows
    if (s.face.brows !== 'none') {
      ctx.strokeStyle = C.hair === C.skin ? C.line : C.hair; ctx.lineWidth = lw * (s.face.brows === 'bold' ? 2 : 1.2);
      const by = ey - es * 1.9;
      const tilt = expr === 'angry' ? -0.35 : expr === 'sad' ? 0.3 : expr === 'surprised' ? 0 : 0.05;
      const brow = (bx, d) => { ctx.beginPath(); ctx.moveTo(bx - es * 1.1, by - (expr === 'surprised' ? es * 0.5 : 0) + d * tilt * es * 1.5 * -1); ctx.lineTo(bx + es * 1.1, by - (expr === 'surprised' ? es * 0.5 : 0) + d * tilt * es * 1.5); ctx.stroke(); };
      if (side) brow(fx + headR * 0.15, 1); else { brow(fx - sp, -1); brow(fx + sp, 1); }
    }
    // nose
    ctx.strokeStyle = L; ctx.lineWidth = lw * 0.8;
    if (side) { ctx.beginPath(); ctx.moveTo(hx + hw * 0.92, ey + es); ctx.lineTo(hx + hw * 1.12, ey + es * 2.6); ctx.lineTo(hx + hw * 0.95, ey + es * 2.9); ctx.stroke(); }
    else if (s.face.nose === 'animal') shape(ctx, () => ctx.ellipse(fx, ey + headR * 0.42, headR * 0.13, headR * 0.09, 0, 0, TAU), C.line, null, 0);
    else if (s.face.nose !== 'none') { ctx.beginPath(); ctx.moveTo(fx + turn * es, ey + es * 1.4); ctx.quadraticCurveTo(fx + es * 0.6 + turn * es, ey + es * 2.4, fx + turn * es * 0.3, ey + es * 2.6); ctx.stroke(); }
    // mouth
    const my = headCy + headR * (s.face.nose === 'animal' ? 0.62 : 0.55), mx = fx + (side ? headR * 0.3 : 0), mw = headR * 0.26 * (1 - turn * 0.4);
    ctx.lineWidth = lw * 1.1; ctx.strokeStyle = L;
    if (expr === 'happy') shape(ctx, () => { ctx.moveTo(mx - mw, my - 2); ctx.quadraticCurveTo(mx, my + mw * 1.4, mx + mw, my - 2); }, '#8a2a2a', L, lw);
    else if (expr === 'surprised') shape(ctx, () => ctx.ellipse(mx, my + 3, mw * 0.4, mw * 0.55, 0, 0, TAU), '#5a1a1a', L, lw);
    else if (expr === 'sad') { ctx.beginPath(); ctx.moveTo(mx - mw * 0.8, my + mw * 0.4); ctx.quadraticCurveTo(mx, my - mw * 0.3, mx + mw * 0.8, my + mw * 0.4); ctx.stroke(); }
    else if (expr === 'angry') { ctx.beginPath(); ctx.moveTo(mx - mw * 0.8, my + mw * 0.2); ctx.lineTo(mx + mw * 0.8, my + mw * 0.1); ctx.stroke(); }
    else if (expr === 'thinking') { ctx.beginPath(); ctx.moveTo(mx - mw * 0.6, my + mw * 0.1); ctx.quadraticCurveTo(mx, my + mw * 0.25, mx + mw * 0.7, my - mw * 0.15); ctx.stroke(); }
    else { ctx.beginPath(); ctx.moveTo(mx - mw * 0.75, my); ctx.quadraticCurveTo(mx, my + mw * 0.55, mx + mw * 0.75, my); ctx.stroke(); }
    // blush and face marks
    if (kidLike || s.face.blush) { ctx.fillStyle = C.blush + '66'; [fx - sp * 1.5, fx + sp * 1.5].forEach((bx, i) => { if (side && i === 0) return; ctx.beginPath(); ctx.ellipse(bx, ey + es * 2.2, es * 1.1, es * 0.6, 0, 0, TAU); ctx.fill(); }); }
    (s.face.marks || []).forEach((m) => {
      if (m === 'tilak') { ctx.fillStyle = C.accent; ctx.beginPath(); ctx.moveTo(fx - es * 0.4, ey - es * 2.6); ctx.lineTo(fx, ey - es * 0.9); ctx.lineTo(fx + es * 0.4, ey - es * 2.6); ctx.fill(); ctx.fillStyle = '#d62828'; ctx.fillRect(fx - es * 0.12, ey - es * 2.5, es * 0.24, es * 1.3); }
      if (m === 'bindi') shape(ctx, () => ctx.arc(fx, ey - es * 1.9, es * 0.35, 0, TAU), '#d62828', null, 0);
      if (m === 'third-eye') { ctx.strokeStyle = C.line; ctx.lineWidth = lw; ctx.beginPath(); ctx.ellipse(fx, ey - es * 2.4, es * 0.3, es * 0.6, 0, 0, TAU); ctx.stroke(); }
      if (m === 'mustache') { ctx.fillStyle = C.hair; ctx.beginPath(); ctx.moveTo(mx, my - mw * 0.35); ctx.quadraticCurveTo(mx - mw * 1.4, my - mw * 0.6, mx - mw * 1.5, my + mw * 0.1); ctx.quadraticCurveTo(mx - mw * 0.6, my - mw * 0.05, mx, my - mw * 0.1); ctx.quadraticCurveTo(mx + mw * 0.6, my - mw * 0.05, mx + mw * 1.5, my + mw * 0.1); ctx.quadraticCurveTo(mx + mw * 1.4, my - mw * 0.6, mx, my - mw * 0.35); ctx.fill(); }
      if (m === 'beard') shape(ctx, () => { ctx.moveTo(hx - hw * 0.85, headCy + headR * 0.2); ctx.quadraticCurveTo(hx - hw * 0.6, headCy + headR * 1.4, hx + turn * headR * 0.4, headCy + headR * 1.5); ctx.quadraticCurveTo(hx + hw * 0.6, headCy + headR * 1.4, hx + hw * 0.85, headCy + headR * 0.2); ctx.quadraticCurveTo(hx, headCy + headR * 0.85, hx - hw * 0.85, headCy + headR * 0.2); }, C.hair, L, lw);
      if (m === 'freckles') { ctx.fillStyle = '#b06a40'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(fx - sp * 1.4 + k * 4, ey + es * 1.8 + (k % 2) * 3, 1.6, 0, TAU); ctx.arc(fx + sp * 1.4 - k * 4, ey + es * 1.8 + (k % 2) * 3, 1.6, 0, TAU); ctx.fill(); } }
    });
  }

  // ---- hair (front)
  const hairFront = () => {
    const st = s.hair.style;
    if (st === 'bald' || st === 'none') return;
    const top = headCy - headR * 1.05;
    shape(ctx, () => {
      ctx.moveTo(hx - hw * 1.04, headCy - headR * 0.05);
      ctx.quadraticCurveTo(hx - hw * 1.1, top - headR * 0.15 * hv, hx, top - headR * 0.1 * hv);
      ctx.quadraticCurveTo(hx + hw * 1.1, top - headR * 0.15 * hv, hx + hw * 1.04, headCy - headR * 0.05);
      if (back) { ctx.quadraticCurveTo(hx + hw, headCy + headR * 0.9, hx, headCy + headR * 0.95); ctx.quadraticCurveTo(hx - hw, headCy + headR * 0.9, hx - hw * 1.04, headCy - headR * 0.05); }
      else { ctx.quadraticCurveTo(hx + hw * 0.6 - turn * headR * 0.6, headCy - headR * 0.75, hx + turn * headR * 0.25, headCy - headR * 0.6); ctx.quadraticCurveTo(hx - hw * 0.6, headCy - headR * 0.75, hx - hw * 1.04, headCy - headR * 0.05); }
    }, C.hair, L, lw);
    if (st === 'bun' || st === 'topknot') shape(ctx, () => ctx.arc(hx - turn * headR * 0.3, top - headR * 0.25, headR * (st === 'bun' ? 0.38 : 0.3), 0, TAU), C.hair, L, lw);
    if (st === 'curly') for (let k = 0; k < 7; k++) shape(ctx, () => ctx.arc(hx - hw + (k / 6) * hw * 2, top + headR * 0.05 + Math.sin(k) * 4, headR * 0.22, 0, TAU), C.hair, L, lw * 0.6);
  };
  if (!['fox', 'cat'].includes(s.ears) || s.hair.style !== 'none') hairFront();

  // ---- headwear
  const crownY = headCy - headR * 1.05;
  if (s.accessories.includes('crown')) shape(ctx, () => { const w = hw * 0.9; ctx.moveTo(hx - w, crownY + headR * 0.15); ctx.lineTo(hx - w, crownY - headR * 0.35); ctx.lineTo(hx - w * 0.5, crownY - headR * 0.1); ctx.lineTo(hx, crownY - headR * 0.6); ctx.lineTo(hx + w * 0.5, crownY - headR * 0.1); ctx.lineTo(hx + w, crownY - headR * 0.35); ctx.lineTo(hx + w, crownY + headR * 0.15); }, C.accent, L, lw);
  if (s.accessories.includes('tall-crown')) {
    shape(ctx, () => { const w = hw * 0.8; ctx.moveTo(hx - w, crownY + headR * 0.2); ctx.lineTo(hx - w * 0.55, crownY - headR * 0.9); ctx.lineTo(hx, crownY - headR * 1.25); ctx.lineTo(hx + w * 0.55, crownY - headR * 0.9); ctx.lineTo(hx + w, crownY + headR * 0.2); }, C.accent, L, lw);
    shape(ctx, () => ctx.arc(hx, crownY - headR * 0.3, headR * 0.13, 0, TAU), '#d62828', L, lw * 0.5);
  }
  if (s.accessories.includes('peacock-feather')) {
    ctx.save(); ctx.translate(hx + hw * 0.35, crownY - headR * 0.5); ctx.rotate(0.35);
    shape(ctx, () => ctx.ellipse(0, -headR * 0.5, headR * 0.22, headR * 0.6, 0, 0, TAU), '#1f8a70', L, lw * 0.5);
    shape(ctx, () => ctx.ellipse(0, -headR * 0.7, headR * 0.13, headR * 0.2, 0, 0, TAU), '#f2c14e', null, 0);
    shape(ctx, () => ctx.ellipse(0, -headR * 0.7, headR * 0.07, headR * 0.11, 0, 0, TAU), '#1a3a8a', null, 0);
    ctx.restore();
  }
  if (s.accessories.includes('crescent')) { ctx.save(); ctx.fillStyle = '#f5f0d8'; ctx.beginPath(); ctx.arc(hx + hw * 0.3, crownY - headR * 0.15, headR * 0.26, 0, TAU); ctx.fill(); ctx.fillStyle = C.hair; ctx.beginPath(); ctx.arc(hx + hw * 0.4, crownY - headR * 0.22, headR * 0.22, 0, TAU); ctx.fill(); ctx.restore(); }
  if (s.accessories.includes('helmet')) shape(ctx, () => { ctx.moveTo(hx - hw * 1.08, headCy - headR * 0.1); ctx.quadraticCurveTo(hx, headCy - headR * 1.8, hx + hw * 1.08, headCy - headR * 0.1); ctx.lineTo(hx + hw * 1.08, headCy - headR * 0.3); ctx.quadraticCurveTo(hx, headCy - headR * 0.55, hx - hw * 1.08, headCy - headR * 0.3); }, '#9aa3ad', L, lw);
  if (s.accessories.includes('turban')) { shape(ctx, () => ctx.ellipse(hx, crownY + headR * 0.05, hw * 1.12, headR * 0.5, 0, Math.PI, TAU), C.accent, L, lw); shape(ctx, () => ctx.arc(hx, crownY - headR * 0.05, headR * 0.12, 0, TAU), '#d62828', L, lw * 0.5); }
  if (s.accessories.includes('halo')) { ctx.save(); ctx.globalCompositeOperation = 'destination-over'; const g = ctx.createRadialGradient(hx, headCy, headR * 0.8, hx, headCy, headR * 2.1); g.addColorStop(0, 'rgba(255,215,110,0.95)'); g.addColorStop(1, 'rgba(255,215,110,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(hx, headCy, headR * 2.1, 0, TAU); ctx.fill(); ctx.restore(); }
  if (s.accessories.includes('glasses') && !back) { ctx.strokeStyle = L; ctx.lineWidth = lw; const ey = headCy + headR * 0.02, sp = headR * 0.38 * (1 - turn * 0.45), fx = hx + turn * headR * 0.28; ctx.beginPath(); ctx.arc(fx - sp, ey, headR * 0.22, 0, TAU); ctx.moveTo(fx + sp + headR * 0.22, ey); ctx.arc(fx + sp, ey, headR * 0.22, 0, TAU); ctx.moveTo(fx - sp + headR * 0.22, ey); ctx.lineTo(fx + sp - headR * 0.22, ey); ctx.stroke(); }

  ctx.restore();
  return { headCy, headR, shoulderY, hipY, handR, handL };
}

// Reference sheet: turnaround + expressions + palette + notes.
export function drawSheet(ctx, W, H, specIn) {
  const s = normalize(specIn);
  ctx.fillStyle = '#f7f5f0'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#1d1d22'; ctx.font = '800 40px Inter, DejaVu Sans'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText(`${s.name || s.id}  ·  v${s.version || 1}`, 40, 28);
  ctx.font = '500 20px Inter, DejaVu Sans'; ctx.fillStyle = '#55555f';
  ctx.fillText([s.role, s.age ? `age ${s.age}` : null, `${s.build.heads} heads tall`].filter(Boolean).join('  ·  '), 40, 78);
  // ground lines
  const gy = 640, hh = 470;
  ctx.strokeStyle = '#d8d4ca'; ctx.lineWidth = 2;
  for (let k = 0; k <= s.build.heads; k++) { const yy = gy - (hh / s.build.heads) * k; ctx.beginPath(); ctx.moveTo(30, yy); ctx.lineTo(1290, yy); ctx.stroke(); }
  [['front', 'FRONT'], ['34', '3/4'], ['side', 'SIDE'], ['back', 'BACK']].forEach(([v, lab], i) => {
    const cx = 170 + i * 300;
    drawCharacter(ctx, s, { x: cx, y: gy, h: hh, view: v, expr: 'neutral', pose: 'stand' });
    ctx.fillStyle = '#1d1d22'; ctx.font = '700 22px Inter, DejaVu Sans'; ctx.textAlign = 'center'; ctx.fillText(lab, cx, gy + 18);
  });
  // expressions
  ctx.fillStyle = '#ece8de'; ctx.fillRect(1320, 0, W - 1320, H);
  ctx.fillStyle = '#1d1d22'; ctx.font = '800 24px Inter, DejaVu Sans'; ctx.textAlign = 'left'; ctx.fillText('EXPRESSIONS', 1350, 28);
  const ex = ['neutral', 'happy', 'sad', 'angry', 'surprised', 'thinking'];
  ex.forEach((e, i) => {
    const cx = 1430 + (i % 3) * 165, cy = 120 + Math.floor(i / 3) * 230;
    ctx.save(); ctx.beginPath(); ctx.rect(cx - 80, cy - 10, 160, 200); ctx.clip();
    const hr = 62, fh = hr * 2 * s.build.heads, feet = cy + 85 + fh - hr;
    drawCharacter(ctx, s, { x: cx, y: feet, h: fh, view: 'front', expr: e });
    ctx.restore();
    ctx.fillStyle = '#55555f'; ctx.font = '600 16px Inter, DejaVu Sans'; ctx.textAlign = 'center'; ctx.fillText(e, cx, cy + 196);
  });
  // poses
  ctx.fillStyle = '#1d1d22'; ctx.font = '800 24px Inter, DejaVu Sans'; ctx.textAlign = 'left'; ctx.fillText('POSES', 1350, 600);
  ['wave', 'walk', 'point', 'hero'].forEach((p, i) => drawCharacter(ctx, s, { x: 1400 + i * 125, y: 900, h: 260, view: p === 'walk' ? '34' : 'front', expr: p === 'hero' ? 'happy' : 'neutral', pose: p }));
  // palette
  const cols = Object.entries(s.colors);
  ctx.font = '600 14px DejaVu Sans Mono'; ctx.textAlign = 'center';
  cols.forEach(([k, v], i) => { const x = 40 + i * 112; ctx.fillStyle = v; ctx.fillRect(x, 720, 96, 60); ctx.strokeStyle = '#1d1d22'; ctx.lineWidth = 1; ctx.strokeRect(x, 720, 96, 60); ctx.fillStyle = '#1d1d22'; ctx.fillText(k, x + 48, 788); ctx.fillText(v, x + 48, 806); });
  // notes
  ctx.textAlign = 'left'; ctx.font = '500 18px Inter, DejaVu Sans'; ctx.fillStyle = '#33333a';
  const notes = [
    s.personality && `Personality: ${s.personality}`,
    s.voice && `Voice: ${s.voice}`,
    s.signature && `Signature: ${s.signature}`,
    s.accessories.length && `Always carries / wears: ${s.accessories.join(', ')}`,
    s.source && `Source: ${s.source}`,
  ].filter(Boolean);
  notes.forEach((n, i) => ctx.fillText(n, 40, 850 + i * 28));
}
