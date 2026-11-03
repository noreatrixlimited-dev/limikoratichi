"""Hook scoring: openers that must pass, openers that must fail, both languages."""
import json, subprocess, sys, unittest
from pathlib import Path

SKILL = Path(__file__).resolve().parents[1]
HOOK = SKILL / "scripts" / "hookcheck.py"


def score(text, lang="en", fmt=None):
    cmd = [sys.executable, str(HOOK), "--text", text, "--lang", lang] + (["--format", fmt] if fmt else [])
    out = subprocess.run(cmd, capture_output=True, text=True, check=True).stdout
    total = int(out.split("→")[1].split("/")[0])
    strike = int(out.split("strike ")[1].split()[0])
    return total, strike, out


class HookCheck(unittest.TestCase):
    def test_greeting_and_subscribe_fail_the_strike(self):
        for bad in ["Hey guys, welcome back to the channel", "Don't forget to like and subscribe",
                    "Smash that like button before we start", "In this video I will explain volcanoes"]:
            self.assertLessEqual(score(bad)[1], 20, bad)

    def test_ordinary_like_is_not_a_subscribe_request(self):
        self.assertEqual(score("Every river on Earth is secretly salty. So why does only the sea taste like it?")[1], 100)
        self.assertEqual(score("I like volcanoes. Why do they erupt?")[1], 100)

    def test_strong_example_scores_strong(self):
        total, _, out = score("This blast was heard five thousand kilometres away. Why did solid rock explode? "
                              "By the end, you'll know how one blast changed your planet's weather.")
        self.assertGreaterEqual(total, 72, out)

    def test_telugu_greeting_first_is_flagged(self):
        self.assertLessEqual(score("నమస్కారం మిత్రులారా, ఈ వీడియోలో వర్షం గురించి చెప్తాను", lang="te")[1], 20)

    def test_telugu_question_hook_passes_strike(self):
        self.assertEqual(score("సముద్రం నీరు ఎందుకు ఉప్పగా ఉంటుంది?", lang="te")[1], 100)

    def test_kids_greeting_is_a_softer_penalty(self):
        kids = score("Hello friends! Why does it rain?", fmt="kids")[1]
        facts = score("Hello friends! Why does it rain?", fmt="facts")[1]
        self.assertGreater(kids, facts)

    def test_script_file_with_beat_marks(self):
        out = subprocess.run([sys.executable, str(HOOK), str(SKILL / "voice-examples" / "volcano.en.md")], capture_output=True, text=True, check=True).stdout
        self.assertIn("STRONG", out)


if __name__ == "__main__":
    unittest.main()
