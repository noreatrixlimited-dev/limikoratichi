"""Synthesised sound beds (horror, devotional): mix a short fake voice and check length and loudness."""
import json, subprocess, sys, tempfile, unittest
from pathlib import Path

SKILL = Path(__file__).resolve().parents[1]
try:
    import numpy as np, soundfile as sf
except ImportError:
    np = None


@unittest.skipIf(np is None, "needs numpy + soundfile")
class SoundMix(unittest.TestCase):
    def voice_dir(self, d):
        sr = 24000; t = np.arange(int(4 * sr)) / sr
        v = (0.3 * np.sin(2 * np.pi * 140 * t) * (np.sin(2 * np.pi * 3 * t) > 0)).astype(np.float32)
        sf.write(Path(d) / "voice.wav", v, sr)
        tl = {"cues": {"s00": 0.1, "s01": 2.0, "hit0": 1.0, "bell1": 3.0}, "duration": 4.0,
              "lines": [{"text": "గంట మోగుతున్న ధ్వని.", "start": 0.0, "end": 2.0}]}
        (Path(d) / "timeline.json").write_text(json.dumps(tl, ensure_ascii=False), encoding="utf-8")

    def run_mix(self, script, extra):
        with tempfile.TemporaryDirectory() as d:
            self.voice_dir(d); out = Path(d) / "mix.m4a"
            r = subprocess.run([sys.executable, str(SKILL / "scripts" / script), d, "--out", str(out), *extra], capture_output=True, text=True)
            self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
            self.assertTrue(out.exists() and out.with_suffix(".mp3").exists())
            return r.stdout

    def test_devotional(self):
        s = self.run_mix("devotionalmix.py", ["--lufs", "-16"])
        self.assertIn("2 hand-bells", s)          # one cue + one line that mentions గంట
        self.assertIn("voice starts at 7.0 s", s)

    def test_horror(self):
        s = self.run_mix("horrormix.py", ["--lufs", "-16"])
        self.assertIn("1 hits", s)


if __name__ == "__main__":
    unittest.main()
