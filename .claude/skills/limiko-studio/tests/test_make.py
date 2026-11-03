"""make.py: scaffolding, placeholder check, and the approval gate."""
import json, shutil, subprocess, sys, unittest, uuid
from pathlib import Path

SKILL = Path(__file__).resolve().parents[1]
ROOT = SKILL.parents[2]
MAKE = SKILL / "scripts" / "make.py"


def make(*args):
    return subprocess.run([sys.executable, str(MAKE), *args], capture_output=True, text=True)


class Make(unittest.TestCase):
    def setUp(self):
        self.slug = "zz-test-" + uuid.uuid4().hex[:6]
        self.dir = ROOT / "films" / self.slug

    def tearDown(self):
        shutil.rmtree(self.dir, ignore_errors=True)

    def test_new_scaffolds_both_languages(self):
        r = make("new", self.slug, "--format", "history", "--lang", "en,te")
        self.assertEqual(r.returncode, 0, r.stderr)
        for p in ("film.json", "scene.js", "voice.en.md", "voice.te.md", "plan/brief.md", "plan/storyboard.md", "plan/sources.md"):
            self.assertTrue((self.dir / p).exists(), p)
        f = json.loads((self.dir / "film.json").read_text())
        self.assertEqual(f["lufs"], -14)
        self.assertIn("# @strike", (self.dir / "voice.te.md").read_text())

    def test_only_english_and_telugu(self):
        r = make("new", self.slug, "--format", "kids", "--lang", "hi")
        self.assertNotEqual(r.returncode, 0)

    def test_placeholders_block_check(self):
        make("new", self.slug, "--format", "facts")
        r = make("check", self.slug)
        self.assertIn("placeholders", r.stdout)

    def test_final_refuses_without_approval(self):
        make("new", self.slug, "--format", "facts")
        r = make("final", self.slug)
        self.assertNotEqual(r.returncode, 0)
        self.assertIn("not approved", r.stderr + r.stdout)
        self.assertEqual(make("approve", self.slug).returncode, 0)
        self.assertTrue((self.dir / "plan" / "APPROVED").exists())


if __name__ == "__main__":
    unittest.main()
