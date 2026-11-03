// Manim-style equation demo: a triangle explains the formula, the formula writes on, a term is boxed,
// then the equation rearranges itself (matching symbols travel to their new places). Moving camera throughout.
import * as M from '../mathfx.js';

export default {
  dim: '2d', fps: 30, width: 1280, height: 720, duration: 9,
  async setup() {
    const a = await M.tex('a^2 + b^2 = c^2'), b = await M.tex('c = \\sqrt{a^2 + b^2}');
    return { a, b, c2: await a.find('c^2'), cues: { write: 1.2, box: 3.2, transform: 5.0 } };
  },
  draw(ctx, W, H, L, T, t, S) {
    const bg = ctx.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#0f1b2d'); bg.addColorStop(1, '#16325c');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    const cam = { x: W / 2 + Math.sin(t * 0.3) * 12, y: H / 2 + Math.cos(t * 0.25) * 8, zoom: T.interpolate(t, [0, 4.5, 6.5, 9], [1.0, 1.08, 1.02, 1.06], { ease: 'inOut' }) };
    T.camera(ctx, W, H, cam, () => {
      // right triangle (the visual mechanism): sides draw on, then the labels
      const A = [250, 520], B = [250, 250], C = [610, 520];
      const tri = T.interpolate(t, [0.2, 1.2], [0, 1], { ease: 'out' });
      ctx.strokeStyle = '#5cc8ff'; ctx.lineWidth = 6; ctx.lineJoin = 'round';
      const per = 270 + 360 + 450; ctx.setLineDash([per * tri, per]);
      ctx.beginPath(); ctx.moveTo(...B); ctx.lineTo(...A); ctx.lineTo(...C); ctx.closePath(); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(92,200,255,0.6)'; ctx.lineWidth = 3; ctx.strokeRect(250, 490, 30, 30);
      const lab = T.interpolate(t, [1.0, 1.6], [0, 1]);
      ctx.globalAlpha = lab; ctx.fillStyle = '#ffffff'; ctx.font = 'italic 700 40px "DejaVu Serif", serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('a', 215, 385); ctx.fillText('b', 430, 560);
      ctx.fillStyle = T.interpolate(t, [3.2, 3.6], [0, 1]) > 0.5 ? '#ffd23f' : '#ffffff'; ctx.fillText('c', 455, 355);
      ctx.globalAlpha = 1;
      // the equation: write on, box c², then rearrange
      const at = { x: 930, y: 380, size: 78 };
      const tp = T.interpolate(t, [S.cues.transform, S.cues.transform + 1.6], [0, 1]);
      if (tp <= 0) {
        M.draw(ctx, S.a, { ...at, t, start: S.cues.write, dur: 1.6, preset: 'write', color: '#ffffff', colors: Object.fromEntries([...Array(S.c2[1] - S.c2[0] + 1)].map((_, i) => [S.c2[0] + i, t > 3.4 ? '#ffd23f' : '#ffffff'])) });
        const bp = T.interpolate(t, [S.cues.box, S.cues.box + 0.6], [0, 1]) * T.interpolate(t, [4.6, 5.0], [1, 0]);
        if (bp > 0) M.box(ctx, S.a, S.c2, { ...at, p: bp, color: '#ffd23f', fill: '#ffd23f' });
      } else M.transform(ctx, S.a, S.b, tp, { ...at, color: '#ffffff' });
      const cap = T.interpolate(t, [7.0, 7.6], [0, 1]);
      if (cap > 0) { ctx.globalAlpha = cap; ctx.fillStyle = '#ffd23f'; ctx.font = '700 30px Inter, sans-serif'; ctx.fillText('the long side, from the two short ones', 930, 520 - (1 - cap) * 12); ctx.globalAlpha = 1; }
    });
  },
};
