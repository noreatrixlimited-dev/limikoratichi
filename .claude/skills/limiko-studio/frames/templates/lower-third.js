// Template: lower third (name + role, place + year). Renders over a solid key colour (props.key, default green)
// so it can be keyed over footage: ffmpeg -i film.mp4 -i lt.mp4 -filter_complex "[1]colorkey=0x00ff00:0.3:0.1[k];[0][k]overlay" out.mp4
// Set props.key to null to render over the theme background instead (for previews).
import { drawText } from '../textfx.js';
import { theme, font, drift, background, roundRect, scale } from './common.js';

export default {
  dim: '2d', fps: 30,
  defaultProps: { theme: 'facts', lang: 'en', name: 'Mount Krakatoa', role: 'Sunda Strait · 1883', side: 'left', key: '#00ff00', hold: 3.0 },
  setup({ props }) { return { th: theme(props), duration: 0.9 + props.hold + 0.7 }; },
  draw(ctx, W, H, L, T, t, S) {
    const p = S.props, th = S.th, k = scale(W, H), f = font(p, th);
    if (p.key) { ctx.fillStyle = p.key; ctx.fillRect(0, 0, W, H); }
    else T.camera(ctx, W, H, drift(t, W, H), () => background(ctx, W, H, t, th, T, L));
    const exitAt = 0.9 + p.hold;
    const inP = T.interpolate(t, [0, 0.6], [0, 1], { ease: 'out' }), outP = T.interpolate(t, [exitAt, exitAt + 0.5], [0, 1], { ease: 'in' });
    ctx.font = `${th.weight} ${40 * k}px ${f}`; const nw = ctx.measureText(p.name).width;
    ctx.font = `600 ${24 * k}px ${f}`; const rw = ctx.measureText(p.role).width;
    const w = Math.max(nw, rw) + 60 * k, h = 104 * k, x = p.side === 'right' ? W - w - 70 * k : 70 * k, y = H - h - 80 * k;
    const reveal = w * inP * (1 - outP);
    // the panel drifts a few pixels so the overlay is never fully still
    const dx = Math.sin(t * 0.6) * 3 * k;
    ctx.save(); ctx.beginPath(); ctx.rect(x + dx + (p.side === 'right' ? w - reveal : 0), y - 10 * k, reveal, h + 20 * k); ctx.clip();
    ctx.fillStyle = th.card; roundRect(ctx, x + dx, y, w, h, 10 * k); ctx.fill();
    ctx.fillStyle = th.accent; ctx.fillRect(x + dx, y, 8 * k, h);
    ctx.restore();
    const tx = x + dx + 30 * k, fade = 1 - outP;
    ctx.globalAlpha = fade;
    drawText(ctx, p.name, { t, x: tx, y: y + 38 * k, start: 0.35, preset: 'maskRise', align: 'left', size: 40 * k, font: f, lang: p.lang, weight: th.weight, color: th.card === '#ffffff' ? th.ink : '#ffffff', unit: 'line', dur: 0.5, hold: 99 });
    drawText(ctx, p.role, { t, x: tx, y: y + 76 * k, start: 0.55, preset: 'fadeUp', align: 'left', size: 24 * k, font: f, lang: p.lang, weight: 600, color: th.accent, unit: 'line', dur: 0.5, hold: 99 });
    ctx.globalAlpha = 1;
  },
};
