// Template: countdown / top-N list ("5 facts", "top 3 plays"). One card per item, big number, camera pushes per item.
import { drawText } from '../textfx.js';
import { theme, font, drift, background, roundRect, wrap, scale } from './common.js';

export default {
  dim: '2d', fps: 30,
  defaultProps: {
    theme: 'facts', lang: 'en', heading: '3 things you never noticed', per: 3.2,
    items: [
      { title: 'Bananas are berries', note: 'Strawberries are not.' },
      { title: 'Octopuses have three hearts', note: 'Two stop when it swims.' },
      { title: 'Honey never spoils', note: 'Jars from ancient tombs are still edible.' },
    ],
  },
  setup({ props }) {
    const th = theme(props), per = props.per * th.pace;
    return { th, per, intro: props.heading ? 1.8 : 0, duration: (props.heading ? 1.8 : 0) + per * props.items.length + 0.4 };
  },
  draw(ctx, W, H, L, T, t, S) {
    const p = S.props, th = S.th, k = scale(W, H), f = font(p, th), n = p.items.length;
    const idx = Math.floor((t - S.intro) / S.per), lt = t - S.intro - idx * S.per;
    // camera: drift always; a push-in through each item, a quick release at the change
    const cam = drift(t, W, H);
    if (idx >= 0 && idx < n) cam.zoom += T.interpolate(lt, [0, S.per], [0, 0.05], { ease: 'inOut' });
    T.camera(ctx, W, H, cam, () => background(ctx, W, H, t, th, T, L));
    if (t < S.intro) drawText(ctx, p.heading, { t, x: W / 2, y: H / 2, start: 0.15, preset: th.enter, exit: th.exit, size: 54 * k, font: f, lang: p.lang, color: th.ink, weight: th.weight, stagger: 0.05, dur: 0.5, hold: S.intro - 1.3 });
    if (idx < 0 || idx >= n) return;
    const it = p.items[idx], num = p.ascending ? idx + 1 : n - idx;
    const vertical = H > W, cw = vertical ? W * 0.86 : W * 0.58;
    const cx = W / 2 + (vertical ? 0 : 110 * k), cy = H / 2 + (vertical ? 60 * k : 0);
    const ink = th.card === '#ffffff' ? th.ink : '#ffffff';
    ctx.font = `${th.weight} ${44 * k}px ${f}`; const tl = wrap(ctx, it.title, cw - 100 * k);
    ctx.font = `500 ${28 * k}px ${f}`; const nl = it.note ? wrap(ctx, it.note, cw - 100 * k) : [];
    const lh = p.lang === 'te' ? 1.45 : 1.2, tH = tl.length * 44 * k * lh, nH = nl.length * 28 * k * lh;
    const ch = Math.max(H * (vertical ? 0.2 : 0.3), tH + nH + (nl.length ? 24 * k : 0) + 90 * k);
    const inP = T.spring(lt, { stiffness: 140, damping: 16 }), outP = T.interpolate(lt, [S.per - 0.35, S.per], [0, 1], { ease: 'in' });
    const away = -outP * W * 0.6;
    ctx.save();
    ctx.translate(cx + (1 - inP) * W * 0.5 + away, cy); ctx.rotate((1 - inP) * 0.06);
    ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 30 * k; ctx.shadowOffsetY = 12 * k;
    ctx.fillStyle = th.card; roundRect(ctx, -cw / 2, -ch / 2, cw, ch, 24 * k); ctx.fill(); ctx.shadowColor = 'transparent';
    ctx.fillStyle = th.accent; roundRect(ctx, -cw / 2, -ch / 2, 12 * k, ch, 6 * k); ctx.fill();
    ctx.restore();
    // big number, stamped in (left of the card; above it in vertical)
    const nx = vertical ? W / 2 : cx - cw / 2 - 110 * k, ny = vertical ? cy - ch / 2 - 110 * k : cy;
    drawText(ctx, String(num), { t: lt, x: nx + away, y: ny, start: 0.05, preset: 'stamp', size: 170 * k, font: 'Inter, sans-serif', weight: 900, color: th.accent, unit: 'line', dur: 0.45, hold: 99, shadow: 'rgba(0,0,0,0.4)' });
    ctx.save(); ctx.translate(away, 0);
    const x0 = cx - cw / 2 + 50 * k; let y = cy - (tH + nH + (nl.length ? 24 * k : 0)) / 2 + 44 * k * lh / 2;
    tl.forEach((ln, i) => drawText(ctx, ln, { t: lt, x: x0, y: y + i * 44 * k * lh, start: 0.3 + i * 0.12, preset: th.enter === 'stamp' ? 'popBounce' : th.enter, align: 'left', size: 44 * k, font: f, lang: p.lang, color: ink, weight: th.weight, stagger: 0.04, dur: 0.45, hold: 99 }));
    y += tH + 24 * k - 44 * k * lh / 2 + 28 * k * lh / 2;
    nl.forEach((ln, i) => drawText(ctx, ln, { t: lt, x: x0, y: y + i * 28 * k * lh, start: 0.8, preset: 'fadeUp', align: 'left', size: 28 * k, font: f, lang: p.lang, weight: 500, color: L.rgba(ink, 0.8), unit: 'line', dur: 0.5, hold: 99 }));
    ctx.restore();
    // progress pips
    for (let i = 0; i < n; i++) { ctx.fillStyle = i <= idx ? th.accent : L.rgba(th.ink, 0.25); ctx.beginPath(); ctx.arc(W / 2 + (i - (n - 1) / 2) * 26 * k, H - 50 * k, 7 * k, 0, L.TAU); ctx.fill(); }
  },
};
