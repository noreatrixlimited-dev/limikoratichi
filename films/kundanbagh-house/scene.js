// Kundanbagh house: the real story · scene driven by the voice cues of the current language (props.lang, props.voice).
// Replace the placeholder visuals beat by beat (storyboard order). Rules: moving camera in every shot,
// only this format's transitions and effect level (formats/05-horror-mystery/direction.md).
export default {
  dim: '2d', fps: 24, width: 1280, height: 720,
  defaultProps: { lang: 'en', voice: '/films/kundanbagh-house/out/voice-en', draft: false },
  async setup({ W, H, L, props }) {
    let tl = { duration: 8, cues: {}, captions: [] };
    try { tl = await (await fetch(`${props.voice}/timeline.json`)).json(); } catch (e) { /* no voice yet: silent layout preview */ }
    return { tl, cues: tl.cues, duration: tl.duration + 1.0, audio: tl.captions.length ? `${props.voice}/voice.m4a` : null };
  },
  draw(ctx, W, H, L, T, t, S) {
    const cue = (k) => S.tl.cues[k] ?? 1e9;
    // moving camera: slow drift + a push on every beat
    const cam = { x: W / 2 + Math.sin(t * 0.2) * 14, y: H / 2 + Math.cos(t * 0.17) * 9, zoom: 1.03 + T.interpolate(t, [0, S.duration], [0, 0.06]) };
    T.camera(ctx, W, H, cam, () => {
      const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#05070a'); g.addColorStop(1, '#141b24');
      ctx.fillStyle = g; ctx.fillRect(-W, -H, W * 3, H * 3);
      // beat placeholders: one shape per cue so timing can be checked before the art exists
      ['strike', 'gap', 'promise', 'beat1'].forEach((k, i) => {
        const p = T.spring(t, { delay: cue(k), stiffness: 120, damping: 14 });
        if (p <= 0) return;
        ctx.fillStyle = L.rgba('#9bd1ff', 0.85); ctx.beginPath(); ctx.arc(W * (0.2 + i * 0.2), H * 0.42, 60 * p, 0, L.TAU); ctx.fill();
        L.text(ctx, k, W * (0.2 + i * 0.2), H * 0.42 + 100, { size: 26, color: '#ffffff', font: 'Inter', weight: 700 });
      });
    });
    // captions: the current chunk, current word in the accent colour
    const caps = S.tl.captions || [];
    const cap = caps.find((c, i) => t >= c.start - 0.1 && t < (caps[i + 1] ? Math.min(caps[i + 1].start - 0.1, c.end + 0.6) : c.end + 0.6));
    if (cap) {
      ctx.font = `800 40px ${S.props.lang === 'te' ? L.FONT.te : L.FONT.en}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const w = ctx.measureText(cap.text).width; ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.beginPath(); ctx.roundRect(W / 2 - w / 2 - 24, H - 118, w + 48, 64, 14); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.fillText(cap.text, W / 2, H - 86);
    }
    if (S.props.draft) { ctx.font = '900 22px Inter'; ctx.fillStyle = 'rgba(255,80,80,0.9)'; ctx.textAlign = 'left'; ctx.fillText('DRAFT', 20, 30); }
  },
};
