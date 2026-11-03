#!/usr/bin/env python3
"""Packaging block for every finished video (the format to give the user after a video is generated).

    package.py template <slug> [--lang en,te]  write films/<slug>/package.json to fill in (one block per language)
    package.py build <slug> [--lang en]        check every limit, write films/<slug>/out/package.<lang>.md
    package.py check <package.json>            only check (exit 1 if anything is over a limit)

The format (characters; Telugu letters count one per code point, as the platforms count):
    YouTube TITLE        ≤ 100  =  title sentence ≤ 60  +  title tags (hashtags) ≤ 40
    YouTube DESCRIPTION  ≤ 5000 =  description text ≤ 2000  +  description tags ≤ 2500
                         (YouTube ignores ALL hashtags when there are more than 15: the first 15 tags, counting the
                          title's, are written as #hashtags; the rest as a plain "Keywords:" line, which still helps search)
    YouTube TAGS field   ≤ 500  =  all tags (counted the YouTube way: commas count, a tag with spaces +2 for quotes)
    INSTAGRAM caption    ≤ 2200 =  title + description + tags together (≤ 30 hashtags; first ~125 chars show before "more")
"""
import argparse, json, re, sys, unicodedata
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]   # repo root (scripts → limiko-studio → skills → .claude → repo)
FILMS = ROOT / "films"

L = {"title": 100, "title_sentence": 60, "title_tags": 40, "desc": 5000, "desc_text": 2000, "desc_tags": 2500,
     "tags_field": 500, "ig": 2200, "ig_hashtags": 30, "yt_hashtags": 15}

TEMPLATE = {
    "youtube": {
        "title_sentence": "<≤60: the curiosity sentence, main search phrase first>",
        "title_tags": ["#<main>", "#<second>"],
        "description_text": "<≤2000: line 1 = the hook (shows before …more); then what they'll learn; sources; credits>",
        "description_tags": ["<most important tag first>", "<…up to 2500 characters>"],
        "tags": ["<all tags for the YouTube Studio tags field, most important first; ≤500 total>"],
    },
    "instagram": {
        "title": "<first line, ≤125 shows before more>",
        "description": "<caption body>",
        "tags": ["#<tag>", "#<…up to 30>"],
    },
}


def n(s):
    return len(unicodedata.normalize("NFC", s or ""))


def hashtag(t):
    t = t.strip()
    return t if t.startswith("#") else "#" + re.sub(r"[\s\-]+", "", t)


def yt_tags_len(tags):
    return sum(n(t) + (2 if " " in t else 0) for t in tags) + max(0, len(tags) - 1)


def compose(p):
    y, ig = p["youtube"], p.get("instagram", {})
    t_sent = y["title_sentence"].strip()
    t_tags = " ".join(hashtag(t) for t in y.get("title_tags", []))
    title = (t_sent + " " + t_tags).strip()
    d_text = y["description_text"].strip()
    dt = [t.strip() for t in y.get("description_tags", []) if t.strip()]
    room = max(0, L["yt_hashtags"] - len(y.get("title_tags", [])))   # title hashtags count toward the 15
    tags_as_hash = " ".join(hashtag(t) for t in dt[:room])
    rest = [t.lstrip("#") for t in dt[room:]]
    d_tags = tags_as_hash + (("\n\nKeywords: " + ", ".join(rest)) if rest else "")
    desc = d_text + ("\n\n" + d_tags if d_tags else "")
    field = []
    for t in [t.strip().lstrip("#") for t in y.get("tags", []) if t.strip()]:
        if yt_tags_len(field + [t]) <= L["tags_field"]:
            field.append(t)
    ig_tags = " ".join(hashtag(t) for t in ig.get("tags", []))
    ig_caption = "\n\n".join(x for x in [ig.get("title", "").strip(), ig.get("description", "").strip(), ig_tags] if x)
    return {"title": title, "title_sentence": t_sent, "title_tags": t_tags, "desc": desc, "desc_text": d_text, "desc_tags": d_tags,
            "tags_field": field, "tags_given": len(y.get("tags", [])), "hashtag_count": len(y.get("title_tags", [])) + min(len(dt), room),
            "ig": ig_caption, "ig_title": ig.get("title", ""), "ig_hashtags": len(ig.get("tags", []))}


def check(c):
    errs, warns = [], []
    def lim(name, key):
        v = n(c[key])
        if v > L[key]: errs.append(f"{name}: {v} > {L[key]}")
    lim("title sentence", "title_sentence"); lim("title tags", "title_tags"); lim("title (total)", "title")
    lim("description text", "desc_text"); lim("description tags", "desc_tags"); lim("description (total)", "desc")
    lim("Instagram caption", "ig")
    if c["ig_hashtags"] > L["ig_hashtags"]: errs.append(f"Instagram hashtags: {c['ig_hashtags']} > 30")
    if len(c["tags_field"]) < c["tags_given"]: warns.append(f"tags field holds {len(c['tags_field'])} of {c['tags_given']} tags (500 limit); the least important were dropped")
    if n(c["ig_title"]) > 125: warns.append("Instagram first line over 125 characters: it gets cut before \"more\"")
    first = c["desc_text"].splitlines()[0] if c["desc_text"] else ""
    if n(first) > 120: warns.append("description line 1 is long: about the first 120 characters show before \"…more\"")
    if re.search(r"<[^>]{3,}>", json.dumps(c, ensure_ascii=False)): errs.append("placeholders <…> are still in the text")
    return errs, warns


def block(c, lang):
    def h(title, used, limit): return f"### {title}  ·  {used} / {limit}"
    out = [f"# Packaging · {lang.upper()}", "",
           "## YouTube", "",
           h("TITLE (sentence + tags)", n(c["title"]), 100),
           f"sentence {n(c['title_sentence'])} / 60 · tags {n(c['title_tags'])} / 40", "```", c["title"], "```", "",
           h("DESCRIPTION (text + tags)", n(c["desc"]), 5000),
           f"text {n(c['desc_text'])} / 2000 · tags {n(c['desc_tags'])} / 2500 · hashtags {c['hashtag_count']} / 15", "```", c["desc"], "```", "",
           h("TAGS field (all tags)", yt_tags_len(c["tags_field"]), 500), "```", ", ".join(c["tags_field"]), "```", "",
           "## Instagram", "",
           h("CAPTION (title + description + tags)", n(c["ig"]), 2200), f"hashtags {c['ig_hashtags']} / 30", "```", c["ig"], "```", ""]
    return "\n".join(out)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sp = ap.add_subparsers(dest="cmd", required=True)
    t = sp.add_parser("template"); t.add_argument("slug"); t.add_argument("--lang", default="en")
    b = sp.add_parser("build"); b.add_argument("slug"); b.add_argument("--lang", default=None)
    c = sp.add_parser("check"); c.add_argument("file")
    a = ap.parse_args()
    if a.cmd == "template":
        f = FILMS / a.slug / "package.json"
        if f.exists(): sys.exit(f"{f} exists")
        langs = [x.strip() for x in a.lang.split(",")]
        f.write_text(json.dumps({l: TEMPLATE for l in langs}, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"✓ {f.relative_to(ROOT)}"); return
    data = json.loads(Path(a.file if a.cmd == "check" else FILMS / a.slug / "package.json").read_text(encoding="utf-8"))
    bad = False
    for lang in ([a.lang] if getattr(a, "lang", None) else list(data)):
        comp = compose(data[lang]); errs, warns = check(comp)
        for e in errs: print(f"✗ [{lang}] {e}")
        for w in warns: print(f"· [{lang}] {w}")
        bad |= bool(errs)
        if a.cmd == "build" and not errs:
            out = FILMS / a.slug / "out"; out.mkdir(parents=True, exist_ok=True)
            (out / f"package.{lang}.md").write_text(block(comp, lang) + "\n", encoding="utf-8")
            print(f"✓ films/{a.slug}/out/package.{lang}.md")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
