// Shortkit: the pieces every vertical facts Short in the "firm narrator" format shares (formats/02-facts-science/shorts.md).
//   import * as K from '../../.claude/skills/limiko-studio/frames/shortkit.js';
//   const { shot, cutAt, since } = K.pickShot(t, [[0, 'nest'], [c('gap'), 'glimpse'], …]);
//   K.cam(ctx, W, H, T, { x, y, zoom }, K.drift(t), K.punch(since, cutAt), () => drawWorld());
//   K.label(ctx, 'FLOOD', W / 2, H * 0.3, t, c('flood') + 0.4, 92, '#5cc8ff');      // one kinetic label per beat
//   K.flash(ctx, W, H, since, cutAt);                                               // short white flash on each cut
//   K.captions(ctx, W, H, L, t, S.tl, { lang });                                     // word-by-word captions in the safe zone
// Safe zone for Shorts/Reels: keep text between 18% and 72% of the height and away from the right 12% (buttons).
import { drawText } from './textfx.js';

export function pickShot(t, cuts) {
  let shot = cuts[0][1], cutAt = cuts[0][0];
  for (const [ct, nm] of cuts) if (t >= ct) { shot = nm; cutAt = ct; }
  return { shot, cutAt, since: t - cutAt };
}

// always-moving camera: slow drift + a tiny roll (directing.md §0)
export const drift = (t, amt = 1) => ({ dx: Math.sin(t * 0.31) * 10 * amt, dy: Math.cos(t * 0.23) * 8 * amt, rot: Math.sin(t * 0.17) * 0.006 * amt });
// zoom punch right after a cut (facts effect level 2), none at the very start
export const punch = (since, cutAt, amount = 0.07) => (cutAt > 0 ? 1 + amount * Math.exp(-since * 10) : 1);

export function cam(ctx, W, H, T, o, d, p, draw) {
  T.camera(ctx, W, H, { x: o.x + d.dx, y: o.y + d.dy, zoom: o.zoom * p, rot: d.rot }, draw);
}

export function flash(ctx, W, H, since, cutAt, len = 0.14, alpha = 0.55) {
  if (cutAt > 0 && since < len) { ctx.fillStyle = `rgba(255,255,255,${alpha * (1 - since / len)})`; ctx.fillRect(0, 0, W, H); }
}

export function label(ctx, text, x, y, t, start, size = 84, color = '#ffd23f', { lang = 'en', hold = 99, preset = 'popBounce' } = {}) {
  const font = lang === 'te' ? '"Noto Sans Telugu", Inter, sans-serif' : 'Inter, sans-serif';
  drawText(ctx, text, { x, y, t, start, preset, size, font, weight: 900, color, stroke: '#000', strokeW: 10, unit: 'word', stagger: 0.05, dur: 0.4, hold, lang });
}

// timer / counter pill ("66 s", "WEEK 2", "DAY 7")
export function pill(ctx, W, y, text, { color = '#ffd23f', size = 84, width = 380 } = {}) {
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.beginPath(); ctx.roundRect(W / 2 - width / 2, y, width, size * 1.45, 30); ctx.fill();
  ctx.fillStyle = color; ctx.font = `900 ${size}px Inter, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, W / 2, y + size * 0.74);
}

/** Word-by-word captions from voice.py's timeline: the current chunk, the spoken word in yellow, up to two lines. */
export function captions(ctx, W, H, L, t, tl, { lang = 'en', y = 0.66, size = 70, on = '#ffd23f', off = '#ffffff' } = {}) {
  const caps = tl.captions || [];
  const cap = caps.find((cp, i) => t >= cp.start - 0.05 && t < (caps[i + 1] ? Math.min(caps[i + 1].start - 0.05, cp.end + 0.4) : cp.end + 0.8));
  if (!cap) return;
  const font = lang === 'te' ? '"Noto Sans Telugu", Inter, sans-serif' : 'Inter, sans-serif';
  const gap = size * 0.34;
  ctx.font = `900 ${size}px ${font}`; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  const maxW = W * 0.86, lines = [[]]; let lw = 0;
  for (const w of cap.words || []) {
    const s = w.word, wd = ctx.measureText(s).width + gap;
    if (lw + wd > maxW && lines[lines.length - 1].length) { lines.push([]); lw = 0; }
    lines[lines.length - 1].push({ ...w, s, wd }); lw += wd;
  }
  const lh = size * (lang === 'te' ? 1.45 : 1.2), y0 = H * y - (lines.length - 1) * lh / 2;
  lines.forEach((ln, li) => {
    let x = W / 2 - ln.reduce((a, b) => a + b.wd, 0) / 2;
    for (const w of ln) {
      const speaking = t >= w.start - 0.02 && t < (w.end ?? w.start + 0.3) + 0.05, sc = speaking ? 1.08 : 1;
      ctx.save(); ctx.translate(x + w.wd / 2, y0 + li * lh); ctx.scale(sc, sc);
      ctx.lineWidth = size * 0.2; ctx.strokeStyle = '#000'; ctx.lineJoin = 'round'; ctx.strokeText(w.s, -(w.wd - gap) / 2, 0);
      ctx.fillStyle = speaking ? on : off; ctx.fillText(w.s, -(w.wd - gap) / 2, 0);
      ctx.restore(); x += w.wd;
    }
  });
}
