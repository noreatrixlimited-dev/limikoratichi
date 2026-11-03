// Games graphics styles: test frames.
const S = {};

function pixelCanvas(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d'); x.imageSmoothingEnabled = false; return [c, x];
}
function blit(ctx, src, W, H) { ctx.imageSmoothingEnabled = false; ctx.drawImage(src, 0, 0, W, H); }
function sprite(x, map, pal, ox, oy) {
  map.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== '.' && pal[ch]) { x.fillStyle = pal[ch]; x.fillRect(ox + i, oy + j, 1, 1); } }));
}
const HERO = [
  '...kkkk...',
  '..krrrrk..',
  '.krrrrrrk.',
  '.kssssssk.',
  '.kswsswsk.',
  '.kssssssk.',
  '..kbbbbk..',
  '.kbbbbbbk.',
  'kskbbbbksk',
  '..kbbbbk..',
  '..kk..kk..',
  '.kkk..kkk.',
];
const HERO_PAL = { k: '#1a1020', r: '#d8343c', s: '#f5c7a0', w: '#1a1020', b: '#2f62c8' };

function pixelBox(x, x0, y0, w, h, bg = '#1c2a6b', edge = '#e8eef8') {
  x.fillStyle = edge; x.fillRect(x0, y0, w, h);
  x.fillStyle = bg; x.fillRect(x0 + 1, y0 + 1, w - 2, h - 2);
}

// ---- pixel-quest (2D) --------------------------------------------------
S['pixel-quest'] = {
  dim: '2d', title: '16-bit pixel RPG',
  draw(ctx, W, H, L) {
    const r = L.rng(2101);
    const [c, x] = pixelCanvas(320, 180);
    // grass tiles
    for (let ty = 0; ty < 12; ty++) for (let tx = 0; tx < 20; tx++) {
      x.fillStyle = (tx + ty) % 2 ? '#5aa83c' : '#62b444'; x.fillRect(tx * 16, ty * 16, 16, 16);
      for (let k = 0; k < 4; k++) { x.fillStyle = '#4a9030'; x.fillRect(tx * 16 + r.int(0, 15), ty * 16 + r.int(0, 15), 1, 2); }
    }
    // path
    for (let tx = 0; tx < 20; tx++) { x.fillStyle = '#d9b77a'; x.fillRect(tx * 16, 96, 16, 16); x.fillStyle = '#c9a466'; x.fillRect(tx * 16 + r.int(0, 12), 98 + r.int(0, 10), 3, 2); }
    // water
    x.fillStyle = '#3b7bd6'; x.fillRect(224, 0, 96, 64); x.fillStyle = '#7fb3ff'; for (let k = 0; k < 20; k++) x.fillRect(226 + r.int(0, 90), r.int(2, 60), 4, 1);
    // trees
    const tree = (tx, ty) => { x.fillStyle = '#7a4a26'; x.fillRect(tx + 6, ty + 14, 4, 6); x.fillStyle = '#1f6b2e'; x.fillRect(tx + 1, ty + 4, 14, 11); x.fillRect(tx + 3, ty + 1, 10, 3); x.fillStyle = '#2f8a3e'; x.fillRect(tx + 3, ty + 5, 6, 4); };
    [[10, 20], [40, 10], [70, 30], [20, 130], [60, 140], [270, 120], [290, 140]].forEach(([a, b]) => tree(a, b));
    // house
    x.fillStyle = '#b04030'; x.fillRect(130, 40, 48, 14); x.fillStyle = '#e8d8b8'; x.fillRect(134, 54, 40, 26); x.fillStyle = '#5a3a20'; x.fillRect(150, 66, 8, 14);
    // chest
    x.fillStyle = '#8a5a20'; x.fillRect(196, 84, 12, 9); x.fillStyle = '#ffd23f'; x.fillRect(201, 87, 2, 3);
    sprite(x, HERO, HERO_PAL, 176, 86);
    // slime
    sprite(x, ['..gggg..', '.gggggg.', 'ggwggwgg', 'gggggggg', '.gggggg.'], { g: '#40d080', w: '#ffffff' }, 220, 100);
    // dialogue box
    pixelBox(x, 8, 128, 304, 46);
    blit(ctx, c, W, H);
    L.text(ctx, 'HERO found an old map!', 64, 560, { size: 34, color: '#fff', font: 'DejaVu Sans Mono', weight: 700, align: 'left' });
    L.text(ctx, '▶ Read it      Keep walking', 64, 620, { size: 30, color: '#ffd23f', font: 'DejaVu Sans Mono', weight: 700, align: 'left' });
    // HUD
    L.text(ctx, 'HP ♥♥♥♡   LV 7   G 120', 40, 34, { size: 26, color: '#fff', stroke: '#000', strokeW: 6, font: 'DejaVu Sans Mono', weight: 700, align: 'left' });
  },
};

// ---- diorama-2d (3D: pixel sprites in a lit miniature) ---------------------
S['diorama-2d'] = {
  dim: '3d', title: 'HD-2D diorama',
  async draw({ THREE, canvas, W, H, L }) {
    const r = L.rng(2202);
    const t = L.three3d(THREE, canvas, W, H, { bg: '#1a2238', fov: 28 });
    t.camera.position.set(0, 7, 18); t.camera.lookAt(0, 1.5, 0);
    t.scene.fog = new THREE.Fog('#1a2238', 18, 40);
    t.scene.add(new THREE.HemisphereLight('#9fb8ff', '#2a1a10', 0.6));
    t.sun(-8, 12, 4, 2.4, '#ffd6a0', 14);
    const lamp = new THREE.PointLight('#ffb050', 60, 12); lamp.position.set(3, 3, 2); t.scene.add(lamp);
    // pixel textures
    const tex = (w, h, fn) => { const [c, x] = pixelCanvas(w, h); fn(x); const tx = new THREE.CanvasTexture(c); tx.magFilter = THREE.NearestFilter; tx.minFilter = THREE.NearestFilter; tx.colorSpace = THREE.SRGBColorSpace; return tx; };
    const grass = tex(16, 16, (x) => { for (let i = 0; i < 16; i++) for (let j = 0; j < 16; j++) { x.fillStyle = r() > 0.8 ? '#3f8a3a' : '#4fa046'; x.fillRect(i, j, 1, 1); } });
    grass.wrapS = grass.wrapT = THREE.RepeatWrapping; grass.repeat.set(10, 6);
    const stone = tex(16, 16, (x) => { x.fillStyle = '#7d7a86'; x.fillRect(0, 0, 16, 16); x.fillStyle = '#5c5966'; for (let j = 0; j < 16; j += 4) x.fillRect(0, j, 16, 1); for (let j = 0; j < 16; j += 4) x.fillRect((j % 8) * 1 + 4, j, 1, 4); });
    stone.wrapS = stone.wrapT = THREE.RepeatWrapping; stone.repeat.set(3, 2);
    t.mesh(new THREE.BoxGeometry(20, 1, 12), new THREE.MeshStandardMaterial({ map: grass }), 0, -0.5, 0);
    // stone tower and wall blocks
    t.mesh(new THREE.BoxGeometry(3, 6, 3), new THREE.MeshStandardMaterial({ map: stone }), -5, 3, -2);
    t.mesh(new THREE.ConeGeometry(2.4, 2.5, 4), new THREE.MeshStandardMaterial({ color: '#7a2f2a' }), -5, 7.2, -2).rotation.y = Math.PI / 4;
    t.mesh(new THREE.BoxGeometry(8, 1.5, 1), new THREE.MeshStandardMaterial({ map: stone }), 2, 0.75, -4);
    // lamp post
    t.mesh(new THREE.CylinderGeometry(0.08, 0.08, 3, 8), new THREE.MeshStandardMaterial({ color: '#222' }), 3, 1.5, 2);
    t.mesh(new THREE.SphereGeometry(0.25, 16, 12), new THREE.MeshBasicMaterial({ color: '#ffd08a' }), 3, 3.1, 2);
    // billboard sprites
    const spr = (map, pal, w, h, x, z, s = 0.25) => {
      const tx = tex(w, h, (c) => sprite(c, map, pal, 0, 0));
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w * s, h * s), new THREE.MeshStandardMaterial({ map: tx, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide }));
      m.position.set(x, (h * s) / 2, z); m.castShadow = true; t.scene.add(m); return m;
    };
    spr(HERO, HERO_PAL, 10, 12, 0, 2, 0.22);
    spr(['....kk....', '...kyyk...', '..kyyyyk..', '.kyyyyyyk.', 'kyywyywyyk', 'kyyyyyyyyk', '.kyyyyyyk.', '..kkkkkk..'], { k: '#2a1a10', y: '#ffb84a', w: '#2a1a10' }, 10, 8, 1.6, 2.4, 0.2);
    for (let i = 0; i < 8; i++) {
      const tr = ['....gg....', '...gggg...', '..gggggg..', '.gggggggg.', 'gggggggggg', '.gggggggg.', '....bb....', '....bb....'];
      spr(tr, { g: r.pick(['#2f7a3a', '#3f8f45']), b: '#6a4022' }, 10, 8, r.range(-9, 9), r.range(-5, -1), 0.45);
    }
    t.render();
    // depth-of-field feel: blur top and bottom bands
    const c2 = document.createElement('canvas'); c2.width = W; c2.height = H; const x2 = c2.getContext('2d');
    x2.drawImage(canvas, 0, 0); x2.filter = 'blur(5px)';
    x2.save(); x2.beginPath(); x2.rect(0, 0, W, H * 0.22); x2.rect(0, H * 0.86, W, H * 0.14); x2.clip(); x2.drawImage(canvas, 0, 0); x2.restore();
    // WebGL canvas: paint the blurred result onto a 2D canvas in its place
    const ov = document.createElement('canvas'); ov.width = W; ov.height = H; ov.id = 'c2';
    canvas.replaceWith(ov); ov.id = 'c'; const o = ov.getContext('2d'); o.drawImage(c2, 0, 0);
    // bloom-ish glow on lamp
    const g = o.createRadialGradient(W * 0.6, H * 0.42, 0, W * 0.6, H * 0.42, 160); g.addColorStop(0, 'rgba(255,190,110,0.35)'); g.addColorStop(1, 'rgba(255,190,110,0)'); o.fillStyle = g; o.fillRect(0, 0, W, H);
  },
};

// ---- micro-games (2D) --------------------------------------------------
S['micro-games'] = {
  dim: '2d', title: 'Microgame frenzy',
  draw(ctx, W, H, L) {
    L.fill(ctx, W, H, '#ffde3d');
    // diagonal stripes
    ctx.save(); ctx.globalAlpha = 0.18; ctx.fillStyle = '#ff7a00'; for (let i = -H; i < W; i += 60) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + 30, 0); ctx.lineTo(i + 30 + H, H); ctx.lineTo(i + H, H); ctx.fill(); } ctx.restore();
    // game panel
    ctx.save(); ctx.fillStyle = '#111'; ctx.translate(640, 380); ctx.rotate(-0.04); ctx.fillRect(-420, -230, 840, 470); ctx.fillStyle = '#5ad1ff'; ctx.fillRect(-405, -215, 810, 440);
    // task: catch the egg
    ctx.fillStyle = '#7ad957'; ctx.fillRect(-405, 140, 810, 85);
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(60, -60, 36, 46, 0, 0, L.TAU); ctx.fill(); ctx.strokeStyle = '#111'; ctx.lineWidth = 6; ctx.stroke();
    ctx.fillStyle = '#c07a3a'; ctx.fillRect(-60, 100, 200, 40); ctx.strokeRect(-60, 100, 200, 40);
    ctx.setLineDash([12, 10]); ctx.beginPath(); ctx.moveTo(60, 0); ctx.lineTo(40, 90); ctx.stroke(); ctx.setLineDash([]);
    ctx.restore();
    L.text(ctx, 'CATCH!', 640, 110, { size: 120, color: '#fff', stroke: '#111', strokeW: 18, font: 'Inter', weight: 900 });
    // timer bar and lives
    ctx.fillStyle = '#111'; ctx.fillRect(140, 640, 1000, 34); ctx.fillStyle = '#ff3b3b'; ctx.fillRect(146, 646, 380, 22);
    L.text(ctx, '3', 1180, 655, { size: 56, color: '#111', font: 'Inter', weight: 900 });
    L.text(ctx, 'LEVEL 12 · ♥♥♡', 140, 610, { size: 30, color: '#111', font: 'Inter', weight: 900, align: 'left' });
  },
};

// ---- quiz-show (2D) ----------------------------------------------------
S['quiz-show'] = {
  dim: '2d', title: 'Quiz show flat',
  draw(ctx, W, H, L) {
    const r = L.rng(2404);
    ctx.fillStyle = L.linGrad(ctx, 0, 0, 0, H, [[0, '#2a0f6b'], [1, '#6b1fb0']]); ctx.fillRect(0, 0, W, H);
    // spotlights
    for (const x of [200, 640, 1080]) { ctx.save(); ctx.globalAlpha = 0.16; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(x - 30, 0); ctx.lineTo(x + 30, 0); ctx.lineTo(x + 220, H); ctx.lineTo(x - 220, H); ctx.fill(); ctx.restore(); }
    // question bar
    ctx.fillStyle = '#ffcc00'; ctx.beginPath(); ctx.roundRect(120, 70, 1040, 110, 55); ctx.fill();
    L.text(ctx, 'Which game sold the most copies?', 640, 125, { size: 44, color: '#2a0f6b', font: 'Inter', weight: 900 });
    // answers
    const ans = [['A', 'Block Builder', '#00c2ff'], ['B', 'Kart Rally', '#ff3d7f'], ['C', 'Space Puzzle', '#36d66b'], ['D', 'Dragon Tales', '#ff8a00']];
    ans.forEach(([k, s, c], i) => {
      const x = 140 + (i % 2) * 520, y = 230 + Math.floor(i / 2) * 120;
      ctx.fillStyle = c; ctx.beginPath(); ctx.roundRect(x, y, 480, 90, 45); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x + 45, y + 45, 32, 0, L.TAU); ctx.fill();
      L.text(ctx, k, x + 45, y + 47, { size: 38, color: c, font: 'Inter', weight: 900 });
      L.text(ctx, s, x + 100, y + 47, { size: 36, color: '#fff', font: 'Inter', weight: 800, align: 'left' });
    });
    // podiums with score
    [[320, '#00c2ff', '1,250'], [640, '#ffcc00', '2,000'], [960, '#ff3d7f', '980']].forEach(([x, c, s]) => {
      ctx.fillStyle = c; ctx.fillRect(x - 110, 520, 220, 200); ctx.fillStyle = '#111'; ctx.fillRect(x - 90, 545, 180, 70);
      L.text(ctx, s, x, 582, { size: 48, color: '#ffef7a', font: 'DejaVu Sans Mono', weight: 700 });
    });
    for (let i = 0; i < 80; i++) { ctx.fillStyle = r.pick(['#ffcc00', '#00c2ff', '#ff3d7f', '#36d66b', '#fff']); ctx.save(); ctx.translate(r() * W, r() * 220 + 480); ctx.rotate(r() * 3); ctx.fillRect(-6, -3, 12, 6); ctx.restore(); }
  },
};

// ---- terminal-crt (2D) -------------------------------------------------
S['terminal-crt'] = {
  dim: '2d', title: 'ASCII CRT terminal',
  draw(ctx, W, H, L) {
    L.fill(ctx, W, H, '#050805');
    const g = ctx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, 760); g.addColorStop(0, '#0d2410'); g.addColorStop(1, '#020402'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const lines = [
      '> SPEEDRUN.LOG  //  world record attempt',
      '',
      '[00:00.00]  START  ............ OK',
      '[00:41.27]  skip bridge glitch . OK',
      '[01:12.90]  boss phase 1 ...... OK',
      '[01:58.03]  frame-perfect jump  !!',
      '[02:03.11]  RESULT ............ NEW RECORD',
      '',
      '       ####   ####   ####',
      '       #  #      #   #  #     -0.42 s',
      '       ####   ####   ####',
      '',
      '> _',
    ];
    ctx.save(); ctx.shadowColor = '#4dff6a'; ctx.shadowBlur = 12;
    lines.forEach((s, i) => L.text(ctx, s, 110, 90 + i * 42, { size: 30, color: i === 5 || i === 6 ? '#d8ff6a' : '#4dff6a', font: 'DejaVu Sans Mono', weight: 700, align: 'left' }));
    ctx.restore();
    L.scanlines(ctx, W, H, 3, 0.35);
    // RGB fringe + curvature vignette
    L.vignette(ctx, W, H, 0.85);
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 40; ctx.beginPath(); ctx.roundRect(0, 0, W, H, 60); ctx.stroke();
    L.grain(ctx, W, H, 0.05, 2505);
  },
};

// ---- holo-hud (3D) -----------------------------------------------------
S['holo-hud'] = {
  dim: '3d', title: 'Sci-fi hologram HUD',
  async draw({ THREE, canvas, W, H, L }) {
    const t = L.three3d(THREE, canvas, W, H, { bg: '#020814', fov: 40, shadows: false });
    t.camera.position.set(0, 2, 12); t.camera.lookAt(0, 1.5, 0);
    const holo = (c, o = 0.9) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, wireframe: true });
    // wireframe character (low poly figure)
    const g = new THREE.Group(); t.scene.add(g);
    const add = (geo, y, sx = 1, sy = 1, sz = 1, x = 0) => { const m = new THREE.Mesh(geo, holo('#3fe8ff', 0.75)); m.position.set(x, y, 0); m.scale.set(sx, sy, sz); g.add(m); };
    add(new THREE.IcosahedronGeometry(0.6, 1), 3.6);
    add(new THREE.CylinderGeometry(0.8, 0.6, 1.8, 8, 3), 2.2);
    add(new THREE.CylinderGeometry(0.22, 0.18, 1.6, 6, 2), 2.3, 1, 1, 1, -1.1);
    add(new THREE.CylinderGeometry(0.22, 0.18, 1.6, 6, 2), 2.3, 1, 1, 1, 1.1);
    add(new THREE.CylinderGeometry(0.28, 0.22, 1.8, 6, 2), 0.4, 1, 1, 1, -0.4);
    add(new THREE.CylinderGeometry(0.28, 0.22, 1.8, 6, 2), 0.4, 1, 1, 1, 0.4);
    g.rotation.y = 0.5;
    // rings and grid
    for (let i = 0; i < 3; i++) { const ring = new THREE.Mesh(new THREE.TorusGeometry(2.2 + i * 0.5, 0.02, 8, 90), new THREE.MeshBasicMaterial({ color: i ? '#1fa8ff' : '#7ff3ff', transparent: true, opacity: 0.8 - i * 0.2 })); ring.rotation.x = Math.PI / 2; ring.position.y = -0.5 + i * 0.05; t.scene.add(ring); }
    const grid = new THREE.GridHelper(30, 40, '#0b6b8f', '#08374f'); grid.position.y = -0.6; t.scene.add(grid);
    // floating stat panels (canvas textures)
    const panel = (lines, x, y, rot) => {
      const c = document.createElement('canvas'); c.width = 512; c.height = 300; const p = c.getContext('2d');
      p.fillStyle = 'rgba(10,60,90,0.35)'; p.fillRect(0, 0, 512, 300); p.strokeStyle = '#3fe8ff'; p.lineWidth = 4; p.strokeRect(4, 4, 504, 292);
      p.font = '700 34px DejaVu Sans Mono'; p.fillStyle = '#9ff7ff'; lines.forEach((s, i) => p.fillText(s, 24, 60 + i * 56));
      p.fillStyle = '#3fe8ff'; p.fillRect(24, 250, 380, 14);
      const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2), new THREE.MeshBasicMaterial({ map: tx, transparent: true, side: THREE.DoubleSide }));
      m.position.set(x, y, 0); m.rotation.y = rot; t.scene.add(m);
    };
    panel(['UNIT: RANGER', 'DMG   ▮▮▮▮▮▮▯', 'SPEED ▮▮▮▮▯▯▯', 'TIER  S'], -4.6, 3, 0.45);
    panel(['BUILD 7.2', 'CRIT  38%', 'RANGE 1200', 'META  ↑ 4%'], 4.6, 3, -0.45);
    t.render();
  },
};

// ---- liminal-tape (2D) -------------------------------------------------
S['liminal-tape'] = {
  dim: '2d', title: 'Liminal found footage',
  draw(ctx, W, H, L) {
    const r = L.rng(2707);
    // one-point perspective hallway
    const vx = 700, vy = 330;
    const wall = '#c9b86a', wallD = '#a8984f', carpet = '#a99a5e', ceil = '#d8d0a0';
    L.fill(ctx, W, H, wall);
    L.poly(ctx, [[0, 0], [W, 0], [vx + 120, vy - 90], [vx - 120, vy - 90]]); ctx.fillStyle = ceil; ctx.fill();
    L.poly(ctx, [[0, H], [W, H], [vx + 120, vy + 90], [vx - 120, vy + 90]]); ctx.fillStyle = carpet; ctx.fill();
    L.poly(ctx, [[0, 0], [vx - 120, vy - 90], [vx - 120, vy + 90], [0, H]]); ctx.fillStyle = wallD; ctx.fill();
    L.poly(ctx, [[vx - 120, vy - 90], [vx + 120, vy - 90], [vx + 120, vy + 90], [vx - 120, vy + 90]]); ctx.fillStyle = '#b8a85e'; ctx.fill();
    // ceiling lights receding
    for (let k = 1; k < 7; k++) { const t = 1 - 1 / (k * 0.8 + 1); const cx = L.lerp(640, vx, t), cy = L.lerp(40, vy - 90, t), s = L.lerp(1, 0.15, t); ctx.fillStyle = 'rgba(255,255,230,0.9)'; ctx.fillRect(cx - 90 * s, cy, 180 * s, 18 * s); }
    // doorway
    ctx.fillStyle = '#3a3420'; ctx.fillRect(vx - 40, vy - 60, 50, 150);
    // wallpaper stripes on left wall
    ctx.strokeStyle = 'rgba(120,100,40,0.25)'; ctx.lineWidth = 3; for (let x = 20; x < vx - 120; x += 40) { const t = x / (vx - 120); ctx.beginPath(); ctx.moveTo(x, t * (vy - 90)); ctx.lineTo(x, H - t * (H - vy - 90)); ctx.stroke(); }
    // VHS look
    L.grain(ctx, W, H, 0.16, 2708, false);
    const img = ctx.getImageData(0, 0, W, H), d = img.data, cp = new Uint8ClampedArray(d);
    for (let y = 0; y < H; y++) { const sh = (y > 420 && y < 445) ? 18 : (r() > 0.985 ? r.int(-8, 8) : 0); for (let x = 0; x < W; x++) { const i = (y * W + x) * 4, j = (y * W + Math.min(W - 1, Math.max(0, x - sh - 3))) * 4; d[i] = cp[j]; } }
    ctx.putImageData(img, 0, 0);
    ctx.save(); ctx.filter = 'blur(1.2px)'; ctx.drawImage(ctx.canvas, 0, 0); ctx.restore();
    L.scanlines(ctx, W, H, 2, 0.12);
    L.text(ctx, '▶ PLAY', 60, 60, { size: 40, color: '#fff', font: 'DejaVu Sans Mono', weight: 700, align: 'left' });
    L.text(ctx, 'OCT 14 1996  03:12:47 AM', W - 60, H - 50, { size: 34, color: '#fff', font: 'DejaVu Sans Mono', weight: 700, align: 'right' });
    L.text(ctx, 'SP', W - 60, 60, { size: 40, color: '#fff', font: 'DejaVu Sans Mono', weight: 700, align: 'right' });
  },
};

// ---- space-sitcom (2D) -------------------------------------------------
S['space-sitcom'] = {
  dim: '2d', title: 'Sci-fi sitcom toon',
  draw(ctx, W, H, L) {
    const r = L.rng(2808);
    L.fill(ctx, W, H, '#1d1b4b');
    for (let i = 0; i < 160; i++) { ctx.fillStyle = `rgba(255,255,255,${r.range(0.3, 1)})`; ctx.fillRect(r() * W, r() * 360, 2, 2); }
    // ship interior window frame
    ctx.fillStyle = '#7fd6c9'; ctx.fillRect(0, 380, W, H - 380);
    ctx.fillStyle = '#5ab8ab'; ctx.fillRect(0, 380, W, 20);
    ctx.lineWidth = 6; ctx.strokeStyle = '#1a1a2e';
    ctx.fillStyle = '#ff8fb1'; ctx.beginPath(); ctx.arc(1030, 160, 70, 0, L.TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#ffd36b'; ctx.lineWidth = 10; ctx.beginPath(); ctx.ellipse(1030, 160, 120, 26, -0.25, 0, L.TAU); ctx.stroke();
    // window frame
    ctx.strokeStyle = '#d4dcea'; ctx.lineWidth = 30; ctx.beginPath(); ctx.roundRect(40, 30, W - 80, 340, 60); ctx.stroke();
    // console
    ctx.fillStyle = '#e9edf5'; ctx.strokeStyle = '#1a1a2e'; ctx.lineWidth = 6; ctx.beginPath(); ctx.roundRect(150, 520, 980, 200, 30); ctx.fill(); ctx.stroke();
    ['#ff5a5a', '#ffd36b', '#5affb0', '#5ac8ff'].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(260 + i * 70, 590, 20, 0, L.TAU); ctx.fill(); ctx.stroke(); });
    // two characters: round alien + robot
    ctx.fillStyle = '#9be36b'; ctx.beginPath(); ctx.ellipse(470, 420, 95, 110, 0, 0, L.TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(470, 390, 44, 0, L.TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1a1a2e'; ctx.beginPath(); ctx.arc(482, 392, 18, 0, L.TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(430, 300); ctx.lineTo(410, 240); ctx.stroke(); ctx.beginPath(); ctx.arc(408, 232, 12, 0, L.TAU); ctx.fillStyle = '#ff5a5a'; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(470, 460, 30, 0.2, Math.PI - 0.2); ctx.stroke();
    ctx.fillStyle = '#c9d2e3'; ctx.beginPath(); ctx.roundRect(760, 300, 160, 140, 24); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1a1a2e'; ctx.beginPath(); ctx.roundRect(782, 330, 116, 56, 14); ctx.fill();
    ctx.fillStyle = '#5affb0'; ctx.fillRect(800, 348, 26, 18); ctx.fillRect(854, 348, 26, 18);
    ctx.fillStyle = '#c9d2e3'; ctx.beginPath(); ctx.roundRect(780, 440, 120, 90, 16); ctx.fill(); ctx.stroke();
    // speech bubble
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(540, 150, 380, 100, 40); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(640, 248); ctx.lineTo(600, 300); ctx.lineTo(690, 248); ctx.fill();
    L.text(ctx, 'Who parked on the moon?!', 730, 200, { size: 26, color: '#1a1a2e', font: 'Inter', weight: 900 });
  },
};

// ---- neon-arcade (2D) --------------------------------------------------
S['neon-arcade'] = {
  dim: '2d', title: 'Neon arcade',
  draw(ctx, W, H, L) {
    L.fill(ctx, W, H, '#07010f');
    const sky = L.linGrad(ctx, 0, 0, 0, 400, [[0, '#07010f'], [1, '#3a0b52']]); ctx.fillStyle = sky; ctx.fillRect(0, 0, W, 400);
    // sun with stripes
    ctx.save(); ctx.beginPath(); ctx.arc(640, 360, 190, Math.PI, 0); ctx.clip();
    ctx.fillStyle = L.linGrad(ctx, 0, 170, 0, 360, [[0, '#ffe66d'], [1, '#ff2fa0']]); ctx.fillRect(400, 160, 480, 200);
    ctx.fillStyle = '#3a0b52'; for (let i = 0; i < 6; i++) ctx.fillRect(400, 270 + i * 16, 480, 3 + i * 1.6);
    ctx.restore();
    // perspective grid floor
    ctx.save(); ctx.shadowColor = '#ff2fa0'; ctx.shadowBlur = 14; ctx.strokeStyle = '#ff2fa0'; ctx.lineWidth = 2.5;
    for (let i = -20; i <= 20; i++) { ctx.beginPath(); ctx.moveTo(640 + i * 12, 400); ctx.lineTo(640 + i * 160, H); ctx.stroke(); }
    for (let k = 0; k < 14; k++) { const y = 400 + Math.pow(k / 13, 2.2) * (H - 400); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.restore();
    ctx.fillStyle = '#07010f'; ctx.fillRect(0, 398, W, 4);
    // neon title
    const neon = (s, y, size, c) => { ctx.save(); ctx.shadowColor = c; for (const b of [40, 20, 8]) { ctx.shadowBlur = b; L.text(ctx, s, 640, y, { size, color: c, font: 'Inter', weight: 900, italic: true }); } L.text(ctx, s, 640, y, { size, color: '#fff', font: 'Inter', weight: 900, italic: true }); ctx.restore(); };
    neon('MONTAGE', 140, 140, '#29e7ff');
    neon('SEASON 4 · BEST PLAYS', 250, 46, '#ff2fa0');
  },
};

// ---- anime-impact (2D) -------------------------------------------------
S['anime-impact'] = {
  dim: '2d', title: 'Anime impact frame',
  draw(ctx, W, H, L) {
    const r = L.rng(3010);
    L.fill(ctx, W, H, '#ffffff');
    // radial speed lines
    ctx.fillStyle = '#000';
    for (let i = 0; i < 180; i++) { const a = r() * L.TAU, w = r.range(0.004, 0.02), r0 = r.range(160, 280); ctx.beginPath(); ctx.moveTo(640 + Math.cos(a) * r0, 360 + Math.sin(a) * r0); ctx.lineTo(640 + Math.cos(a - w) * 1000, 360 + Math.sin(a - w) * 1000); ctx.lineTo(640 + Math.cos(a + w) * 1000, 360 + Math.sin(a + w) * 1000); ctx.fill(); }
    // inverted burst
    ctx.fillStyle = '#000'; L.star(ctx, 640, 360, 300, 150, 14, 0.1); ctx.fill();
    ctx.fillStyle = '#ffffff'; L.star(ctx, 640, 360, 250, 120, 14, 0.25); ctx.fill();
    // fist silhouette (simple)
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.roundRect(540, 280, 210, 150, 40); ctx.fill();
    ctx.fillStyle = '#fff'; for (let i = 0; i < 3; i++) ctx.fillRect(560, 315 + i * 35, 120, 6);
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.moveTo(740, 320); ctx.lineTo(1000, 290); ctx.lineTo(1000, 420); ctx.lineTo(740, 400); ctx.fill();
    // impact text with red
    ctx.save(); ctx.translate(380, 570); ctx.rotate(-0.1); L.text(ctx, 'CLUTCH!', 0, 0, { size: 150, color: '#e8112d', stroke: '#000', strokeW: 22, font: 'Inter', weight: 900, italic: true }); ctx.restore();
    // screentone dots corner
    L.halftone(ctx, W, H, (x, y) => Math.max(0, 1 - Math.hypot(x - W, y) / 520) * 0.7, 12, '#000', 0.6);
  },
};

// ---- tier-board (2D) ---------------------------------------------------
S['tier-board'] = {
  dim: '2d', title: 'Tier board',
  draw(ctx, W, H, L) {
    const r = L.rng(3111);
    L.fill(ctx, W, H, '#1a1a1f');
    const tiers = [['S', '#ff7f7f'], ['A', '#ffbf7f'], ['B', '#ffdf7f'], ['C', '#bfff7f'], ['D', '#7fbfff']];
    tiers.forEach(([k, c], i) => {
      const y = 60 + i * 122;
      ctx.fillStyle = c; ctx.fillRect(60, y, 120, 112);
      L.text(ctx, k, 120, y + 58, { size: 70, color: '#1a1a1f', font: 'Inter', weight: 900 });
      ctx.fillStyle = '#2a2a33'; ctx.fillRect(186, y, 1034, 112);
      const n = [3, 4, 2, 3, 1][i];
      for (let j = 0; j < n; j++) {
        const x = 200 + j * 126; const col = r.pick(['#5b8cff', '#ff5b8c', '#5bffb0', '#ffd35b', '#b05bff']);
        ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(x, y + 8, 112, 96, 12); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.arc(x + 56, y + 46, 26, 0, L.TAU); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x + 22, y + 78, 68, 14);
      }
    });
    // card dropping in
    ctx.save(); ctx.translate(940, 150); ctx.rotate(0.12); ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 20;
    ctx.fillStyle = '#ffd35b'; ctx.beginPath(); ctx.roundRect(-70, -60, 140, 120, 14); ctx.fill(); ctx.restore();
    L.text(ctx, '?', 940, 152, { size: 70, color: '#1a1a1f', font: 'Inter', weight: 900 });
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.setLineDash([8, 8]); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(940, 230); ctx.lineTo(860, 330); ctx.stroke();
  },
};

export default S;
