// Template: quote / verse card (history, mythology, documentary). Words appear with the reading pace; source shown.
import { drawText } from '../textfx.js';
import { theme, font, drift, background, wrap, scale } from './common.js';

export default {
  dim: '2d', fps: 30,
  defaultProps: { theme: 'history', lang: 'en', text: 'The fort did not fall to the cannon. It fell to the river.', author: 'Chronicle of the siege', note: 'retold', hold: 2.0 },
  setup({ props }) {
    const th = theme(props), words = String(props.text).split(/\s+/).length;
    const read = words / ((props.lang === 'te' ? 1.9 : 2.5) / th.pace);   // seconds to read at a calm pace
    return { th, read, duration: 0.6 + read + props.hold + 0.8 };
  },
  draw(ctx, W, H, L, T, t, S) {
    const p = S.props, th = S.th, k = scale(W, H), f = font(p, th, { serif: true });
    const cam = drift(t, W, H, 0.7); cam.x += T.interpolate(t, [0, S.duration], [-20, 20]);
    T.camera(ctx, W, H, cam, () => background(ctx, W, H, t, th, T, L));
    const size = (H > W ? 46 : 50) * k;
    ctx.font = `700 ${size}px ${f}`;
    const lines = wrap(ctx, p.text, W * 0.74), lh = size * (p.lang === 'te' ? 1.6 : 1.35);
    const top = H / 2 - ((lines.length - 1) * lh) / 2 - 30 * k;
    const out = T.interpolate(t, [S.duration - 0.7, S.duration], [1, 0]);
    ctx.globalAlpha = out;
    // big quote mark
    ctx.font = `900 ${220 * k}px "DejaVu Serif", serif`; ctx.fillStyle = L.rgba(th.accent, 0.25 * T.interpolate(t, [0, 0.6], [0, 1])); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('“', W / 2 - W * 0.36, top - 20 * k);
    let wi = 0; const total = String(p.text).split(/\s+/).length, per = S.read / total;
    lines.forEach((ln, i) => {
      drawText(ctx, ln, { t, x: W / 2, y: top + i * lh, start: 0.6 + wi * per, preset: 'blurIn', size, font: f, lang: p.lang, weight: 700, color: th.ink, stagger: per, dur: 0.6, hold: 99 });
      wi += ln.split(/\s+/).length;
    });
    const ay = top + lines.length * lh + 20 * k, at = 0.6 + S.read;
    const ru = T.interpolate(t, [at, at + 0.6], [0, 1], { ease: 'out' });
    ctx.fillStyle = th.accent; ctx.fillRect(W / 2 - 40 * k * ru, ay - 6 * k, 80 * k * ru, 3 * k);
    drawText(ctx, '— ' + p.author + (p.note ? ` (${p.note})` : ''), { t, x: W / 2, y: ay + 30 * k, start: at + 0.2, preset: 'fadeUp', size: 26 * k, font: f, lang: p.lang, weight: 600, color: L.rgba(th.ink, 0.8), unit: 'line', dur: 0.6, hold: 99 });
    ctx.globalAlpha = 1;
    L.vignette(ctx, W, H, 0.5); L.grain(ctx, W, H, 0.04, Math.floor(t * 12));
  },
};
