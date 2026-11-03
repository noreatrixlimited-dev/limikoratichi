// Character reference sheets: node character-sheet.cjs <spec.json…> [--out DIR]
// Writes <id>-v<version>-sheet.png next to each spec (or into --out).
const fs = require('fs'), path = require('path'), http = require('http');
const { chromium } = require('playwright');
const ROOT = __dirname;
const args = process.argv.slice(2);
const oi = args.indexOf('--out'); const outDir = oi >= 0 ? args.splice(oi, 2)[1] : null;
if (!args.length) { console.log('usage: node character-sheet.cjs <spec.json…> [--out DIR]'); process.exit(1); }
const srv = http.createServer((q, r) => { const p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!p.startsWith(ROOT) || !fs.existsSync(p)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); fs.createReadStream(p).pipe(r); });
srv.listen(0, '127.0.0.1', async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1920, height: 1000 } });
  pg.on('pageerror', (e) => { console.log('page error:', e.message); process.exit(1); });
  let bad = 0;
  for (const f of args) {
    const spec = JSON.parse(fs.readFileSync(f, 'utf8'));
    await pg.goto(`http://127.0.0.1:${srv.address().port}/sheet.html`);
    await pg.waitForFunction(() => window.READY);
    await pg.evaluate((s) => window.render(s), spec);
    await pg.waitForFunction(() => window.DONE || window.ERR);
    const err = await pg.evaluate(() => window.ERR);
    if (err) { bad++; console.log(`✗ ${f}: ${err.split('\n')[0]}`); continue; }
    const out = path.join(outDir || path.dirname(f), `${spec.id}-v${spec.version || 1}-sheet.png`);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    await pg.locator('#c').screenshot({ path: out });
    console.log(`✓ ${out}`);
  }
  await b.close(); srv.close(); process.exit(bad ? 1 : 0);
});
