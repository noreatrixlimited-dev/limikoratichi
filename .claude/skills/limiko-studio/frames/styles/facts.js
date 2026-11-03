// Facts / science styles: test frames.
const S = {};

S['whiteboard-hand'] = {
  dim: '2d', title: 'Whiteboard explainer',
  draw(ctx, W, H, L) {
    const r = L.rng(3101);
    L.fill(ctx, W, H, '#fbfbf8');
    ctx.strokeStyle = '#1b1b1b'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const line = (pts, w = 5) => { ctx.lineWidth = w; L.wobble(ctx, pts, 2, r, false); ctx.stroke(); };
    // sun → earth with arrows: why seasons happen
    ctx.lineWidth = 5; L.wobble(ctx, L.circlePts(230, 330, 110), 3, r); ctx.stroke();
    for (let i = 0; i < 12; i++) { const a = (i / 12) * L.TAU; line([[230 + Math.cos(a) * 130, 330 + Math.sin(a) * 130], [230 + Math.cos(a) * 165, 330 + Math.sin(a) * 165]], 4); }
    ctx.save(); ctx.translate(820, 330); ctx.rotate(0.41);
    L.wobble(ctx, L.circlePts(0, 0, 120), 3, r); ctx.stroke();
    line([[0, -175], [0, 175]], 4); line([[-120, 0], [120, 0]], 2);
    ctx.restore();
    ctx.setLineDash([16, 12]); line([[380, 300], [660, 300]], 4); line([[380, 360], [660, 360]], 4); ctx.setLineDash([]);
    line([[640, 285], [665, 300], [640, 315]], 4); line([[640, 345], [665, 360], [640, 375]], 4);
    L.text(ctx, '23.5°', 1000, 160, { size: 44, color: '#d62828', font: 'Comic Sans MS, DejaVu Sans', weight: 700 });
    ctx.strokeStyle = '#d62828'; line([[900, 170], [960, 165]], 4);
    L.text(ctx, 'Why do we have seasons?', W / 2, 70, { size: 54, color: '#1b1b1b', font: 'Comic Sans MS, DejaVu Sans', weight: 700 });
    L.text(ctx, 'The tilt, not the distance!', W / 2, 600, { size: 44, color: '#2a62c9', font: 'Comic Sans MS, DejaVu Sans', weight: 700 });
    // drawing hand
    ctx.save(); ctx.translate(1040, 560); ctx.rotate(-0.5);
    ctx.fillStyle = '#f2c9a8'; ctx.strokeStyle = '#6a4a3a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(0, 0, 150, 70, 30); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#2a62c9'; ctx.fillRect(-60, 26, 80, 16); ctx.fillStyle = '#1b1b1b'; ctx.fillRect(-72, 30, 14, 8);
    ctx.restore();
  },
};

S['iso-diagram'] = {
  dim: '2d', title: 'Isometric infographic',
  draw(ctx, W, H, L) {
    L.fill(ctx, W, H, '#eef3f8');
    const P = L.iso(640, 300, 40);
    for (let i = -6; i <= 6; i++) { ctx.strokeStyle = '#dbe4ee'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(...P(i, -6)); ctx.lineTo(...P(i, 6)); ctx.moveTo(...P(-6, i)); ctx.lineTo(...P(6, i)); ctx.stroke(); }
    // 4 stations: farm → factory → ship → cup
    const st = [[-5, -1, '#7ac74f', 'Farm'], [-1, -1, '#f4a259', 'Roast'], [3, -1, '#5b8def', 'Ship'], [3, 3, '#e05263', 'Café']];
    st.forEach(([x, y, c, n], i) => {
      L.isoBox(ctx, P, x, y, 0, 2, 2, i === 1 ? 2.5 : 1.4, L.mixHex(c, '#ffffff', 0.25), L.mixHex(c, '#000000', 0.2), c);
      const [tx, ty] = P(x + 1, y + 1, (i === 1 ? 2.5 : 1.4) + 1.2);
      L.text(ctx, `${i + 1}. ${n}`, tx, ty, { size: 26, color: '#23324a', font: 'Inter', weight: 800 });
    });
    // flow arrows along the ground
    ctx.strokeStyle = '#23324a'; ctx.lineWidth = 4; ctx.setLineDash([10, 8]);
    [[[-3, 0], [-1, 0]], [[1, 0], [3, 0]], [[4, 1], [4, 3]]].forEach(([a, b]) => { ctx.beginPath(); ctx.moveTo(...P(...a)); ctx.lineTo(...P(...b)); ctx.stroke(); });
    ctx.setLineDash([]);
    L.text(ctx, 'From Bean to Cup', 640, 70, { size: 56, color: '#23324a', font: 'Inter', weight: 900 });
    L.text(ctx, '7,400 km', 1040, 300, { size: 40, color: '#5b8def', font: 'Inter', weight: 900 });
  },
};

S['data-story'] = {
  dim: '2d', title: 'Data storytelling',
  draw(ctx, W, H, L) {
    L.fill(ctx, W, H, '#101318');
    const vals = [12, 15, 14, 18, 22, 21, 27, 31, 36, 44];
    const x0 = 140, y0 = 600, bw = 80, gap = 26, max = 50;
    vals.forEach((v, i) => {
      const hgt = (v / max) * 420, x = x0 + i * (bw + gap);
      ctx.fillStyle = i === vals.length - 1 ? '#ffcc33' : '#3a4250'; ctx.fillRect(x, y0 - hgt, bw, hgt);
      L.text(ctx, String(1935 + i * 10), x + bw / 2, y0 + 28, { size: 20, color: '#8a93a3', font: 'Inter', weight: 600 });
    });
    ctx.strokeStyle = '#ffcc33'; ctx.lineWidth = 3; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.moveTo(x0 + 9 * (bw + gap) + bw / 2, y0 - (44 / max) * 420 - 10); ctx.lineTo(1100, 150); ctx.stroke(); ctx.setLineDash([]);
    L.text(ctx, '44', 1150, 120, { size: 120, color: '#ffcc33', font: 'Inter', weight: 900 });
    L.text(ctx, 'hot days a year', 1150, 200, { size: 28, color: '#ffffff', font: 'Inter', weight: 700 });
    L.text(ctx, 'A Hundred Summers', 140, 80, { size: 52, color: '#ffffff', font: 'Inter', weight: 900, align: 'left' });
    L.text(ctx, 'Sample data for a style test', 140, 690, { size: 18, color: '#6a7383', font: 'Inter', weight: 500, align: 'left' });
  },
};

S['blueprint-sheet'] = {
  dim: '2d', title: 'Blueprint',
  draw(ctx, W, H, L) {
    L.fill(ctx, W, H, '#1d4f91');
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.strokeStyle = '#e8f1ff'; ctx.lineWidth = 3;
    // windmill: tower, hub, blades, dimension lines
    ctx.beginPath(); ctx.moveTo(560, 640); ctx.lineTo(610, 260); ctx.lineTo(670, 260); ctx.lineTo(720, 640); ctx.closePath(); ctx.stroke();
    ctx.beginPath(); ctx.arc(640, 240, 26, 0, L.TAU); ctx.stroke();
    for (let i = 0; i < 4; i++) { ctx.save(); ctx.translate(640, 240); ctx.rotate(i * Math.PI / 2 + 0.3); ctx.strokeRect(20, -18, 220, 36); ctx.beginPath(); ctx.moveTo(20, 0); ctx.lineTo(240, 0); ctx.stroke(); ctx.restore(); }
    ctx.setLineDash([10, 6]); ctx.beginPath(); ctx.arc(640, 240, 245, 0, L.TAU); ctx.stroke(); ctx.setLineDash([]);
    ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(820, 240); ctx.lineTo(820, 640); ctx.moveTo(805, 240); ctx.lineTo(835, 240); ctx.moveTo(805, 640); ctx.lineTo(835, 640); ctx.stroke();
    L.text(ctx, '18.0 m', 870, 440, { size: 26, color: '#e8f1ff', font: 'DejaVu Sans Mono', weight: 700, align: 'left' });
    L.text(ctx, 'Ø 24.5 m', 900, 80, { size: 26, color: '#e8f1ff', font: 'DejaVu Sans Mono', weight: 700, align: 'left' });
    ctx.strokeRect(40, 560, 380, 120); L.text(ctx, 'HOW A WINDMILL WORKS', 60, 600, { size: 24, color: '#e8f1ff', font: 'DejaVu Sans Mono', weight: 700, align: 'left' });
    L.text(ctx, 'SHEET 2 OF 6   SCALE 1:200', 60, 645, { size: 18, color: '#b8d0f0', font: 'DejaVu Sans Mono', weight: 400, align: 'left' });
  },
};

S['exploded-view'] = {
  dim: '3d', title: 'Exploded view',
  async draw({ THREE, canvas, W, H, L }) {
    const t = L.three3d(THREE, canvas, W, H, { bg: '#f2f3f5', fov: 30 });
    t.camera.position.set(9, 6, 12); t.camera.lookAt(0, 0.5, 0);
    t.scene.add(new THREE.HemisphereLight('#ffffff', '#c8cbd2', 1.2)); t.sun(6, 10, 6, 2.4, '#ffffff', 10);
    const m = (c, metal = 0.1, rough = 0.4) => new THREE.MeshStandardMaterial({ color: c, metalness: metal, roughness: rough });
    // a flashlight exploded along x: cap, lens, reflector, bulb, battery x2, body, tail
    const parts = [
      [new THREE.CylinderGeometry(0.9, 0.9, 0.5, 48), m('#2b2f36', 0.6, 0.3), -5],
      [new THREE.CylinderGeometry(0.82, 0.82, 0.08, 48), new THREE.MeshPhysicalMaterial({ color: '#cfe8ff', transmission: 0.9, roughness: 0.05, thickness: 0.2 }), -4],
      [new THREE.ConeGeometry(0.8, 0.9, 48, 1, true), m('#d9dde3', 1, 0.15), -3],
      [new THREE.SphereGeometry(0.22, 24, 16), new THREE.MeshStandardMaterial({ color: '#fff4c2', emissive: '#ffd36b', emissiveIntensity: 0.8 }), -2],
      [new THREE.CylinderGeometry(0.45, 0.45, 1.6, 32), m('#e05263', 0.2, 0.4), -0.6],
      [new THREE.CylinderGeometry(0.45, 0.45, 1.6, 32), m('#e05263', 0.2, 0.4), 1.2],
      [new THREE.CylinderGeometry(0.7, 0.7, 3.4, 48, 1, true), m('#3a3f48', 0.7, 0.35), 3.4],
      [new THREE.CylinderGeometry(0.72, 0.72, 0.4, 48), m('#2b2f36', 0.6, 0.3), 5.6],
    ];
    parts.forEach(([g, mat, x]) => { const p = t.mesh(g, mat, x, 0.6, 0); p.rotation.z = Math.PI / 2; });
    const axis = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-6.5, 0.6, 0), new THREE.Vector3(6.5, 0.6, 0)]), new THREE.LineDashedMaterial({ color: '#8a93a3', dashSize: 0.2, gapSize: 0.15 }));
    axis.computeLineDistances(); t.scene.add(axis);
    t.mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.18 }), 0, -0.6, 0).rotation.x = -Math.PI / 2;
    t.render();
    // labels in 2D over the render
    const ov = document.createElement('canvas'); ov.width = W; ov.height = H; const o = ov.getContext('2d'); o.drawImage(canvas, 0, 0);
    const lab = (s, x, y, tx, ty) => { o.strokeStyle = '#23324a'; o.lineWidth = 2; o.beginPath(); o.moveTo(x, y); o.lineTo(tx, ty); o.stroke(); o.fillStyle = '#23324a'; o.beginPath(); o.arc(x, y, 5, 0, L.TAU); o.fill(); L.text(o, s, tx, ty - 16, { size: 24, color: '#23324a', font: 'Inter', weight: 800 }); };
    const p3 = (x) => { const v = new THREE.Vector3(x, 0.6, 0).project(t.camera); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H]; };
    [['Lens', -4], ['Reflector', -3], ['Bulb', -2], ['Batteries', 0.3], ['Body', 3.4]].forEach(([s, x], i) => { const [px, py] = p3(x); lab(s, px, py - 30, px - 10, py - (i % 2 ? 170 : 120)); });
    L.text(o, 'What\'s inside a flashlight?', 640, 60, { size: 46, color: '#23324a', font: 'Inter', weight: 900 });
    canvas.replaceWith(ov); ov.id = 'c';
  },
};

S['scale-zoom'] = {
  dim: '2d', title: 'Scale comparison',
  draw(ctx, W, H, L) {
    ctx.fillStyle = L.linGrad(ctx, 0, 0, 0, H, [[0, '#0b1026'], [1, '#1d2b5a']]); ctx.fillRect(0, 0, W, H);
    const r = L.rng(3606); for (let i = 0; i < 200; i++) { ctx.fillStyle = `rgba(255,255,255,${r.range(0.2, 0.9)})`; ctx.fillRect(r() * W, r() * H, 1.5, 1.5); }
    const ground = 560;
    const planets = [['Earth', 12, '#3a8ee6'], ['Neptune', 46, '#4b6fe0'], ['Saturn', 110, '#e8c27a'], ['Jupiter', 132, '#d9a066']];
    let x = 120;
    planets.forEach(([n, rad, c]) => { x += rad; ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, ground - rad, rad, 0, L.TAU); ctx.fill(); if (n === 'Saturn') { ctx.strokeStyle = '#f3dca3'; ctx.lineWidth = 8; ctx.beginPath(); ctx.ellipse(x, ground - rad, rad * 1.8, rad * 0.35, -0.25, 0, L.TAU); ctx.stroke(); } L.text(ctx, n, x, ground + 34, { size: 24, color: '#fff', font: 'Inter', weight: 700 }); x += rad + 40; });
    // the sun, too big to fit
    const g = ctx.createRadialGradient(1500, ground - 700, 100, 1500, ground - 700, 900); g.addColorStop(0, '#fff3b0'); g.addColorStop(0.7, '#ffb703'); g.addColorStop(1, '#fb8500');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(1500, ground - 640, 680, 0, L.TAU); ctx.fill();
    L.text(ctx, 'The Sun →', 1080, 120, { size: 40, color: '#2a1500', font: 'Inter', weight: 900 });
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, ground); ctx.lineTo(W, ground); ctx.stroke();
    L.text(ctx, '1,300,000 Earths fit inside', 330, 80, { size: 40, color: '#ffffff', font: 'Inter', weight: 900 });
  },
};

S['satellite-pass'] = {
  dim: '2d', title: 'Satellite briefing',
  draw(ctx, W, H, L) {
    const r = L.rng(3707);
    L.fill(ctx, W, H, '#1a2a2f');
    // procedural terrain tiles
    for (let y = 0; y < H; y += 8) for (let x = 0; x < W; x += 8) { const n = Math.sin(x * 0.006) + Math.cos(y * 0.008) + Math.sin((x + y) * 0.013) * 0.6 + r() * 0.3; ctx.fillStyle = n > 1.1 ? '#6b7b5a' : n > 0.4 ? '#4f6a4a' : n > -0.2 ? '#3d5a45' : '#1f4a6b'; ctx.fillRect(x, y, 8, 8); }
    // river
    ctx.strokeStyle = '#2a6f9a'; ctx.lineWidth = 14; ctx.beginPath(); ctx.moveTo(0, 520); ctx.bezierCurveTo(300, 420, 500, 640, 800, 480); ctx.bezierCurveTo(1000, 380, 1100, 300, W, 260); ctx.stroke();
    // roads
    ctx.strokeStyle = 'rgba(230,220,200,0.6)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(200, 0); ctx.lineTo(700, H); ctx.moveTo(0, 200); ctx.lineTo(W, 350); ctx.stroke();
    // scan grid + target
    ctx.strokeStyle = 'rgba(120,255,200,0.25)'; ctx.lineWidth = 1; for (let x = 0; x < W; x += 80) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); } for (let y = 0; y < H; y += 80) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.strokeStyle = '#7dffc8'; ctx.lineWidth = 3; ctx.strokeRect(560, 330, 160, 120); [[560, 330], [720, 330], [560, 450], [720, 450]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 6, 0, L.TAU); ctx.stroke(); });
    ctx.beginPath(); ctx.arc(640, 390, 220, 0, L.TAU); ctx.stroke();
    L.text(ctx, '17.3850° N   78.4867° E', 40, 40, { size: 26, color: '#7dffc8', font: 'DejaVu Sans Mono', weight: 700, align: 'left' });
    L.text(ctx, 'ALT 412 km · PASS 3/5', W - 40, 40, { size: 26, color: '#7dffc8', font: 'DejaVu Sans Mono', weight: 700, align: 'right' });
    L.text(ctx, 'The river that moved 2 km', W / 2, H - 50, { size: 44, color: '#ffffff', stroke: '#000', strokeW: 8, font: 'Inter', weight: 900 });
    L.scanlines(ctx, W, H, 4, 0.12);
  },
};

S['microscope-lens'] = {
  dim: '2d', title: 'Microscope story',
  draw(ctx, W, H, L) {
    const r = L.rng(3808);
    L.fill(ctx, W, H, '#050507');
    ctx.save(); ctx.beginPath(); ctx.arc(640, 360, 320, 0, L.TAU); ctx.clip();
    const g = ctx.createRadialGradient(640, 360, 0, 640, 360, 330); g.addColorStop(0, '#e9f5e1'); g.addColorStop(1, '#a9cf9a'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 26; i++) {
      const x = r.range(330, 950), y = r.range(60, 660), rad = r.range(30, 70);
      ctx.fillStyle = 'rgba(80,150,90,0.35)'; L.wobble(ctx, L.blobPts(x, y, rad, r, 9, 0.18), 1, r); ctx.fill();
      ctx.strokeStyle = 'rgba(40,100,50,0.7)'; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.fillStyle = 'rgba(60,70,140,0.65)'; ctx.beginPath(); ctx.arc(x + r.range(-8, 8), y + r.range(-8, 8), rad * 0.25, 0, L.TAU); ctx.fill();
      for (let k = 0; k < 5; k++) { ctx.fillStyle = 'rgba(20,110,40,0.55)'; ctx.beginPath(); ctx.ellipse(x + r.range(-rad * 0.6, rad * 0.6), y + r.range(-rad * 0.6, rad * 0.6), 7, 4, r() * 3, 0, L.TAU); ctx.fill(); }
    }
    ctx.restore();
    const vg = ctx.createRadialGradient(640, 360, 250, 640, 360, 330); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.85)'); ctx.fillStyle = vg; ctx.beginPath(); ctx.arc(640, 360, 330, 0, L.TAU); ctx.fill();
    ctx.strokeStyle = '#222'; ctx.lineWidth = 20; ctx.beginPath(); ctx.arc(640, 360, 330, 0, L.TAU); ctx.stroke();
    L.text(ctx, '×400', 1080, 120, { size: 60, color: '#e9f5e1', font: 'DejaVu Sans Mono', weight: 700 });
    L.text(ctx, 'Plant cells', 1080, 600, { size: 40, color: '#e9f5e1', font: 'Inter', weight: 800 });
    L.text(ctx, 'chloroplasts ↘', 190, 220, { size: 30, color: '#b6e3a6', font: 'Inter', weight: 700 });
  },
};

S['evidence-board'] = {
  dim: '2d', title: 'Evidence board',
  draw(ctx, W, H, L) {
    const r = L.rng(3909);
    L.fill(ctx, W, H, '#b58a5a');
    for (let i = 0; i < 9000; i++) { ctx.fillStyle = `rgba(${r() > 0.5 ? '90,60,30' : '210,170,120'},0.25)`; ctx.fillRect(r() * W, r() * H, 2, 2); }
    const pins = [];
    const card = (x, y, w, h, rot, fn) => { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 6; fn(w, h); ctx.restore(); pins.push([x, y - h / 2 + 12]); };
    card(260, 220, 260, 200, -0.05, (w, h) => { ctx.fillStyle = '#f4f1ea'; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.fillStyle = '#6d7b83'; ctx.fillRect(-w / 2 + 14, -h / 2 + 14, w - 28, h - 60); L.text(ctx, 'LIGHTHOUSE · 1900', 0, h / 2 - 22, { size: 18, color: '#333', font: 'DejaVu Sans Mono', weight: 700 }); });
    card(980, 200, 280, 180, 0.06, (w, h) => { ctx.fillStyle = '#fff6a8'; ctx.fillRect(-w / 2, -h / 2, w, h); L.text(ctx, '3 keepers', 0, -30, { size: 30, color: '#222', font: 'Comic Sans MS, DejaVu Sans', weight: 700 }); L.text(ctx, 'vanished?', 0, 20, { size: 30, color: '#c1121f', font: 'Comic Sans MS, DejaVu Sans', weight: 700 }); });
    card(620, 470, 300, 200, 0.02, (w, h) => { ctx.fillStyle = '#f4f1ea'; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.strokeStyle = '#999'; ctx.lineWidth = 1; for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.moveTo(-w / 2 + 20, -h / 2 + 40 + k * 20); ctx.lineTo(w / 2 - 20 - (k % 3) * 30, -h / 2 + 40 + k * 20); ctx.stroke(); } L.text(ctx, 'LOGBOOK, DEC 15', 0, -h / 2 + 18, { size: 18, color: '#333', font: 'DejaVu Sans Mono', weight: 700 }); });
    card(1080, 520, 200, 160, -0.08, (w, h) => { ctx.fillStyle = '#f4f1ea'; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.strokeStyle = '#2b4c7e'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 50, 0, L.TAU); ctx.moveTo(-60, 0); ctx.lineTo(60, 0); ctx.stroke(); L.text(ctx, 'MAP', 0, h / 2 - 16, { size: 16, color: '#333', font: 'DejaVu Sans Mono', weight: 700 }); });
    ctx.strokeStyle = '#c1121f'; ctx.lineWidth = 3;
    [[0, 2], [2, 1], [2, 3], [0, 1]].forEach(([a, b]) => { ctx.beginPath(); ctx.moveTo(...pins[a]); ctx.quadraticCurveTo((pins[a][0] + pins[b][0]) / 2, (pins[a][1] + pins[b][1]) / 2 + 30, ...pins[b]); ctx.stroke(); });
    pins.forEach(([x, y]) => { ctx.fillStyle = '#c1121f'; ctx.beginPath(); ctx.arc(x, y, 10, 0, L.TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(x - 3, y - 3, 3, 0, L.TAU); ctx.fill(); });
    L.vignette(ctx, W, H, 0.55);
  },
};

S['halftone-file'] = {
  dim: '2d', title: 'Halftone dossier',
  draw(ctx, W, H, L) {
    L.fill(ctx, W, H, '#efe4cf');
    ctx.fillStyle = '#d8c39a'; ctx.beginPath(); ctx.moveTo(80, 80); ctx.lineTo(380, 80); ctx.lineTo(420, 120); ctx.lineTo(1200, 120); ctx.lineTo(1200, 680); ctx.lineTo(80, 680); ctx.fill();
    ctx.fillStyle = '#f7f0e0'; ctx.fillRect(140, 170, 520, 460);
    // halftone portrait silhouette
    ctx.save(); ctx.beginPath(); ctx.rect(170, 200, 460, 400); ctx.clip();
    L.halftone(ctx, W, H, (x, y) => { const d = Math.hypot((x - 400) / 1.0, (y - 360) / 1.25); const head = d < 110 ? 0.85 : 0; const sh = y > 470 && Math.abs(x - 400) < 200 - (y - 470) * -0.4 ? 0.9 : 0; return Math.max(head, sh, 0.12 + (y - 200) / 2000); }, 9, '#1c1c1c', 0.78);
    ctx.restore();
    L.text(ctx, 'CASE FILE 0417', 720, 220, { size: 44, color: '#1c1c1c', font: 'DejaVu Sans Mono', weight: 700, align: 'left' });
    ['NAME: ██████████', 'LAST SEEN: 1957', 'STATUS: UNKNOWN', 'NOTES: see page 12'].forEach((s, i) => L.text(ctx, s, 720, 300 + i * 50, { size: 28, color: '#333', font: 'DejaVu Sans Mono', weight: 700, align: 'left' }));
    ctx.save(); ctx.translate(950, 560); ctx.rotate(-0.18); ctx.strokeStyle = '#c1121f'; ctx.lineWidth = 6; ctx.strokeRect(-170, -45, 340, 90); L.text(ctx, 'CLASSIFIED', 0, 2, { size: 54, color: '#c1121f', font: 'DejaVu Sans', weight: 900 }); ctx.restore();
    L.grain(ctx, W, H, 0.07, 4010);
  },
};

S['countdown-split'] = {
  dim: '2d', title: 'Countdown split-screen',
  draw(ctx, W, H, L) {
    ctx.fillStyle = '#ff5a5f'; ctx.fillRect(0, 0, W / 2, H); ctx.fillStyle = '#2ec4b6'; ctx.fillRect(W / 2, 0, W / 2, H);
    L.text(ctx, 'YOUR HEART', W / 4, 120, { size: 44, color: '#fff', font: 'Inter', weight: 900 });
    L.text(ctx, 'A HUMMINGBIRD', (3 * W) / 4, 120, { size: 44, color: '#fff', font: 'Inter', weight: 900 });
    // heart and bird shapes
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(W / 4, 420); ctx.bezierCurveTo(W / 4 - 160, 300, W / 4 - 90, 200, W / 4, 270); ctx.bezierCurveTo(W / 4 + 90, 200, W / 4 + 160, 300, W / 4, 420); ctx.fill();
    ctx.beginPath(); ctx.ellipse(3 * W / 4, 320, 90, 40, -0.3, 0, L.TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(3 * W / 4 + 70, 290); ctx.lineTo(3 * W / 4 + 190, 250); ctx.lineTo(3 * W / 4 + 80, 305); ctx.fill(); ctx.beginPath(); ctx.moveTo(3 * W / 4 - 20, 300); ctx.lineTo(3 * W / 4 - 60, 200); ctx.lineTo(3 * W / 4 + 20, 290); ctx.fill();
    L.text(ctx, '72', W / 4, 540, { size: 110, color: '#fff', font: 'Inter', weight: 900 });
    L.text(ctx, '1,260', (3 * W) / 4, 540, { size: 110, color: '#fff', font: 'Inter', weight: 900 });
    L.text(ctx, 'beats per minute', W / 2, 640, { size: 30, color: '#fff', font: 'Inter', weight: 700 });
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.roundRect(W / 2 - 110, 20, 220, 80, 20); ctx.fill();
    L.text(ctx, '00:07', W / 2, 62, { size: 52, color: '#ffcc00', font: 'DejaVu Sans Mono', weight: 700 });
  },
};

S['kinetic-type'] = {
  dim: '2d', title: 'Kinetic type',
  draw(ctx, W, H, L) {
    L.fill(ctx, W, H, '#f2efe8');
    ctx.strokeStyle = '#d8d3c8'; ctx.lineWidth = 1; for (let x = 0; x < W; x += 80) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    L.text(ctx, 'OCTOPUSES', 80, 200, { size: 150, color: '#111', font: 'Inter', weight: 900, align: 'left' });
    L.text(ctx, 'HAVE', 80, 360, { size: 150, color: '#111', font: 'Inter', weight: 900, align: 'left' });
    ctx.fillStyle = '#ff3b1f'; ctx.fillRect(520, 290, 520, 150);
    L.text(ctx, 'THREE', 540, 365, { size: 150, color: '#f2efe8', font: 'Inter', weight: 900, align: 'left' });
    L.text(ctx, 'HEARTS.', 80, 530, { size: 150, color: '#111', font: 'Inter', weight: 900, align: 'left' });
    ctx.fillStyle = '#111'; ctx.fillRect(80, 640, 300, 10); ctx.fillStyle = '#ff3b1f'; ctx.fillRect(80, 640, 120, 10);
    L.text(ctx, 'FACT 03 / 10', W - 80, 650, { size: 26, color: '#111', font: 'DejaVu Sans Mono', weight: 700, align: 'right' });
  },
};

S['paper-collage'] = {
  dim: '2d', title: 'Paper collage',
  draw(ctx, W, H, L) {
    const r = L.rng(4313);
    L.paper(ctx, W, H, '#e9dcc3', 4313);
    const torn = (x, y, w, h, col, rot = 0) => { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 5; const pts = []; for (let i = 0; i <= 20; i++) pts.push([-w / 2 + (w * i) / 20, -h / 2 + r.range(-6, 6)]); for (let i = 0; i <= 14; i++) pts.push([w / 2 + r.range(-6, 6), -h / 2 + (h * i) / 14]); for (let i = 20; i >= 0; i--) pts.push([-w / 2 + (w * i) / 20, h / 2 + r.range(-6, 6)]); for (let i = 14; i >= 0; i--) pts.push([-w / 2 + r.range(-6, 6), -h / 2 + (h * i) / 14]); L.poly(ctx, pts); ctx.fillStyle = col; ctx.fill(); ctx.restore(); };
    torn(640, 360, 900, 520, '#2b3a55', -0.02);
    torn(420, 300, 360, 300, '#d9634f', 0.05);
    // halftone "photo" of a city
    ctx.save(); ctx.translate(840, 330); ctx.rotate(-0.04); ctx.fillStyle = '#f2ead8'; ctx.fillRect(-200, -150, 400, 300);
    ctx.beginPath(); ctx.rect(-190, -140, 380, 280); ctx.clip(); ctx.translate(-840, -330);
    L.halftone(ctx, W, H, (x, y) => { const sky = y < 300 ? 0.15 : 0; const b = (Math.floor((x - 650) / 45) % 2 ? 230 : 260) + Math.sin(x * 0.05) * 30; return y > b ? 0.75 : sky; }, 7, '#2b3a55', 0.3);
    ctx.restore();
    // tape pieces
    [[620, 170, 0.4], [1030, 470, -0.5], [270, 160, -0.3]].forEach(([x, y, a]) => { ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillStyle = 'rgba(245,235,190,0.75)'; ctx.fillRect(-60, -18, 120, 36); ctx.restore(); });
    // cut-out letters
    'WHY CITIES'.split('').forEach((ch, i) => { if (ch === ' ') return; ctx.save(); ctx.translate(330 + i * 62, 560 + r.range(-10, 10)); ctx.rotate(r.range(-0.15, 0.15)); ctx.fillStyle = r.pick(['#f2ead8', '#ffcc33', '#ffffff']); ctx.fillRect(-28, -38, 56, 76); L.text(ctx, ch, 0, 2, { size: 56, color: r.pick(['#111', '#d9634f', '#2b3a55']), font: r.pick(['DejaVu Serif', 'Inter', 'DejaVu Sans Mono']), weight: 900 }); ctx.restore(); });
    L.text(ctx, 'never sleep', 640, 650, { size: 40, color: '#111', font: 'DejaVu Serif', weight: 700, italic: true });
  },
};

S['glass-tech'] = {
  dim: '3d', title: 'Glass tech render',
  async draw({ THREE, canvas, W, H, L }) {
    const t = L.three3d(THREE, canvas, W, H, { bg: '#0d0f14', fov: 30 });
    t.camera.position.set(0, 2.2, 10); t.camera.lookAt(0, 0.6, 0);
    const key = t.sun(-4, 6, 5, 3, '#ffffff', 8); const rim = new THREE.DirectionalLight('#7fb6ff', 4); rim.position.set(5, 3, -6); t.scene.add(rim);
    t.scene.add(new THREE.HemisphereLight('#a8c8ff', '#101018', 0.4));
    // studio floor with reflection-like gradient
    t.mesh(new THREE.CylinderGeometry(6, 6, 0.1, 80), new THREE.MeshStandardMaterial({ color: '#161a22', metalness: 0.6, roughness: 0.3 }), 0, -0.85, 0);
    // glass device: rounded slab + chrome ring + glowing core
    const glass = new THREE.MeshPhysicalMaterial({ color: '#ffffff', transmission: 1, roughness: 0.05, thickness: 1.2, ior: 1.45, clearcoat: 1 });
    const body = t.mesh(new THREE.CapsuleGeometry(0.9, 1.4, 12, 48), glass, 0, 0.6, 0); body.rotation.z = Math.PI / 2;
    t.mesh(new THREE.TorusGeometry(1.05, 0.08, 24, 96), new THREE.MeshStandardMaterial({ color: '#d9dde6', metalness: 1, roughness: 0.15 }), 0, 0.6, 0);
    t.mesh(new THREE.SphereGeometry(0.4, 48, 32), new THREE.MeshStandardMaterial({ color: '#7fd3ff', emissive: '#3fb6ff', emissiveIntensity: 2 }), 0, 0.6, 0);
    const pt = new THREE.PointLight('#5fc4ff', 8, 4); pt.position.set(0, 0.6, 0); t.scene.add(pt);
    t.render();
    const ov = document.createElement('canvas'); ov.width = W; ov.height = H; const o = ov.getContext('2d'); o.drawImage(canvas, 0, 0);
    L.text(o, 'AURA', 640, 90, { size: 64, color: '#ffffff', font: 'Inter', weight: 300, spacing: 18 });
    L.text(o, '40 hours · 9 g · 0 wires', 640, 560, { size: 28, color: '#9fb3cc', font: 'Inter', weight: 500 });
    canvas.replaceWith(ov); ov.id = 'c';
  },
};

S['miniature-city'] = {
  dim: '3d', title: 'Tilt-shift miniature city',
  async draw({ THREE, canvas, W, H, L }) {
    const r = L.rng(4616);
    const t = L.three3d(THREE, canvas, W, H, { bg: '#bfe0ff', fov: 22 });
    t.camera.position.set(22, 20, 22); t.camera.lookAt(0, 0, 0);
    t.scene.add(new THREE.HemisphereLight('#ffffff', '#a0b090', 1.1)); t.sun(10, 20, 6, 2.6, '#fff2d8', 16);
    const toy = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6 });
    t.mesh(new THREE.BoxGeometry(30, 0.4, 30), toy('#8fc06a'), 0, -0.2, 0);
    for (let i = -2; i <= 2; i++) { t.mesh(new THREE.BoxGeometry(30, 0.05, 1.6), toy('#4a4f57'), 0, 0.02, i * 5); t.mesh(new THREE.BoxGeometry(1.6, 0.06, 30), toy('#4a4f57'), i * 5, 0.03, 0); }
    const cols = ['#ff6b6b', '#ffd166', '#06d6a0', '#118ab2', '#f4f1de', '#ef8354'];
    for (let gx = -2; gx < 2; gx++) for (let gz = -2; gz < 2; gz++) for (let k = 0; k < 3; k++) {
      const h = r.range(0.8, 4.5), x = gx * 5 + 2.5 + r.range(-1.2, 1.2), z = gz * 5 + 2.5 + r.range(-1.2, 1.2);
      t.mesh(new THREE.BoxGeometry(r.range(1, 1.8), h, r.range(1, 1.8)), toy(r.pick(cols)), x, h / 2, z);
    }
    for (let i = 0; i < 20; i++) { const lane = r.int(-2, 2) * 5, along = r.range(-14, 14), horiz = r() > 0.5; t.mesh(new THREE.BoxGeometry(horiz ? 0.8 : 0.4, 0.35, horiz ? 0.4 : 0.8), toy(r.pick(['#e63946', '#f1faee', '#ffb703', '#219ebc'])), horiz ? along : lane + 0.4, 0.25, horiz ? lane + 0.4 : along); }
    for (let i = 0; i < 25; i++) t.mesh(new THREE.SphereGeometry(r.range(0.3, 0.6), 12, 10), toy('#3d8b37'), r.range(-14, 14), 0.5, r.range(-14, 14));
    t.render();
    // tilt-shift blur bands + saturation
    const ov = document.createElement('canvas'); ov.width = W; ov.height = H; const o = ov.getContext('2d');
    o.filter = 'saturate(1.35) contrast(1.05)'; o.drawImage(canvas, 0, 0); o.filter = 'none';
    const blur = (y0, y1, b) => { o.save(); o.beginPath(); o.rect(0, y0, W, y1 - y0); o.clip(); o.filter = `blur(${b}px) saturate(1.35)`; o.drawImage(canvas, 0, 0); o.restore(); };
    blur(0, 140, 7); blur(140, 230, 3); blur(520, 600, 3); blur(600, H, 7);
    L.text(o, 'One Day in Toy Town', 640, 670, { size: 40, color: '#fff', stroke: '#1a1a1a', strokeW: 8, font: 'Inter', weight: 900 });
    canvas.replaceWith(ov); ov.id = 'c';
  },
};

S['cutaway-3d'] = {
  dim: '3d', title: '3D cutaway (mechanism)',
  async draw({ THREE, canvas, W, H, L }) {
    const r = L.rng(4717);
    const t = L.three3d(THREE, canvas, W, H, { bg: '#0f1622', fov: 32 });
    t.renderer.localClippingEnabled = true;
    t.camera.position.set(11, 7, 18); t.camera.lookAt(0, 2.2, 0);
    t.scene.add(new THREE.HemisphereLight('#bcd4ff', '#2a1a10', 0.9)); t.sun(6, 12, 8, 2.4, '#fff1dc', 12);
    const clip = [new THREE.Plane(new THREE.Vector3(0, 0, -1), 0)];
    const mat = (c, e = null) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, flatShading: true, side: THREE.DoubleSide, clippingPlanes: clip, ...(e ? { emissive: e, emissiveIntensity: 1.2 } : {}) });
    // layered ground block, cut in half
    const layers = [['#5a3b2a', -3, 1.2], ['#7a5236', -1.8, 1.0], ['#8a6a4a', -0.8, 0.8]];
    layers.forEach(([c, y, h]) => t.mesh(new THREE.BoxGeometry(14, h, 8), mat(c), 0, y + h / 2, 0));
    // mountain cone
    const cone = new THREE.ConeGeometry(4.5, 5, 40, 6, true); const p = cone.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y < 2.4) { p.setX(i, p.getX(i) * (1 + r.range(-0.04, 0.04))); p.setZ(i, p.getZ(i) * (1 + r.range(-0.04, 0.04))); } } cone.computeVertexNormals();
    t.mesh(cone, mat('#6b5a4e'), 0, 2.5, 0);
    // magma chamber and conduit (glowing)
    t.mesh(new THREE.SphereGeometry(1.4, 32, 20), mat('#ff5a1f', '#ff3b00'), 0, -2.2, 0).scale.set(1.6, 0.7, 1.2);
    t.mesh(new THREE.CylinderGeometry(0.35, 0.5, 6.5, 16), mat('#ff7b2a', '#ff4b00'), 0, 1.2, 0);
    // rising magma blobs
    for (let i = 0; i < 6; i++) t.mesh(new THREE.SphereGeometry(r.range(0.15, 0.3), 12, 10), new THREE.MeshStandardMaterial({ color: '#ffd166', emissive: '#ffb703', emissiveIntensity: 2 }), r.range(-0.15, 0.15), -1 + i * 0.9, 0.2);
    // ash plume
    for (let i = 0; i < 14; i++) t.mesh(new THREE.SphereGeometry(r.range(0.5, 1.1), 14, 10), new THREE.MeshStandardMaterial({ color: '#7d7a80', roughness: 1, transparent: true, opacity: 0.85 }), r.range(-1.2, 1.2), 5.6 + i * 0.35, r.range(-1, 1));
    const glow = new THREE.PointLight('#ff6a00', 60, 10); glow.position.set(0, 0, 2); t.scene.add(glow);
    t.render();
    const ov = document.createElement('canvas'); ov.width = W; ov.height = H; const o = ov.getContext('2d'); o.drawImage(canvas, 0, 0);
    const P = (x, y, z) => { const v = new THREE.Vector3(x, y, z).project(t.camera); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H]; };
    const lab = (s, at, dx, dy, c = '#ffffff') => { const [x, y] = P(...at); o.strokeStyle = c; o.lineWidth = 2; o.beginPath(); o.moveTo(x, y); o.lineTo(x + dx, y + dy); o.stroke(); o.fillStyle = c; o.beginPath(); o.arc(x, y, 5, 0, L.TAU); o.fill(); L.text(o, s, x + dx + (dx > 0 ? 8 : -8), y + dy, { size: 24, color: c, font: 'Inter', weight: 800, align: dx > 0 ? 'left' : 'right' }); };
    lab('Magma chamber', [1.6, -2.2, 0], 160, 60, '#ffd166');
    lab('Conduit', [0.35, 1, 0], 200, -30, '#ffd166');
    lab('Crust layers', [-6, -1.5, 0], -60, 80);
    lab('Ash plume', [0.8, 7.5, 0], 150, -20);
    L.text(o, 'Why volcanoes erupt', 640, 50, { size: 44, color: '#ffffff', font: 'Inter', weight: 900 });
    L.text(o, 'Hot magma is less dense, so it rises', 640, 680, { size: 28, color: '#ffd166', font: 'Inter', weight: 700 });
    canvas.replaceWith(ov); ov.id = 'c';
  },
};

export default S;
