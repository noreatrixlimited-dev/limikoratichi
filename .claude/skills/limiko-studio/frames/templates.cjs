// Data-driven templates: one scene definition, many videos from data.
//   node templates.cjs list                                         templates with their props
//   node templates.cjs render <name> [--props p.json] [--set k=v,…] [--vertical] [--out x.mp4]
//   node templates.cjs batch <name> --data rows.json|rows.csv [--outdir dir] [--vertical]     one video per row
//   node templates.cjs still <name> [--props p.json] [--t 1.5] --out x.png                   one frame (thumbnail check)
// Run from the repo root. Props are merged over the template's defaultProps. --vertical renders 1080×1920 (Shorts).
// Lists in CSV: use "a|b|c" for arrays of strings; items for countdown: "title::note|title::note".
const fs = require('fs'), path = require('path'), os = require('os');
const { execFileSync } = require('child_process');

const DIR = path.join(__dirname, 'templates');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args.splice(i, 2)[1] : d; };
const flag = (k) => { const i = args.indexOf(k); if (i >= 0) { args.splice(i, 1); return true; } return false; };
const ROOT = process.cwd();
const tmp = fs.mkdtempSync(path.join(ROOT, '.tpl-'));
process.on('exit', () => fs.rmSync(tmp, { recursive: true, force: true }));

const names = () => fs.readdirSync(DIR).filter((f) => f.endsWith('.js') && f !== 'common.js').map((f) => f.replace(/\.js$/, ''));
const coerce = (v) => (v === 'true' ? true : v === 'false' ? false : v === 'null' ? null : v !== '' && !isNaN(+v) ? +v : v);
function parseSet(s) { const o = {}; if (!s) return o; for (const kv of s.split(',')) { const [k, ...r] = kv.split('='); o[k.trim()] = coerce(r.join('=').trim()); } return o; }
function csv(text) {
  const rows = []; let row = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
    else if (c === '"') q = true; else if (c === ',') { row.push(cur); cur = ''; } else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; }
    else cur += c;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  const [head, ...body] = rows.filter((r) => r.some((x) => x.trim()));
  return body.map((r) => Object.fromEntries(head.map((h, i) => {
    const v = r[i] ?? '';
    if (h === 'items') return [h, v.split('|').map((s) => { const [title, note] = s.split('::'); return note ? { title, note } : { title }; })];
    return [h, v.includes('|') ? v.split('|') : coerce(v)];
  })));
}
function sceneFile(name) { const f = path.join(DIR, name + '.js'); if (!fs.existsSync(f)) { console.error(`unknown template ${name}; try: ${names().join(', ')}`); process.exit(1); } return f; }
function writeProps(props) { const f = path.join(tmp, `p${Math.random().toString(36).slice(2)}.json`); fs.writeFileSync(f, JSON.stringify(props)); return path.relative(ROOT, f); }
function animate(name, props, out, extra = []) {
  execFileSync('node', [path.join(__dirname, 'animate.cjs'), path.relative(ROOT, sceneFile(name)), '--props', writeProps(props), '--out', out, ...extra], { stdio: 'inherit', cwd: ROOT });
}
const vertical = flag('--vertical');
const propsFile = opt('--props');
const fileProps = propsFile ? JSON.parse(fs.readFileSync(propsFile, 'utf8')) : {};
const size = vertical ? { width: 1080, height: 1920 } : {};

const cmd = args.shift();
if (cmd === 'list') {
  for (const n of names()) {
    const src = fs.readFileSync(path.join(DIR, n + '.js'), 'utf8');
    const what = (src.match(/^\/\/ Template: (.*)$/m) || [, ''])[1];
    const dp = (src.match(/defaultProps: (\{[\s\S]*?\}),\n  setup/) || [, ''])[1].replace(/\s+/g, ' ');
    console.log(`${n.padEnd(12)} ${what}\n${' '.repeat(13)}props: ${dp.slice(0, 220)}${dp.length > 220 ? '…' : ''}\n`);
  }
  console.log('themes: kids facts history gaming business mystery · lang: en te · add --vertical for Shorts');
} else if (cmd === 'render') {
  const name = args.shift();
  const props = { ...fileProps };
  Object.assign(props, parseSet(opt('--set')), size);
  animate(name, props, opt('--out', `${name}.mp4`));
} else if (cmd === 'batch') {
  const name = args.shift(), data = opt('--data'), outdir = opt('--outdir', `${name}-batch`);
  if (!data) { console.error('batch needs --data rows.json|rows.csv'); process.exit(1); }
  const text = fs.readFileSync(data, 'utf8');
  const rows = data.endsWith('.csv') ? csv(text) : JSON.parse(text);
  fs.mkdirSync(outdir, { recursive: true });
  rows.forEach((row, i) => {
    const slug = String(row.slug || row.title || row.name || i + 1).toLowerCase().replace(/[^a-z0-9ఀ-౿]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || String(i + 1);
    const out = path.join(outdir, `${String(i + 1).padStart(2, '0')}-${slug}.mp4`);
    console.log(`[${i + 1}/${rows.length}] ${out}`);
    animate(name, { ...row, ...size }, out);
  });
  console.log(`✓ ${rows.length} videos in ${outdir}`);
} else if (cmd === 'still') {
  const name = args.shift(), t = +opt('--t', 1.5), out = opt('--out', `${name}.png`);
  const props = { ...fileProps, ...parseSet(opt('--set')), ...size };
  const fps = 30, mp4 = path.join(tmp, 'still.mp4');
  animate(name, props, mp4, ['--from', String(t), '--to', String(t + 1 / fps), '--workers', '1', '--keep-frames']);
  execFileSync('cp', [path.join(tmp, 'still_frames', '00000.png'), out]);
  console.log(`✓ ${out}`);
} else {
  console.log('usage: node templates.cjs list | render <name> [--props p.json] [--set k=v,…] [--vertical] [--out x.mp4] | batch <name> --data rows.json|csv [--outdir d] | still <name> [--t s] --out x.png');
}
