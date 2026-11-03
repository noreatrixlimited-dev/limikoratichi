// Shared drawing helpers for style frames. Everything is seeded, so every render is identical.

export function rng(seed = 1) {
  let a = seed >>> 0;
  const r = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  r.range = (lo, hi) => lo + r() * (hi - lo);
  r.pick = (arr) => arr[Math.floor(r() * arr.length)];
  r.int = (lo, hi) => Math.floor(r.range(lo, hi + 1));
  return r;
}

export const TAU = Math.PI * 2;

export function rgba(hex, a = 1) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export function fill(ctx, W, H, color) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, W, H);
}

// Per-pixel noise. amt 0..1, mono or coloured.
export function grain(ctx, W, H, amt = 0.08, seed = 7, mono = true) {
  const r = rng(seed);
  const img = ctx.getImageData(0, 0, W, H);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (r() - 0.5) * 255 * amt;
    if (mono) {
      d[i] += n; d[i + 1] += n; d[i + 2] += n;
    } else {
      d[i] += n; d[i + 1] += (r() - 0.5) * 255 * amt; d[i + 2] += (r() - 0.5) * 255 * amt;
    }
  }
  ctx.putImageData(img, 0, 0);
}

// Paper: base colour, soft blotches, fibres, grain.
export function paper(ctx, W, H, base = '#f4ead5', seed = 3, tone = '#c9b48a') {
  const r = rng(seed);
  fill(ctx, W, H, base);
  for (let i = 0; i < 40; i++) {
    const x = r() * W, y = r() * H, rad = r.range(80, 300);
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, rgba(tone, 0.06));
    g.addColorStop(1, rgba(tone, 0));
    ctx.fillStyle = g;
    ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  ctx.strokeStyle = rgba(tone, 0.12);
  ctx.lineWidth = 0.6;
  for (let i = 0; i < 300; i++) {
    const x = r() * W, y = r() * H, a = r() * TAU, l = r.range(4, 14);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); ctx.stroke();
  }
  grain(ctx, W, H, 0.05, seed + 1);
}

export function vignette(ctx, W, H, strength = 0.5, color = '#000') {
  const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
  g.addColorStop(0, rgba(color, 0));
  g.addColorStop(1, rgba(color, strength));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

// Wobbly closed or open path through points.
export function wobble(ctx, pts, amp = 2, r = rng(5), closed = true) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => {
    const jx = x + (r() - 0.5) * amp, jy = y + (r() - 0.5) * amp;
    i ? ctx.lineTo(jx, jy) : ctx.moveTo(jx, jy);
  });
  if (closed) ctx.closePath();
}

export function circlePts(cx, cy, rx, ry = rx, n = 48, rot = 0) {
  return Array.from({ length: n }, (_, i) => {
    const a = rot + (i / n) * TAU;
    return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry];
  });
}

export function blobPts(cx, cy, rad, r, n = 10, var_ = 0.25) {
  const base = Array.from({ length: n }, () => rad * (1 + (r() - 0.5) * var_ * 2));
  const out = [];
  for (let i = 0; i < n * 6; i++) {
    const t = (i / (n * 6)) * n, k = Math.floor(t), f = t - k;
    const a0 = base[k % n], a1 = base[(k + 1) % n];
    const rr = a0 + (a1 - a0) * (0.5 - Math.cos(f * Math.PI) / 2);
    const a = (i / (n * 6)) * TAU;
    out.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  return out;
}

// Crayon: fill a shape with many short jittery strokes, then a rough outline.
export function crayon(ctx, pts, color, r = rng(9), { density = 1, outline = true, width = 3 } = {}) {
  ctx.save();
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.clip();
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  const step = 5 / density;
  for (let y = y0 - 20; y < y1 + 20; y += step) {
    ctx.globalAlpha = r.range(0.45, 0.85);
    ctx.lineWidth = r.range(width * 0.7, width * 1.4);
    ctx.beginPath();
    ctx.moveTo(x0 - 20, y + r.range(-3, 3));
    for (let x = x0; x < x1 + 20; x += 18) ctx.lineTo(x, y + r.range(-3, 3) + (x - x0) * 0.18);
    ctx.stroke();
  }
  ctx.restore();
  if (outline) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.9;
    ctx.lineWidth = width;
    for (let k = 0; k < 2; k++) { wobble(ctx, pts, 3, r); ctx.stroke(); }
    ctx.restore();
  }
}

// Watercolour wash: many low-alpha jittered blobs with a darker edge.
export function wash(ctx, pts, color, r = rng(11), layers = 14) {
  ctx.save();
  for (let i = 0; i < layers; i++) {
    ctx.globalAlpha = 0.07;
    ctx.fillStyle = color;
    wobble(ctx, pts.map(([x, y]) => [x + r.range(-6, 6), y + r.range(-6, 6)]), 10, r);
    ctx.fill();
  }
  ctx.globalAlpha = 0.25;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  wobble(ctx, pts, 4, r);
  ctx.stroke();
  ctx.restore();
}

export function poly(ctx, pts) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
}

export function text(ctx, s, x, y, { size = 48, font = 'Inter', weight = 800, color = '#000', align = 'center',
  stroke = null, strokeW = 0, base = 'middle', italic = false, spacing = 0 } = {}) {
  ctx.save();
  ctx.font = `${italic ? 'italic ' : ''}${weight} ${size}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = base;
  if (spacing) ctx.letterSpacing = `${spacing}px`;
  if (stroke) { ctx.lineJoin = 'round'; ctx.strokeStyle = stroke; ctx.lineWidth = strokeW; ctx.strokeText(s, x, y); }
  ctx.fillStyle = color;
  ctx.fillText(s, x, y);
  ctx.restore();
}

// Halftone dots driven by a brightness function f(x,y) -> 0..1 (1 = full ink).
export function halftone(ctx, W, H, f, cell = 10, color = '#000', angle = 0.4) {
  ctx.save();
  ctx.fillStyle = color;
  const ca = Math.cos(angle), sa = Math.sin(angle), R = Math.hypot(W, H);
  for (let u = -R; u < R; u += cell) {
    for (let v = -R; v < R; v += cell) {
      const x = W / 2 + u * ca - v * sa, y = H / 2 + u * sa + v * ca;
      if (x < -cell || y < -cell || x > W + cell || y > H + cell) continue;
      const k = f(x, y);
      if (k <= 0.02) continue;
      ctx.beginPath(); ctx.arc(x, y, (cell / 2) * Math.sqrt(k) * 1.15, 0, TAU); ctx.fill();
    }
  }
  ctx.restore();
}

// Isometric projection helpers (2:1).
export function iso(ox, oy, s) {
  return (x, y, z = 0) => [ox + (x - y) * s, oy + (x + y) * s * 0.5 - z * s];
}

export function isoBox(ctx, P, x, y, z, w, d, h, top, left, right, line = null) {
  const a = P(x, y, z + h), b = P(x + w, y, z + h), c = P(x + w, y + d, z + h), e = P(x, y + d, z + h);
  const b0 = P(x + w, y, z), c0 = P(x + w, y + d, z), e0 = P(x, y + d, z);
  const face = (pts, col) => { poly(ctx, pts); ctx.fillStyle = col; ctx.fill(); if (line) { ctx.strokeStyle = line; ctx.lineWidth = 1; ctx.stroke(); } };
  face([e, c, c0, e0], left);
  face([c, b, b0, c0], right);
  face([a, b, c, e], top);
}

export function star(ctx, cx, cy, r1, r2, n = 5, rot = -Math.PI / 2) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const a = rot + (i / (n * 2)) * TAU, rr = i % 2 ? r2 : r1;
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  poly(ctx, pts);
}

export function lerp(a, b, t) { return a + (b - a) * t; }

export function mixHex(h1, h2, t) {
  const a = parseInt(h1.slice(1), 16), b = parseInt(h2.slice(1), 16);
  const c = (s) => Math.round(lerp((a >> s) & 255, (b >> s) & 255, t));
  return `#${((1 << 24) | (c(16) << 16) | (c(8) << 8) | c(0)).toString(16).slice(1)}`;
}

export function linGrad(ctx, x0, y0, x1, y1, stops) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  stops.forEach(([o, c]) => g.addColorStop(o, c));
  return g;
}

// Scanlines for CRT/VHS looks.
export function scanlines(ctx, W, H, gap = 3, alpha = 0.18) {
  ctx.save();
  ctx.fillStyle = `rgba(0,0,0,${alpha})`;
  for (let y = 0; y < H; y += gap) ctx.fillRect(0, y, W, 1);
  ctx.restore();
}

// Film scratches and dust.
export function filmDamage(ctx, W, H, r = rng(21), n = 10) {
  ctx.save();
  for (let i = 0; i < n; i++) {
    ctx.strokeStyle = `rgba(255,255,255,${r.range(0.08, 0.3)})`;
    ctx.lineWidth = r.range(0.5, 1.5);
    const x = r() * W;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + r.range(-10, 10), H); ctx.stroke();
  }
  for (let i = 0; i < 60; i++) {
    ctx.fillStyle = `rgba(${r() > 0.5 ? '255,255,255' : '0,0,0'},${r.range(0.2, 0.6)})`;
    ctx.beginPath(); ctx.arc(r() * W, r() * H, r.range(0.5, 2.5), 0, TAU); ctx.fill();
  }
  ctx.restore();
}

// Three.js scene setup for 3D frames.
export function three3d(THREE, canvas, W, H, { bg = '#ffffff', fov = 35, ortho = false, orthoSize = 10, shadows = true } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(W, H, false);
  renderer.shadowMap.enabled = shadows;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(bg);
  const camera = ortho
    ? new THREE.OrthographicCamera((-orthoSize * W) / H, (orthoSize * W) / H, orthoSize, -orthoSize, 0.1, 500)
    : new THREE.PerspectiveCamera(fov, W / H, 0.1, 500);
  const sun = (x, y, z, intensity = 2.5, color = '#ffffff', size = 20) => {
    const l = new THREE.DirectionalLight(color, intensity);
    l.position.set(x, y, z);
    l.castShadow = shadows;
    l.shadow.mapSize.set(2048, 2048);
    Object.assign(l.shadow.camera, { left: -size, right: size, top: size, bottom: -size, near: 0.5, far: 200 });
    l.shadow.bias = -0.0005;
    scene.add(l);
    return l;
  };
  const mesh = (geo, mat, x = 0, y = 0, z = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = m.receiveShadow = shadows;
    scene.add(m);
    return m;
  };
  const render = () => renderer.render(scene, camera);
  return { renderer, scene, camera, sun, mesh, render };
}
