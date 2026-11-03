// Render style test frames.
//   node render.cjs <category|all> [styleId…]
// Categories are files in styles/: kids, games, facts, history.
// Writes out/<category>/<id>.png and out/<category>-sheet.jpg (via sheet.py).
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');  // skill root, so frames can load ../characters/*.json
const OUT = path.join(__dirname, 'out');
const STY = path.join(__dirname, 'styles');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json' };

function serve() {
  return new Promise((res) => {
    const srv = http.createServer((req, rsp) => {
      const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
      if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { rsp.writeHead(404); return rsp.end(); }
      rsp.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' });
      fs.createReadStream(p).pipe(rsp);
    });
    srv.listen(0, '127.0.0.1', () => res(srv));
  });
}

async function waitDone(page) {
  await page.waitForFunction(() => window.DONE || window.ERR, null, { timeout: 120000 });
  const err = await page.evaluate(() => window.ERR);
  if (err) throw new Error(err);
}

(async () => {
  const [catArg = 'all', ...only] = process.argv.slice(2);
  const cats = catArg === 'all'
    ? fs.readdirSync(STY).filter((f) => f.endsWith('.js')).map((f) => f.slice(0, -3))
    : [catArg];
  const srv = await serve();
  const base = `http://127.0.0.1:${srv.address().port}/frames/page.html`;
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('console', (m) => { if (m.type() === 'error') console.log('  console:', m.text()); });
  let failed = 0;
  for (const cat of cats) {
    await page.goto(`${base}?c=${cat}&list=1`);
    await waitDone(page);
    const list = await page.evaluate(() => window.LIST);
    const outDir = path.join(OUT, cat);
    fs.mkdirSync(outDir, { recursive: true });
    for (const st of list) {
      if (only.length && !only.includes(st.id)) continue;
      const t0 = Date.now();
      try {
        await page.goto(`${base}?c=${cat}&s=${st.id}`);
        await waitDone(page);
        await page.locator('#c').screenshot({ path: path.join(outDir, `${st.id}.png`) });
        console.log(`✓ ${cat}/${st.id} (${st.dim}) ${Date.now() - t0} ms`);
      } catch (e) {
        failed++;
        console.log(`✗ ${cat}/${st.id}: ${String(e.message).split('\n').slice(0, 3).join(' | ')}`);
      }
    }
    fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify(list, null, 2));
    execFileSync('python3', [path.join(__dirname, 'sheet.py'), outDir], { stdio: 'inherit' });
  }
  await browser.close();
  srv.close();
  process.exit(failed ? 1 : 0);
})();
