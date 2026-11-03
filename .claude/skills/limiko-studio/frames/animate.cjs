// Render an animated scene to video.
//   node animate.cjs <scene.js> [--out film.mp4] [--from s] [--to s] [--every n] [--audio file]
// <scene.js> (path from the repo root / current dir) exports default
//   { dim: '2d'|'3d', fps, duration, width, height, audio?, setup?(env), draw(ctx, W, H, L, T, t, state) }
// 3D scenes: draw({ THREE, canvas, W, H, L, T, t, state }). Frames are pure functions of t.
const fs = require('fs'), path = require('path'), http = require('http');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args.splice(i, 2)[1] : d; };
const out = opt('--out', null), from = +opt('--from', 0), toArg = opt('--to', null), every = +opt('--every', 1), audioArg = opt('--audio', null);
const sceneArg = args[0];
if (!sceneArg) { console.log('usage: node animate.cjs <scene.js> [--out film.mp4] [--from s] [--to s] [--every n] [--audio file]'); process.exit(1); }
const ROOT = process.cwd();
const scenePath = path.resolve(ROOT, sceneArg);
if (!scenePath.startsWith(ROOT)) { console.error('scene must be inside the current directory'); process.exit(1); }
const framesRel = path.relative(ROOT, __dirname).split(path.sep).join('/');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.wav': 'audio/wav' };

const srv = http.createServer((q, r) => {
  const p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(r);
});
srv.listen(0, '127.0.0.1', async () => {
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage();
  page.on('pageerror', (e) => { console.error('page error:', e.message); process.exit(1); });
  const sceneUrl = '/' + path.relative(ROOT, scenePath).split(path.sep).join('/');
  await page.goto(`http://127.0.0.1:${srv.address().port}/${framesRel}/anim.html?scene=${encodeURIComponent(sceneUrl)}`);
  await page.waitForFunction(() => window.READY || window.ERR, null, { timeout: 120000 });
  const err = await page.evaluate(() => window.ERR); if (err) { console.error(err); process.exit(1); }
  const meta = await page.evaluate(() => window.META);
  const fps = meta.fps, to = toArg != null ? +toArg : meta.duration;
  const base = out ? out.replace(/\.mp4$/, '') : scenePath.replace(/\.js$/, '');
  const dir = base + '_frames'; fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const n0 = Math.round(from * fps), n1 = Math.round(to * fps);
  const t0 = Date.now(); let k = 0;
  for (let f = n0; f < n1; f += every) {
    const url = await page.evaluate((t) => window.frame(t), f / fps);
    fs.writeFileSync(path.join(dir, String(k++).padStart(5, '0') + '.png'), Buffer.from(url.split(',')[1], 'base64'));
    if (k % 24 === 0) process.stdout.write(`\r  ${k}/${Math.ceil((n1 - n0) / every)} frames`);
  }
  console.log(`\r  ${k} frames in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  await browser.close(); srv.close();
  const mp4 = base + '.mp4';
  const audio = audioArg || (meta.audio ? path.resolve(path.dirname(scenePath), meta.audio) : null);
  const ff = ['-y', '-v', 'error', '-framerate', String(fps / every), '-i', path.join(dir, '%05d.png')];
  if (audio && fs.existsSync(audio)) ff.push('-ss', String(from), '-i', audio, '-c:a', 'aac', '-b:a', '192k', '-shortest');
  ff.push('-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium', '-movflags', '+faststart', mp4);
  execFileSync('ffmpeg', ff, { stdio: 'inherit' });
  console.log(`✓ ${mp4}`);
});
