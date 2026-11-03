// Kids explainer driven by the voice track: the same scene for English and Telugu.
// Cues from voice.py (steam, cloud, rain) trigger the story beats; captions highlight the spoken word.
import { drawCharacter } from '../character.js';

const layer = (W, H, fn) => { const c = document.createElement('canvas'); c.width = W; c.height = H; fn(c.getContext('2d')); return c; };

export function makeRain(lang) {
  const dir = `../voice-examples/out/rain-${lang}`;
  return {
    dim: '2d', fps: 24, width: 1280, height: 720,
    async setup({ W, H, L }) {
      const tl = await (await fetch(`${dir}/timeline.json`)).json();
      const pip = await (await fetch('../characters/examples/pip.json')).json();
      const r = L.rng(91);
      const bg = layer(W, H, (c) => {
        L.paper(c, W, H, '#fbf3df', 91);
        L.crayon(c, [[0, 0], [W, 0], [W, 470], [0, 470]], '#a9d8f5', r, { density: 0.6, outline: false, width: 4 });
        L.crayon(c, [[0, 470], [W, 450], [W, H], [0, H]], '#4aa3df', r, { width: 4 });
        L.crayon(c, [[0, 560], [520, 540], [560, H], [0, H]], '#e9c98a', r, { width: 4 });
      });
      const drops = Array.from({ length: 90 }, () => ({ x: r.range(560, 1240), ph: r(), sp: r.range(380, 520) }));
      const steam = Array.from({ length: 26 }, () => ({ x: r.range(640, 1180), ph: r(), sp: r.range(40, 70), s: r.range(10, 22) }));
      return { tl, pip, bg, drops, steam, duration: tl.duration + 1.2, audio: `${dir}/voice.m4a` };
    },
    draw(ctx, W, H, L, T, t, S) {
      const { tl } = S, cue = (k) => tl.cues[k] ?? 1e9;
      const cam = { x: W / 2, y: H / 2, zoom: T.interpolate(t, [0, S.duration], [1, 1.06], { ease: 'inOut' }) };
      T.camera(ctx, W, H, cam, () => {
        ctx.drawImage(S.bg, 0, 0);
        // sun (warms the water), gentle pulse
        const sunGlow = 1 + T.sway(t, 0.03, 0.4);
        ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(170, 120, 62 * sunGlow, 0, L.TAU); ctx.fill();
        ctx.strokeStyle = '#f5a623'; ctx.lineWidth = 6; ctx.lineCap = 'round';
        for (let i = 0; i < 10; i++) { const a = i / 10 * L.TAU + t * 0.15; ctx.beginPath(); ctx.moveTo(170 + Math.cos(a) * 82, 120 + Math.sin(a) * 82); ctx.lineTo(170 + Math.cos(a) * 110, 120 + Math.sin(a) * 110); ctx.stroke(); }
        // beat 1: steam rises from the sea after cue "steam"
        const st = T.interpolate(t, [cue('steam'), cue('steam') + 0.8], [0, 1]);
        if (st > 0) S.steam.forEach((p) => { const k = ((t * 0.25 + p.ph) % 1); const y = 470 - k * 300; ctx.fillStyle = `rgba(255,255,255,${0.75 * st * (1 - k)})`; ctx.beginPath(); ctx.arc(p.x + T.sway(t + p.ph * 5, 10, 0.3), y, p.s * (0.6 + k), 0, L.TAU); ctx.fill(); });
        // beat 2: the cloud forms (soft spring), darkens before the rain
        const cs = T.spring(t, { delay: cue('cloud'), stiffness: 80, damping: 11 });
        const dark = T.interpolate(t, [cue('rain') - 1.2, cue('rain')], [0, 1]);
        if (t > cue('cloud')) {
          ctx.save(); ctx.translate(900 + T.sway(t, 6, 0.15), 150); ctx.scale(cs, cs);
          ctx.fillStyle = L.mixHex('#ffffff', '#8a96a8', dark); ctx.strokeStyle = L.mixHex('#cfe6f5', '#5f6b7d', dark); ctx.lineWidth = 5;
          ctx.beginPath(); [[-120, 20, 70], [-40, -20, 90], [60, -10, 80], [130, 25, 60], [0, 40, 80]].forEach(([x, y, rr]) => { ctx.moveTo(x + rr, y); ctx.arc(x, y, rr, 0, L.TAU); }); ctx.fill();
          ctx.restore();
        }
        // beat 3: rain after cue "rain"
        if (t > cue('rain')) S.drops.forEach((d) => { const k = ((t - cue('rain')) * d.sp / 300 + d.ph) % 1; const y = 200 + k * 300; ctx.strokeStyle = 'rgba(60,110,190,0.8)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(d.x - 3, y); ctx.lineTo(d.x, y + 18); ctx.stroke(); });
        // Pip on the shore: reacts to the story (on twos)
        const tt = T.onTwos(t, 24);
        const pipTalking = tl.lines.some((l) => l.who === 'pip' && tt >= l.start && tt <= l.end);
        const expr = pipTalking ? 'surprised' : t > cue('rain') ? 'happy' : t > cue('cloud') ? 'thinking' : 'happy';
        const pose = t > cue('rain') + 0.5 ? 'wave' : pipTalking ? 'point' : 'stand';
        drawCharacter(ctx, S.pip, { x: 300, y: 650 - (pipTalking ? T.bob(tt, 6, 3) : 0), h: 270, view: 'front', expr, pose });
      });
      // captions: current line, current word highlighted (font by language)
      const cap = tl.captions.find((c, i) => t >= c.start - 0.1 && t < (tl.captions[i + 1] ? Math.min(tl.captions[i + 1].start - 0.1, c.end + 0.6) : c.end + 0.6));
      if (cap) {
        const font = lang === 'te' ? L.FONT.te : L.FONT.en, size = lang === 'te' ? 40 : 42;
        ctx.font = `800 ${size}px ${font}`;
        const widths = cap.words.map((w) => ctx.measureText(w.word + ' ').width);
        const total = widths.reduce((a, b) => a + b, 0); let x = W / 2 - total / 2;
        ctx.fillStyle = 'rgba(20,30,50,0.55)'; ctx.beginPath(); ctx.roundRect(W / 2 - total / 2 - 24, H - 96, total + 48, 72, 20); ctx.fill();
        cap.words.forEach((w, i) => { const next = cap.words[i + 1]; const on = t >= w.start && t < (next ? next.start : w.end + 0.2); L.text(ctx, w.word, x, H - 60, { size, font, weight: 800, align: 'left', color: on ? '#ffd23f' : '#ffffff' }); x += widths[i]; });
      }
    },
  };
}
