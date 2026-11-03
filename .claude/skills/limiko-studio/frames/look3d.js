// Cinematic look for three.js scenes: what makes a Blender render feel like film, rebuilt for the browser renderer.
// Image-based light, filmic tone mapping, real lens (focal length + depth of field), ambient occlusion, bloom,
// light shafts, atmospheric fog, colour grade, vignette and grain. Every effect is a pure function of t.
//
//   import { cinematic, lens, rig, lightShaft, dust, materials } from '../look3d.js';
//   setup({ THREE, canvas, W, H }) {
//     const look = await cinematic(THREE, canvas, W, H, { quality: 'final', fog: '#1a1410', grade: 'warm' });
//     look.scene.add(...); return { look };
//   }
//   draw({ t, state: { look } }) {
//     rig.orbit(look.camera, { target: [0, 1, 0], radius: 7, height: 2.2, angle: 0.4 + t * 0.06 });
//     look.render(t, { focus: [0, 1, 0] });             // focus distance follows a point (rack focus = move the point)
//   }
// Quality: 'draft' (fast, no AO / DOF), 'final' (everything). Grades: neutral, warm, cool, teal-orange, night, golden, bleach.

import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export const GRADES = {
  neutral:       { lift: [0, 0, 0], gamma: [1, 1, 1], gain: [1, 1, 1], sat: 1.0 },
  warm:          { lift: [0.02, 0.01, -0.01], gamma: [1.02, 1, 0.96], gain: [1.06, 1.0, 0.9], sat: 1.05 },
  cool:          { lift: [-0.01, 0.0, 0.02], gamma: [0.97, 1, 1.03], gain: [0.94, 1.0, 1.06], sat: 0.95 },
  'teal-orange': { lift: [-0.01, 0.015, 0.03], gamma: [1.03, 1, 0.97], gain: [1.08, 0.99, 0.9], sat: 1.12, split: 0.35 },
  night:         { lift: [0.0, 0.01, 0.04], gamma: [0.92, 0.96, 1.05], gain: [0.8, 0.9, 1.05], sat: 0.8 },
  golden:        { lift: [0.03, 0.015, -0.01], gamma: [1.05, 1.0, 0.92], gain: [1.1, 1.0, 0.82], sat: 1.1 },
  bleach:        { lift: [0.01, 0.01, 0.01], gamma: [1, 1, 1], gain: [1.02, 1.02, 1.02], sat: 0.6, contrast: 1.15 },
};

const GradeShader = {
  uniforms: {
    tDiffuse: { value: null }, lift: { value: [0, 0, 0] }, gamma: { value: [1, 1, 1] }, gain: { value: [1, 1, 1] },
    sat: { value: 1 }, contrast: { value: 1 }, split: { value: 0 }, vignette: { value: 0.35 }, grain: { value: 0.035 },
    seed: { value: 0 }, aberration: { value: 0.0015 }, aspect: { value: 16 / 9 },
  },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform vec3 lift, gamma, gain; uniform float sat, contrast, split, vignette, grain, seed, aberration, aspect;
    varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233)) + seed * 0.618) * 43758.5453); }
    void main(){
      vec2 d = vUv - 0.5;
      // slight lens chromatic aberration toward the edges
      vec3 c = vec3(texture2D(tDiffuse, vUv - d * aberration).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv + d * aberration).b);
      c = pow(max(c * gain + lift * (1.0 - c), 0.0), 1.0 / gamma);                    // lift / gamma / gain
      float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
      c = mix(vec3(l), c, sat);
      c = (c - 0.5) * contrast + 0.5;
      c += split * vec3(0.06, 0.02, -0.05) * smoothstep(0.45, 1.0, l) + split * vec3(-0.04, 0.02, 0.06) * (1.0 - smoothstep(0.0, 0.45, l));  // warm highs, teal lows
      float v = smoothstep(0.85, 0.2, length(d * vec2(aspect, 1.0)) / aspect * 1.6);
      c *= mix(1.0, v, vignette);
      c += (hash(vUv * 1000.0) - 0.5) * grain;
      gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
    }`,
};

/** Build a cinematic renderer. Returns { THREE, renderer, scene, camera, sun, mesh, render(t, opts), composer }. */
export async function cinematic(THREE, canvas, W, H, o = {}) {
  const { quality = 'final', bg = '#0d0b09', fog = null, fogDensity = 0.045, grade = 'warm', exposure = 1.0, env = 0.6,
    bloom = 0.35, bloomRadius = 0.5, bloomThreshold = 0.82, ao = quality === 'final', dof = quality === 'final',
    aperture = 0.0022, maxblur = 0.008, focal = 35, vignette = 0.35, grain = 0.035, shadows = true } = o;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1); renderer.setSize(W, H, false);
  renderer.shadowMap.enabled = shadows; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.AgXToneMapping ?? THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = exposure;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(bg);
  if (fog) scene.fog = new THREE.FogExp2(fog, fogDensity);
  // image-based light: a soft studio room, so metal and glass have something to reflect
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = env;
  const camera = new THREE.PerspectiveCamera(35, W / H, 0.1, 400);
  lens(camera, focal);
  const sun = (x, y, z, intensity = 3, color = '#ffe2b8', size = 12) => {
    const l = new THREE.DirectionalLight(color, intensity); l.position.set(x, y, z); l.castShadow = shadows;
    l.shadow.mapSize.set(2048, 2048); Object.assign(l.shadow.camera, { left: -size, right: size, top: size, bottom: -size, near: 0.5, far: 120 });
    l.shadow.bias = -0.0004; l.shadow.normalBias = 0.02; l.shadow.radius = 4; scene.add(l); return l;
  };
  const mesh = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = shadows; scene.add(m); return m; };

  // render target with MSAA so edges stay clean through the post chain
  const rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, rt);
  composer.setPixelRatio(1); composer.setSize(W, H);
  composer.addPass(new RenderPass(scene, camera));
  let gtao = null, bokeh = null;
  if (ao) { gtao = new GTAOPass(scene, camera, W, H); gtao.updateGtaoMaterial({ radius: 0.5, distanceFallOff: 1, thickness: 1, scale: 1 }); gtao.blendIntensity = 0.85; composer.addPass(gtao); }
  if (dof) { bokeh = new BokehPass(scene, camera, { focus: 6, aperture, maxblur }); composer.addPass(bokeh); }
  if (bloom > 0) composer.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), bloom, bloomRadius, bloomThreshold));
  composer.addPass(new OutputPass());
  const gradePass = new ShaderPass(GradeShader);
  const g = { ...GRADES.neutral, ...(typeof grade === 'string' ? GRADES[grade] : grade) };
  Object.assign(gradePass.uniforms.lift, { value: g.lift }); gradePass.uniforms.gamma.value = g.gamma; gradePass.uniforms.gain.value = g.gain;
  gradePass.uniforms.sat.value = g.sat ?? 1; gradePass.uniforms.contrast.value = g.contrast ?? 1.04; gradePass.uniforms.split.value = g.split ?? 0;
  gradePass.uniforms.vignette.value = vignette; gradePass.uniforms.grain.value = grain; gradePass.uniforms.aspect.value = W / H;
  composer.addPass(gradePass);

  const v = new THREE.Vector3();
  const render = (t = 0, { focus = null, fps = 24 } = {}) => {
    if (bokeh && focus) { v.set(...focus); bokeh.uniforms.focus.value = camera.position.distanceTo(v); }
    gradePass.uniforms.seed.value = Math.floor(t * fps) % 997;   // grain changes per frame, deterministically
    composer.render();
  };
  return { THREE, renderer, scene, camera, sun, mesh, render, composer, quality };
}

/** Set a perspective camera by focal length (mm, 35 mm full-frame): 18 wide, 35 normal, 50 natural, 85 portrait, 135 tele. */
export function lens(camera, mm = 35) { camera.setFocalLength(mm); camera.updateProjectionMatrix(); return camera; }

/** Camera moves, each a pure function of its arguments (feed t in). Every move keeps a tiny handheld breath. */
export const rig = {
  look(camera, target) { camera.lookAt(target[0], target[1], target[2]); },
  orbit(camera, { target = [0, 0, 0], radius = 8, height = 2, angle = 0, breathe = 0.02, t = angle }) {
    camera.position.set(target[0] + Math.sin(angle) * radius, target[1] + height + Math.sin(t * 1.3) * breathe, target[2] + Math.cos(angle) * radius);
    camera.lookAt(target[0], target[1] + Math.sin(t * 0.9) * breathe * 0.5, target[2]);
  },
  dolly(camera, { from, to, p, target }) {
    const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
    camera.position.set(...from.map((a, i) => a + (to[i] - a) * e)); if (target) camera.lookAt(...target);
  },
  crane(camera, { base = [0, 0, 8], rise = 4, p, target = [0, 1, 0] }) {
    const e = 1 - Math.pow(1 - p, 3);
    camera.position.set(base[0], base[1] + rise * e, base[2] - rise * 0.35 * e); camera.lookAt(...target);
  },
  handheld(camera, t, amount = 0.01) {
    camera.rotation.x += Math.sin(t * 1.7) * amount * 0.6 + Math.sin(t * 4.1) * amount * 0.15;
    camera.rotation.y += Math.cos(t * 1.3) * amount * 0.6 + Math.sin(t * 3.3) * amount * 0.15;
  },
};

/** A volumetric-looking light shaft (god ray): an additive cone that fades along its length and at the edges. */
export function lightShaft(THREE, { from = [3, 8, -2], to = [0, 0, 0], radius = 1.6, color = '#ffd9a0', strength = 0.35 } = {}) {
  const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to), len = a.distanceTo(b);
  const geo = new THREE.CylinderGeometry(radius * 0.25, radius, len, 48, 1, true);
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { color: { value: new THREE.Color(color) }, strength: { value: strength }, time: { value: 0 } },
    vertexShader: 'varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv = uv; vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position,1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
    fragmentShader: `uniform vec3 color; uniform float strength, time; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main(){ float edge = pow(abs(dot(vN, vV)), 1.6); float along = smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.55, vUv.y);
        float flick = 0.9 + 0.1 * sin(vUv.x * 40.0 + time * 0.7); gl_FragColor = vec4(color * strength * edge * along * flick, 1.0); }`,
  });
  const m = new THREE.Mesh(geo, mat);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), b.clone().sub(a).normalize());
  m.update = (t) => { mat.uniforms.time.value = t; };
  return m;
}

/** Floating dust motes catching the light (deterministic: positions are functions of t). */
export function dust(THREE, { count = 400, box = [8, 5, 8], center = [0, 2, 0], size = 0.035, color = '#ffe9c4', seed = 3 } = {}) {
  let s = seed; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const base = new Float32Array(count * 3), ph = new Float32Array(count);
  for (let i = 0; i < count; i++) { base[i * 3] = (r() - 0.5) * box[0]; base[i * 3 + 1] = (r() - 0.5) * box[1]; base[i * 3 + 2] = (r() - 0.5) * box[2]; ph[i] = r() * 100; }
  const pos = new Float32Array(count * 3), geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color, size, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending }));
  pts.position.set(...center);
  pts.update = (t) => {
    for (let i = 0; i < count; i++) {
      const p = ph[i];
      pos[i * 3] = base[i * 3] + Math.sin(t * 0.21 + p) * 0.25;
      pos[i * 3 + 1] = ((base[i * 3 + 1] + t * 0.05 + box[1] / 2) % box[1] + box[1]) % box[1] - box[1] / 2;
      pos[i * 3 + 2] = base[i * 3 + 2] + Math.cos(t * 0.17 + p) * 0.25;
    }
    geo.attributes.position.needsUpdate = true;
  };
  return pts;
}

/** Physically based material presets (look right under the environment light). */
export const materials = {
  gold: (THREE) => new THREE.MeshPhysicalMaterial({ color: '#e7b75a', metalness: 1, roughness: 0.22, clearcoat: 0.4 }),
  bronze: (THREE) => new THREE.MeshPhysicalMaterial({ color: '#a8653a', metalness: 1, roughness: 0.4 }),
  stone: (THREE, color = '#b9a68a') => new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0 }),
  marble: (THREE) => new THREE.MeshPhysicalMaterial({ color: '#efe9df', roughness: 0.25, clearcoat: 0.6, clearcoatRoughness: 0.2 }),
  glass: (THREE, tint = '#d8f1ff') => new THREE.MeshPhysicalMaterial({ color: tint, metalness: 0, roughness: 0.02, transmission: 1, thickness: 0.6, ior: 1.5 }),
  plastic: (THREE, color = '#ff6b6b') => new THREE.MeshPhysicalMaterial({ color, roughness: 0.35, clearcoat: 0.8, clearcoatRoughness: 0.15 }),
  clay: (THREE, color = '#d9b8a0') => new THREE.MeshStandardMaterial({ color, roughness: 0.75 }),
  emissive: (THREE, color = '#ffb347', intensity = 3) => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity }),
};
