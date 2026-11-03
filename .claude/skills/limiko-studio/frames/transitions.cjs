// Video transitions from the GL Transitions collection (frames/transitions/gl, MIT/BSD, see LICENSE-gl-transitions.txt).
//   node transitions.cjs list [tag]                       names, tags and descriptions (writes transitions/catalog.json)
//   node transitions.cjs sheet [--out sheet.jpg]           preview of every transition at mid-point (to choose one)
//   node transitions.cjs join A.mp4 B.mp4 --name Cube [--dur 0.6] [--ease inOut|linear|in|out] [--set k=v,…] --out AB.mp4
//        A's last `dur` seconds blend into B's first `dur` seconds; audio crossfades over the same time.
//   node transitions.cjs chain --list clips.txt --names Cube,CrossZoom,… [--dur 0.6] --out all.mp4
//        joins many clips with a (different) transition between each pair.
const fs = require('fs'), path = require('path'), http = require('http'), os = require('os');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');

const ROOT = __dirname, GL = path.join(ROOT, 'transitions', 'gl');
const SKIP = new Set(['DisplacementMap', 'LumaWipe']); // need extra texture images
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args.splice(i, 2)[1] : d; };

function catalog() {
  const out = [];
  for (const f of fs.readdirSync(GL).filter((x) => x.endsWith('.glsl')).sort()) {
    const name = f.slice(0, -5); if (SKIP.has(name)) continue;
    const src = fs.readFileSync(path.join(GL, f), 'utf8');
    const meta = (k) => ((src.match(new RegExp(`^//\\s*${k}\\s*:\\s*(.+)$`, 'mi')) || [])[1] || '').trim();
    out.push({ name, author: meta('Author'), license: meta('License'), description: meta('Description'), tags: meta('Tags') });
  }
  fs.writeFileSync(path.join(ROOT, 'transitions', 'catalog.json'), JSON.stringify(out, null, 1));
  return out;
}

const EASE = { linear: (x) => x, in: (x) => x * x * x, out: (x) => 1 - (1 - x) ** 3, inOut: (x) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2) };
const ff = (a) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...a], { stdio: 'inherit' });
const probe = (f, e) => execFileSync('ffprobe', ['-v', 'error', ...e, '-of', 'csv=p=0', f]).toString().trim();
const dur = (f) => parseFloat(probe(f, ['-show_entries', 'format=duration']));
const size = (f) => probe(f, ['-select_streams', 'v', '-show_entries', 'stream=width,height']).split(',').map(Number);
const hasAudio = (f) => probe(f, ['-select_streams', 'a', '-show_entries', 'stream=index']) !== '';

async function withPage(fn) {
  const srv = http.createServer((q, r) => {
    const p = decodeURIComponent(q.url.split('?')[0]);
    const file = p.startsWith('/tmpf/') ? path.join(os.tmpdir(), p.slice(6)) : path.join(ROOT, p);
    if (!fs.existsSync(file)) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'Content-Type': file.endsWith('.html') ? 'text/html' : file.endsWith('.png') ? 'image/png' : 'image/jpeg' });
    fs.createReadStream(file).pipe(r);
  });
  await new Promise((res) => srv.listen(0, '127.0.0.1', res));
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await b.newPage();
  await page.goto(`http://127.0.0.1:${srv.address().port}/transition.html`);
  await page.waitForFunction(() => window.READY);
  try { return await fn(page, `http://127.0.0.1:${srv.address().port}`); } finally { await b.close(); srv.close(); }
}

function parseSet(s) {
  const o = {}; if (!s) return o;
  for (const kv of s.split(';')) { const [k, v] = kv.split('='); if (k) o[k.trim()] = v.split(',').map(Number); }
  return o;
}

async function renderTransition(page, base, framesA, framesB, glsl, w, h, ease, set, outDir) {
  const params = await page.evaluate(([w, h, g, s]) => window.setup(w, h, g, s), [w, h, glsl, set]);
  const n = framesA.length;
  for (let i = 0; i < n; i++) {
    const p = EASE[ease]((i + 0.5) / n);
    const url = await page.evaluate(([a, b, p]) => window.frame(a, b, p), [`${base}/tmpf/${framesA[i]}`, `${base}/tmpf/${framesB[i]}`, p]);
    fs.writeFileSync(path.join(outDir, `t${String(i).padStart(4, '0')}.png`), Buffer.from(url.split(',')[1], 'base64'));
  }
  return params;
}

async function join(A, B, name, d, ease, set, out, page, base) {
  const glsl = fs.readFileSync(path.join(GL, `${name}.glsl`), 'utf8');
  const [w, h] = size(A); const fps = 60;
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'trans-')); const rel = path.basename(work);
  const dA = dur(A), n = Math.round(d * fps);
  ff(['-sseof', `-${d}`, '-i', A, '-vf', `fps=${fps},scale=${w}:${h}`, '-frames:v', String(n), path.join(work, 'a%04d.png')]);
  ff(['-i', B, '-vf', `fps=${fps},scale=${w}:${h}`, '-frames:v', String(n), path.join(work, 'b%04d.png')]);
  const fa = fs.readdirSync(work).filter((x) => x.startsWith('a')).sort().map((x) => `${rel}/${x}`);
  const fb = fs.readdirSync(work).filter((x) => x.startsWith('b')).sort().map((x) => `${rel}/${x}`);
  const m = Math.min(fa.length, fb.length);
  const params = await renderTransition(page, base, fa.slice(0, m), fb.slice(0, m), glsl, w, h, ease, set, work);
  const tv = path.join(work, 'trans.mp4');
  ff(['-framerate', String(fps), '-i', path.join(work, 't%04d.png'), '-c:v', 'libx264', '-crf', '17', '-pix_fmt', 'yuv420p', tv]);
  const td = m / fps; const audio = hasAudio(A) && hasAudio(B);
  const fc = [`[0:v]fps=${fps},scale=${w}:${h},setsar=1,trim=0:${(dA - td).toFixed(3)},setpts=PTS-STARTPTS[v0]`,
    `[2:v]setsar=1[vt]`, `[1:v]fps=${fps},scale=${w}:${h},setsar=1,trim=${td.toFixed(3)},setpts=PTS-STARTPTS[v1]`,
    `[v0][vt][v1]concat=n=3:v=1:a=0[v]`];
  if (audio) fc.push(`[0:a][1:a]acrossfade=d=${td.toFixed(3)}:c1=tri:c2=tri[a]`);
  ff(['-i', A, '-i', B, '-i', tv, '-filter_complex', fc.join(';'), '-map', '[v]', ...(audio ? ['-map', '[a]', '-c:a', 'aac', '-b:a', '192k'] : []),
    '-c:v', 'libx264', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out]);
  fs.rmSync(work, { recursive: true, force: true });
  console.log(`✓ ${out}  (${name}, ${td.toFixed(2)} s, ${ease}${params.length ? ', ' + params.join(' ') : ''})`);
}

(async () => {
  const cmd = args.shift();
  if (cmd === 'list') {
    const tag = args[0]; const c = catalog().filter((t) => !tag || (t.tags + ' ' + t.name + ' ' + t.description).toLowerCase().includes(tag.toLowerCase()));
    c.forEach((t) => console.log(`${t.name.padEnd(28)} ${t.tags.padEnd(30)} ${t.description}`)); console.log(`${c.length} transitions`);
  } else if (cmd === 'sheet') {
    const out = opt('--out', path.join(ROOT, 'previews', 'transitions.jpg'));
    const c = catalog(); const w = 320, h = 180;
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tsheet-')); const rel = path.basename(tmp);
    // two style previews as A and B
    const pv = path.join(ROOT, 'out');
    const pick = ['kids/crayon-storybook.png', 'history/epic-silhouette.png'].map((f) => path.join(pv, f));
    if (!pick.every((f) => fs.existsSync(f))) { console.error('render style frames first: node render.cjs kids && node render.cjs history'); process.exit(1); }
    pick.forEach((f, i) => ff(['-i', f, '-vf', `scale=${w}:${h}`, path.join(tmp, `${'ab'[i]}.png`)]));
    await withPage(async (page, base) => {
      for (const t of c) {
        const glsl = fs.readFileSync(path.join(GL, `${t.name}.glsl`), 'utf8');
        try {
          await page.evaluate(([w, h, g]) => window.setup(w, h, g, {}), [w, h, glsl]);
          const url = await page.evaluate(([a, b]) => window.frame(a, b, 0.5), [`${base}/tmpf/${rel}/a.png`, `${base}/tmpf/${rel}/b.png`]);
          fs.writeFileSync(path.join(tmp, `x_${t.name}.png`), Buffer.from(url.split(',')[1], 'base64'));
        } catch (e) { console.log(`  ! ${t.name}: ${String(e.message).split('\n')[0]}`); }
      }
    });
    execFileSync('python3', [path.join(ROOT, 'tsheet.py'), tmp, out], { stdio: 'inherit' });
    fs.rmSync(tmp, { recursive: true, force: true });
  } else if (cmd === 'join') {
    const name = opt('--name', 'Fade'), d = parseFloat(opt('--dur', '0.6')), ease = opt('--ease', 'inOut'), set = parseSet(opt('--set', '')), out = opt('--out', 'joined.mp4');
    const [A, B] = args;
    await withPage((page, base) => join(A, B, name, d, ease, set, out, page, base));
  } else if (cmd === 'chain') {
    const list = fs.readFileSync(opt('--list'), 'utf8').split('\n').map((s) => s.trim()).filter(Boolean);
    const names = opt('--names', 'Fade').split(','), d = parseFloat(opt('--dur', '0.6')), ease = opt('--ease', 'inOut'), out = opt('--out', 'chain.mp4');
    await withPage(async (page, base) => {
      let cur = list[0];
      for (let i = 1; i < list.length; i++) {
        const next = i === list.length - 1 ? out : path.join(os.tmpdir(), `chain_${process.pid}_${i}.mp4`);
        await join(cur, list[i], names[(i - 1) % names.length], d, ease, {}, next, page, base);
        cur = next;
      }
    });
  } else {
    console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(0, 8).join('\n'));
  }
})();
