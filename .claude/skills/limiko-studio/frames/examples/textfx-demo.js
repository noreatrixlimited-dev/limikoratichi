// Demo of every text animation preset (English and Telugu rows), looping. Render with animate.cjs.
import { drawText, PRESETS } from '../textfx.js';

const names = Object.keys(PRESETS);
export default {
  dim: '2d', fps: 30, duration: 5, width: 1280, height: 720,
  draw(ctx, W, H, L, T, t) {
    ctx.fillStyle = '#14161c'; ctx.fillRect(0, 0, W, H);
    const cols = 5, cw = W / cols, ch = H / 5;
    names.forEach((n, i) => {
      const cx = (i % cols) * cw + cw / 2, cy = Math.floor(i / cols) * ch + ch / 2 + 8;
      ctx.strokeStyle = '#2a2e38'; ctx.strokeRect((i % cols) * cw + 0.5, Math.floor(i / cols) * ch + 0.5, cw - 1, ch - 1);
      L.text(ctx, n, (i % cols) * cw + 8, Math.floor(i / cols) * ch + 14, { size: 14, color: '#8a93a3', font: 'Inter', weight: 600, align: 'left' });
      const te = Math.floor(i / cols) % 2 === 1;
      const lt = t % 2.5;
      drawText(ctx, te ? 'నమస్తే మిత్రులారా' : 'Hello friends', {
        x: cx, y: cy, t: lt, start: 0.15, preset: n, exit: 'fadeDown', size: te ? 30 : 34, unit: n === 'typewriter' || n === 'trackingIn' || n === 'glitch' ? 'grapheme' : 'word',
        stagger: n === 'typewriter' ? 0.07 : 0.08, dur: n === 'karaoke' ? 1.2 : 0.5, hold: 1.0, lang: te ? 'te' : 'en',
        font: te ? L.FONT.te : 'Inter', color: '#ffffff', accent: '#ffd23f', stroke: '#000000', strokeW: 5,
      });
    });
  },
};
