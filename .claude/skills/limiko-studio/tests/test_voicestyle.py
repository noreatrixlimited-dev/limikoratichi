"""voicestyle.py: profile file loads, and an audio file analyses (skipped without librosa/ASR models)."""
import json, subprocess, sys, unittest
from pathlib import Path

SKILL = Path(__file__).resolve().parents[1]
VS = SKILL / "scripts" / "voicestyle.py"
VENV = Path.home() / ".cache" / "limiko-voice" / "venv-te" / "bin" / "python"


class VoiceStyle(unittest.TestCase):
    def test_profile_has_targets(self):
        d = json.loads((SKILL / "shared" / "voice-profiles" / "facts-short-firm.json").read_text())
        for k in ("pace_wpm_overall", "pause_median_s", "pitch_median_hz", "brightness_hz"):
            self.assertIn(k, d["targets"])
        self.assertEqual(d["recipe"]["engine"], "chatterbox")

    @unittest.skipUnless(VENV.exists(), "voice analysis venv not installed")
    def test_compare_against_profile(self):
        wav = SKILL / "voice-examples" / "out" / "rain-en" / "voice.wav"
        if not wav.exists():
            self.skipTest("no rendered example voice")
        r = subprocess.run([sys.executable, str(VS), "compare", str(SKILL / "shared" / "voice-profiles" / "facts-short-firm.json"), str(wav)],
                           capture_output=True, text=True, timeout=600)
        self.assertEqual(r.returncode, 0, r.stderr[-500:])
        self.assertIn("pitch_median_hz", r.stdout)


if __name__ == "__main__":
    unittest.main()
