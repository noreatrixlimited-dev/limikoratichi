// Live preview player for a scene: scrub, play with audio, step frames, jump to voice cues, edit props, hot reload.
//   node preview.cjs <scene.js> [--props p.json] [--port 5173]          then open the printed URL in a browser
//   node preview.cjs <scene.js> --snap 0,1.5,3 --out strip.jpg          headless: screenshots of the player at those times
// Run from the repo root (scene paths are relative to it). Frames drawn here are the same frames animate.cjs renders.
const fs = require('fs'), path = require('path'), http = require('http');

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args.splice(i, 2)[1] : d; };
const port = +opt('--port', 5173), propsArg = opt('--props', null), snapArg = opt('--snap', null), out = opt('--out', 'preview.jpg');
const sceneArg = args[0];
if (!sceneArg) { console.log('usage: node preview.cjs <scene.js> [--props p.json] [--port 5173] [--snap t1,t2 --out strip.jpg]'); process.exit(1); }
const ROOT = process.cwd();
const rel = (p) => '/' + path.relative(ROOT, p).split(path.sep).join('/');
const scenePath = path.resolve(ROOT, sceneArg);
if (!scenePath.startsWith(ROOT) || !fs.existsSync(scenePath)) { console.error('scene not found inside the current directory'); process.exit(1); }
const framesRel = path.relative(ROOT, __dirname).split(path.sep).join('/');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.wav': 'audio/wav', '.m4a': 'audio/mp4', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2', '.glsl': 'text/plain' };

function newest(dirs) { // newest mtime of the files a scene depends on (its folder + the toolkit), for hot reload
  let m = 0;
  for (const d of dirs) for (const f of fs.readdirSync(d)) { const p = path.join(d, f); const s = fs.statSync(p); if (s.isFile()) m = Math.max(m, s.mtimeMs); }
  return String(m);
}
const srv = http.createServer((q, r) => {
  const u = new URL(q.url, 'http://x');
  if (u.pathname === '/__stamp') { r.writeHead(200, { 'Cache-Control': 'no-store' }); return r.end(newest([path.dirname(scenePath), __dirname])); }
  const p = path.join(ROOT, decodeURIComponent(u.pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(p).pipe(r);
});
let qs = `scene=${encodeURIComponent(rel(scenePath))}`;
if (propsArg) qs += `&props=${encodeURIComponent(rel(path.resolve(ROOT, propsArg)))}`;

srv.listen(snapArg ? 0 : port, '127.0.0.1', async () => {
  const url = `http://127.0.0.1:${srv.address().port}/${framesRel}/preview.html?${qs}`;
  if (!snapArg) { console.log(`preview: ${url}\n(edit the scene and save: the player reloads; Ctrl+C to stop)`); return; }
  const { chromium } = require('playwright');
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', (e) => console.error('page error:', e.message));
  await page.goto(url); await page.waitForFunction(() => window.READY, null, { timeout: 120000 });
  const err = await page.evaluate(() => document.getElementById('err').textContent); if (err) { console.error(err); process.exit(1); }
  const shots = [];
  for (const t of snapArg.split(',').map(Number)) { await page.evaluate((x) => window.seek(x), t); shots.push(await page.screenshot({ type: 'png' })); }
  await browser.close(); srv.close();
  const dir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'pv-'));
  shots.forEach((b, i) => fs.writeFileSync(path.join(dir, `${i}.png`), b));
  const { execFileSync } = require('child_process');
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', path.join(dir, '%d.png'), '-vf', `scale=640:-1,tile=1x${shots.length}`, '-frames:v', '1', out]);
  fs.rmSync(dir, { recursive: true, force: true });
  console.log(`✓ ${out}`);
});
