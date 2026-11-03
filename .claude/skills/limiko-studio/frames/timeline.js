// Timeline toolkit: everything is a pure function of time t (seconds), so any frame re-renders identically.

// ---- easing ---------------------------------------------------------------------
export const ease = {
  linear: (x) => x,
  in: (x) => x * x * x,
  out: (x) => 1 - Math.pow(1 - x, 3),
  inOut: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  backOut: (x, s = 1.6) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2),
  sine: (x) => -(Math.cos(Math.PI * x) - 1) / 2,
  step: (x) => (x < 1 ? 0 : 1),
};
const pickEase = (e) => (typeof e === 'function' ? e : ease[e || 'inOut']);
const clamp01 = (x) => Math.max(0, Math.min(1, x));

// ---- interpolate: piecewise map of t across ranges ---------------------------------
// interpolate(t, [0, 1, 2], [0, 100, 50], { ease: 'out' })
export function interpolate(t, input, output, { ease: e = 'linear', clamp = true } = {}) {
  const f = pickEase(e);
  if (t <= input[0]) return clamp ? output[0] : output[0] + (output[1] - output[0]) * ((t - input[0]) / (input[1] - input[0]));
  for (let i = 0; i < input.length - 1; i++) {
    if (t <= input[i + 1]) {
      const p = (t - input[i]) / (input[i + 1] - input[i]);
      return output[i] + (output[i + 1] - output[i]) * f(p);
    }
  }
  return output[output.length - 1];
}

// ---- spring: damped harmonic motion from `from` to `to`, starting at `delay` -------------
export function spring(t, { from = 0, to = 1, delay = 0, stiffness = 170, damping = 14, mass = 1 } = {}) {
  const x = t - delay;
  if (x <= 0) return from;
  const w0 = Math.sqrt(stiffness / mass), zeta = damping / (2 * Math.sqrt(stiffness * mass));
  let e;
  if (zeta < 1) { const wd = w0 * Math.sqrt(1 - zeta * zeta); e = Math.exp(-zeta * w0 * x) * (Math.cos(wd * x) + (zeta * w0 / wd) * Math.sin(wd * x)); }
  else e = Math.exp(-w0 * x) * (1 + w0 * x);
  return to + (from - to) * e;
}

// ---- sequence: a scene's local clock inside the film -------------------------------------
// const s = sequence(t, 2.0, 3.5); if (s.active) drawScene(s.t, s.p)
export function sequence(t, start, duration) {
  const lt = t - start;
  return { active: lt >= 0 && lt < duration, t: lt, p: clamp01(lt / duration), done: lt >= duration };
}

// ---- script: tweens that run in order, together, or wait for cues -------------------------
// const tl = script({ x: 0, alpha: 0 }, cues)
//   .to('alpha', 1, 0.5).to('x', 300, 1.2, 'out').wait(0.3)
//   .together((g) => g.to('x', 600, 1).to('alpha', 0, 1))
//   .until('magma')            // jump the cursor to a voiceover cue
//   .to('x', 0, 0.8);
// tl.get('x', t) · tl.all(t) · tl.duration
export function script(initial = {}, cues = {}) {
  const tracks = {}; // name -> [{start,end,from,to,ease}]
  const last = { ...initial };
  let cursor = 0, duration = 0;
  const api = {
    cues,
    to(name, value, dur, e = 'inOut') {
      const seg = { start: cursor, end: cursor + dur, from: last[name] ?? 0, to: value, ease: pickEase(e) };
      (tracks[name] ||= []).push(seg); last[name] = value;
      cursor += dur; duration = Math.max(duration, cursor); return api;
    },
    set(name, value) { return api.to(name, value, 0, 'step'); },
    wait(d) { cursor += d; duration = Math.max(duration, cursor); return api; },
    at(time) { cursor = time; return api; },
    until(cue) { if (!(cue in cues)) throw new Error(`unknown cue ${cue}`); cursor = Math.max(cursor, cues[cue]); return api; },
    together(fn) {
      const start = cursor; let end = start;
      const g = new Proxy(api, { get(target, k) { if (k === 'to') return (n, v, d, e) => { cursor = start; target.to(n, v, d, e); end = Math.max(end, cursor); return g; }; return target[k]; } });
      fn(g); cursor = end; duration = Math.max(duration, end); return api;
    },
    get(name, t) {
      const segs = tracks[name];
      if (!segs) return initial[name];
      let v = initial[name] ?? segs[0].from;
      for (const s of segs) {
        if (t < s.start) break;
        v = t >= s.end || s.end === s.start ? s.to : s.from + (s.to - s.from) * s.ease((t - s.start) / (s.end - s.start));
      }
      return v;
    },
    all(t) { const o = { ...initial }; for (const k of Object.keys(tracks)) o[k] = api.get(k, t); return o; },
    get duration() { return duration; },
  };
  return api;
}

// ---- cues from word timings: [{word, start}] -> { word: firstStart } ---------------------
export function cuesFromWords(words, pick = null) {
  const out = {};
  for (const w of words) { const k = (w.cue || w.word || '').toLowerCase().replace(/[^a-z0-9-]/g, ''); if (k && !(k in out) && (!pick || pick.includes(k))) out[k] = w.start; }
  return out;
}

// ---- tracker: one value drives a whole diagram (with derived values) -----------------------
// const temp = tracker((t) => interpolate(t, [0, 4], [20, 100])); temp(t), temp.map(v => v / 100)(t)
export function tracker(fn) { const f = (t) => fn(t); f.map = (g) => tracker((t) => g(fn(t))); return f; }

// ---- exposure sheet: hold drawings for N frames (on ones, twos, threes) --------------------
// const tt = onTwos(t, 24)             // quantised time for hand-made styles
// const drawing = exposure(t, 24, [4, 4, 2, 2, 6])  // index of the drawing showing at t
export function onN(t, fps, n) { return Math.floor((t * fps) / n) * n / fps; }
export const onTwos = (t, fps = 24) => onN(t, fps, 2);
export function exposure(t, fps, holds, loop = true) {
  const total = holds.reduce((a, b) => a + b, 0);
  let f = Math.floor(t * fps); if (loop) f %= total;
  for (let i = 0; i < holds.length; i++) { if (f < holds[i]) return i; f -= holds[i]; }
  return holds.length - 1;
}

// ---- camera: pan / zoom / rotate around a focus point ------------------------------------
// camera(ctx, W, H, { x, y, zoom, rot }, () => drawWorld())
export function camera(ctx, W, H, { x = W / 2, y = H / 2, zoom = 1, rot = 0, shake = 0, seed = 0, t = 0 } = {}, drawFn) {
  ctx.save();
  const sx = shake ? Math.sin(t * 53 + seed) * shake + Math.sin(t * 31) * shake * 0.5 : 0;
  const sy = shake ? Math.cos(t * 47 + seed) * shake : 0;
  ctx.translate(W / 2 + sx, H / 2 + sy); ctx.rotate(rot); ctx.scale(zoom, zoom); ctx.translate(-x, -y);
  drawFn(); ctx.restore();
}

// ---- parallax: layers move at different rates for depth -----------------------------------
// parallax(ctx, W, H, cam, [{ depth: 0.3, draw }, { depth: 1, draw }, { depth: 1.6, draw }])
export function parallax(ctx, W, H, cam, layers) {
  for (const L of layers) {
    const d = L.depth;
    camera(ctx, W, H, { x: W / 2 + (cam.x - W / 2) * d, y: H / 2 + (cam.y - H / 2) * d, zoom: 1 + (cam.zoom - 1) * d, rot: (cam.rot || 0) * d }, L.draw);
  }
}

// ---- morph: blend two point sets (resampled to the same length) -----------------------------
export function resample(pts, n) {
  const segs = []; let total = 0;
  for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; const l = Math.hypot(b[0] - a[0], b[1] - a[1]); segs.push([a, b, l]); total += l; }
  const out = []; let si = 0, acc = 0;
  for (let k = 0; k < n; k++) {
    const target = (k / n) * total;
    while (si < segs.length - 1 && acc + segs[si][2] < target) { acc += segs[si][2]; si++; }
    const [a, b, l] = segs[si]; const u = l ? (target - acc) / l : 0;
    out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]);
  }
  return out;
}
export function morph(a, b, p, n = 120) {
  const A = resample(a, n), B = resample(b, n);
  return A.map(([x, y], i) => [x + (B[i][0] - x) * p, y + (B[i][1] - y) * p]);
}

// ---- secondary motion helpers -----------------------------------------------------------------
export const sway = (t, amp = 1, speed = 1, phase = 0) => Math.sin(t * speed * Math.PI * 2 + phase) * amp;
export const bob = (t, amp = 1, speed = 1) => Math.abs(Math.sin(t * speed * Math.PI)) * amp;
