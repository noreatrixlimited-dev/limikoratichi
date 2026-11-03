// Kids styles: test frames. Recurring hero: a little fox.
const S = {};

// ---- shared kids pieces ------------------------------------------------
function foxFlat(ctx, L, x, y, s, { body = '#f28c38', belly = '#fff4e0', dark = '#3a2a20', outline = null, lw = 4 } = {}) {
  ctx.save();
  ctx.translate(x, y); ctx.scale(s, s);
  const draw = (pts, col) => { L.poly(ctx, pts); ctx.fillStyle = col; ctx.fill(); if (outline) { ctx.strokeStyle = outline; ctx.lineWidth = lw / s; ctx.lineJoin = 'round'; ctx.stroke(); } };
  // tail
  ctx.beginPath(); ctx.moveTo(40, 40); ctx.quadraticCurveTo(140, 10, 120, -60); ctx.quadraticCurveTo(80, 0, 30, 20); ctx.closePath();
  ctx.fillStyle = body; ctx.fill(); if (outline) { ctx.strokeStyle = outline; ctx.lineWidth = lw / s; ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(120, -60); ctx.quadraticCurveTo(112, -30, 100, -22); ctx.quadraticCurveTo(110, -45, 120, -60); ctx.fillStyle = belly; ctx.fill();
  // body
  ctx.beginPath(); ctx.ellipse(0, 40, 48, 42, 0, 0, L.TAU); ctx.fillStyle = body; ctx.fill(); if (outline) ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, 52, 26, 28, 0, 0, L.TAU); ctx.fillStyle = belly; ctx.fill();
  // feet
  [[-22, 80], [22, 80]].forEach(([fx, fy]) => { ctx.beginPath(); ctx.ellipse(fx, fy, 16, 9, 0, 0, L.TAU); ctx.fillStyle = dark; ctx.fill(); });
  // head
  draw([[-62, -40], [-50, -110], [-20, -62], [20, -62], [50, -110], [62, -40], [0, 18]], body);
  draw([[-46, -64], [-44, -96], [-28, -66]], dark);
  draw([[46, -64], [44, -96], [28, -66]], dark);
  draw([[-40, -22], [0, 18], [40, -22], [0, -6]], belly);
  // eyes and nose
  [[-22, -32], [22, -32]].forEach(([ex, ey]) => {
    ctx.beginPath(); ctx.ellipse(ex, ey, 8, 10, 0, 0, L.TAU); ctx.fillStyle = dark; ctx.fill();
    ctx.beginPath(); ctx.arc(ex + 3, ey - 4, 3, 0, L.TAU); ctx.fillStyle = '#fff'; ctx.fill();
  });
  ctx.beginPath(); ctx.ellipse(0, 12, 8, 6, 0, 0, L.TAU); ctx.fillStyle = dark; ctx.fill();
  ctx.beginPath(); ctx.ellipse(-34, -12, 8, 5, 0, 0, L.TAU); ctx.ellipse(34, -12, 8, 5, 0, 0, L.TAU); ctx.fillStyle = 'rgba(255,120,120,0.45)'; ctx.fill();
  ctx.restore();
}

function caption(ctx, L, W, H, s, { color = '#fff', stroke = '#3a2a20', size = 46, y = H - 70, font = 'Inter' } = {}) {
  L.text(ctx, s, W / 2, y, { size, color, stroke, strokeW: 10, font, weight: 900 });
}

// ---- 1 crayon-storybook (2D) -------------------------------------------
S['crayon-storybook'] = {
  dim: '2d', title: 'Crayon storybook',
  draw(ctx, W, H, L) {
    const r = L.rng(101);
    L.paper(ctx, W, H, '#fbf3df', 101);
    // sky scribble band
    L.crayon(ctx, [[0, 0], [W, 0], [W, 330], [0, 360]], '#8cc8f0', r, { density: 0.7, outline: false, width: 4 });
    // sun
    L.crayon(ctx, L.circlePts(1080, 120, 70), '#ffcc33', r, { width: 4 });
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * L.TAU; ctx.strokeStyle = '#f5a623'; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(1080 + Math.cos(a) * 90, 120 + Math.sin(a) * 90); ctx.lineTo(1080 + Math.cos(a) * 125, 120 + Math.sin(a) * 125); ctx.stroke();
    }
    // hills
    const hill = (x0, x1, top, base, col) => {
      const pts = []; for (let i = 0; i <= 30; i++) { const t = i / 30; pts.push([L.lerp(x0, x1, t), base - Math.sin(t * Math.PI) * (base - top)]); }
      pts.push([x1, H], [x0, H]); L.crayon(ctx, pts, col, r, { width: 4 });
    };
    hill(-200, 700, 330, 520, '#7cc35a');
    hill(450, 1500, 360, 540, '#5aa845');
    L.crayon(ctx, [[0, 520], [W, 500], [W, H], [0, H]], '#4f9a3c', r, { width: 4 });
    // flowers
    for (let i = 0; i < 14; i++) {
      const fx = r.range(40, W - 40), fy = r.range(560, 690), c = r.pick(['#ff6b8b', '#ffd23f', '#a66bff', '#ff8c42']);
      ctx.strokeStyle = '#2f7a2a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx, fy + 30); ctx.stroke();
      L.crayon(ctx, L.circlePts(fx, fy, 12), c, r, { width: 3 });
    }
    // tree
    L.crayon(ctx, [[220, 560], [250, 560], [255, 400], [215, 400]], '#8b5a2b', r, { width: 4 });
    L.crayon(ctx, L.blobPts(235, 340, 95, r, 9, 0.2), '#3f8f3a', r, { width: 4 });
    // fox
    foxFlat(ctx, L, 640, 470, 1.25, { outline: '#5a3a20', lw: 5 });
    // crayon title
    L.text(ctx, 'Pip Finds the Rainbow', W / 2, 70, { size: 58, color: '#e8553a', font: 'Comic Neue, Comic Sans MS, Inter', weight: 800 });
    L.grain(ctx, W, H, 0.06, 102);
  },
};

// ---- 2 wet-watercolor (2D) --------------------------------------------
S['wet-watercolor'] = {
  dim: '2d', title: 'Wet watercolor',
  draw(ctx, W, H, L) {
    const r = L.rng(202);
    L.paper(ctx, W, H, '#fbf8f1', 202, '#d8cdb5');
    L.wash(ctx, [[0, 0], [W, 0], [W, 420], [0, 380]], '#7fb2e5', r, 18);
    L.wash(ctx, L.blobPts(980, 150, 130, r, 8, 0.15), '#f7c873', r, 16);
    const ridge = (base, amp, col, seed) => {
      const rr = L.rng(seed); const pts = [];
      for (let x = -40; x <= W + 40; x += 40) pts.push([x, base - Math.abs(Math.sin(x * 0.006 + seed)) * amp - rr() * 20]);
      pts.push([W + 40, H], [-40, H]); L.wash(ctx, pts, col, rr, 16);
    };
    ridge(430, 160, '#9bb7d4', 3);
    ridge(500, 110, '#7ea88a', 5);
    ridge(590, 70, '#5e9466', 8);
    // rain streaks
    ctx.strokeStyle = 'rgba(70,110,170,0.35)'; ctx.lineWidth = 2;
    for (let i = 0; i < 120; i++) { const x = r() * W, y = r() * 420; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 8, y + 26); ctx.stroke(); }
    // umbrella + fox
    L.wash(ctx, [[520, 360], [760, 360], [740, 300], [640, 260], [540, 300]], '#e8553a', r, 16);
    ctx.strokeStyle = '#6b4b3a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(640, 360); ctx.lineTo(640, 470); ctx.stroke();
    ctx.save(); ctx.globalAlpha = 0.9; foxFlat(ctx, L, 640, 530, 0.95, { body: '#ef9a55', belly: '#fff6ea', dark: '#5a4032' }); ctx.restore();
    // puddle
    L.wash(ctx, L.circlePts(640, 640, 190, 28), '#8ab4e0', r, 12);
    L.text(ctx, 'Follow the Raindrop', W / 2, 70, { size: 54, color: '#355c8a', font: 'DejaVu Serif', weight: 700, italic: true });
  },
};

// ---- 3 pop-up-paper (3D) ----------------------------------------------
S['pop-up-paper'] = {
  dim: '3d', title: 'Pop-up paper book',
  async draw({ THREE, canvas, W, H, L }) {
    const t = L.three3d(THREE, canvas, W, H, { bg: '#2d3a4a', fov: 32 });
    t.camera.position.set(0, 9, 15); t.camera.lookAt(0, 1.6, 0);
    t.scene.add(new THREE.HemisphereLight('#fff6e8', '#33404f', 1.2));
    t.sun(6, 12, 8, 2.6, '#fff1dc', 12);
    const paperMat = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.95, side: THREE.DoubleSide });
    // open book: two pages slightly angled
    const page = new THREE.BoxGeometry(7, 0.12, 9);
    const left = t.mesh(page, paperMat('#f6efe0'), -3.55, 0, 0); left.rotation.z = 0.06;
    const right = t.mesh(page, paperMat('#f6efe0'), 3.55, 0, 0); right.rotation.z = -0.06;
    t.mesh(new THREE.BoxGeometry(14.6, 0.3, 9.4), paperMat('#9c3b2e'), 0, -0.22, 0);
    // stand-up cut-outs from shapes
    const cut = (shapePts, color, x, z, h, tilt = 0) => {
      const sh = new THREE.Shape(shapePts.map(([a, b]) => new THREE.Vector2(a, b)));
      const g = new THREE.ExtrudeGeometry(sh, { depth: 0.04, bevelEnabled: false });
      const m = t.mesh(g, paperMat(color), x, 0.08, z);
      m.rotation.x = -tilt; m.scale.setScalar(h);
      return m;
    };
    const hill = (w, hgt) => { const p = []; for (let i = 0; i <= 20; i++) { const u = i / 20; p.push([(u - 0.5) * w, Math.sin(u * Math.PI) * hgt]); } return p; };
    cut(hill(12, 3.2), '#6bb36a', 0, -3, 1, 0.05);
    cut(hill(9, 2.4), '#4f9a52', -1, -1.6, 1, 0.08);
    // trees
    const tree = [[-0.5, 0], [0.5, 0], [0.5, 0.8], [1.3, 0.8], [0, 3], [-1.3, 0.8], [-0.5, 0.8]];
    cut(tree, '#2f7a45', -4.5, -0.8, 1, 0.1);
    cut(tree, '#3d8d50', 4.6, -1.2, 1.2, 0.1);
    // fox cut-out (simplified silhouette)
    const fox = [[-0.9, 0], [0.9, 0], [1.1, 1.4], [0.8, 2.4], [1.0, 3.3], [0.45, 2.7], [-0.45, 2.7], [-1.0, 3.3], [-0.8, 2.4], [-1.1, 1.4]];
    cut(fox, '#f28c38', 0.6, 0.8, 0.9, 0.0);
    // sun disc
    const sun = t.mesh(new THREE.CylinderGeometry(1, 1, 0.05, 40), paperMat('#ffcf4a'), 3.2, 4.4, -3.4); sun.rotation.x = Math.PI / 2 - 0.05;
    // tabs
    for (let i = -3; i <= 3; i++) t.mesh(new THREE.BoxGeometry(0.4, 0.02, 0.6), paperMat('#e9dfc8'), i * 1.4, 0.08, 2.4);
    t.render();
  },
};

// ---- 4 felt-and-yarn (2D) ---------------------------------------------
S['felt-and-yarn'] = {
  dim: '2d', title: 'Felt and yarn',
  draw(ctx, W, H, L) {
    const r = L.rng(404);
    const felt = (pts, col, stitch = '#ffffff') => {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 5;
      L.poly(ctx, pts); ctx.fillStyle = col; ctx.fill(); ctx.restore();
      ctx.save(); L.poly(ctx, pts); ctx.clip();
      for (let i = 0; i < 900; i++) { ctx.fillStyle = `rgba(255,255,255,${r.range(0.02, 0.08)})`; const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]); ctx.fillRect(r.range(Math.min(...xs), Math.max(...xs)), r.range(Math.min(...ys), Math.max(...ys)), 2, 2); }
      ctx.restore();
      // inset stitch line
      const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
      const inset = pts.map(([x, y]) => { const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy) || 1; return [x - (dx / d) * 9, y - (dy / d) * 9]; });
      ctx.save(); ctx.setLineDash([9, 7]); ctx.lineWidth = 3; ctx.strokeStyle = stitch; L.poly(ctx, inset); ctx.stroke(); ctx.restore();
    };
    L.fill(ctx, W, H, '#7cc6d6');
    for (let i = 0; i < 4000; i++) { ctx.fillStyle = `rgba(255,255,255,${r.range(0.02, 0.06)})`; ctx.fillRect(r() * W, r() * H, 2, 2); }
    felt(L.circlePts(1050, 140, 80), '#ffd166');
    felt(L.blobPts(300, 130, 70, r, 7, 0.2), '#ffffff', '#7cc6d6');
    felt(L.blobPts(420, 160, 50, r, 7, 0.2), '#ffffff', '#7cc6d6');
    const hill = (x0, x1, top, base) => { const p = []; for (let i = 0; i <= 24; i++) { const t = i / 24; p.push([L.lerp(x0, x1, t), base - Math.sin(t * Math.PI) * (base - top)]); } p.push([x1, H + 20], [x0, H + 20]); return p; };
    felt(hill(-100, 800, 380, 560), '#8bc34a');
    felt(hill(500, 1400, 420, 580), '#6aa84f');
    // yarn music notes
    ctx.strokeStyle = '#e94f7c'; ctx.lineWidth = 7; ctx.lineCap = 'round';
    [[820, 260], [900, 220], [980, 280]].forEach(([x, y]) => { ctx.beginPath(); ctx.ellipse(x, y, 16, 12, -0.4, 0, L.TAU); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x + 14, y - 4); ctx.lineTo(x + 14, y - 70); ctx.quadraticCurveTo(x + 40, y - 60, x + 36, y - 40); ctx.stroke(); });
    // felt fox (flat shapes, stitched)
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 6; foxFlat(ctx, L, 620, 470, 1.3, { outline: null }); ctx.restore();
    ctx.save(); ctx.setLineDash([8, 6]); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(620, 522, 56, 50, 0, 0, L.TAU); ctx.stroke(); ctx.restore();
    caption(ctx, L, W, H, 'Sing with Pip!', { stroke: '#e94f7c' });
  },
};

// ---- 5 toy-bricks (3D) ------------------------------------------------
S['toy-bricks'] = {
  dim: '3d', title: 'Toy bricks',
  async draw({ THREE, canvas, W, H, L }) {
    const t = L.three3d(THREE, canvas, W, H, { bg: '#bfe3ff', fov: 30 });
    t.camera.position.set(14, 12, 18); t.camera.lookAt(0, 3, 0);
    t.scene.add(new THREE.HemisphereLight('#ffffff', '#8aa', 1.1));
    t.sun(10, 18, 8, 2.8, '#ffffff', 16);
    const plastic = (c) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.15 });
    const brick = (x, y, z, w, d, c, h = 1.2) => {
      const mat = plastic(c);
      t.mesh(new THREE.BoxGeometry(w, h, d), mat, x, y + h / 2, z);
      const stud = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 20);
      for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) t.mesh(stud, mat, x - w / 2 + 0.5 + i, y + h + 0.1, z - d / 2 + 0.5 + j);
    };
    // base plate
    const base = plastic('#3fae49');
    t.mesh(new THREE.BoxGeometry(16, 0.4, 16), base, 0, -0.2, 0);
    const stud = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16);
    for (let i = -7; i <= 7; i += 1) for (let j = -7; j <= 7; j += 1) if (Math.abs(i) > 2 || Math.abs(j) > 2) t.mesh(stud, base, i + 0.5, 0.1, j + 0.5);
    // rocket tower
    const cols = ['#e3342f', '#ffffff', '#e3342f', '#ffffff', '#3490dc'];
    cols.forEach((c, k) => brick(0, k * 1.2, 0, 3, 3, c));
    brick(0, 6, 0, 2, 2, '#ffd23f');
    brick(0, 7.2, 0, 1, 1, '#ffd23f');
    // fins
    brick(-2, 0, 0, 1, 2, '#3490dc'); brick(2, 0, 0, 1, 2, '#3490dc');
    // window
    const win = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.1, 30), new THREE.MeshPhysicalMaterial({ color: '#9fd8ff', roughness: 0.05, metalness: 0.2, clearcoat: 1 }));
    win.rotation.x = Math.PI / 2; win.position.set(0, 3.6, 1.56); t.scene.add(win);
    // loose bricks
    brick(5, 0, 3, 2, 1, '#ff9f1c'); brick(-5, 0, 4, 1, 2, '#9b5de5'); brick(-4, 0, -4, 2, 2, '#f15bb5'); brick(5, 0, -4, 2, 1, '#00bbf9');
    t.render();
  },
};

// ---- 6 chalk-classroom (2D) -------------------------------------------
S['chalk-classroom'] = {
  dim: '2d', title: 'Chalk classroom',
  draw(ctx, W, H, L) {
    const r = L.rng(606);
    L.fill(ctx, W, H, '#8a5a35');
    ctx.fillStyle = '#2f5d4b'; ctx.fillRect(40, 40, W - 80, H - 110);
    // eraser smudges
    for (let i = 0; i < 18; i++) { const x = r() * W, y = r() * H, g = ctx.createRadialGradient(x, y, 0, x, y, r.range(60, 180)); g.addColorStop(0, 'rgba(255,255,255,0.06)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(40, 40, W - 80, H - 110); }
    const chalkStroke = (fn, col = '#f4f1e8', w = 5) => {
      for (let k = 0; k < 3; k++) {
        ctx.save(); ctx.strokeStyle = col; ctx.globalAlpha = 0.35 + k * 0.15; ctx.lineWidth = w - k; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); fn(k); ctx.stroke(); ctx.restore();
      }
    };
    const chalkText = (s, x, y, size, col) => {
      for (let k = 0; k < 4; k++) L.text(ctx, s, x + r.range(-1.5, 1.5), y + r.range(-1.5, 1.5), { size, color: L.rgba(col, 0.3), font: 'Comic Sans MS, DejaVu Sans', weight: 700 });
    };
    chalkText('Let\'s count apples!', W / 2, 110, 56, '#ffffff');
    // three apples with numbers
    [[330, '#ff7b7b'], [640, '#ffd36b'], [950, '#9fe08a']].forEach(([x, c], i) => {
      const pts = L.circlePts(x, 320, 85, 80);
      chalkStroke(() => { pts.forEach(([a, b], j) => (j ? ctx.lineTo(a + r.range(-2, 2), b + r.range(-2, 2)) : ctx.moveTo(a, b))); ctx.closePath(); }, c, 6);
      ctx.save(); L.poly(ctx, pts); ctx.clip(); ctx.strokeStyle = L.rgba(c, 0.25); ctx.lineWidth = 3; for (let y = 230; y < 410; y += 9) { ctx.beginPath(); ctx.moveTo(x - 100, y + r.range(-3, 3)); ctx.lineTo(x + 100, y + 30 + r.range(-3, 3)); ctx.stroke(); } ctx.restore();
      chalkStroke(() => { ctx.moveTo(x, 245); ctx.quadraticCurveTo(x + 5, 215, x + 18, 205); }, '#c79a6a', 6);
      chalkStroke(() => { ctx.ellipse(x + 30, 222, 22, 10, -0.5, 0, L.TAU); }, '#9fe08a', 4);
      chalkText(String(i + 1), x, 480, 110, '#ffffff');
    });
    // chalk dust on the ledge
    ctx.fillStyle = '#6b4428'; ctx.fillRect(40, H - 80, W - 80, 26);
    for (let i = 0; i < 300; i++) { ctx.fillStyle = `rgba(255,255,255,${r.range(0.1, 0.4)})`; ctx.fillRect(r.range(60, W - 60), H - 80 + r.range(0, 8), 2, 1); }
    ctx.fillStyle = '#f4f1e8'; ctx.fillRect(900, H - 92, 60, 14); ctx.fillStyle = '#ffd36b'; ctx.fillRect(980, H - 92, 50, 14);
    L.grain(ctx, W, H, 0.05, 607);
  },
};

// ---- 7 tiny-island (3D, low poly) ---------------------------------------
S['tiny-island'] = {
  dim: '3d', title: 'Tiny low-poly island',
  async draw({ THREE, canvas, W, H, L }) {
    const r = L.rng(707);
    const t = L.three3d(THREE, canvas, W, H, { bg: '#ffe7d1', ortho: true, orthoSize: 7.5 });
    t.camera.position.set(20, 18, 20); t.camera.lookAt(0, 0.5, 0);
    t.scene.add(new THREE.HemisphereLight('#fff8ee', '#a9c7e8', 1.3));
    t.sun(8, 14, 4, 2.2, '#ffe6c4', 12);
    const flat = (c) => new THREE.MeshLambertMaterial({ color: c, flatShading: true });
    // water
    const water = t.mesh(new THREE.CylinderGeometry(9, 9, 0.6, 7), flat('#6cc5d9'), 0, -0.5, 0);
    water.receiveShadow = true;
    // island top with jitter
    const g = new THREE.CylinderGeometry(5, 6, 1.6, 9, 2);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { if (p.getY(i) > 0.7) p.setY(i, 0.8 + r() * 0.35); else p.setX(i, p.getX(i) * (1 + (r() - 0.5) * 0.1)); }
    g.computeVertexNormals();
    t.mesh(g, flat('#8fd16a'), 0, 0.2, 0);
    t.mesh(new THREE.CylinderGeometry(6, 5.2, 1.2, 9), flat('#e8c48a'), 0, -0.7, 0);
    // trees
    for (let i = 0; i < 9; i++) {
      const a = r() * L.TAU, d = r.range(1, 4), x = Math.cos(a) * d, z = Math.sin(a) * d, s = r.range(0.7, 1.2);
      t.mesh(new THREE.CylinderGeometry(0.12 * s, 0.18 * s, 0.8 * s, 5), flat('#8a5a3c'), x, 1.4, z);
      t.mesh(new THREE.ConeGeometry(0.7 * s, 1.6 * s, 6), flat(r.pick(['#3f9e5a', '#57b36b', '#2f8a4c'])), x, 2.3 * s + 0.3, z);
    }
    // little house
    t.mesh(new THREE.BoxGeometry(1.4, 1, 1.2), flat('#fff3e3'), 2.6, 1.6, 1.6);
    const roof = t.mesh(new THREE.ConeGeometry(1.15, 0.9, 4), flat('#e8553a'), 2.6, 2.55, 1.6); roof.rotation.y = Math.PI / 4;
    // rocks + boat
    for (let i = 0; i < 6; i++) { const a = r() * L.TAU; t.mesh(new THREE.DodecahedronGeometry(r.range(0.25, 0.5)), flat('#b9b3a8'), Math.cos(a) * 6.3, -0.1, Math.sin(a) * 6.3); }
    t.mesh(new THREE.BoxGeometry(1.4, 0.35, 0.6), flat('#c0733f'), -6.8, 0, 2.5);
    t.mesh(new THREE.ConeGeometry(0.45, 1.1, 3), flat('#ffffff'), -6.8, 0.75, 2.5);
    t.render();
  },
};

// ---- 8 bendy-cartoon (2D, 1930s) ---------------------------------------
S['bendy-cartoon'] = {
  dim: '2d', title: 'Bendy 1930s cartoon',
  draw(ctx, W, H, L) {
    const r = L.rng(808);
    L.fill(ctx, W, H, '#e9e2cf');
    // background stage lines
    ctx.fillStyle = '#d4cab2'; ctx.fillRect(0, 470, W, H - 470);
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 470); ctx.lineTo(W, 470); ctx.stroke();
    // smiling sun with face
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#111'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(1060, 150, 80, 0, L.TAU); ctx.fill(); ctx.stroke();
    for (let i = 0; i < 10; i++) { const a = (i / 10) * L.TAU; ctx.beginPath(); ctx.moveTo(1060 + Math.cos(a) * 95, 150 + Math.sin(a) * 95); ctx.quadraticCurveTo(1060 + Math.cos(a + 0.2) * 120, 150 + Math.sin(a + 0.2) * 120, 1060 + Math.cos(a) * 140, 150 + Math.sin(a) * 140); ctx.stroke(); }
    const pieEye = (x, y, s) => { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(x, y, 14 * s, 20 * s, 0, 0, L.TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#111'; ctx.beginPath(); ctx.moveTo(x, y + 4 * s); ctx.ellipse(x, y + 4 * s, 9 * s, 13 * s, 0, -2.3, 1.2); ctx.closePath(); ctx.fill(); };
    pieEye(1035, 140, 1); pieEye(1085, 140, 1);
    ctx.beginPath(); ctx.arc(1060, 165, 35, 0.2, Math.PI - 0.2); ctx.stroke();
    // rubber-hose fox: black body, white face, hose limbs
    const cx = 620, cy = 360;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = '#111'; ctx.lineWidth = 16;
    ctx.beginPath(); ctx.moveTo(cx - 40, cy + 80); ctx.bezierCurveTo(cx - 120, cy + 60, cx - 160, cy - 20, cx - 200, cy - 60); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 40, cy + 80); ctx.bezierCurveTo(cx + 120, cy + 120, cx + 170, cy + 60, cx + 210, cy - 10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - 25, cy + 150); ctx.bezierCurveTo(cx - 60, cy + 220, cx - 120, cy + 230, cx - 140, cy + 240); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 25, cy + 150); ctx.bezierCurveTo(cx + 70, cy + 200, cx + 90, cy + 240, cx + 140, cy + 240); ctx.stroke();
    // gloves and shoes
    ctx.fillStyle = '#fff'; ctx.lineWidth = 5;
    [[cx - 210, cy - 70], [cx + 220, cy - 20]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 26, 0, L.TAU); ctx.fill(); ctx.stroke(); });
    ctx.fillStyle = '#111';
    [[cx - 160, cy + 245], [cx + 165, cy + 245]].forEach(([x, y]) => { ctx.beginPath(); ctx.ellipse(x, y, 44, 20, 0, 0, L.TAU); ctx.fill(); });
    // body + head
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.ellipse(cx, cy + 100, 70, 80, 0, 0, L.TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx - 100, cy - 40); ctx.lineTo(cx - 80, cy - 170); ctx.lineTo(cx - 30, cy - 90); ctx.lineTo(cx + 30, cy - 90); ctx.lineTo(cx + 80, cy - 170); ctx.lineTo(cx + 100, cy - 40); ctx.quadraticCurveTo(cx, cy + 40, cx - 100, cy - 40); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(cx - 70, cy - 40); ctx.quadraticCurveTo(cx, cy - 80, cx + 70, cy - 40); ctx.quadraticCurveTo(cx, cy + 30, cx - 70, cy - 40); ctx.fill();
    ctx.strokeStyle = '#111'; ctx.lineWidth = 5; pieEye(cx - 26, cy - 58, 1.2); pieEye(cx + 26, cy - 58, 1.2);
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.ellipse(cx, cy - 22, 14, 10, 0, 0, L.TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy - 10, 26, 0.3, Math.PI - 0.3); ctx.stroke();
    // motion lines
    ctx.lineWidth = 4; [[cx - 260, cy - 110], [cx - 280, cy - 70], [cx + 270, cy - 60]].forEach(([x, y]) => { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (x < cx ? -30 : 30), y - 6); ctx.stroke(); });
    // title card frame
    L.text(ctx, 'PIP in "MORNING STOMP"', W / 2, 60, { size: 46, color: '#111', font: 'DejaVu Serif', weight: 900 });
    // film look
    L.grain(ctx, W, H, 0.12, 809);
    L.filmDamage(ctx, W, H, r, 6);
    L.vignette(ctx, W, H, 0.6);
    const img = ctx.getImageData(0, 0, W, H), d = img.data;
    for (let i = 0; i < d.length; i += 4) { const g = d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11; d[i] = g * 1.02; d[i + 1] = g; d[i + 2] = g * 0.92; }
    ctx.putImageData(img, 0, 0);
  },
};

// ---- 9 fifties-flat (2D) ----------------------------------------------
S['fifties-flat'] = {
  dim: '2d', title: '1950s flat cartoon',
  draw(ctx, W, H, L) {
    const r = L.rng(909);
    L.fill(ctx, W, H, '#f3e6c8');
    // offset colour blocks (misregistered print)
    const block = (pts, col, off = 6) => { L.poly(ctx, pts.map(([x, y]) => [x + off, y + off * 0.6])); ctx.fillStyle = L.rgba(col, 0.35); ctx.fill(); L.poly(ctx, pts); ctx.fillStyle = col; ctx.fill(); };
    block([[0, 0], [W, 0], [W, 420], [0, 420]], '#7fc4c0', 0);
    block([[80, 90], [520, 60], [470, 360], [120, 380]], '#e9a23b');
    block([[760, 120], [1180, 160], [1120, 400], [800, 380]], '#d9574a');
    // boomerang table + starbursts
    block([[180, 520], [600, 470], [1040, 530], [980, 580], [620, 540], [240, 590]], '#5a3d2b');
    ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 4;
    for (const [x, y] of [[300, 180], [980, 260], [1150, 70]]) { for (let i = 0; i < 8; i++) { const a = (i / 8) * L.TAU; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * 36, y + Math.sin(a) * 36); ctx.stroke(); } ctx.beginPath(); ctx.arc(x, y, 6, 0, L.TAU); ctx.fillStyle = '#2a2a2a'; ctx.fill(); }
    // tilted modern fox, flat with thin outline
    ctx.save(); ctx.translate(640, 380); ctx.rotate(-0.12); foxFlat(ctx, L, 0, 0, 1.25, { body: '#e8743b', belly: '#fbeed3', dark: '#2a2a2a', outline: '#2a2a2a', lw: 3 }); ctx.restore();
    // safety sign
    block([[920, 430], [1120, 430], [1120, 520], [920, 520]], '#fbeed3');
    L.text(ctx, 'LOOK BOTH', 1020, 462, { size: 26, color: '#2a2a2a', font: 'DejaVu Sans', weight: 900 });
    L.text(ctx, 'WAYS!', 1020, 494, { size: 26, color: '#d9574a', font: 'DejaVu Sans', weight: 900 });
    L.text(ctx, 'Pip Crosses the Road', W / 2, H - 60, { size: 52, color: '#2a2a2a', font: 'DejaVu Serif', weight: 900, italic: true });
    L.grain(ctx, W, H, 0.07, 910);
  },
};

// ---- 10 shadow-theatre (2D) ---------------------------------------------
S['shadow-theatre'] = {
  dim: '2d', title: 'Shadow theatre',
  draw(ctx, W, H, L) {
    const r = L.rng(1010);
    L.fill(ctx, W, H, '#1b0f08');
    // glowing screen
    const g = ctx.createRadialGradient(W / 2, H / 2 - 20, 40, W / 2, H / 2, 620);
    g.addColorStop(0, '#ffd99a'); g.addColorStop(0.55, '#f2a24f'); g.addColorStop(1, '#5a2a10');
    ctx.fillStyle = g; ctx.fillRect(90, 60, W - 180, H - 160);
    for (let i = 0; i < 2500; i++) { ctx.fillStyle = `rgba(80,30,0,${r.range(0.02, 0.06)})`; ctx.fillRect(r.range(90, W - 90), r.range(60, H - 100), 3, 1); }
    // frame
    ctx.strokeStyle = '#4a2510'; ctx.lineWidth = 26; ctx.strokeRect(90, 60, W - 180, H - 160);
    ctx.fillStyle = '#120804';
    const sil = (fn) => { ctx.save(); ctx.fillStyle = '#1a0c05'; ctx.shadowColor = 'rgba(30,10,0,0.6)'; ctx.shadowBlur = 8; fn(); ctx.restore(); };
    // ground
    sil(() => { ctx.beginPath(); ctx.moveTo(90, 540); for (let x = 90; x <= W - 90; x += 30) ctx.lineTo(x, 540 - Math.sin(x * 0.01) * 16); ctx.lineTo(W - 90, H - 100); ctx.lineTo(90, H - 100); ctx.fill(); });
    // tree
    sil(() => { ctx.fillRect(250, 300, 22, 240); ctx.beginPath(); for (let i = 0; i < 7; i++) { ctx.moveTo(261, 320); ctx.ellipse(261 + Math.cos(i) * 60, 260 + Math.sin(i) * 40, 70, 34, i, 0, L.TAU); } ctx.fill(); });
    // jointed fox puppet with rods and pins
    sil(() => {
      ctx.translate(560, 420);
      ctx.beginPath(); ctx.ellipse(0, 30, 70, 46, 0, 0, L.TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(60, 0); ctx.quadraticCurveTo(170, -40, 150, -110); ctx.quadraticCurveTo(110, -40, 50, -10); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-60, 0); ctx.lineTo(-90, -90); ctx.lineTo(-110, -150); ctx.lineTo(-80, -110); ctx.lineTo(-50, -120); ctx.lineTo(-40, -70); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-100, -60); ctx.lineTo(-180, -50); ctx.lineTo(-100, -30); ctx.fill();
      for (const [x, y, a] of [[-40, 70, 0.3], [30, 70, -0.2]]) { ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillRect(-7, 0, 14, 60); ctx.restore(); }
    });
    // decorative cut holes in the puppet
    ctx.fillStyle = '#e99a4a'; [[530, 440], [560, 450], [590, 440]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 6, 0, L.TAU); ctx.fill(); });
    ctx.beginPath(); ctx.arc(470, 330, 6, 0, L.TAU); ctx.fill();
    // rods
    ctx.strokeStyle = '#2a1406'; ctx.lineWidth = 4;
    [[520, 470, 470, H - 100], [470, 330, 420, H - 100], [600, 480, 650, H - 100]].forEach(([a, b, c, d]) => { ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.stroke(); });
    // moon + crow
    ctx.fillStyle = 'rgba(255,245,220,0.8)'; ctx.beginPath(); ctx.arc(960, 170, 54, 0, L.TAU); ctx.fill();
    ctx.fillStyle = '#ffd99a'; ctx.beginPath(); ctx.arc(980, 160, 50, 0, L.TAU); ctx.fill();
    sil(() => { ctx.translate(930, 330); ctx.beginPath(); ctx.ellipse(0, 0, 50, 26, 0, 0, L.TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(-10, -10); ctx.lineTo(-80, -70); ctx.lineTo(10, -20); ctx.fill(); ctx.beginPath(); ctx.moveTo(40, -10); ctx.lineTo(80, 0); ctx.lineTo(40, 6); ctx.fill(); });
    L.text(ctx, 'The Fox and the Clever Crow', W / 2, H - 50, { size: 40, color: '#ffd99a', font: 'DejaVu Serif', weight: 700 });
    L.vignette(ctx, W, H, 0.5);
  },
};

// ---- 11 sticker-book (2D) ---------------------------------------------
S['sticker-book'] = {
  dim: '2d', title: 'Sticker book',
  draw(ctx, W, H, L) {
    const r = L.rng(1111);
    L.fill(ctx, W, H, '#fde8ef');
    // dotted page pattern
    ctx.fillStyle = '#f8cfdc'; for (let y = 20; y < H; y += 40) for (let x = (y / 40) % 2 ? 20 : 40; x < W; x += 40) { ctx.beginPath(); ctx.arc(x, y, 3, 0, L.TAU); ctx.fill(); }
    const sticker = (x, y, rot, drawFn, border = 12) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
      ctx.shadowColor = 'rgba(80,30,50,0.3)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 6;
      ctx.lineJoin = 'round'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = border * 2; drawFn(true); ctx.restore();
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot); drawFn(false);
      // gloss
      const g = ctx.createLinearGradient(-80, -80, 60, 60); g.addColorStop(0, 'rgba(255,255,255,0.45)'); g.addColorStop(0.4, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.globalCompositeOperation = 'source-atop'; ctx.fillRect(-150, -150, 300, 300);
      ctx.restore();
    };
    const shape = (pts, col) => (outline) => { L.poly(ctx, pts); if (outline) { ctx.stroke(); ctx.fillStyle = '#fff'; ctx.fill(); } else { ctx.fillStyle = col; ctx.fill(); } };
    sticker(200, 200, -0.2, shape(L.circlePts(0, 0, 70), '#ff595e'));
    sticker(420, 180, 0.15, shape([[-70, 60], [70, 60], [70, -60], [-70, -60]], '#1982c4'));
    sticker(630, 200, -0.1, shape([[0, -80], [80, 60], [-80, 60]], '#ffca3a'));
    sticker(860, 190, 0.2, (o) => { L.star(ctx, 0, 0, 80, 36); if (o) { ctx.stroke(); ctx.fillStyle = '#fff'; ctx.fill(); } else { ctx.fillStyle = '#8ac926'; ctx.fill(); } });
    sticker(1080, 200, -0.15, (o) => { ctx.beginPath(); ctx.moveTo(0, 60); ctx.bezierCurveTo(-90, 0, -60, -80, 0, -35); ctx.bezierCurveTo(60, -80, 90, 0, 0, 60); if (o) { ctx.stroke(); ctx.fillStyle = '#fff'; ctx.fill(); } else { ctx.fillStyle = '#ff70a6'; ctx.fill(); } });
    ['circle', 'square', 'triangle', 'star', 'heart'].forEach((w, i) => L.text(ctx, w, [200, 420, 630, 860, 1080][i], 320, { size: 30, color: '#6a3a50', font: 'Inter', weight: 800 }));
    // the fox as a big sticker
    sticker(640, 520, 0.05, (o) => { if (o) { ctx.beginPath(); ctx.ellipse(10, -10, 110, 130, 0, 0, L.TAU); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.fill(); } else foxFlat(ctx, L, 0, 10, 0.95, {}); }, 10);
    L.text(ctx, 'Learn Shapes!', 250, 560, { size: 64, color: '#ff595e', stroke: '#fff', strokeW: 12, font: 'Inter', weight: 900 });
  },
};

// ---- 12 bubble-world (3D) ---------------------------------------------
S['bubble-world'] = {
  dim: '3d', title: 'Bubble world',
  async draw({ THREE, canvas, W, H, L }) {
    const r = L.rng(1212);
    const t = L.three3d(THREE, canvas, W, H, { bg: '#ffe9f3', fov: 34 });
    t.camera.position.set(0, 2, 16); t.camera.lookAt(0, 0.5, 0);
    t.scene.add(new THREE.HemisphereLight('#ffffff', '#ffc0d9', 1.4));
    t.sun(-6, 10, 8, 2.2, '#ffffff', 12);
    const pt = new THREE.PointLight('#a0d8ff', 40, 30); pt.position.set(6, 4, 6); t.scene.add(pt);
    const soft = (c) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.2, sheen: 0.5 });
    // floor
    t.mesh(new THREE.CylinderGeometry(14, 14, 0.5, 60), soft('#ffd3e6'), 0, -3, 0);
    // big friendly bubble character
    const body = t.mesh(new THREE.SphereGeometry(2.2, 64, 48), soft('#ffb347'), 0, -0.6, 0); body.scale.set(1, 0.92, 1);
    const head = t.mesh(new THREE.SphereGeometry(1.7, 64, 48), soft('#ffb347'), 0, 2.4, 0.2);
    const ear = (x) => { const e = t.mesh(new THREE.ConeGeometry(0.6, 1.3, 32), soft('#ff9a2e'), x, 3.9, 0); e.rotation.z = -x * 0.35; };
    ear(-0.95); ear(0.95);
    t.mesh(new THREE.SphereGeometry(1.0, 48, 32), soft('#fff3df'), 0, 1.9, 1.15).scale.set(1, 0.75, 0.7);
    const eye = (x) => { t.mesh(new THREE.SphereGeometry(0.28, 32, 24), soft('#2b1d14'), x, 2.75, 1.5); t.mesh(new THREE.SphereGeometry(0.09, 16, 12), new THREE.MeshBasicMaterial({ color: '#fff' }), x + 0.1, 2.88, 1.75); };
    eye(-0.55); eye(0.55);
    t.mesh(new THREE.SphereGeometry(0.2, 24, 16), soft('#2b1d14'), 0, 2.1, 1.85);
    // floating bubbles
    const cols = ['#ff7eb6', '#7ec8ff', '#b28dff', '#7effc1', '#ffe27e'];
    for (let i = 0; i < 16; i++) {
      const rad = r.range(0.25, 0.9);
      const m = new THREE.MeshPhysicalMaterial({ color: r.pick(cols), roughness: 0.05, transmission: 0.6, thickness: 0.5, clearcoat: 1, transparent: true, opacity: 0.9 });
      let x = r.range(-9, 9); if (Math.abs(x) < 3) x += x < 0 ? -3 : 3;
      t.mesh(new THREE.SphereGeometry(rad, 40, 30), m, x, r.range(-2, 5), r.range(-4, 2));
    }
    t.render();
  },
};

export default S;
