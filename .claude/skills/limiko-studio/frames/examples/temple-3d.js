// Cinematic 3D demo (history / mythology look): a lamp-lit shrine with a gold idol, light shafts, dust,
// a slow orbiting dolly with a rack focus from the lamp to the idol. Uses look3d.js.
// props.quality: 'final' (AO + depth of field) or 'draft'.
import { cinematic, rig, lightShaft, dust, materials } from '../look3d.js';

export default {
  dim: '3d', fps: 24, width: 1280, height: 720, duration: 6,
  defaultProps: { quality: 'final', grade: 'golden' },
  async setup({ THREE, canvas, W, H, props }) {
    const look = await cinematic(THREE, canvas, W, H, { quality: props.quality, grade: props.grade, bg: '#120d08', fog: '#140e08', fogDensity: 0.028, exposure: 0.85, env: 0.22, focal: 40, aperture: 0.004 });
    const { scene, mesh, sun } = look;
    sun(-4, 9, 3, 2.6, '#ffd7a0', 10);
    const floor = mesh(new THREE.PlaneGeometry(40, 40), materials.stone(THREE, '#6d5a44'), 0, 0, 0); floor.rotation.x = -Math.PI / 2;
    // steps and plinth
    for (let i = 0; i < 3; i++) mesh(new THREE.BoxGeometry(4.4 - i * 0.9, 0.22, 3.2 - i * 0.7), materials.stone(THREE, '#a8946f'), 0, 0.11 + i * 0.22, 0);
    // columns
    for (const x of [-3, 3]) for (const z of [-2.2, 1.6]) {
      mesh(new THREE.CylinderGeometry(0.32, 0.36, 5, 28), materials.marble(THREE), x, 2.5, z);
      mesh(new THREE.BoxGeometry(0.9, 0.25, 0.9), materials.stone(THREE, '#c9b893'), x, 5.1, z);
    }
    mesh(new THREE.BoxGeometry(7.4, 0.5, 4.6), materials.stone(THREE, '#8f7b5c'), 0, 5.45, -0.3);
    // idol: a stylised gold figure (abstract, original shapes)
    const gold = materials.gold(THREE);
    const idol = new THREE.Group(); scene.add(idol); idol.position.set(0, 0.66, -0.2);
    const part = (geo, y, s = 1) => { const m = new THREE.Mesh(geo, gold); m.position.y = y; m.scale.setScalar(s); m.castShadow = m.receiveShadow = true; idol.add(m); return m; };
    part(new THREE.CylinderGeometry(0.55, 0.7, 0.35, 40), 0.18);
    part(new THREE.LatheGeometry([[0, 0], [0.42, 0], [0.5, 0.3], [0.38, 0.9], [0.3, 1.2], [0, 1.25]].map(([x, y]) => new THREE.Vector2(x, y)), 48), 0.35);
    part(new THREE.SphereGeometry(0.27, 40, 30), 1.85);
    const halo = part(new THREE.TorusGeometry(0.62, 0.05, 16, 80), 1.9); halo.position.z = -0.18;
    // oil lamps (emissive) with warm point lights
    const lamps = [-1.4, 1.4].map((x) => {
      mesh(new THREE.CylinderGeometry(0.16, 0.1, 0.12, 20), materials.bronze(THREE), x, 0.72, 0.9);
      const flame = mesh(new THREE.SphereGeometry(0.06, 16, 12), materials.emissive(THREE, '#ffb347', 6), x, 0.85, 0.9); flame.castShadow = false;
      const l = new THREE.PointLight('#ffae55', 2.2, 6, 1.6); l.position.set(x, 0.95, 0.9); scene.add(l);
      return { flame, l, x };
    });
    const shaft = lightShaft(THREE, { from: [-3.5, 9, 2.5], to: [0, 0.6, -0.2], radius: 2.0, color: '#ffd9a0', strength: 0.22 }); scene.add(shaft);
    const motes = dust(THREE, { count: 500, box: [7, 5, 6], center: [0, 2.4, 0], size: 0.02 }); scene.add(motes);
    return { look, lamps, shaft, motes, idol };
  },
  draw({ t, state: S }) {
    const { look } = S;
    // camera: slow orbit + push in; rack focus from the left lamp to the idol at ~3 s
    const p = t / 6;
    rig.orbit(look.camera, { target: [0, 1.6, 0], radius: 7.2 - 2.2 * p, height: 0.2 + 0.5 * p, angle: -0.55 + 0.6 * p, t });
    rig.handheld(look.camera, t, 0.004);
    const k = Math.min(1, Math.max(0, (t - 2.4) / 1.2)), e = k * k * (3 - 2 * k);
    const focus = [-1.4 + 1.4 * e, 0.85 + 1.0 * e, 0.9 - 1.1 * e];
    S.lamps.forEach(({ flame, l, x }, i) => { const f = 1 + Math.sin(t * 13 + i * 2) * 0.08 + Math.sin(t * 29 + i) * 0.05; l.intensity = 2.2 * f; flame.scale.set(1, 1.2 * f, 1); });
    S.shaft.update(t); S.motes.update(t);
    S.idol.rotation.y = Math.sin(t * 0.3) * 0.05;
    look.render(t, { focus, fps: 24 });
  },
};
