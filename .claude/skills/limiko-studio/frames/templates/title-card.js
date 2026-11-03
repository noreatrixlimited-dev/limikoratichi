// Template: title card (opening title, chapter card, Short cover). Props → video.
import { drawText } from '../textfx.js';
import { theme, font, drift, background, scale } from './common.js';

export default {
  dim: '2d', fps: 30,
  defaultProps: { theme: 'facts', lang: 'en', kicker: 'CHAPTER 1', title: 'The Day the Sky Went Dark', subtitle: 'Krakatoa, 1883', hold: 2.4 },
  setup({ props }) {
    const th = theme(props);
    return { th, duration: 0.4 + 1.6 * th.pace + props.hold + 0.9 };
  },
  draw(ctx, W, H, L, T, t, S) {
    const p = S.props, th = S.th, k = scale(W, H), f = font(p, th);
    const exitAt = 0.4 + 1.6 * th.pace + p.hold;
    T.camera(ctx, W, H, drift(t, W, H), () => background(ctx, W, H, t, th, T, L));
    const vertical = H > W, cy = vertical ? H * 0.42 : H * 0.48;
    const common = { t, font: f, lang: p.lang, unit: p.lang === 'te' ? 'word' : 'word', exit: th.exit };
    const hk = Math.max(0.1, exitAt - 0.9);
    if (p.kicker) drawText(ctx, p.kicker, { ...common, x: W / 2, y: cy - 110 * k, start: 0.3, preset: 'trackingIn', size: 26 * k, weight: 700, color: th.accent, unit: 'line', dur: 0.8 * th.pace, hold: hk - 0.3 - 0.8 * th.pace });
    // title: wrap to two lines if needed
    ctx.font = `${th.weight} ${64 * k}px ${f}`;
    const words = p.title.split(' '); let lines = [p.title];
    if (ctx.measureText(p.title).width > W * 0.82) { const mid = Math.ceil(words.length / 2); lines = [words.slice(0, mid).join(' '), words.slice(mid).join(' ')]; }
    lines.forEach((ln, i) => {
      const start = 0.5 + i * 0.25;
      drawText(ctx, ln, { ...common, x: W / 2, y: cy + (i - (lines.length - 1) / 2) * 76 * k, start, preset: th.enter, size: 64 * k, weight: th.weight, color: th.ink, stagger: 0.06 * th.pace, dur: 0.6 * th.pace, hold: hk - start - 0.6 * th.pace - 0.06 * th.pace * (ln.split(' ').length - 1), shadow: 'rgba(0,0,0,0.35)' });
    });
    // accent rule draws on
    const ru = T.interpolate(t, [0.9, 1.6, exitAt - 0.6, exitAt - 0.1], [0, 1, 1, 0], { ease: 'out' });
    ctx.fillStyle = th.accent; ctx.fillRect(W / 2 - 90 * k * ru, cy + (lines.length * 38 + 28) * k, 180 * k * ru, 5 * k);
    if (p.subtitle) drawText(ctx, p.subtitle, { ...common, x: W / 2, y: cy + (lines.length * 38 + 72) * k, start: 1.1 * th.pace, preset: 'fadeUp', size: 30 * k, weight: 600, color: L.rgba(th.ink, 0.85), dur: 0.6, hold: hk - 1.1 * th.pace - 0.6 });
    L.vignette(ctx, W, H, 0.35);
  },
};
