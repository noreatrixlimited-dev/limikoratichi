"""package.py: limits, the 15-hashtag rule, the 500-character tags field."""
import json, subprocess, sys, tempfile, unittest
from pathlib import Path

SKILL = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SKILL / "scripts"))
import package as P  # noqa: E402

BASE = {"youtube": {"title_sentence": "Why the sea is salty", "title_tags": ["#ocean", "#facts"], "description_text": "Rivers carry salt.\nMore.",
                    "description_tags": [f"tag{i}" for i in range(30)], "tags": [f"long tag number {i}" for i in range(60)]},
        "instagram": {"title": "Why is the sea salty?", "description": "Body.", "tags": ["#ocean", "#facts"]}}


class Package(unittest.TestCase):
    def test_title_is_sentence_plus_tags(self):
        c = P.compose(BASE)
        self.assertEqual(c["title"], "Why the sea is salty #ocean #facts")
        self.assertEqual(P.check(c)[0], [])

    def test_only_15_hashtags_rest_as_keywords(self):
        c = P.compose(BASE)
        self.assertEqual(c["hashtag_count"], 15)
        self.assertIn("Keywords: tag13", c["desc"])

    def test_tags_field_fits_500(self):
        c = P.compose(BASE)
        self.assertLessEqual(P.yt_tags_len(c["tags_field"]), 500)
        self.assertLess(len(c["tags_field"]), 60)

    def test_over_limit_blocks(self):
        bad = json.loads(json.dumps(BASE)); bad["youtube"]["title_sentence"] = "x" * 61
        self.assertTrue(any("title sentence" in e for e in P.check(P.compose(bad))[0]))
        bad = json.loads(json.dumps(BASE)); bad["instagram"]["description"] = "y" * 2300
        self.assertTrue(any("Instagram" in e for e in P.check(P.compose(bad))[0]))

    def test_placeholders_block(self):
        self.assertTrue(P.check(P.compose(P.TEMPLATE))[0])

    def test_example_film_package_passes(self):
        f = SKILL.parents[2] / "films" / "ant-nest-rain" / "package.json"
        r = subprocess.run([sys.executable, str(SKILL / "scripts" / "package.py"), "check", str(f)], capture_output=True, text=True)
        self.assertEqual(r.returncode, 0, r.stdout)


if __name__ == "__main__":
    unittest.main()
