"""Voice scripts parse (no engine needed): every example, both languages."""
import subprocess, sys, unittest
from pathlib import Path

SKILL = Path(__file__).resolve().parents[1]


class VoiceScripts(unittest.TestCase):
    def test_examples_parse(self):
        for f in sorted((SKILL / "voice-examples").glob("*.md")):
            r = subprocess.run([sys.executable, str(SKILL / "scripts" / "voice.py"), "check", str(f)], capture_output=True, text=True)
            self.assertEqual(r.returncode, 0, f"{f.name}: {r.stdout[-400:]}{r.stderr[-400:]}")
            self.assertNotIn("missing numpy", r.stdout + r.stderr, "install numpy + soundfile")

    def test_cues_and_say_markup_are_not_spoken(self):
        r = subprocess.run([sys.executable, str(SKILL / "scripts" / "voice.py"), "check", str(SKILL / "voice-examples" / "volcano.en.md")], capture_output=True, text=True)
        self.assertNotIn("{cue", r.stdout)
        self.assertNotIn("on screen:", r.stdout)   # comment lines never reach the voice

    def test_chatterbox_options_parse(self):
        import tempfile
        with tempfile.TemporaryDirectory() as d:
            f = Path(d) / "cb.en.md"
            f.write_text("---\nlang: en\nengine: chatterbox\nemotion: 0.6\n---\n[narrator emotion=0.9 cfg=0.4] Why is the sea salty?\n", encoding="utf-8")
            r = subprocess.run([sys.executable, str(SKILL / "scripts" / "voice.py"), "check", str(f)], capture_output=True, text=True)
            self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
            self.assertIn("Why is the sea salty", r.stdout)


if __name__ == "__main__":
    unittest.main()
