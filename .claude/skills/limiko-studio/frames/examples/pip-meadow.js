// Motion test (format 01 Kids): Pip walks into the meadow and waves.
// Follows the kids profile: slow push-in ≤ 8%, character on twos, soft secondary motion, gentle pop for the title.
import { drawCharacter } from '../character.js';

const layer = (W, H, fn) => { const c = document.createElement('canvas'); c.width = W; c.height = H; fn(c.getContext('2d')); return c; };

export default {
  dim: '2d', fps: 24, duration: 5, width: 1280, height: 720,

  async setup({ W, H, L }) {
    const pip = await (await fetch('../characters/examples/pip.json')).json();
    const r = L.rng(77);
    const PW = W * 1.2, PH = H * 1.2; // oversized layers so the camera can move
    const sky = layer(PW, PH, (c) => { L.paper(c, PW, PH, '#fbf3df', 77); L.crayon(c, [[0, 0], [PW, 0], [PW, PH * 0.85], [0, PH * 0.85]], '#9fd3f2', r, { density: 0.7, outline: false, width: 4 }); });
    const far = layer(PW, PH, (c) => { const p = []; for (let i = 0; i <= 30; i++) { const t = i / 30; p.push([t * PW, PH * 0.6 - Math.abs(Math.sin(t * Math.PI * 1.4)) * 110]); } p.push([PW, PH], [0, PH]); L.crayon(c, p, '#8ccf6a', r, { width: 4 }); });
    const near = layer(PW, PH, (c) => { L.crayon(c, [[0, PH * 0.74], [PW, PH * 0.7], [PW, PH], [0, PH]], '#5aa845', r, { width: 4 }); });
    const flowers = Array.from({ length: 18 }, () => ({ x: r.range(0, PW), y: r.range(PH * 0.8, PH * 0.95), c: r.pick(['#ff6b8b', '#ffd23f', '#a66bff', '#ff8c42']), ph: r() * 6 }));
    const clouds = Array.from({ length: 4 }, (_, i) => ({ x: i * 380 + 100, y: 90 + r() * 80, s: r.range(0.8, 1.3), pts: L.blobPts(0, 0, 60, r, 8, 0.25) }));
    return { pip, sky, far, near, flowers, clouds, PW, PH };
  },

  draw(ctx, W, H, L, T, t, S) {
    const { pip, PW, PH } = S;
    // camera: very slow push-in (kids profile) towards where Pip stops
    const cam = { x: W / 2 + T.interpolate(t, [0, 5], [0, 40], { ease: 'inOut' }), y: H / 2 + 20, zoom: T.interpolate(t, [0, 5], [1, 1.07], { ease: 'inOut' }) };
    ctx.fillStyle = '#fbf3df'; ctx.fillRect(0, 0, W, H);
    const off = (img) => () => ctx.drawImage(img, -(PW - W) / 2, -(PH - H) / 2);
    T.parallax(ctx, W, H, cam, [
      { depth: 0.3, draw: off(S.sky) },
      { depth: 0.3, draw: () => S.clouds.forEach((c) => { const x = ((c.x + t * 18) % (W + 300)) - 150; ctx.save(); ctx.translate(x, c.y); ctx.scale(c.s, c.s * 0.7); L.poly(ctx, c.pts); ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.fill(); ctx.strokeStyle = '#cfe6f5'; ctx.lineWidth = 3; ctx.stroke(); ctx.restore(); }) },
      { depth: 0.6, draw: off(S.far) },
      { depth: 1.0, draw: off(S.near) },
      { depth: 1.0, draw: () => {
        // Pip: walk in for 2.6 s, settle, wave from 3.2 s. Animated on twos (hand-made feel).
        const tt = T.onTwos(t, 24);
        const x = T.interpolate(tt, [0, 2.6], [-140, 640], { ease: 'inOut' });
        const walking = tt < 2.6;
        const stride = walking ? Math.sin(tt * Math.PI * 3.2) * 0.38 : 0;
        const y = 600 - (walking ? T.bob(tt, 10, 1.6) : 0);
        const waving = tt > 3.2 && Math.floor((tt - 3.2) * 4) % 2 === 0;
        drawCharacter(ctx, pip, { x, y, h: 300, view: walking ? '34' : 'front', pose: walking ? 'walk' : waving ? 'wave' : 'stand', stride, expr: tt > 2.8 ? 'happy' : 'neutral' });
      } },
      { depth: 1.5, draw: () => S.flowers.forEach((f) => { const sw = T.sway(t, 4, 0.5, f.ph); ctx.strokeStyle = '#2f7a2a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(f.x - (PW - W) / 2, f.y - (PH - H) / 2 + 30); ctx.lineTo(f.x - (PW - W) / 2 + sw, f.y - (PH - H) / 2); ctx.stroke(); ctx.fillStyle = f.c; ctx.beginPath(); ctx.arc(f.x - (PW - W) / 2 + sw, f.y - (PH - H) / 2, 11, 0, L.TAU); ctx.fill(); }) },
    ]);
    // title pops in with a soft spring (not a flash), holds long enough to read
    const s = T.spring(t, { delay: 3.0, stiffness: 120, damping: 12 });
    if (t > 3.0) { ctx.save(); ctx.translate(W / 2, 110); ctx.scale(s, s); L.text(ctx, 'Hello, friends!', 0, 0, { size: 72, color: '#e8553a', stroke: '#fff', strokeW: 12, font: 'Inter', weight: 900 }); ctx.restore(); }
  },
};
