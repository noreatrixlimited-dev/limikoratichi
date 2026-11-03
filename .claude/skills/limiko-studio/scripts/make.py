#!/usr/bin/env python3
"""One command per stage: scaffold a film, check it, render a draft, and (after approval) render the final.

    make.py new <slug> --format kids|facts|history|gaming|horror|documentary|anime|nature|music|business [--lang en,te]
        films/<slug>/ with plan/ (brief, storyboard, continuity, sources), voice.<lang>.md (O-10 opening marked),
        scene.js (voice-cue driven, moving camera, captions in both languages) and film.json (settings).
    make.py check <slug>       voice scripts parse, hook scores (O-10), required plan files exist
    make.py draft <slug>       voice → half-rate preview video per language → out/draft.<lang>.mp4 (marked DRAFT)
    make.py approve <slug>     records the user's approval (run only after the user approves the plan + sample frames)
    make.py final <slug>       needs approval: voice → full render → mix to the format's loudness → hook check on the real
                               timing → edit analysis → out/film.<lang>.mp4 + out/report.md
    make.py status <slug>      what exists, what's next

Run from anywhere; films live in <repo>/films/<slug>/. Gates from shared/preproduction.md still apply: `final` refuses
to run until `approve` has been recorded.
"""
import argparse, datetime, json, os, re, shutil, subprocess, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
SKILL = HERE.parent
ROOT = SKILL.parents[2]
FILMS = ROOT / "films"
FRAMES = SKILL / "frames"

FORMATS = {  # format → (folder, loudness target, voice defaults per language, theme)
    "kids":        ("01-kids", -16, {"en": ("kokoro", "af_heart", 0.92), "te": ("parler", "Lalitha", 0.9)}, "kids"),
    "facts":       ("02-facts-science", -14, {"en": ("kokoro", "af_heart", 1.0), "te": ("parler", "Lalitha", 1.0)}, "facts"),
    "history":     ("03-history-mythology", -14, {"en": ("kokoro", "bm_george", 0.95), "te": ("parler", "Prakash", 0.95)}, "history"),
    "gaming":      ("04-gaming", -12, {"en": ("kokoro", "am_puck", 1.08), "te": ("parler", "Prakash", 1.05)}, "gaming"),
    "horror":      ("05-horror-mystery", -16, {"en": ("kokoro", "bm_george", 0.9), "te": ("parler", "Prakash", 0.9)}, "mystery"),
    "documentary": ("06-documentary", -16, {"en": ("kokoro", "bm_george", 1.0), "te": ("parler", "Prakash", 1.0)}, "history"),
    "anime":       ("07-anime-cartoon", -14, {"en": ("kokoro", "af_heart", 1.05), "te": ("parler", "Lalitha", 1.0)}, "kids"),
    "nature":      ("08-nature-wildlife", -16, {"en": ("kokoro", "bm_george", 0.92), "te": ("parler", "Prakash", 0.92)}, "facts"),
    "music":       ("09-music-lyric", -14, {"en": ("recorded", "", 1.0), "te": ("recorded", "", 1.0)}, "gaming"),
    "business":    ("10-business-tech", -14, {"en": ("kokoro", "af_heart", 1.0), "te": ("parler", "Lalitha", 1.0)}, "business"),
}
HOOK_FORMAT = {"kids": "kids", "facts": "facts", "history": "history", "gaming": "gaming"}

VOICE_TPL = {
    "en": """---
lang: en
engine: {engine}
voice: {voice}
speed: {speed}
gap: 0.35
---
# {title} · opening in the O-10 curiosity format (shared/hooks.md). Write three openings, score with: make.py check {slug}
# @strike
[narrator] {{cue strike}}<the most intriguing line, 9 words or fewer>
# @gap
[narrator] {{cue gap}}<the question the viewer can't answer yet>?
# @stakes
[narrator] <why it matters to them, or proof the payoff is real>
# @promise
[narrator] {{cue promise}}By the end, <what they'll get, and one open loop>.
[narrator] {{cue beat1}}<first beat of the content>
""",
    "te": """---
lang: te
engine: {engine}
voice: {voice}
style: "clear, warm and expressive"
speed: {speed}
gap: 0.4
---
# {title} · O-10 ప్రారంభం (shared/hooks.md). స్థానిక తెలుగులో రాయండి, అనువాదం కాదు.
# @strike
[narrator] {{cue strike}}<ఏడు పదాల లోపు అత్యంత ఆసక్తికరమైన వాక్యం>
# @gap
[narrator] {{cue gap}}<ప్రేక్షకుడికి ఇంకా తెలియని ప్రశ్న>?
# @stakes
[narrator] <ఇది వారికి ఎందుకు ముఖ్యం>
# @promise
[narrator] {{cue promise}}చివరికి, <వారికి ఏం తెలుస్తుంది>.
[narrator] {{cue beat1}}<మొదటి భాగం>
""",
}

SCENE_TPL = """// {title} · scene driven by the voice cues of the current language (props.lang, props.voice).
// Replace the placeholder visuals beat by beat (storyboard order). Rules: moving camera in every shot,
// only this format's transitions and effect level (formats/{folder}/direction.md).
export default {{
  dim: '2d', fps: 24, width: 1280, height: 720,
  defaultProps: {{ lang: 'en', voice: '/films/{slug}/out/voice-en', draft: false }},
  async setup({{ W, H, L, props }}) {{
    let tl = {{ duration: 8, cues: {{}}, captions: [] }};
    try {{ tl = await (await fetch(`${{props.voice}}/timeline.json`)).json(); }} catch (e) {{ /* no voice yet: silent layout preview */ }}
    return {{ tl, cues: tl.cues, duration: tl.duration + 1.0, audio: tl.captions.length ? `${{props.voice}}/voice.m4a` : null }};
  }},
  draw(ctx, W, H, L, T, t, S) {{
    const cue = (k) => S.tl.cues[k] ?? 1e9;
    // moving camera: slow drift + a push on every beat
    const cam = {{ x: W / 2 + Math.sin(t * 0.2) * 14, y: H / 2 + Math.cos(t * 0.17) * 9, zoom: 1.03 + T.interpolate(t, [0, S.duration], [0, 0.06]) }};
    T.camera(ctx, W, H, cam, () => {{
      const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '{bg0}'); g.addColorStop(1, '{bg1}');
      ctx.fillStyle = g; ctx.fillRect(-W, -H, W * 3, H * 3);
      // beat placeholders: one shape per cue so timing can be checked before the art exists
      ['strike', 'gap', 'promise', 'beat1'].forEach((k, i) => {{
        const p = T.spring(t, {{ delay: cue(k), stiffness: 120, damping: 14 }});
        if (p <= 0) return;
        ctx.fillStyle = L.rgba('{accent}', 0.85); ctx.beginPath(); ctx.arc(W * (0.2 + i * 0.2), H * 0.42, 60 * p, 0, L.TAU); ctx.fill();
        L.text(ctx, k, W * (0.2 + i * 0.2), H * 0.42 + 100, {{ size: 26, color: '#ffffff', font: 'Inter', weight: 700 }});
      }});
    }});
    // captions: the current chunk, current word in the accent colour
    const caps = S.tl.captions || [];
    const cap = caps.find((c, i) => t >= c.start - 0.1 && t < (caps[i + 1] ? Math.min(caps[i + 1].start - 0.1, c.end + 0.6) : c.end + 0.6));
    if (cap) {{
      ctx.font = `800 40px ${{S.props.lang === 'te' ? L.FONT.te : L.FONT.en}}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const w = ctx.measureText(cap.text).width; ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.beginPath(); ctx.roundRect(W / 2 - w / 2 - 24, H - 118, w + 48, 64, 14); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.fillText(cap.text, W / 2, H - 86);
    }}
    if (S.props.draft) {{ ctx.font = '900 22px Inter'; ctx.fillStyle = 'rgba(255,80,80,0.9)'; ctx.textAlign = 'left'; ctx.fillText('DRAFT', 20, 30); }}
  }},
}};
"""

THEME_COLORS = {"kids": ("#fff4d6", "#ffd6e7", "#ff6b6b"), "facts": ("#0f1b2d", "#16325c", "#ffd23f"), "history": ("#2a1d12", "#5a3a1e", "#e0a84f"),
                "gaming": ("#0b0614", "#2b0f4a", "#ffb347"), "business": ("#1e293b", "#334155", "#2563eb"), "mystery": ("#05070a", "#141b24", "#9bd1ff")}


def run(cmd, **kw):
    print("  $", " ".join(str(c) for c in cmd)[:200])
    r = subprocess.run([str(c) for c in cmd], **kw)
    if r.returncode != 0:
        sys.exit(f"step failed ({r.returncode}): {cmd[0]} {cmd[1] if len(cmd) > 1 else ''}")
    return r


def film(slug):
    d = FILMS / slug
    if not (d / "film.json").exists():
        sys.exit(f"no film {slug}: make.py new {slug} --format …")
    return d, json.loads((d / "film.json").read_text())


def cmd_new(a):
    if a.format not in FORMATS:
        sys.exit(f"format must be one of: {', '.join(FORMATS)}")
    if not re.fullmatch(r"[a-z0-9][a-z0-9-]{1,40}", a.slug):
        sys.exit("slug: lowercase letters, digits and dashes")
    d = FILMS / a.slug
    if d.exists():
        sys.exit(f"{d} exists")
    folder, lufs, voices, theme = FORMATS[a.format]
    langs = [l.strip() for l in a.lang.split(",") if l.strip()]
    if any(l not in ("en", "te") for l in langs):
        sys.exit("languages: en and/or te (native English, native Telugu)")
    title = a.title or a.slug.replace("-", " ").title()
    for sub in ("plan", "characters", "out"):
        (d / sub).mkdir(parents=True)
    (d / "plan" / "brief.md").write_text(f"# {title}\n\nFormat: {a.format} (`formats/{folder}/direction.md`)\nLanguages: {', '.join(langs)}\n\n## G1 Topic analysis\n- What the viewer came for:\n- One-line promise:\n- Audience / age:\n\n## G2 Visual direction\n- Style (from styles.md / previews):\n- Palette:\n- Camera grammar (this format's Camera rules):\n- Transitions allowed:\n\n## G4 Concept / moment plan\n- Beat → visual mechanism:\n")
    (d / "plan" / "storyboard.md").write_text("# Storyboard (G5)\n\n| # | Time | Voice cue | Picture | Camera move | Transition out | Sound |\n|---|---|---|---|---|---|---|\n| 1 | 0.0–1.5 | strike | | | | |\n| 2 | 1.5–4 | gap | | | | |\n| 3 | 4–7 | stakes | | | | |\n| 4 | 7–10 | promise | | | | |\n\nOpenings considered (hookcheck scores):\n1.\n2.\n3.\n")
    (d / "plan" / "continuity.md").write_text("# Continuity\n\n| Scene | Characters (spec + version) | Light / time of day | Screen direction | Props / costume |\n|---|---|---|---|---|\n")
    (d / "plan" / "sources.md").write_text("# Sources\n\nEvery claim in the script (and the hook) with its source. Myths: name the tradition and label them as stories.\n\n| Claim | Source | Note |\n|---|---|---|\n")
    for l in langs:
        eng, voice, speed = voices[l]
        (d / f"voice.{l}.md").write_text(VOICE_TPL[l].format(engine=eng, voice=voice, speed=speed, title=title, slug=a.slug))
    c0, c1, acc = THEME_COLORS[theme]
    (d / "scene.js").write_text(SCENE_TPL.format(title=title, folder=folder, slug=a.slug, bg0=c0, bg1=c1, accent=acc))
    (d / "film.json").write_text(json.dumps({"slug": a.slug, "title": title, "format": a.format, "langs": langs, "lufs": lufs, "theme": theme,
                                             "created": datetime.date.today().isoformat()}, indent=2) + "\n")
    subprocess.run([sys.executable, str(HERE / "package.py"), "template", a.slug, "--lang", ",".join(langs)], capture_output=True)
    print(f"✓ {d.relative_to(ROOT)}\n  next: fill plan/brief.md (G1, G2), write voice.{langs[0]}.md (three openings), make.py check {a.slug}")


def hookcheck(d, f, l, timeline=None):
    cmd = [sys.executable, HERE / "hookcheck.py", d / f"voice.{l}.md", "--format", HOOK_FORMAT.get(f["format"], "facts")]
    if timeline and Path(timeline).exists():
        cmd += ["--timeline", timeline]
    return subprocess.run([str(c) for c in cmd], capture_output=True, text=True)


def cmd_check(a):
    d, f = film(a.slug)
    ok = True
    for p in ("brief.md", "storyboard.md", "continuity.md") + (("sources.md",) if f["format"] in ("facts", "history", "documentary", "nature", "business") else ()):
        if not (d / "plan" / p).exists():
            print(f"✗ plan/{p} missing"); ok = False
    for l in f["langs"]:
        v = d / f"voice.{l}.md"
        txt = v.read_text()
        if "<" in re.sub(r"^#.*$", "", txt, flags=re.M):
            print(f"✗ voice.{l}.md still has <placeholders>"); ok = False; continue
        r = subprocess.run([sys.executable, str(HERE / "voice.py"), "check", str(v)], capture_output=True, text=True)
        print(f"— voice.{l}.md\n" + (r.stdout + r.stderr).strip()[-600:])
        ok &= r.returncode == 0
        h = hookcheck(d, f, l)
        print(h.stdout.strip()[-900:])
    print("✓ ready for draft" if ok else "fix the items above")
    return ok


def voice_render(d, l):
    out = d / "out" / f"voice-{l}"
    run([sys.executable, HERE / "voice.py", "render", d / f"voice.{l}.md", "--out", out])
    run([sys.executable, HERE / "voice.py", "mix", "--voice", out / "voice.wav", "--out", out / "voice.m4a", "--lufs", "-16"])
    return out


def animate(d, l, out_mp4, extra=(), draft=False):
    props = d / "out" / f".props-{l}.json"
    props.write_text(json.dumps({"lang": l, "voice": f"/films/{d.name}/out/voice-{l}", "draft": draft}))
    run(["node", FRAMES / "animate.cjs", (d / "scene.js").relative_to(ROOT), "--props", props.relative_to(ROOT), "--out", out_mp4, *extra], cwd=ROOT)


def cmd_draft(a):
    d, f = film(a.slug)
    for l in f["langs"]:
        print(f"[{l}] voice"); voice_render(d, l)
        print(f"[{l}] draft video (every 2nd frame)")
        animate(d, l, d / "out" / f"draft.{l}.mp4", ["--every", "2"], draft=True)
        print(f"✓ films/{a.slug}/out/draft.{l}.mp4")
    print("Show the draft with the plan and sample frames; after the user approves: make.py approve", a.slug)


def cmd_approve(a):
    d, f = film(a.slug)
    note = a.note or "approved by the user"
    (d / "plan" / "APPROVED").write_text(f"{datetime.datetime.now().isoformat(timespec='seconds')} · {note}\n")
    print(f"✓ approval recorded: films/{a.slug}/plan/APPROVED")


def loudnorm(video, target):
    """Two-pass loudness normalisation of the finished film's audio (music ducking can leave the mix below target)."""
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(video), "-af", f"loudnorm=I={target}:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"],
                       capture_output=True, text=True)
    m = re.search(r"\{[^{}]*\}", r.stderr, re.S)
    if not m:
        return
    d = json.loads(m.group(0))
    tmp = Path(str(video).replace(".mp4", ".norm.mp4"))
    af = (f"loudnorm=I={target}:TP=-1.5:LRA=11:measured_I={d['input_i']}:measured_TP={d['input_tp']}:"
          f"measured_LRA={d['input_lra']}:measured_thresh={d['input_thresh']}:offset={d['target_offset']}:linear=true")
    run(["ffmpeg", "-y", "-v", "error", "-i", video, "-af", af, "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", tmp])
    tmp.replace(video)
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(video), "-af", "ebur128=framelog=quiet", "-f", "null", "-"], capture_output=True, text=True)
    got = re.findall(r"I:\s+(-?[\d.]+) LUFS", r.stderr)
    print(f"  loudness: {got[-1] if got else '?'} LUFS (target {target})")


def cmd_final(a):
    d, f = film(a.slug)
    if not (d / "plan" / "APPROVED").exists():
        sys.exit("not approved yet: show the plan, storyboard, characters and sample frames to the user, then make.py approve " + a.slug)
    report = [f"# {f['title']} · final report", "", f"Format: {f['format']} · loudness target {f['lufs']} LUFS", ""]
    for l in f["langs"]:
        print(f"[{l}] voice"); vo = voice_render(d, l)
        raw = d / "out" / f"film.{l}.raw.mp4"
        print(f"[{l}] render"); animate(d, l, raw)
        final = d / "out" / f"film.{l}.mp4"
        # loudness: re-mix the narration (and music if present) to the format target, then mux
        music = d / "music.wav"
        mix = d / "out" / f"mix.{l}.m4a"
        cmd = [sys.executable, HERE / "voice.py", "mix", "--voice", vo / "voice.wav", "--out", mix, "--lufs", str(f["lufs"])]
        if music.exists():
            cmd += ["--music", music, "--duck", "10"]
        run(cmd)
        run(["ffmpeg", "-y", "-v", "error", "-i", raw, "-i", mix, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", final])
        raw.unlink(missing_ok=True)
        loudnorm(final, f["lufs"])
        h = hookcheck(d, f, l, vo / "timeline.json")
        an = subprocess.run([sys.executable, str(HERE / "analyze.py"), str(final), "--out", str(d / "out" / f"analysis-{l}")], capture_output=True, text=True)
        report += [f"## {l.upper()} · films/{a.slug}/out/film.{l}.mp4", "", "### Hook (first 10 s, real timing)", "```", h.stdout.strip()[-1500:], "```",
                   "### Edit analysis", f"`out/analysis-{l}/recipe.md`" + ("" if an.returncode == 0 else f" (analysis failed: {an.stderr.strip()[-200:]})"), ""]
        print(f"✓ {final.relative_to(ROOT)}")
    report += ["## Before publishing", f"- [ ] the format checklist (`formats/{FORMATS[f['format']][0]}/direction.md`)", "- [ ] packaging block: hook, title, thumbnail, description, tags",
               "- [ ] sources checked (facts) / tradition named (myths)" + (" · kids checklist passed" if f["format"] == "kids" else "")]
    pk = d / "package.json"
    if pk.exists():
        r = subprocess.run([sys.executable, str(HERE / "package.py"), "build", a.slug], capture_output=True, text=True)
        print(r.stdout.strip())
        report += ["", "## Packaging", "`out/package.<lang>.md` (YouTube title / hook / descriptions / tags, Instagram caption)" if r.returncode == 0
                   else "packaging NOT built: fix package.json (" + r.stdout.strip().splitlines()[0] + ")"]
    else:
        report += ["", "## Packaging", "fill `package.json` (YouTube + Instagram), then `scripts/package.py build " + a.slug + "`"]
    (d / "out" / "report.md").write_text("\n".join(report) + "\n")
    print(f"✓ films/{a.slug}/out/report.md")


def cmd_status(a):
    d, f = film(a.slug)
    out = d / "out"
    print(f"{f['title']} · {f['format']} · {', '.join(f['langs'])}")
    steps = [("plan written", all((d / 'plan' / p).stat().st_size > 300 for p in ('brief.md', 'storyboard.md'))),
             ("voice scripts filled", all('<' not in re.sub(r'^#.*$', '', (d / f'voice.{l}.md').read_text(), flags=re.M) for l in f['langs'])),
             ("draft rendered", all((out / f'draft.{l}.mp4').exists() for l in f['langs'])),
             ("approved", (d / 'plan' / 'APPROVED').exists()),
             ("final rendered", all((out / f'film.{l}.mp4').exists() for l in f['langs']))]
    for name, done in steps:
        print(f"  {'✓' if done else '·'} {name}")
    nxt = next((n for n, done in steps if not done), None)
    print("next:", {"plan written": "fill plan/brief.md and storyboard.md", "voice scripts filled": f"write voice scripts, then make.py check {a.slug}",
                    "draft rendered": f"make.py draft {a.slug}", "approved": "show the user; then make.py approve " + a.slug,
                    "final rendered": f"make.py final {a.slug}"}.get(nxt, "package and publish"))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sp = ap.add_subparsers(dest="cmd", required=True)
    n = sp.add_parser("new"); n.add_argument("slug"); n.add_argument("--format", required=True); n.add_argument("--lang", default="en"); n.add_argument("--title")
    for c in ("check", "draft", "final", "status"):
        sp.add_parser(c).add_argument("slug")
    ap_ = sp.add_parser("approve"); ap_.add_argument("slug"); ap_.add_argument("--note")
    a = ap.parse_args()
    {"new": cmd_new, "check": cmd_check, "draft": cmd_draft, "approve": cmd_approve, "final": cmd_final, "status": cmd_status}[a.cmd](a)


if __name__ == "__main__":
    main()
