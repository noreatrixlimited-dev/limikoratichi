// Template: big number that counts up, with a label and an optional comparison bar ("4,800 km", "1 in 10").
import { drawText } from '../textfx.js';
import { theme, font, drift, background, roundRect, scale } from './common.js';

const fmt = (v, dec, sep) => { const s = v.toFixed(dec); if (!sep) return s; const [a, b] = s.split('.'); return a.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (b ? '.' + b : ''); };

export default {
  dim: '2d', fps: 30,
  defaultProps: { theme: 'facts', lang: 'en', value: 4800, decimals: 0, separators: true, prefix: '', suffix: ' km', label: 'how far away the blast was heard',
    compare: { label: 'London → Moscow', value: 2500 }, count: 1.6, hold: 2.2 },
  setup({ props }) { const th = theme(props); return { th, duration: 0.3 + props.count * th.pace + props.hold + 0.6 }; },
  draw(ctx, W, H, L, T, t, S) {
    const p = S.props, th = S.th, k = scale(W, H), f = font(p, th), cnt = p.count * th.pace;
    const cam = drift(t, W, H); cam.zoom += T.interpolate(t, [0, S.duration], [0, 0.04]);
    T.camera(ctx, W, H, cam, () => background(ctx, W, H, t, th, T, L));
    const out = T.interpolate(t, [S.duration - 0.5, S.duration], [1, 0]);
    ctx.globalAlpha = out;
    const v = T.interpolate(t, [0.3, 0.3 + cnt], [0, p.value], { ease: 'out' });
    const pop = 1 + 0.08 * Math.exp(-6 * Math.max(0, t - 0.3 - cnt)) * (t > 0.3 + cnt ? 1 : 0);
    ctx.save(); ctx.translate(W / 2, H * 0.42); ctx.scale(pop, pop);
    ctx.font = `900 ${150 * k}px Inter, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = th.accent; ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 24 * k;
    const sfx = p.suffix || '';
    ctx.fillText(p.prefix + fmt(v, p.decimals, p.separators), 0, 0);
    ctx.restore();
    if (sfx) { /* suffix in ink colour, smaller, after the number */
      ctx.font = `900 ${150 * k}px Inter, sans-serif`; const w = ctx.measureText(p.prefix + fmt(p.value, p.decimals, p.separators)).width;
      ctx.font = `800 ${56 * k}px ${f}`; ctx.fillStyle = th.ink; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.globalAlpha = out * T.interpolate(t, [0.3 + cnt * 0.6, 0.3 + cnt], [0, 1]); ctx.fillText(sfx.trim(), W / 2 + w / 2 + 14 * k, H * 0.42 + 30 * k); ctx.globalAlpha = out;
    }
    drawText(ctx, p.label, { t, x: W / 2, y: H * 0.42 + 120 * k, start: 0.6, preset: 'fadeUp', size: 34 * k, font: f, lang: p.lang, weight: 600, color: th.ink, dur: 0.5, hold: 99 });
    if (p.compare) {
      const bw = Math.min(W * 0.7, 760 * k), bx = W / 2 - bw / 2, by = H * 0.42 + 190 * k, mx = Math.max(p.value, p.compare.value);
      const g = T.interpolate(t, [0.3 + cnt, 0.3 + cnt + 0.9], [0, 1], { ease: 'out' });
      [[p.value, th.accent, p.prefix + fmt(p.value, p.decimals, p.separators) + sfx], [p.compare.value, L.rgba(th.ink, 0.45), p.compare.label]].forEach(([val, c, lab], i) => {
        const y = by + i * 46 * k;
        ctx.fillStyle = L.rgba(th.ink, 0.12); roundRect(ctx, bx, y, bw, 28 * k, 14 * k); ctx.fill();
        ctx.fillStyle = c; roundRect(ctx, bx, y, Math.max(28 * k, bw * (val / mx) * g), 28 * k, 14 * k); ctx.fill();
        ctx.font = `700 ${20 * k}px ${f}`; ctx.fillStyle = th.ink; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.globalAlpha = out * g; ctx.fillText(lab, bx + 12 * k, y + 14 * k); ctx.globalAlpha = out;
      });
    }
    ctx.globalAlpha = 1;
  },
};
