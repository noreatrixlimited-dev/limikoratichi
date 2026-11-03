"""Renderer smoke tests (need node, Playwright's Chromium and ffmpeg; skipped when missing).
Checks that templates render, that parallel workers give identical frames, and that equations typeset."""
import hashlib, json, os, shutil, subprocess, tempfile, unittest
from pathlib import Path

SKILL = Path(__file__).resolve().parents[1]
ROOT = SKILL.parents[2]
FR = SKILL / "frames"


def have_renderer():
    if not shutil.which("node") or not shutil.which("ffmpeg") or not (FR / "node_modules" / "three").exists():
        return False
    r = subprocess.run(["node", "-e", "require('playwright')"], cwd=FR, capture_output=True)
    return r.returncode == 0


@unittest.skipUnless(have_renderer(), "renderer not installed (cd frames && npm install; Playwright Chromium)")
class Render(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp(dir=ROOT, prefix=".test-"))

    def tearDown(self):
        shutil.rmtree(self.tmp, ignore_errors=True)

    def frames(self, scene, workers, extra=()):
        out = self.tmp / f"w{workers}.mp4"
        subprocess.run(["node", str(FR / "animate.cjs"), os.path.relpath(scene, ROOT), "--to", "0.8", "--workers", str(workers), "--keep-frames", "--out", str(out), *extra],
                       cwd=ROOT, check=True, capture_output=True)
        d = self.tmp / f"w{workers}_frames"
        return [hashlib.md5(p.read_bytes()).hexdigest() for p in sorted(d.glob("*.png"))]

    def test_parallel_workers_match_single(self):
        a, b = self.frames(FR / "templates" / "title-card.js", 1), self.frames(FR / "templates" / "title-card.js", 3)
        self.assertGreater(len(a), 10)
        self.assertEqual(a, b)

    def test_every_template_renders_a_still(self):
        for name in ("title-card", "countdown", "stat", "quote", "lower-third"):
            out = self.tmp / f"{name}.png"
            subprocess.run(["node", str(FR / "templates.cjs"), "still", name, "--t", "1.0", "--out", str(out)], cwd=ROOT, check=True, capture_output=True)
            self.assertGreater(out.stat().st_size, 5000, name)

    def test_telugu_vertical_template(self):
        props = self.tmp / "p.json"
        props.write_text(json.dumps({"lang": "te", "theme": "kids", "title": "వర్షం ఎలా పడుతుంది?", "kicker": "", "subtitle": ""}), encoding="utf-8")
        out = self.tmp / "te.png"
        subprocess.run(["node", str(FR / "templates.cjs"), "still", "title-card", "--vertical", "--props", str(props), "--t", "1.5", "--out", str(out)], cwd=ROOT, check=True, capture_output=True)
        w, h = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=width,height", "-of", "csv=p=0", str(out)], capture_output=True, text=True).stdout.strip().split(",")
        self.assertEqual((int(w), int(h)), (1080, 1920))

    @unittest.skipUnless((FR / "node_modules" / "mathjax-full").exists(), "mathjax-full not installed")
    def test_equations_typeset(self):
        self.assertTrue(self.frames(FR / "examples" / "math-demo.js", 1))


if __name__ == "__main__":
    unittest.main()
