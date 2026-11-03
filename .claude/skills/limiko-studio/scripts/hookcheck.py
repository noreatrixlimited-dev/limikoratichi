#!/usr/bin/env python3
"""Score the first 10 seconds of a script for curiosity (English and Telugu). See shared/hooks.md.

    hookcheck.py <voice script .md> [--timeline audio/timeline.json] [--format kids|facts|history|gaming|…]
    hookcheck.py --options options.txt [--lang te] [--format kids]     # rank several openings (blank line between)
    hookcheck.py --text "Why do cats always land on their feet?" [--lang en]

Six checks, each 0–100: strike (no greeting/intro, short first line), curiosity (an open question or gap),
specificity (numbers, names, concrete detail), viewer (talks to the viewer), stakes (why it matters / promise /
open loop), pace (word budget for 10 s). Total = weakest-link blend (0.6 × lowest + 0.4 × average):
one dead check sinks the hook. Bands: STRONG ≥ 72 · WORKABLE ≥ 55 · WEAK below. A score is a reason to look again,
not a guarantee. Written for this studio (ideas learned from open-source hook tools, see REFERENCES.txt).
"""
import argparse, json, re, sys
from pathlib import Path

WPM = {"en": 150, "te": 115}
BANNED = {
    "en": [r"^\s*(hi|hey|hello)\b.*\b(guys|everyone|friends|folks|all)\b", r"\bwelcome (back )?to\b", r"\bin (this|today'?s) video\b",
           r"\bbefore (we|i) (start|begin|get started)\b", r"\bsubscribe\b|\bhit the bell\b|\bsmash (that|the) like\b|\b(like|share) (this|the|my|our) (video|channel)\b|\bdon'?t forget to like\b",
           r"^\s*so,? today\b", r"\bmy name is\b"],
    "te": [r"^\s*నమస్కారం\s*(మిత్రులారా|అందరికీ|ఫ్రెండ్స్)", r"ఈ\s*వీడియోలో", r"మా\s*ఛానల్", r"సబ్‌?స్క్రైబ్", r"లైక్\s*చేయండి",
           r"వీడియో\s*మొదలు", r"స్వాగతం"],
}
CURIOUS = {
    "en": r"\?|\b(why|how|what if|what happens|secret|nobody|no one|never|until|but|actually|really|hidden|strange|impossible|mystery|truth|wrong|nobody knows|turns out|guess)\b",
    "te": r"\?|ఎందుకు|ఎలా|ఏమిటి|ఏంటి|ఏమవుతుంది|రహస్యం|ఎవరికీ\s*తెలియదు|ఎవరూ|ఎప్పుడూ|కానీ|నిజంగా|నిజం|వింత|అసాధ్యం|ఊహించ|ఆశ్చర్య|తప్పు",
}
LOOP = {
    "en": r"\b(by the end|at the end|the last one|stay|wait|until you|third|final|later|you'll see|keep watching|one more)\b",
    "te": r"చివర్లో|చివరికి|చివరి|మూడోది|ఆఖరి|తర్వాత|ఇంకా\s*ఉంది|చూడండి|ఆగండి",
}
VIEWER = {
    "en": r"\b(you|your|you're|you'll|yours)\b",
    "te": r"మీరు|మీకు|మీ\b|మీది|నువ్వు|నీకు",
}
KIDS_VIEWER = {"en": r"\b(friends|kids|children)\b", "te": r"పిల్లలూ|పిల్లలు|ఫ్రెండ్స్|స్నేహితులారా"}
STAKES = {
    "en": r"\b(matters|chang(e|ed|es)|save|lose|win|danger|safe|never again|forever|every day|your life|you'll know|learn|find out|discover|real|proof|million|billion|whole (planet|world|country)|everyone|history)\b",
    "te": r"తెలుసుకుం|మార్చ|మారిపో|ప్రమాదం|ప్రాణ|రోజూ|ఎప్పటికీ|నేర్చుకుం|కనిపెట్ట|లక్ష|కోటి|గెల|ఓడ|నిజమైన|ప్రపంచం|అందరికీ|చరిత్ర",
}
GREETING = {"en": r"^\s*(hi|hey|hello|good (morning|evening))\b", "te": r"^\s*(నమస్కారం|నమస్తే|హాయ్|హలో)"}
FEAR = {"en": r"\b(die|death|dead|kill|blood|scary|danger|warning)\b", "te": r"చనిపో|చావు|రక్తం|భయం|ప్రమాదం"}
NUMWORDS = {
    "en": r"\b\d[\d,.]*%?|\b(one|two|three|four|five|six|seven|eight|nine|ten|hundred|thousand|million|billion|half|twice|double)\b",
    "te": r"\d|ఒక|రెండు|మూడు|నాలుగు|ఐదు|ఆరు|ఏడు|ఎనిమిది|తొమ్మిది|పది|వంద|వెయ్యి|లక్ష|కోటి|సగం|రెట్లు",
}
HOOK_TYPES = [
    ("Unanswered question", r"\?$|^(why|how|what)\b|ఎందుకు|ఎలా"), ("Surprising number", r"\d|million|billion|లక్ష|కోటి"),
    ("Wrong belief", r"\b(wrong|not true|myth|taught)\b|తప్పు|నిజం\s*కాదు"), ("Impossible fact", r"impossible|shouldn'?t|అసాధ్యం"),
    ("Countdown", r"\bin \d+ seconds\b|సెకన్ల"), ("Secret / insider", r"secret|nobody knows|almost no one|రహస్యం|ఎవరికీ\s*తెలియదు"),
    ("Warning", r"\bdon'?t\b|\bnever\b.*until|జాగ్రత్త"), ("Challenge", r"\bonly \d|can you|try it|మీరు\s*చేయగలరా"),
    ("Comparison / scale", r"\bvs\b|\bversus\b|bigger than|smaller than|కంటే\s*పెద్ద"),
]


def clean(line):
    line = re.sub(r"\{say\s+([^|}]*)\|[^}]*\}", r"\1", line)
    line = re.sub(r"\{(pause|cue)[^}]*\}", " ", line)
    line = re.sub(r"^\[[^\]]+\]\s*", "", line)
    return re.sub(r"\s+", " ", line).strip()


def read_script(path):
    text = Path(path).read_text(encoding="utf-8")
    meta = {}
    m = re.match(r"^---\n(.*?)\n---\n", text, re.S)
    if m:
        for raw in m.group(1).splitlines():
            k, _, v = raw.split("#", 1)[0].partition(":")
            if k.strip() and not k.startswith("cast"):
                meta[k.strip()] = v.strip()
        text = text[m.end():]
    lines, beat = [], None
    for raw in text.splitlines():
        s = raw.strip()
        mm = re.match(r"^#\s*@(strike|gap|stakes|promise)\b", s)
        if mm:
            beat = mm.group(1); continue
        if not s or s.startswith("#"):
            continue
        c = clean(s)
        if c:
            lines.append((beat, c))
    return meta, lines


def first_ten(lines, lang, timeline=None):
    if timeline:
        tl = json.loads(Path(timeline).read_text(encoding="utf-8"))
        words = [w["word"] for L in tl["lines"] for w in L["words"] if w["start"] < 10.0]
        first_line = tl["lines"][0]["segments"][0] if tl["lines"] and tl["lines"][0]["segments"] else None
        return " ".join(words), (first_line["end"] - first_line["start"]) if first_line else None
    budget = WPM[lang] / 6.0
    out, n = [], 0
    for _, ln in lines:
        for w in ln.split():
            if n >= budget:
                return " ".join(out), None
            out.append(w); n += 1
    return " ".join(out), None


def score(text, lang, fmt, strike_secs=None):
    t = text.strip(); tl = t.lower()
    sentences = [s for s in re.split(r"(?<=[.!?।])\s+", t) if s.strip()]
    first = sentences[0] if sentences else t
    words = t.split(); fw = len(first.split())
    early_n = max(int(WPM[lang] * 4 / 60), len(" ".join(sentences[:2]).split()))   # ~first 4 s or first two sentences
    first_half = " ".join(words[:early_n])
    notes, parts = [], {}
    # strike
    banned = [b for b in BANNED[lang] if re.search(b, tl if lang == "en" else t, re.I)]
    greet = bool(re.search(GREETING[lang], t, re.I))
    kids = fmt in ("kids", "01")
    lim = 9 if lang == "en" else 7
    s = 100 - 85 * bool(banned) - (40 if kids else 80) * (greet and not banned) - max(0, fw - lim) * 8
    if banned:
        notes.append("Opens with a greeting/intro or a channel/subscribe line: start with the strike instead.")
    elif greet:
        notes.append("Starts with a greeting: put the strike first" + (" and greet right after it (kids)." if kids else "."))
    if fw > lim:
        notes.append(f"First sentence has {fw} words: cut it to ≤ {lim} so it lands in under 1.5 s.")
    if strike_secs is not None and strike_secs > 3.0:
        s -= int((strike_secs - 3.0) * 25)
        notes.append(f"The first line takes {strike_secs:.1f} s to say (aim ≤ 3 s): shorten it; put long numbers on screen and say a short form ({{say 4,800 km|five thousand kilometres}}).")
    parts["strike"] = max(0, min(100, s))
    # curiosity (in the first ~4 s)
    c = 0
    if re.search(CURIOUS[lang], first_half if lang == "te" else first_half.lower()):
        c = 85 + 15 * ("?" in first_half)
    elif re.search(CURIOUS[lang], t if lang == "te" else tl):
        c = 55
    if c < 70:
        notes.append("No clear open question early: add a gap the viewer can't answer yet (why/how/what if… / ఎందుకు, ఎలా…) within 4 s.")
    parts["curiosity"] = c
    # specificity
    nums = len(re.findall(NUMWORDS[lang], t if lang == "te" else tl))
    names = len(re.findall(r"(?<!^)(?<![.!?] )\b[A-Z][a-z]{2,}", t)) if lang == "en" else 0
    sp = min(100, 40 + 30 * nums + 15 * names)
    if sp < 70:
        notes.append("Vague: add one concrete detail (a number, a name, a place, a year).")
    parts["specificity"] = sp
    # viewer
    v = 100 if re.search(VIEWER[lang], t if lang == "te" else tl) else (90 if kids and re.search(KIDS_VIEWER[lang], t if lang == "te" else tl) else 45)
    if v < 70:
        notes.append("Doesn't talk to the viewer: bring them in (you / your · మీరు / మీకు; kids: friends / పిల్లలూ).")
    parts["viewer"] = v
    # stakes / promise / loop
    loop = bool(re.search(LOOP[lang], t if lang == "te" else tl)); stake = bool(re.search(STAKES[lang], t if lang == "te" else tl))
    st = 40 + 35 * loop + 25 * stake
    if not loop:
        notes.append("No open loop: promise something that only pays off later (by the end… / the last one… · చివర్లో…).")
    if not stake:
        notes.append("Why should they care? Add the stakes or a proof of the payoff (a result, a number, a glimpse).")
    if kids and re.search(FEAR[lang], t if lang == "te" else tl):
        st -= 40; notes.append("Kids format: remove fear/danger words from the opening.")
    parts["stakes"] = max(0, min(100, st))
    # pace / budget
    n = len(words); lo, hi = ((16, 22) if lang == "en" else (11, 16)) if kids else ((18, 27) if lang == "en" else (13, 21))
    pc = 100 if lo <= n <= hi else max(0, 100 - 6 * (lo - n if n < lo else n - hi))
    if n > hi:
        notes.append(f"{n} words in the first 10 s: too much talk (aim {lo}–{hi}); let the picture carry part of it.")
    elif n < lo:
        notes.append(f"Only {n} words in the first 10 s: fine if the visual carries it; otherwise add the promise line.")
    parts["pace"] = pc
    total = round(0.6 * min(parts.values()) + 0.4 * sum(parts.values()) / len(parts))
    band = "STRONG" if total >= 72 else "WORKABLE" if total >= 55 else "WEAK"
    htype = next((name for name, rx in HOOK_TYPES if re.search(rx, first if lang == "te" else first.lower(), re.I)), "Story / statement")
    return total, band, parts, notes, htype


def report(label, text, lang, fmt, strike_secs=None):
    total, band, parts, notes, htype = score(text, lang, fmt, strike_secs)
    print(f"\n{label}  →  {total}/100  {band}   (type: {htype})")
    print(f"  “{text[:160]}{'…' if len(text) > 160 else ''}”")
    print("  " + "  ".join(f"{k} {v}" for k, v in parts.items()))
    for n in notes:
        print(f"  - {n}")
    return total


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("script", nargs="?"); ap.add_argument("--timeline"); ap.add_argument("--options"); ap.add_argument("--text")
    ap.add_argument("--lang", choices=["en", "te"]); ap.add_argument("--format", default="")
    a = ap.parse_args()
    fmt = a.format.lower()
    if a.text:
        lang = a.lang or ("te" if re.search(r"[ఀ-౿]", a.text) else "en")
        report("hook", a.text, lang, fmt); return
    if a.options:
        opts = [p.strip() for p in re.split(r"\n\s*\n", Path(a.options).read_text(encoding="utf-8")) if p.strip()]
        res = []
        for i, o in enumerate(opts, 1):
            lang = a.lang or ("te" if re.search(r"[ఀ-౿]", o) else "en")
            res.append((score(" ".join(clean(x) for x in o.splitlines()), lang, fmt)[0], i))
        for tot, i in sorted(res, reverse=True):
            o = opts[i - 1]; lang = a.lang or ("te" if re.search(r"[ఀ-౿]", o) else "en")
            report(f"option {i}", " ".join(clean(x) for x in o.splitlines()), lang, fmt)
        print(f"\nbest: option {max(res)[1]} — show the top two to the user with their scores")
        return
    if not a.script:
        ap.print_help(); sys.exit(1)
    meta, lines = read_script(a.script)
    lang = a.lang or meta.get("lang", "en")
    fmt = fmt or meta.get("format", "")
    text, strike_secs = first_ten(lines, lang, a.timeline)
    report(f"{Path(a.script).name} (first 10 s{' from the rendered voice' if a.timeline else ', estimated'})", text, lang, fmt, strike_secs)


if __name__ == "__main__":
    main()
