// History & mythology styles: test frames. Characters come from approved specs, so they match across styles.
import { drawCharacter } from '../character.js';

const spec = async (id) => (await fetch(`../characters/examples/${id}.json`)).json();
const S = {};

// recolour helper: same character, different surface (e.g. silhouette, puppet leather)
const tint = (sp, colors) => ({ ...sp, colors: { ...sp.colors, ...colors } });

function border(ctx, W, H, L, col, inner, motif = 'dots') {
  ctx.fillStyle = col; ctx.fillRect(0, 0, W, 40); ctx.fillRect(0, H - 40, W, 40); ctx.fillRect(0, 0, 40, H); ctx.fillRect(W - 40, 0, 40, H);
  ctx.fillStyle = inner;
  if (motif === 'dots') for (let x = 20; x < W; x += 28) { [20, H - 20].forEach((y) => { ctx.beginPath(); ctx.arc(x, y, 6, 0, L.TAU); ctx.fill(); }); }
  if (motif === 'petals') for (let x = 20; x < W; x += 36) { [20, H - 20].forEach((y) => { ctx.beginPath(); ctx.ellipse(x, y, 12, 6, 0, 0, L.TAU); ctx.fill(); }); }
  if (motif === 'meander') { ctx.strokeStyle = inner; ctx.lineWidth = 4; for (let x = 0; x < W; x += 40) [8, H - 32].forEach((y) => { ctx.beginPath(); ctx.moveTo(x, y + 24); ctx.lineTo(x, y); ctx.lineTo(x + 30, y); ctx.lineTo(x + 30, y + 16); ctx.lineTo(x + 12, y + 16); ctx.lineTo(x + 12, y + 8); ctx.stroke(); }); }
}

// ---- Indian traditions ------------------------------------------------------
S['kalamkari-scroll'] = {
  dim: '2d', title: 'Kalamkari scroll',
  async draw(ctx, W, H, L) {
    const r = L.rng(5101); const k = await spec('krishna');
    L.paper(ctx, W, H, '#efe2c4', 5101, '#b08a5a');
    border(ctx, W, H, L, '#8a2e1c', '#e6b54a', 'petals');
    // tree of life, lotus pond, cows (outlined, earthy fills)
    ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = 3;
    ctx.fillStyle = '#3a4a7a'; ctx.beginPath(); ctx.ellipse(640, 640, 520, 60, 0, 0, L.TAU); ctx.fill(); ctx.stroke();
    for (let i = 0; i < 7; i++) { const x = 200 + i * 150; ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.ellipse(x, 630, 26, 12, 0, 0, L.TAU); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = '#6b3a1f'; ctx.fillRect(950, 250, 34, 350); ctx.strokeRect(950, 250, 34, 350);
    for (let i = 0; i < 26; i++) { const a = r() * Math.PI - Math.PI, d = r.range(40, 190); ctx.fillStyle = r.pick(['#4a6b3a', '#c0392b', '#d9a441']); ctx.beginPath(); ctx.ellipse(967 + Math.cos(a) * d, 250 + Math.sin(a) * d * 0.8, 22, 11, a, 0, L.TAU); ctx.fill(); ctx.stroke(); }
    const cow = (x, y, s) => { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = '#f4ead2'; ctx.beginPath(); ctx.ellipse(0, 0, 70, 38, 0, 0, L.TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.ellipse(78, -26, 26, 20, -0.4, 0, L.TAU); ctx.fill(); ctx.stroke(); [-40, -15, 25, 50].forEach((lx) => { ctx.beginPath(); ctx.moveTo(lx, 30); ctx.lineTo(lx, 80); ctx.stroke(); }); ctx.fillStyle = '#c0392b'; for (let j = 0; j < 5; j++) { ctx.beginPath(); ctx.arc(-40 + j * 20, -4, 5, 0, L.TAU); ctx.fill(); } ctx.restore(); };
    cow(260, 470, 1); cow(1120, 500, -0.8);
    drawCharacter(ctx, tint(k, { line: '#2a1a10' }), { x: 600, y: 620, h: 420, view: '34', expr: 'happy', pose: 'hero' });
    L.text(ctx, 'The Flute in Vrindavan', 640, 75, { size: 40, color: '#8a2e1c', font: 'DejaVu Serif', weight: 700 });
    L.text(ctx, 'FROM THE BHAGAVATA PURANA', 640, 112, { size: 18, color: '#5a3a20', font: 'DejaVu Sans', weight: 700, spacing: 3 });
    L.grain(ctx, W, H, 0.05, 5102);
  },
};

S['miniature-court'] = {
  dim: '2d', title: 'Miniature court painting',
  async draw(ctx, W, H, L) {
    const king = await spec('warrior-king');
    L.fill(ctx, W, H, '#c8462c');
    ctx.fillStyle = '#e8c35a'; ctx.fillRect(30, 30, W - 60, H - 60); ctx.fillStyle = '#2f6b4f'; ctx.fillRect(48, 48, W - 96, H - 96);
    // flat-perspective palace: arches, terrace, carpet tilted up
    ctx.fillStyle = '#f1e7d0'; ctx.fillRect(48, 48, W - 96, 380);
    for (let i = 0; i < 5; i++) { const x = 150 + i * 240; ctx.fillStyle = '#d9b46a'; ctx.fillRect(x - 70, 120, 140, 280); ctx.fillStyle = '#1f3d5a'; ctx.beginPath(); ctx.moveTo(x - 50, 400); ctx.lineTo(x - 50, 190); ctx.quadraticCurveTo(x, 130, x + 50, 190); ctx.lineTo(x + 50, 400); ctx.fill(); }
    ctx.fillStyle = '#8a1f2a'; ctx.beginPath(); ctx.moveTo(300, 690); ctx.lineTo(980, 690); ctx.lineTo(900, 430); ctx.lineTo(380, 430); ctx.fill();
    ctx.strokeStyle = '#e8c35a'; ctx.lineWidth = 4; ctx.strokeRect(420, 460, 440, 200);
    // throne cushion + king in profile
    ctx.fillStyle = '#e8c35a'; ctx.beginPath(); ctx.ellipse(640, 600, 140, 40, 0, 0, L.TAU); ctx.fill();
    drawCharacter(ctx, king, { x: 640, y: 640, h: 420, view: 'side', expr: 'neutral', pose: 'hero' });
    // attendants (simplified, same flat language)
    [[330, 1], [950, -1]].forEach(([x, d]) => { ctx.save(); ctx.translate(x, 0); ctx.scale(d, 1); drawCharacter(ctx, { ...king, id: 'attendant', accessories: ['staff', 'turban'], outfit: { top: 'kurta', bottom: 'robe' }, colors: { ...king.colors, top: '#f1e7d0', bottom: '#f1e7d0', accent: '#2f6b4f' }, face: { ...king.face, marks: [] } }, { x: 0, y: 650, h: 330, view: 'side' }); ctx.restore(); });
    L.text(ctx, 'The Court at Warangal', 640, 690 - 6, { size: 30, color: '#e8c35a', font: 'DejaVu Serif', weight: 700 });
    L.grain(ctx, W, H, 0.05, 5203);
  },
};

S['temple-relief'] = {
  dim: '3d', title: 'Temple stone relief',
  async draw({ THREE, canvas, W, H, L }) {
    const r = L.rng(5304);
    const t = L.three3d(THREE, canvas, W, H, { bg: '#20140c', fov: 30 });
    t.camera.position.set(4.5, 0.8, 16); t.camera.lookAt(0, 0, 0);
    t.scene.add(new THREE.HemisphereLight('#ffe1b0', '#1a0e06', 0.35));
    const key = t.sun(-7, 4, 5, 4.2, '#ffc27a', 10);
    const stone = new THREE.MeshStandardMaterial({ color: '#b98d5f', roughness: 0.95 });
    // wall panel
    t.mesh(new THREE.BoxGeometry(14, 7, 0.6), stone, 0, 0, -0.3);
    // carved frieze: row of figures as extruded silhouettes (dancers / riders)
    const fig = (x, y, s, kind) => {
      const sh = new THREE.Shape();
      if (kind === 'dancer') { sh.moveTo(-0.3, 0); sh.lineTo(-0.5, 0.9); sh.lineTo(-0.9, 1.2); sh.lineTo(-0.4, 1.4); sh.lineTo(-0.25, 2.1); sh.absarc(0, 2.4, 0.3, Math.PI, 0, true); sh.lineTo(0.25, 2.1); sh.lineTo(0.9, 1.9); sh.lineTo(0.4, 1.5); sh.lineTo(0.5, 0.9); sh.lineTo(0.8, 0); }
      else { sh.moveTo(-1.2, 0.4); sh.lineTo(-1.0, 1.2); sh.lineTo(-1.4, 1.6); sh.lineTo(-0.9, 1.7); sh.lineTo(-0.5, 1.2); sh.lineTo(0.8, 1.2); sh.lineTo(1.2, 1.6); sh.lineTo(1.0, 0.4); sh.lineTo(0.8, 0); sh.lineTo(0.6, 0.4); sh.lineTo(-0.7, 0.4); sh.lineTo(-0.9, 0); sh.lineTo(-1.2, 0.4); }
      const g = new THREE.ExtrudeGeometry(sh, { depth: 0.35, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.08, bevelSegments: 3 });
      const m = t.mesh(g, stone, x, y, 0); m.scale.setScalar(s);
    };
    for (let i = 0; i < 5; i++) fig(-5.2 + i * 2.6, 0.3, 0.95, 'dancer');
    for (let i = 0; i < 4; i++) fig(-4.5 + i * 3, -3.1, 0.8, 'elephant');
    // bands and pillars
    t.mesh(new THREE.BoxGeometry(14, 0.35, 0.5), stone, 0, 3.1, 0.1); t.mesh(new THREE.BoxGeometry(14, 0.35, 0.5), stone, 0, -0.1, 0.1); t.mesh(new THREE.BoxGeometry(14, 0.35, 0.5), stone, 0, -3.3, 0.1);
    for (let i = 0; i < 28; i++) t.mesh(new THREE.SphereGeometry(0.12, 10, 8), stone, -6.75 + i * 0.5, 3.1, 0.35);
    // dust in light
    for (let i = 0; i < 70; i++) t.mesh(new THREE.SphereGeometry(0.015, 4, 3), new THREE.MeshBasicMaterial({ color: '#ffd9a0' }), r.range(-6, 6), r.range(-3, 3), r.range(0.6, 3));
    t.render();
    const ov = document.createElement('canvas'); ov.width = W; ov.height = H; const o = ov.getContext('2d'); o.drawImage(canvas, 0, 0);
    const g = o.createLinearGradient(0, 0, W, 0); g.addColorStop(0, 'rgba(255,190,110,0.18)'); g.addColorStop(0.5, 'rgba(255,190,110,0)'); o.fillStyle = g; o.fillRect(0, 0, W, H);
    L.vignette(o, W, H, 0.6);
    canvas.replaceWith(ov); ov.id = 'c';
  },
};

S['pattachitra-panel'] = {
  dim: '2d', title: 'Pattachitra panel',
  async draw(ctx, W, H, L) {
    const k = await spec('krishna');
    L.fill(ctx, W, H, '#b5261e');
    ctx.fillStyle = '#f6e7b8'; ctx.fillRect(40, 40, W - 80, H - 80);
    ctx.strokeStyle = '#111'; ctx.lineWidth = 6; ctx.strokeRect(40, 40, W - 80, H - 80);
    border(ctx, W, H, L, '#b5261e', '#f6e7b8', 'dots');
    // three panels with bold outlines, flat fills, patterned grounds
    [[60, 420, '#1f5f8b'], [440, 400, '#2e7d32'], [840, 380, '#e0a21b']].forEach(([x, w, c], i) => {
      ctx.fillStyle = c; ctx.fillRect(x + 10, 60, w - 20, H - 120); ctx.lineWidth = 6; ctx.strokeRect(x + 10, 60, w - 20, H - 120);
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; for (let yy = 80; yy < H - 80; yy += 30) for (let xx = x + 30; xx < x + w - 20; xx += 30) { ctx.beginPath(); ctx.arc(xx, yy, 4, 0, L.TAU); ctx.fill(); }
    });
    drawCharacter(ctx, tint(k, { line: '#111' }), { x: 640, y: 640, h: 520, view: 'front', expr: 'happy', pose: 'stand' });
    // peacock and lotus side panels
    ctx.lineWidth = 5; ctx.fillStyle = '#1b6b6b'; ctx.beginPath(); ctx.ellipse(260, 420, 60, 90, 0, 0, L.TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(260, 300, 34, 0, L.TAU); ctx.fill(); ctx.stroke();
    for (let i = 0; i < 7; i++) { const a = Math.PI + 0.2 + i * 0.12; ctx.fillStyle = '#145252'; ctx.beginPath(); ctx.ellipse(260 + Math.cos(a) * 140, 480 + Math.sin(a) * 140, 22, 50, a + Math.PI / 2, 0, L.TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#f2c14e'; ctx.beginPath(); ctx.arc(260 + Math.cos(a) * 170, 480 + Math.sin(a) * 170, 10, 0, L.TAU); ctx.fill(); }
    for (let i = 0; i < 3; i++) { const x = 1030, y = 250 + i * 150; ctx.fillStyle = '#f48fb1'; for (let p = 0; p < 5; p++) { const a = -Math.PI / 2 + (p - 2) * 0.5; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * 30, y + Math.sin(a) * 30, 16, 36, a + Math.PI / 2, 0, L.TAU); ctx.fill(); ctx.stroke(); } }
  },
};

S['leather-puppet'] = {
  dim: '2d', title: 'Leather puppet (tholu bommalata)',
  async draw(ctx, W, H, L) {
    const r = L.rng(5506); const king = await spec('warrior-king');
    const g = ctx.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, 700); g.addColorStop(0, '#fff2cf'); g.addColorStop(0.6, '#f0c27a'); g.addColorStop(1, '#6a3410'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // translucent coloured leather: brighter, saturated, with punched holes
    ctx.save(); ctx.globalAlpha = 0.85; ctx.globalCompositeOperation = 'multiply';
    drawCharacter(ctx, tint(king, { skin: '#e0782f', top: '#c0262d', bottom: '#2f6fb0', cape: '#1d7a43', accent: '#f2b705', line: '#3a1a08' }), { x: 470, y: 690, h: 600, view: 'side', pose: 'point', expr: 'angry' });
    ctx.restore();
    ctx.fillStyle = 'rgba(255,245,210,0.85)'; for (let i = 0; i < 60; i++) { ctx.beginPath(); ctx.arc(r.range(420, 560), r.range(230, 560), r.range(2, 4), 0, L.TAU); ctx.fill(); }
    // opposing demon puppet (simple, jointed)
    ctx.save(); ctx.globalAlpha = 0.85; ctx.globalCompositeOperation = 'multiply';
    drawCharacter(ctx, { id: 'demon', build: { heads: 6.5, width: 1.4, belly: 0.6, head: 'square' }, colors: { skin: '#2a6b8a', hair: '#1a1a1a', eyes: '#f2b705', top: '#6b2a8a', bottom: '#c0262d', shoes: '#1a1a1a', accent: '#f2b705', line: '#1a0a08' }, face: { eyes: 'round', eyeSize: 1.4, brows: 'bold', marks: ['mustache'] }, hair: { style: 'curly' }, outfit: { top: 'armor', bottom: 'dhoti' }, accessories: ['crown', 'mace'] }, { x: 880, y: 690, h: 620, view: 'front', expr: 'angry', pose: 'hero' });
    ctx.restore();
    ctx.strokeStyle = '#3a1a08'; ctx.lineWidth = 4; [[470, 420, 430, H], [880, 380, 920, H], [560, 400, 600, H]].forEach(([a, b, c, d]) => { ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.stroke(); });
    L.vignette(ctx, W, H, 0.5);
    L.text(ctx, 'LEGEND', 70, 50, { size: 20, color: '#3a1a08', font: 'DejaVu Sans', weight: 900, align: 'left', spacing: 4 });
  },
};

S['mural-fresco'] = {
  dim: '2d', title: 'Mural fresco',
  draw(ctx, W, H, L) {
    const r = L.rng(5607);
    L.paper(ctx, W, H, '#d9b98a', 5607, '#8a6a4a');
    // figures in mineral pigments
    const fig = (x, y, s, col) => { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(0, -160, 34, 40, 0, 0, L.TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(-60, -110); ctx.quadraticCurveTo(0, -130, 60, -110); ctx.lineTo(80, 60); ctx.lineTo(-80, 60); ctx.fill(); ctx.fillStyle = '#3a2a20'; ctx.beginPath(); ctx.ellipse(0, -185, 40, 22, 0, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#e8c35a'; ctx.beginPath(); ctx.arc(0, -160, 70, Math.PI * 1.1, Math.PI * 1.9); ctx.lineWidth = 6; ctx.strokeStyle = '#e8c35a'; ctx.stroke(); ctx.restore(); };
    fig(380, 470, 1.4, '#a8552e'); fig(640, 450, 1.6, '#c77a3a'); fig(900, 470, 1.4, '#6a7a4a');
    // lotus border and flakes of missing plaster
    for (let x = 60; x < W; x += 90) { ctx.fillStyle = '#7a3a2a'; ctx.beginPath(); ctx.ellipse(x, 640, 30, 14, 0, 0, L.TAU); ctx.fill(); }
    ctx.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 7; i++) { ctx.fillStyle = '#efe2c8'; L.wobble(ctx, L.blobPts(r() * W, r.range(560, H), r.range(15, 40), r, 7, 0.4), 4, r); ctx.fill(); }
    // cracks
    ctx.strokeStyle = 'rgba(60,40,20,0.6)'; ctx.lineWidth = 1.5; for (let i = 0; i < 12; i++) { let x = r() * W, y = r() * H; ctx.beginPath(); ctx.moveTo(x, y); for (let k = 0; k < 8; k++) { x += r.range(-40, 40); y += r.range(-10, 40); ctx.lineTo(x, y); } ctx.stroke(); }
    L.grain(ctx, W, H, 0.08, 5608);
    L.vignette(ctx, W, H, 0.4, '#3a2410');
  },
};

// ---- World traditions -------------------------------------------------------
S['black-figure-vase'] = {
  dim: '3d', title: 'Black-figure vase',
  async draw({ THREE, canvas, W, H, L }) {
    const t = L.three3d(THREE, canvas, W, H, { bg: '#1a1410', fov: 28 });
    t.camera.position.set(0, 1.2, 11); t.camera.lookAt(0, 0.6, 0);
    t.scene.add(new THREE.HemisphereLight('#ffe8c8', '#1a1008', 0.6)); t.sun(-5, 6, 6, 3, '#fff0d8', 8);
    // painted band texture: black figures on terracotta with meander
    const c = document.createElement('canvas'); c.width = 2048; c.height = 1024; const x = c.getContext('2d');
    x.fillStyle = '#c4642c'; x.fillRect(0, 0, 2048, 1024);
    x.fillStyle = '#111'; x.fillRect(0, 0, 2048, 260); x.fillRect(0, 800, 2048, 224);
    x.strokeStyle = '#c4642c'; x.lineWidth = 10; for (let i = 0; i < 2048; i += 70) { x.beginPath(); x.moveTo(i, 250); x.lineTo(i, 200); x.lineTo(i + 50, 200); x.lineTo(i + 50, 235); x.lineTo(i + 20, 235); x.stroke(); }
    const hero = (cx, flip) => { x.save(); x.translate(cx, 760); x.scale(flip, 1); x.fillStyle = '#111'; x.beginPath(); x.arc(0, -400, 40, 0, Math.PI * 2); x.fill(); x.beginPath(); x.moveTo(-50, -350); x.lineTo(50, -350); x.lineTo(70, -150); x.lineTo(110, 0); x.lineTo(70, 0); x.lineTo(20, -140); x.lineTo(-30, 0); x.lineTo(-70, 0); x.lineTo(-40, -150); x.closePath(); x.fill(); x.beginPath(); x.arc(-90, -270, 70, 0, Math.PI * 2); x.fill(); x.fillRect(40, -340, 220, 14); x.beginPath(); x.moveTo(-40, -440); x.lineTo(0, -520); x.lineTo(40, -440); x.fill(); x.strokeStyle = '#c4642c'; x.lineWidth = 5; x.beginPath(); x.arc(-90, -270, 45, 0, Math.PI * 2); x.stroke(); x.restore(); };
    hero(600, 1); hero(1000, -1); hero(1500, 1);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = THREE.RepeatWrapping; tex.offset.x = 0.12;
    const prof = [[0, -2.2], [0.9, -2.2], [1.0, -2.0], [0.7, -1.6], [1.3, -0.6], [1.6, 0.4], [1.4, 1.4], [0.8, 2.0], [0.6, 2.4], [0.95, 2.7], [0.9, 2.8]].map(([a, b]) => new THREE.Vector2(a, b));
    const vase = t.mesh(new THREE.LatheGeometry(prof, 96), new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.35, clearcoat: 0.6 }), 0, 0.4, 0);
    vase.rotation.y = -0.6;
    t.mesh(new THREE.CylinderGeometry(4, 4, 0.2, 60), new THREE.MeshStandardMaterial({ color: '#2a201a', roughness: 0.8 }), 0, -1.9, 0);
    t.render();
  },
};

S['papyrus-relief'] = {
  dim: '2d', title: 'Egyptian papyrus',
  draw(ctx, W, H, L) {
    const r = L.rng(5809);
    L.paper(ctx, W, H, '#e8d3a2', 5809, '#a8885a');
    ctx.strokeStyle = 'rgba(140,110,60,0.25)'; ctx.lineWidth = 2; for (let y = 0; y < H; y += 9) { ctx.beginPath(); ctx.moveTo(0, y + r.range(-1, 1)); ctx.lineTo(W, y + r.range(-1, 1)); ctx.stroke(); }
    // registers
    ctx.fillStyle = '#1f4e8a'; ctx.fillRect(0, 90, W, 12); ctx.fillRect(0, 610, W, 12);
    // profile figure (stylised, original) and the scales of judgement
    const prof = (x, col, headCol) => { ctx.save(); ctx.translate(x, 600); ctx.fillStyle = headCol; ctx.beginPath(); ctx.ellipse(0, -400, 36, 44, 0, 0, L.TAU); ctx.fill(); ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.moveTo(-40, -440); ctx.lineTo(40, -440); ctx.lineTo(50, -330); ctx.lineTo(-50, -330); ctx.fill(); ctx.fillStyle = '#b5652e'; ctx.fillRect(-36, -350, 72, 150); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-40, -200); ctx.lineTo(40, -200); ctx.lineTo(55, -40); ctx.lineTo(-55, -40); ctx.fill(); ctx.fillStyle = '#b5652e'; ctx.fillRect(-30, -40, 22, 40); ctx.fillRect(14, -40, 22, 40); ctx.fillStyle = '#e8b23a'; ctx.fillRect(-46, -350, 92, 20); ctx.restore(); };
    prof(330, '#f2ead6', '#b5652e'); prof(930, '#f2ead6', '#2a6b5a');
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(640, 600); ctx.lineTo(640, 260); ctx.moveTo(500, 280); ctx.lineTo(780, 280); ctx.stroke();
    [[520, '#e8b23a'], [760, '#c0392b']].forEach(([x, c]) => { ctx.beginPath(); ctx.moveTo(x, 280); ctx.lineTo(x - 40, 380); ctx.moveTo(x, 280); ctx.lineTo(x + 40, 380); ctx.stroke(); ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x, 385, 50, 12, 0, 0, Math.PI); ctx.fill(); });
    // glyph column
    for (let i = 0; i < 9; i++) { const y = 130 + i * 52; ctx.fillStyle = '#1f4e8a'; ctx.fillRect(1120, y, 50, 6); ctx.beginPath(); ctx.arc(1145 + (i % 2 ? 12 : -12), y + 24, 12, 0, L.TAU); ctx.fill(); }
    L.text(ctx, 'The Weighing of the Heart', 520, 660, { size: 36, color: '#1a1a1a', font: 'DejaVu Serif', weight: 700 });
    L.text(ctx, 'MYTH · ANCIENT EGYPT', 520, 50, { size: 20, color: '#1f4e8a', font: 'DejaVu Sans', weight: 900, spacing: 4 });
    L.grain(ctx, W, H, 0.05, 5810);
  },
};

S['rune-woodcarving'] = {
  dim: '2d', title: 'Norse rune carving',
  draw(ctx, W, H, L) {
    const r = L.rng(5911);
    // wood grain
    L.fill(ctx, W, H, '#6b4a2e');
    for (let y = 0; y < H; y += 4) { ctx.strokeStyle = `rgba(${r() > 0.5 ? '40,25,12' : '140,100,60'},${r.range(0.1, 0.35)})`; ctx.lineWidth = r.range(1, 3); ctx.beginPath(); ctx.moveTo(0, y); for (let x = 0; x <= W; x += 60) ctx.lineTo(x, y + Math.sin(x * 0.01 + y * 0.05) * 6); ctx.stroke(); }
    // carved knotwork serpent ring
    const carve = (fn, w) => { ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = '#2a170a'; ctx.lineWidth = w + 6; fn(); ctx.stroke(); ctx.strokeStyle = '#c99a62'; ctx.lineWidth = w; ctx.translate(-2, -2); fn(); ctx.stroke(); ctx.restore(); };
    carve(() => { ctx.beginPath(); for (let i = 0; i <= 200; i++) { const a = (i / 200) * L.TAU, rr = 230 + Math.sin(a * 6) * 40; const p = [640 + Math.cos(a) * rr, 360 + Math.sin(a) * rr * 0.9]; i ? ctx.lineTo(...p) : ctx.moveTo(...p); } }, 18);
    carve(() => { ctx.beginPath(); ctx.arc(640, 360, 120, 0, L.TAU); }, 14);
    // runes around
    const runes = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ';
    [...runes].forEach((ch, i) => { const a = (i / runes.length) * L.TAU; const x = 640 + Math.cos(a) * 330, y = 360 + Math.sin(a) * 300; L.text(ctx, ch, x + 2, y + 2, { size: 42, color: '#2a170a', font: 'DejaVu Sans', weight: 700 }); L.text(ctx, ch, x, y, { size: 42, color: '#d8ae78', font: 'DejaVu Sans', weight: 700 }); });
    // hammer in the centre
    carve(() => { ctx.beginPath(); ctx.moveTo(640, 300); ctx.lineTo(640, 430); ctx.moveTo(590, 300); ctx.lineTo(690, 300); }, 26);
    L.vignette(ctx, W, H, 0.6);
  },
};

S['ink-river'] = {
  dim: '2d', title: 'Ink wash',
  draw(ctx, W, H, L) {
    const r = L.rng(6012);
    L.paper(ctx, W, H, '#f3efe4', 6012, '#c8bfa8');
    const mount = (x, base, w, hgt, a) => { for (let k = 0; k < 10; k++) { ctx.fillStyle = `rgba(30,30,35,${a * 0.12})`; ctx.beginPath(); ctx.moveTo(x - w, base); for (let i = 0; i <= 20; i++) { const t = i / 20; ctx.lineTo(x - w + w * 2 * t + r.range(-6, 6), base - Math.pow(Math.sin(t * Math.PI), 1.6) * hgt * (0.9 + k * 0.012) + r.range(-6, 6)); } ctx.lineTo(x + w, base); ctx.fill(); } };
    mount(300, 520, 300, 360, 0.5); mount(820, 540, 380, 300, 0.7); mount(1150, 520, 220, 220, 0.4);
    // mist band
    const g = ctx.createLinearGradient(0, 380, 0, 560); g.addColorStop(0, 'rgba(243,239,228,0)'); g.addColorStop(0.5, 'rgba(243,239,228,0.95)'); g.addColorStop(1, 'rgba(243,239,228,0)'); ctx.fillStyle = g; ctx.fillRect(0, 380, W, 180);
    // river and boat
    ctx.strokeStyle = 'rgba(30,30,35,0.5)'; ctx.lineWidth = 2; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(200 + i * 40, 600 + i * 8); ctx.lineTo(500 + i * 60, 600 + i * 8); ctx.stroke(); }
    ctx.fillStyle = '#1e1e23'; ctx.beginPath(); ctx.moveTo(560, 590); ctx.quadraticCurveTo(620, 610, 680, 590); ctx.lineTo(670, 600); ctx.lineTo(570, 600); ctx.fill(); ctx.fillRect(612, 560, 4, 32); ctx.beginPath(); ctx.arc(614, 556, 7, 0, L.TAU); ctx.fill();
    // dry-brush pine
    ctx.strokeStyle = '#1e1e23'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(1060, 700); ctx.quadraticCurveTo(1030, 560, 1080, 430); ctx.stroke();
    for (let i = 0; i < 6; i++) { ctx.lineWidth = 3; ctx.beginPath(); const y = 460 + i * 40; ctx.moveTo(1070, y); ctx.lineTo(1000 - i * 6, y - 20); ctx.moveTo(1070, y); ctx.lineTo(1150 + i * 4, y - 12); ctx.stroke(); }
    // red seal
    ctx.fillStyle = '#c1272d'; ctx.fillRect(1150, 90, 60, 60); L.text(ctx, '山', 1180, 121, { size: 40, color: '#f3efe4', font: 'IPAGothic', weight: 700 });
    L.text(ctx, 'The Swordsman and the River', 70, 80, { size: 34, color: '#1e1e23', font: 'DejaVu Serif', weight: 400, italic: true, align: 'left' });
  },
};

S['wave-print'] = {
  dim: '2d', title: 'Woodblock wave print',
  draw(ctx, W, H, L) {
    L.fill(ctx, W, H, '#efe3c6');
    // sky gradient band (bokashi)
    const g = ctx.createLinearGradient(0, 0, 0, 260); g.addColorStop(0, '#2f4f7f'); g.addColorStop(1, 'rgba(239,227,198,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, 260);
    // distant mountain
    ctx.fillStyle = '#2f4f7f'; ctx.beginPath(); ctx.moveTo(760, 470); ctx.lineTo(900, 330); ctx.lineTo(1040, 470); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(870, 360); ctx.lineTo(900, 330); ctx.lineTo(930, 360); ctx.lineTo(912, 372); ctx.lineTo(900, 360); ctx.lineTo(888, 372); ctx.fill();
    // big curling wave with claws (original take)
    const blue = '#1e3f73', light = '#7aa3c8';
    ctx.fillStyle = blue; ctx.strokeStyle = '#0f1f3a'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, 720); ctx.lineTo(0, 520); ctx.bezierCurveTo(120, 300, 360, 160, 560, 220); ctx.bezierCurveTo(660, 250, 640, 330, 560, 330); ctx.bezierCurveTo(500, 330, 470, 280, 520, 270); ctx.bezierCurveTo(400, 300, 340, 450, 420, 720); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = light; ctx.lineWidth = 6; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(30 + i * 40, 700); ctx.bezierCurveTo(60 + i * 40, 500, 200 + i * 30, 330, 420 + i * 20, 250 + i * 8); ctx.stroke(); }
    ctx.fillStyle = '#fff'; for (let i = 0; i < 16; i++) { const a = -0.4 + i * 0.12; const x = 520 + Math.cos(a) * 70, y = 280 + Math.sin(a) * 50; ctx.beginPath(); ctx.arc(x, y, 9, 0, L.TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 20, y + 14); ctx.lineTo(x + 6, y + 2); ctx.fill(); }
    // small waves and boat
    for (let i = 0; i < 5; i++) { ctx.fillStyle = blue; ctx.beginPath(); ctx.ellipse(620 + i * 140, 640, 90, 50, 0, Math.PI, 0); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = '#e8d3a2'; ctx.beginPath(); ctx.moveTo(560, 600); ctx.quadraticCurveTo(700, 660, 860, 590); ctx.lineTo(840, 620); ctx.quadraticCurveTo(700, 680, 580, 625); ctx.fill(); ctx.stroke();
    // cartouche
    ctx.fillStyle = '#e9d8a6'; ctx.fillRect(1100, 40, 120, 240); ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 3; ctx.strokeRect(1100, 40, 120, 240);
    ['波', 'の', '道'].forEach((c, i) => L.text(ctx, c, 1160, 90 + i * 70, { size: 54, color: '#1a1a1a', font: 'IPAGothic', weight: 700 }));
    L.grain(ctx, W, H, 0.05, 6113);
  },
};

S['illuminated-page'] = {
  dim: '2d', title: 'Illuminated manuscript',
  draw(ctx, W, H, L) {
    L.paper(ctx, W, H, '#efe2c4', 6214, '#b8945a');
    ctx.strokeStyle = '#8a1f1f'; ctx.lineWidth = 3; ctx.strokeRect(80, 60, W - 160, H - 120);
    // gold initial
    ctx.fillStyle = '#1f3a6b'; ctx.fillRect(120, 100, 220, 240);
    const g = ctx.createLinearGradient(120, 100, 340, 340); g.addColorStop(0, '#f8e08e'); g.addColorStop(0.5, '#c99a2e'); g.addColorStop(1, '#f8e08e');
    L.text(ctx, 'O', 230, 225, { size: 220, color: g, font: 'DejaVu Serif', weight: 900 });
    for (let i = 0; i < 8; i++) { ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.arc(130 + i * 28, 330, 6, 0, L.TAU); ctx.fill(); }
    // text lines
    const lines = ['nce upon the river road', 'there rode a king who', 'sought the lost city of', 'gold, and found instead', 'a single silver bell.'];
    lines.forEach((s, i) => L.text(ctx, s, i < 3 ? 370 : 130, 150 + i * 70, { size: 46, color: '#2a1a10', font: 'DejaVu Serif', weight: 400, italic: true, align: 'left' }));
    // marginal vine
    ctx.strokeStyle = '#2e6b3a'; ctx.lineWidth = 4; ctx.beginPath(); for (let y = 90; y < H - 80; y += 4) { const x = 1140 + Math.sin(y * 0.03) * 24; y === 90 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke();
    for (let y = 110; y < H - 90; y += 50) { ctx.fillStyle = y % 100 ? '#c0392b' : '#1f3a6b'; ctx.beginPath(); ctx.ellipse(1140 + Math.sin(y * 0.03) * 24 + 22, y, 14, 7, 0.4, 0, L.TAU); ctx.fill(); }
    L.text(ctx, 'LEGEND', 1060, 640, { size: 18, color: '#8a1f1f', font: 'DejaVu Sans', weight: 900, spacing: 4 });
  },
};

S['mosaic-tiles'] = {
  dim: '2d', title: 'Mosaic',
  draw(ctx, W, H, L) {
    const r = L.rng(6315);
    L.fill(ctx, W, H, '#3a3330');
    const col = (x, y) => {
      const d = Math.hypot(x - 640, y - 330);
      if (d < 70) return '#e0b38a';               // face
      if (d < 92) return '#3a2a20';               // hair ring
      if (d < 160 && y < 330) return '#f2c94c';    // halo
      if (Math.abs(x - 640) < 150 - (y - 420) * -0.2 && y > 400 && y < 680) return y < 470 ? '#8a1f2a' : '#5a2a6a';  // robe
      return r() > 0.5 ? '#d4a63a' : '#c89a2e';   // gold field
    };
    const s = 14;
    for (let y = 0; y < H; y += s) for (let x = (y / s) % 2 ? 0 : s / 2; x < W; x += s) {
      const c = col(x, y); ctx.fillStyle = L.mixHex(c, r() > 0.5 ? '#ffffff' : '#000000', r.range(0, 0.12));
      ctx.save(); ctx.translate(x + r.range(-1, 1), y + r.range(-1, 1)); ctx.rotate(r.range(-0.08, 0.08)); ctx.fillRect(-s / 2 + 1, -s / 2 + 1, s - 2, s - 2); ctx.restore();
    }
    for (let x = 0; x < W; x += s) { ctx.fillStyle = (x / s) % 2 ? '#1f3a6b' : '#efe2c4'; ctx.fillRect(x + 1, 1, s - 2, s - 2); ctx.fillRect(x + 1, H - s + 1, s - 2, s - 2); }
    L.vignette(ctx, W, H, 0.35);
  },
};

// ---- Cinematic & archival ----------------------------------------------------
S['parchment-map'] = {
  dim: '2d', title: 'Parchment campaign map',
  draw(ctx, W, H, L) {
    const r = L.rng(6416);
    L.paper(ctx, W, H, '#e8d5a8', 6416, '#9a7a4a');
    // coastline
    ctx.fillStyle = '#d8c08a'; ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(120, 60); for (let y = 60; y <= 680; y += 20) ctx.lineTo(820 + Math.sin(y * 0.02) * 60 + r.range(-12, 12) - (y > 420 ? (y - 420) * 0.9 : 0), y); ctx.lineTo(120, 680); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(90,58,26,0.35)'; for (let k = 1; k < 4; k++) { ctx.beginPath(); for (let y = 60; y <= 680; y += 20) { const x = 820 + Math.sin(y * 0.02) * 60 - (y > 420 ? (y - 420) * 0.9 : 0) + k * 16; y === 60 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke(); }
    // mountains, river, cities
    for (let i = 0; i < 9; i++) { const x = 240 + i * 50, y = 230 + (i % 2) * 20; ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 22, y + 20); ctx.lineTo(x, y - 16); ctx.lineTo(x + 22, y + 20); ctx.stroke(); }
    ctx.strokeStyle = '#3d6b8a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(180, 120); ctx.bezierCurveTo(300, 300, 480, 330, 700, 520); ctx.stroke();
    const city = (x, y, n) => { ctx.fillStyle = '#8a1f1f'; ctx.beginPath(); ctx.arc(x, y, 9, 0, L.TAU); ctx.fill(); L.text(ctx, n, x + 14, y - 4, { size: 22, color: '#2a1a0a', font: 'DejaVu Serif', weight: 700, italic: true, align: 'left' }); };
    city(300, 420, 'Warangal'); city(560, 300, 'Golconda'); city(450, 580, 'Kanchi');
    // campaign arrow
    ctx.strokeStyle = '#8a1f1f'; ctx.fillStyle = '#8a1f1f'; ctx.lineWidth = 8; ctx.setLineDash([22, 10]);
    ctx.beginPath(); ctx.moveTo(300, 420); ctx.quadraticCurveTo(420, 470, 450, 570); ctx.stroke(); ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(452, 585); ctx.lineTo(430, 545); ctx.lineTo(475, 550); ctx.fill();
    // compass rose + year
    ctx.save(); ctx.translate(1060, 520); ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 80, 0, L.TAU); ctx.stroke(); ctx.fillStyle = '#5a3a1a'; L.star(ctx, 0, 0, 90, 16, 4); ctx.fill(); L.text(ctx, 'N', 0, -110, { size: 28, color: '#5a3a1a', font: 'DejaVu Serif', weight: 700 }); ctx.restore();
    L.text(ctx, '1309 CE', 1060, 140, { size: 72, color: '#8a1f1f', font: 'DejaVu Serif', weight: 700 });
    L.text(ctx, 'HISTORY', 1060, 200, { size: 20, color: '#5a3a1a', font: 'DejaVu Sans', weight: 900, spacing: 5 });
    L.vignette(ctx, W, H, 0.4, '#3a2410');
  },
};

S['woodcut-legend'] = {
  dim: '2d', title: 'Woodcut legend',
  draw(ctx, W, H, L) {
    const r = L.rng(6517);
    L.fill(ctx, W, H, '#efe6d2');
    ctx.fillStyle = '#141414';
    // carved sky lines
    for (let y = 30; y < 360; y += 12) { ctx.fillRect(0, y, W, 4 + (360 - y) / 90); }
    // red sun
    ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.arc(900, 220, 110, 0, L.TAU); ctx.fill();
    ctx.fillStyle = '#efe6d2'; for (let y = 120; y < 330; y += 18) ctx.fillRect(780, y, 240, 5);
    // hills as solid black with gouge marks
    ctx.fillStyle = '#141414'; ctx.beginPath(); ctx.moveTo(0, 470); ctx.bezierCurveTo(300, 330, 600, 520, 900, 420); ctx.bezierCurveTo(1100, 360, 1200, 430, W, 400); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
    ctx.strokeStyle = '#efe6d2'; ctx.lineWidth = 3; for (let i = 0; i < 140; i++) { const x = r() * W, y = r.range(500, H - 10); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + r.range(10, 30), y - r.range(0, 6)); ctx.stroke(); }
    // bell tower silhouette
    ctx.fillStyle = '#141414'; ctx.fillRect(380, 250, 90, 230); ctx.beginPath(); ctx.moveTo(360, 250); ctx.lineTo(425, 170); ctx.lineTo(490, 250); ctx.fill();
    ctx.fillStyle = '#efe6d2'; ctx.beginPath(); ctx.arc(425, 300, 26, Math.PI, 0); ctx.fill(); ctx.fillRect(399, 300, 52, 34);
    ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.moveTo(410, 300); ctx.quadraticCurveTo(425, 270, 440, 300); ctx.lineTo(445, 330); ctx.lineTo(405, 330); ctx.fill();
    L.text(ctx, 'THE BELL FOUNDER', 640, 650, { size: 52, color: '#efe6d2', font: 'DejaVu Serif', weight: 900, spacing: 6 });
    L.grain(ctx, W, H, 0.06, 6518);
  },
};

S['oil-impasto'] = {
  dim: '2d', title: 'Oil impasto',
  draw(ctx, W, H, L) {
    const r = L.rng(6619);
    const field = (x, y) => { const sky = y < 380; if (sky) { const d = Math.hypot(x - 980, y - 180); return d < 90 ? '#ffd27a' : d < 200 ? '#f0a35a' : L.mixHex('#4a6fa5', '#e9a07a', y / 380); } return L.mixHex('#4a6b3a', '#2a3a28', (y - 380) / 340); };
    L.fill(ctx, W, H, '#33424f');
    for (let i = 0; i < 9000; i++) {
      const x = r() * W, y = r() * H, c = field(x, y);
      const a = y < 380 ? Math.sin(x * 0.01 + y * 0.02) * 1.2 : Math.PI / 2 + Math.sin(x * 0.02) * 0.4;
      const len = r.range(14, 34), wdt = r.range(4, 9);
      ctx.save(); ctx.translate(x, y); ctx.rotate(a);
      ctx.fillStyle = L.mixHex(c, '#000000', 0.25); ctx.beginPath(); ctx.ellipse(1.5, 1.5, len / 2, wdt / 2, 0, 0, L.TAU); ctx.fill();
      ctx.fillStyle = L.mixHex(c, r() > 0.5 ? '#ffffff' : '#000000', r.range(0, 0.15)); ctx.beginPath(); ctx.ellipse(0, 0, len / 2, wdt / 2, 0, 0, L.TAU); ctx.fill();
      ctx.restore();
    }
    // a lone figure and a horse (silhouette painted thick)
    ctx.fillStyle = '#1a1612';
    ctx.beginPath(); ctx.ellipse(420, 520, 70, 34, 0, 0, L.TAU); ctx.fill(); ctx.fillRect(360, 530, 12, 70); ctx.fillRect(470, 530, 12, 70); ctx.beginPath(); ctx.moveTo(480, 505); ctx.lineTo(540, 450); ctx.lineTo(555, 470); ctx.lineTo(495, 525); ctx.fill();
    ctx.beginPath(); ctx.arc(600, 470, 16, 0, L.TAU); ctx.fill(); ctx.fillRect(590, 485, 22, 70); ctx.fillRect(588, 555, 10, 40); ctx.fillRect(604, 555, 10, 40);
    L.text(ctx, 'The Last Ride Home', 640, 660, { size: 40, color: '#f5e6c8', font: 'DejaVu Serif', weight: 700, italic: true });
  },
};

S['newsreel-1920'] = {
  dim: '2d', title: '1920s newsreel',
  draw(ctx, W, H, L) {
    const r = L.rng(6720);
    L.fill(ctx, W, H, '#2a2620');
    // city crowd scene: buildings + bunting
    for (let i = 0; i < 9; i++) { const x = i * 150, h = 250 + r() * 200; ctx.fillStyle = L.mixHex('#8a8070', '#4a443a', r()); ctx.fillRect(x, H - h - 140, 140, h); for (let wy = H - h - 120; wy < H - 160; wy += 40) for (let wx = x + 16; wx < x + 130; wx += 34) { ctx.fillStyle = 'rgba(30,26,20,0.8)'; ctx.fillRect(wx, wy, 18, 24); } }
    ctx.fillStyle = '#3a342c'; ctx.fillRect(0, H - 140, W, 140);
    for (let i = 0; i < 90; i++) { ctx.fillStyle = L.mixHex('#1a1812', '#5a5246', r()); const x = r() * W, y = H - r.range(20, 140); ctx.beginPath(); ctx.arc(x, y - 30, 10, 0, L.TAU); ctx.fill(); ctx.fillRect(x - 10, y - 20, 20, 40); ctx.fillStyle = '#1a1812'; ctx.fillRect(x - 13, y - 42, 26, 6); }
    ctx.strokeStyle = '#d8d0c0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 160); ctx.quadraticCurveTo(640, 260, W, 160); ctx.stroke();
    for (let i = 0; i < 20; i++) { const x = 30 + i * 64, y = 160 + Math.sin((x / W) * Math.PI) * 100 * 0.98; ctx.fillStyle = i % 2 ? '#d8d0c0' : '#6a6050'; ctx.beginPath(); ctx.moveTo(x - 14, y); ctx.lineTo(x + 14, y); ctx.lineTo(x, y + 32); ctx.fill(); }
    // sepia, damage, vignette, title strip
    const img = ctx.getImageData(0, 0, W, H), d = img.data; for (let i = 0; i < d.length; i += 4) { const g = d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11; d[i] = g * 1.08; d[i + 1] = g * 0.95; d[i + 2] = g * 0.78; } ctx.putImageData(img, 0, 0);
    L.grain(ctx, W, H, 0.16, 6721); L.filmDamage(ctx, W, H, r, 9); L.vignette(ctx, W, H, 0.75);
    ctx.fillStyle = 'rgba(10,8,6,0.85)'; ctx.fillRect(160, 40, 960, 90); ctx.strokeStyle = '#d8c8a8'; ctx.lineWidth = 3; ctx.strokeRect(170, 50, 940, 70);
    L.text(ctx, 'CITY CELEBRATES · 1925', 640, 86, { size: 44, color: '#e8dcc0', font: 'DejaVu Serif', weight: 700, spacing: 4 });
  },
};

S['stained-window'] = {
  dim: '2d', title: 'Stained glass',
  draw(ctx, W, H, L) {
    const r = L.rng(6822);
    L.fill(ctx, W, H, '#111');
    ctx.save(); ctx.beginPath(); ctx.moveTo(340, H); ctx.lineTo(340, 260); ctx.quadraticCurveTo(640, -40, 940, 260); ctx.lineTo(940, H); ctx.closePath(); ctx.clip();
    // voronoi-ish panes
    const seeds = Array.from({ length: 70 }, () => [r.range(330, 950), r.range(40, H)]);
    const pal = (x, y) => { const d = Math.hypot(x - 640, y - 330); if (d < 90) return '#f2c94c'; if (Math.abs(x - 640) < 90 && y > 400) return '#b3202f'; return y < 250 ? r.pick(['#2a5db0', '#3c7bd6']) : r.pick(['#2e8b57', '#1f6b8f', '#6a3fa0', '#2a5db0']); };
    const step = 6;
    const owner = [];
    for (let y = 0; y < H; y += step) for (let x = 330; x < 950; x += step) { let bi = 0, bd = 1e9; seeds.forEach(([sx, sy], i) => { const dd = (sx - x) ** 2 + (sy - y) ** 2; if (dd < bd) { bd = dd; bi = i; } }); owner.push([x, y, bi]); }
    const cols = seeds.map(([x, y]) => pal(x, y));
    owner.forEach(([x, y, i]) => { ctx.fillStyle = cols[i]; ctx.fillRect(x, y, step, step); });
    // lead lines at pane borders
    ctx.fillStyle = '#151515'; const idx = new Map(owner.map(([x, y, i]) => [`${x},${y}`, i]));
    owner.forEach(([x, y, i]) => { const rt = idx.get(`${x + step},${y}`), dn = idx.get(`${x},${y + step}`); if ((rt !== undefined && rt !== i) || (dn !== undefined && dn !== i)) ctx.fillRect(x, y, step, step); });
    // glow
    const g = ctx.createRadialGradient(640, 330, 30, 640, 330, 420); g.addColorStop(0, 'rgba(255,240,200,0.35)'); g.addColorStop(1, 'rgba(255,240,200,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.restore();
    ctx.strokeStyle = '#2a2420'; ctx.lineWidth = 26; ctx.beginPath(); ctx.moveTo(340, H); ctx.lineTo(340, 260); ctx.quadraticCurveTo(640, -40, 940, 260); ctx.lineTo(940, H); ctx.stroke();
    // light spill on the floor
    ctx.save(); ctx.globalAlpha = 0.25; ctx.fillStyle = L.linGrad(ctx, 0, 600, 0, H, [[0, '#f2c94c'], [1, '#2a5db0']]); ctx.beginPath(); ctx.moveTo(340, H); ctx.lineTo(940, H); ctx.lineTo(1180, H); ctx.lineTo(100, H); ctx.fill(); ctx.restore();
  },
};

S['epic-silhouette'] = {
  dim: '2d', title: 'Epic silhouette',
  async draw(ctx, W, H, L) {
    const r = L.rng(6923); const king = await spec('warrior-king');
    ctx.fillStyle = L.linGrad(ctx, 0, 0, 0, H, [[0, '#2a0f1f'], [0.45, '#c2410c'], [0.62, '#fbbf24'], [1, '#2a0f1f']]); ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ffe9a8'; ctx.beginPath(); ctx.arc(640, 400, 170, 0, L.TAU); ctx.fill();
    // dust
    for (let i = 0; i < 300; i++) { ctx.fillStyle = `rgba(255,220,160,${r.range(0.05, 0.25)})`; ctx.beginPath(); ctx.arc(r() * W, r.range(300, 620), r.range(1, 3), 0, L.TAU); ctx.fill(); }
    // layered parallax ridges with army
    const ridge = (base, amp, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 20) ctx.lineTo(x, base - Math.sin(x * 0.004 + base) * amp); ctx.lineTo(W, H); ctx.fill(); };
    ridge(540, 30, '#5a1d12'); ridge(590, 20, '#3a1008');
    for (let i = 0; i < 70; i++) { const x = r() * W, y = 585 + r.range(-6, 6); ctx.fillStyle = '#2a0a05'; ctx.fillRect(x, y - 26, 6, 26); ctx.beginPath(); ctx.arc(x + 3, y - 30, 5, 0, L.TAU); ctx.fill(); ctx.fillRect(x + 6, y - 60, 2, 50); }
    ridge(660, 12, '#140404');
    // the approved king, as pure silhouette (same proportions & accessories)
    const black = Object.fromEntries(Object.keys(king.colors).map((k) => [k, '#0c0202']));
    drawCharacter(ctx, { ...king, colors: black, outfit: { ...king.outfit, cape: '#0c0202' } }, { x: 640, y: 690, h: 430, view: 'back', pose: 'hero' });
    // banner
    ctx.fillStyle = '#0c0202'; ctx.fillRect(830, 330, 6, 360); ctx.beginPath(); ctx.moveTo(836, 335); ctx.quadraticCurveTo(920, 360, 990, 340); ctx.lineTo(980, 420); ctx.quadraticCurveTo(920, 440, 836, 420); ctx.fill();
    L.text(ctx, 'The Day the Fort Stood', 640, 70, { size: 48, color: '#ffe9a8', font: 'DejaVu Serif', weight: 700, spacing: 2 });
  },
};

S['deco-gold'] = {
  dim: '2d', title: 'Art Deco gold',
  draw(ctx, W, H, L) {
    L.fill(ctx, W, H, '#0f1d1a');
    const gold = L.linGrad(ctx, 0, 0, 0, H, [[0, '#f8e08e'], [0.5, '#c9962e'], [1, '#f8e08e']]);
    ctx.strokeStyle = gold; ctx.lineWidth = 3;
    // sunburst fan
    for (let i = 0; i <= 24; i++) { const a = Math.PI + (i / 24) * Math.PI; ctx.beginPath(); ctx.moveTo(640, 520); ctx.lineTo(640 + Math.cos(a) * 700, 520 + Math.sin(a) * 700); ctx.stroke(); }
    ctx.fillStyle = '#0f1d1a'; ctx.beginPath(); ctx.arc(640, 520, 230, Math.PI, 0); ctx.fill();
    for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(640, 520, 90 + k * 34, Math.PI, 0); ctx.stroke(); }
    // stepped tower
    ctx.fillStyle = '#0f1d1a'; ctx.strokeStyle = gold; ctx.lineWidth = 4;
    [[160, 300], [120, 380], [80, 450]].forEach(([w, y]) => { ctx.fillRect(640 - w, y, w * 2, 520 - y); ctx.strokeRect(640 - w, y, w * 2, 520 - y); });
    ctx.beginPath(); ctx.moveTo(640, 170); ctx.lineTo(600, 300); ctx.lineTo(680, 300); ctx.closePath(); ctx.fill(); ctx.stroke();
    for (let x = 500; x <= 780; x += 28) { ctx.beginPath(); ctx.moveTo(x, 470); ctx.lineTo(x, 520); ctx.stroke(); }
    // frame + type
    ctx.strokeRect(40, 40, W - 80, H - 80); ctx.strokeRect(56, 56, W - 112, H - 112);
    [[56, 56], [W - 56, 56], [56, H - 56], [W - 56, H - 56]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 26, 0, L.TAU); ctx.stroke(); });
    L.text(ctx, 'THE STARLIGHT YEARS', 640, 610, { size: 56, color: gold, font: 'DejaVu Sans', weight: 300, spacing: 14 });
    L.text(ctx, '1924 — 1933', 640, 660, { size: 24, color: '#c9962e', font: 'DejaVu Sans', weight: 400, spacing: 8 });
  },
};

export default S;
