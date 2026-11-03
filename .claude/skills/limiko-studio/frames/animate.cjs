// Render an animated scene to video.
//   node animate.cjs <scene.js> [--out film.mp4] [--from s] [--to s] [--every n] [--audio file]
//                    [--workers N]      render with N browser pages in parallel (default: CPU cores, max 4)
//                    [--keep-frames]    keep the PNG frames folder (removed after encoding by default)
//                    [--props p.json]   data for template scenes (env.props in setup, state.props in draw)
// <scene.js> (path from the repo root / current dir) exports default
//   { dim: '2d'|'3d', fps, duration, width, height, audio?, setup?(env), draw(ctx, W, H, L, T, t, state) }
// 3D scenes: draw({ THREE, canvas, W, H, L, T, t, state }). Frames are pure functions of t.
const fs = require('fs'), path = require('path'), http = require('http');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args.splice(i, 2)[1] : d; };
const out = opt('--out', null), from = +opt('--from', 0), toArg = opt('--to', null), every = +opt('--every', 1), audioArg = opt('--audio', null);
const workers = Math.max(1, +opt('--workers', Math.min(4, require('os').cpus().length)));
const propsArg = opt('--props', null);
const keepFrames = (() => { const i = args.indexOf('--keep-frames'); if (i >= 0) { args.splice(i, 1); return true; } return false; })();
const sceneArg = args[0];
if (!sceneArg) { console.log('usage: node animate.cjs <scene.js> [--out film.mp4] [--from s] [--to s] [--every n] [--audio file] [--workers N] [--props p.json]'); process.exit(1); }
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
  const sceneUrl = '/' + path.relative(ROOT, scenePath).split(path.sep).join('/');
  let propsUrl = '';
  if (propsArg) { const pp = path.resolve(ROOT, propsArg); if (!pp.startsWith(ROOT) || !fs.existsSync(pp)) { console.error(`props not found: ${propsArg}`); process.exit(1); } propsUrl = '&props=' + encodeURIComponent('/' + path.relative(ROOT, pp).split(path.sep).join('/')); }
  const open = async () => {
    const page = await browser.newPage();
    page.on('pageerror', (e) => { console.error('page error:', e.message); process.exit(1); });
    await page.goto(`http://127.0.0.1:${srv.address().port}/${framesRel}/anim.html?scene=${encodeURIComponent(sceneUrl)}${propsUrl}`);
    await page.waitForFunction(() => window.READY || window.ERR, null, { timeout: 120000 });
    const err = await page.evaluate(() => window.ERR); if (err) { console.error(err); process.exit(1); }
    return page;
  };
  const first = await open();
  const meta = await first.evaluate(() => window.META);
  const fps = meta.fps, to = toArg != null ? +toArg : meta.duration;
  const base = out ? out.replace(/\.mp4$/, '') : scenePath.replace(/\.js$/, '');
  const dir = base + '_frames'; fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const n0 = Math.round(from * fps), n1 = Math.round(to * fps);
  const list = []; for (let f = n0; f < n1; f += every) list.push(f);
  const nw = Math.max(1, Math.min(workers, Math.ceil(list.length / 12)));
  const pages = [first]; for (let i = 1; i < nw; i++) pages.push(await open());
  // each page renders a contiguous chunk (scenes may cache per-frame work), so output = single-page output
  const t0 = Date.now(); let done = 0;
  const per = Math.ceil(list.length / nw);
  await Promise.all(pages.map(async (page, w) => {
    for (let i = w * per; i < Math.min(list.length, (w + 1) * per); i++) {
      const url = await page.evaluate((t) => window.frame(t), list[i] / fps);
      fs.writeFileSync(path.join(dir, String(i).padStart(5, '0') + '.png'), Buffer.from(url.split(',')[1], 'base64'));
      if (++done % 24 === 0) process.stdout.write(`\r  ${done}/${list.length} frames (${nw} workers)`);
    }
  }));
  console.log(`\r  ${list.length} frames in ${((Date.now() - t0) / 1000).toFixed(1)} s with ${nw} worker${nw > 1 ? 's' : ''}`);
  await browser.close(); srv.close();
  const mp4 = base + '.mp4';
  // scene audio paths are URLs like fetch(): relative to frames/anim.html (or '/…' from the repo root)
  const audio = audioArg ? path.resolve(ROOT, audioArg)
    : meta.audio ? (meta.audio.startsWith('/') ? path.join(ROOT, meta.audio) : path.resolve(__dirname, meta.audio)) : null;
  if (audio && !fs.existsSync(audio)) { console.error(`audio not found: ${audio}`); process.exit(1); }
  if (audio) console.log(`  audio: ${path.relative(ROOT, audio)}`);
  const ff = ['-y', '-v', 'error', '-framerate', String(fps / every), '-i', path.join(dir, '%05d.png')];
  if (audio) ff.push('-ss', String(from), '-i', audio, '-c:a', 'aac', '-b:a', '192k');
  ff.push('-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium', '-movflags', '+faststart', mp4);
  execFileSync('ffmpeg', ff, { stdio: 'inherit' });
  if (!keepFrames) fs.rmSync(dir, { recursive: true, force: true });
  console.log(`✓ ${mp4}`);
});
