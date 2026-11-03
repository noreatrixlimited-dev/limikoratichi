#!/usr/bin/env python3
"""Voice-over for English and Telugu: one script format, any engine, timings for the animation.

    voice.py render <script.md> [--out DIR]       narration → voice.wav, timeline.json, words.json, cues.json, captions.srt
    voice.py mix --voice V.wav [--music M.wav] [--sfx S.wav] --out mix.wav [--lufs -14] [--duck 10]
    voice.py voices [en|te]                       list voices per engine
    voice.py check <script.md>                    parse and report (lines, words, estimated length) without rendering

Script format (see shared/voiceover.md):
    ---
    lang: en                 # en | te
    engine: kokoro           # kokoro (en, offline) | google | azure | espeak (draft) | recorded
    voice: af_heart
    speed: 1.0
    gap: 0.35                # silence between lines, seconds
    cast pip: voice=am_puck speed=1.08
    cast king: voice=bm_george speed=0.92
    lexicon: lexicon.txt     # optional: word = spoken respelling
    ---
    [narrator] Deep underground, molten rock is rising. {pause 0.5} {cue magma}And then… the mountain wakes up.
    [pip] Hi friends!
    [narrator file=rec/03.wav] A line recorded by a human voice artist.

Engines:
    kokoro   English (US af_/am_, UK bf_/bm_ voices), local, Apache-2.0. Needs scripts/voice-setup.sh once.
    google   Google Cloud Text-to-Speech (en-US, en-GB, te-IN). Uses `gcloud auth print-access-token`;
             set GOOGLE_CLOUD_PROJECT. Commercial use under Google Cloud terms.
    azure    Azure AI Speech (te-IN-ShrutiNeural / te-IN-MohanNeural, en-*). Env AZURE_SPEECH_KEY, AZURE_SPEECH_REGION.
    parler   AI4Bharat Indic Parler-TTS (Apache-2.0): native Telugu (and English), runs locally on CPU (slow) or GPU.
             voice = speaker name (Telugu: Lalitha, Prakash, Kiran …); style= tone words. Needs HF_TOKEN with the
             model's terms accepted, and scripts/voice-setup.sh --telugu once.
    indicf5  AI4Bharat IndicF5 (MIT): Telugu in the voice of a reference clip. ref=clip.wav (+ clip.txt transcript,
             or reftext="…"). Only voices you have the right to use. Needs HF_TOKEN + voice-setup.sh --telugu.
    espeak   espeak-ng, robotic. Timing drafts and animatics only, never for publishing.
    recorded Lines from files (`file=` per line): human voice artists, the user's own voice.
"""
import json, math, os, re, shutil, subprocess, sys, tempfile, wave
from pathlib import Path

CACHE = Path(os.environ.get("LIMIKO_VOICE_CACHE", Path.home() / ".cache" / "limiko-voice"))
VENV_PY = CACHE / "venv" / "bin" / "python"

try:
    import numpy as np
    import soundfile as sf
except ImportError:
    if VENV_PY.exists() and Path(sys.prefix).resolve() != (CACHE / "venv").resolve():
        os.execv(str(VENV_PY), [str(VENV_PY), *sys.argv])
    sys.exit("missing numpy/soundfile: run scripts/voice-setup.sh first")

SR = 24000

TELUGU_VOICES = {
    "indicf5": ["any voice from a 5–12 s reference clip you have rights to (ref=clip.wav, transcript in clip.txt)"],
    "parler": ["Lalitha (female, recommended)", "Prakash (male, recommended)", "Kiran (male)", "+ style=warm|calm|expressive|deep|cheerful"],
    "google": ["te-IN-Standard-A (female)", "te-IN-Standard-B (male)", "te-IN-Chirp3-HD-* (if enabled in your project)"],
    "azure": ["te-IN-ShrutiNeural (female)", "te-IN-MohanNeural (male)"],
    "espeak": ["te (draft only)"],
}
ENGLISH_CLOUD = {
    "google": ["en-US-Neural2-*", "en-GB-Neural2-*", "en-US-Chirp3-HD-*"],
    "azure": ["en-US-AvaNeural", "en-US-AndrewNeural", "en-GB-SoniaNeural", "en-GB-RyanNeural"],
}

# ---------------------------------------------------------------- parsing
def parse_script(path):
    text = Path(path).read_text(encoding="utf-8")
    meta = {"lang": "en", "engine": "kokoro", "voice": None, "speed": 1.0, "gap": 0.35, "cast": {}, "lexicon": None}
    body = text
    m = re.match(r"^---\n(.*?)\n---\n", text, re.S)
    if m:
        body = text[m.end():]
        for raw in m.group(1).splitlines():
            line = raw.split("#", 1)[0].strip()
            if not line:
                continue
            k, _, v = line.partition(":")
            k, v = k.strip(), v.strip()
            if k.startswith("cast "):
                meta["cast"][k[5:].strip()] = kv(v)
            elif k in ("speed", "gap"):
                meta[k] = float(v)
            else:
                meta[k] = v
    if meta["lang"] not in ("en", "te"):
        sys.exit(f"lang must be en or te, not {meta['lang']}")
    lex = {}
    if meta["lexicon"]:
        lp = Path(path).parent / meta["lexicon"]
        for raw in lp.read_text(encoding="utf-8").splitlines():
            if "=" in raw and not raw.strip().startswith("#"):
                a, b = raw.split("=", 1)
                lex[a.strip()] = b.strip()
    lines = []
    for n, raw in enumerate(body.splitlines(), 1):
        s = raw.strip()
        if not s or s.startswith("#"):
            continue
        who, opts = "narrator", {}
        mm = re.match(r"^\[([^\]]+)\]\s*(.*)$", s)
        if mm:
            head, s = mm.group(1).split(), mm.group(2)
            who = head[0]
            opts = kv(" ".join(head[1:]))
        lines.append({"n": n, "who": who, "opts": opts, "raw": s, "segments": split_segments(s, lex)})
    return meta, lines


def kv(s):
    import shlex
    out = {}
    try:
        toks = shlex.split(s)
    except ValueError:
        toks = s.split()
    for tok in toks:
        if "=" in tok:
            a, b = tok.split("=", 1)
            out[a] = float(b) if re.fullmatch(r"-?\d+(\.\d+)?", b) else b
    return out


def split_segments(s, lex):
    """Split a line on {pause x}; collect {cue name}; apply {say shown|spoken} and the lexicon."""
    segs, cur, cues_here = [], "", []
    pos = 0
    for m in re.finditer(r"\{(pause|cue|say)\s+([^}]*)\}", s):
        cur += s[pos:m.start()]
        kind, arg = m.group(1), m.group(2).strip()
        if kind == "pause":
            segs.append({"text": cur, "cues": cues_here}); segs.append({"pause": float(arg)})
            cur, cues_here = "", []
        elif kind == "cue":
            cues_here.append({"name": arg, "at_char": len(cur)})
        else:
            shown, _, spoken = arg.partition("|")
            cur += f"\x00{shown}\x01{spoken or shown}\x02"
        pos = m.end()
    cur += s[pos:]
    segs.append({"text": cur, "cues": cues_here})
    out = []
    for g in segs:
        if "pause" in g:
            out.append(g); continue
        lead_ws = len(g["text"]) - len(g["text"].lstrip())
        for c in g["cues"]:
            c["at_char"] = max(0, c["at_char"] - lead_ws)
        shown = re.sub(r"\x00(.*?)\x01(.*?)\x02", r"\1", g["text"]).strip()
        spoken = re.sub(r"\x00(.*?)\x01(.*?)\x02", r"\2", g["text"]).strip()
        for a, b in lex.items():
            spoken = re.sub(rf"(?<!\w){re.escape(a)}(?!\w)", b, spoken)
        if shown:
            out.append({"shown": shown, "spoken": spoken, "cues": g["cues"]})
        elif g["cues"]:
            out.append({"shown": "", "spoken": "", "cues": g["cues"]})
    return out

# ---------------------------------------------------------------- engines
_kokoro = None
def eng_kokoro(text, voice, speed, lang):
    global _kokoro
    if lang != "en":
        sys.exit("kokoro has no Telugu voice: use engine google, azure, recorded (or espeak for drafts)")
    if _kokoro is None:
        try:
            from kokoro_onnx import Kokoro
        except ImportError:
            sys.exit("kokoro-onnx missing: run scripts/voice-setup.sh")
        _kokoro = Kokoro(str(CACHE / "kokoro-q8.onnx"), str(CACHE / "voices.npz"))
    voice = voice or "af_heart"
    a, sr = _kokoro.create(text, voice=voice, speed=float(speed), lang="en-gb" if voice[:1] == "b" else "en-us")
    return resample(np.asarray(a, dtype=np.float32), sr)


def eng_espeak(text, voice, speed, lang):
    exe = shutil.which("espeak-ng") or shutil.which("espeak")
    if not exe:
        sys.exit("espeak-ng not installed (apt-get install espeak-ng)")
    with tempfile.NamedTemporaryFile(suffix=".wav") as f:
        subprocess.run([exe, "-v", voice or ("te" if lang == "te" else "en-us"), "-s", str(int(150 * float(speed))), "-w", f.name, text], check=True)
        a, sr = sf.read(f.name, dtype="float32")
    return resample(a, sr)


def eng_google(text, voice, speed, lang):
    import base64, urllib.request
    tok = subprocess.run(["gcloud", "auth", "print-access-token"], capture_output=True, text=True)
    if tok.returncode:
        sys.exit("google engine: gcloud is not signed in (gcloud auth login, or a service account)")
    lc = "te-IN" if lang == "te" else ("-".join(voice.split("-")[:2]) if voice else "en-US")
    body = {"input": {"text": text}, "voice": {"languageCode": lc, **({"name": voice} if voice else {})},
            "audioConfig": {"audioEncoding": "LINEAR16", "sampleRateHertz": SR, "speakingRate": float(speed)}}
    req = urllib.request.Request("https://texttospeech.googleapis.com/v1/text:synthesize", data=json.dumps(body).encode(),
                                 headers={"Authorization": f"Bearer {tok.stdout.strip()}", "Content-Type": "application/json",
                                          **({"x-goog-user-project": os.environ["GOOGLE_CLOUD_PROJECT"]} if os.environ.get("GOOGLE_CLOUD_PROJECT") else {})})
    with urllib.request.urlopen(req, timeout=120) as r:
        audio = base64.b64decode(json.load(r)["audioContent"])
    return wav_bytes_to_array(audio)


def eng_azure(text, voice, speed, lang):
    import urllib.request
    key, region = os.environ.get("AZURE_SPEECH_KEY"), os.environ.get("AZURE_SPEECH_REGION")
    if not key or not region:
        sys.exit("azure engine: set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION")
    voice = voice or ("te-IN-ShrutiNeural" if lang == "te" else "en-US-AvaNeural")
    xl = "te-IN" if lang == "te" else "-".join(voice.split("-")[:2])
    rate = f"{(float(speed) - 1) * 100:+.0f}%"
    esc = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    ssml = f'<speak version="1.0" xml:lang="{xl}"><voice name="{voice}"><prosody rate="{rate}">{esc}</prosody></voice></speak>'
    req = urllib.request.Request(f"https://{region}.tts.speech.microsoft.com/cognitiveservices/v1", data=ssml.encode("utf-8"),
                                 headers={"Ocp-Apim-Subscription-Key": key, "Content-Type": "application/ssml+xml",
                                          "X-Microsoft-OutputFormat": "riff-24khz-16bit-mono-pcm", "User-Agent": "limiko-voice"})
    with urllib.request.urlopen(req, timeout=120) as r:
        return wav_bytes_to_array(r.read())


def eng_recorded(path):
    a, sr = sf.read(path, dtype="float32", always_2d=True)
    return trim(resample(a.mean(axis=1), sr))


_parler_cache = {}
VENV_TE = CACHE / "venv-te" / "bin" / "python"
PACE = [(0.88, "slow"), (0.97, "slightly slow"), (1.04, "moderate"), (1.12, "slightly fast"), (9, "fast")]


def parler_description(voice, speed, style, lang):
    voice = voice or ("Lalitha" if lang == "te" else "Mary")
    pace = next(w for lim, w in PACE if float(speed) <= lim)
    tone = style or "warm, clear and expressive"
    return (f"{voice} speaks in a {tone} tone at a {pace} pace. "
            "The recording is of very high quality, with the speaker's voice sounding clear and very close up, with no background noise.")


def parler_prefetch(jobs, work):
    """Render all parler segments in one batch (the model loads once)."""
    if not jobs:
        return
    if not VENV_TE.exists():
        sys.exit("parler engine not installed: run scripts/voice-setup.sh --telugu")
    if not (os.environ.get("HF_TOKEN") or os.environ.get("HUGGING_FACE_HUB_TOKEN")):
        sys.exit("parler engine: set HF_TOKEN (a Hugging Face token whose account accepted ai4bharat/indic-parler-tts terms)")
    work.mkdir(parents=True, exist_ok=True)
    jf = work / "jobs.json"
    jf.write_text(json.dumps(jobs, ensure_ascii=False), encoding="utf-8")
    subprocess.run([str(VENV_TE), str(Path(__file__).with_name("voice_parler.py")), str(jf), str(work)], check=True)
    for j in jobs:
        a, sr = sf.read(work / f"{j['id']}.wav", dtype="float32")
        _parler_cache[j["key"]] = resample(a, sr)


_f5_cache = {}


def indicf5_prefetch(jobs, work):
    if not jobs:
        return
    if not VENV_TE.exists():
        sys.exit("indicf5 engine not installed: run scripts/voice-setup.sh --telugu")
    if not (os.environ.get("HF_TOKEN") or os.environ.get("HUGGING_FACE_HUB_TOKEN")):
        sys.exit("indicf5 engine: set HF_TOKEN (account must accept ai4bharat/IndicF5 terms)")
    work.mkdir(parents=True, exist_ok=True)
    jf = work / "jobs.json"
    jf.write_text(json.dumps([{k: v for k, v in j.items() if k != "key"} for j in jobs], ensure_ascii=False), encoding="utf-8")
    subprocess.run([str(VENV_TE), str(Path(__file__).with_name("voice_indicf5.py")), str(jf), str(work)], check=True)
    for j in jobs:
        a, sr = sf.read(work / f"{j['id']}.wav", dtype="float32")
        _f5_cache[j["key"]] = resample(a, sr)


def ref_for(script_dir, ref, reftext):
    rp = (Path(script_dir) / ref).resolve()
    if not rp.exists():
        sys.exit(f"indicf5: reference clip not found: {rp}")
    if not reftext:
        tp = rp.with_suffix(".txt")
        if not tp.exists():
            sys.exit(f"indicf5: give reftext=\"…\" or put the clip's transcript in {tp.name}")
        reftext = tp.read_text(encoding="utf-8").strip()
    return str(rp), reftext


def eng_parler(text, voice, speed, lang, style=None):
    key = (text, voice, float(speed), style)
    if key not in _parler_cache:
        sys.exit("internal: parler segment was not prefetched")
    return _parler_cache[key]


ENGINES = {"parler": eng_parler, "kokoro": eng_kokoro, "espeak": eng_espeak, "google": eng_google, "azure": eng_azure}

# ---------------------------------------------------------------- audio helpers
def resample(a, sr):
    if sr == SR:
        return a.astype(np.float32)
    n = int(round(len(a) * SR / sr))
    return np.interp(np.linspace(0, len(a) - 1, n), np.arange(len(a)), a).astype(np.float32)


def wav_bytes_to_array(b):
    import io
    a, sr = sf.read(io.BytesIO(b), dtype="float32", always_2d=True)
    return resample(a.mean(axis=1), sr)


def trim(a, thresh_db=-45, pad=0.04):
    if not len(a):
        return a
    hop = 240
    n = len(a) // hop
    if n == 0:
        return a
    rms = np.sqrt((a[: n * hop].reshape(n, hop) ** 2).mean(axis=1) + 1e-12)
    db = 20 * np.log10(rms + 1e-9)
    on = np.where(db > db.max() + thresh_db)[0]
    if not len(on):
        return a
    s = max(0, on[0] * hop - int(pad * SR)); e = min(len(a), (on[-1] + 1) * hop + int(pad * SR))
    return a[s:e]


def word_units(text, lang):
    """Weight of each word for timing estimates: letters for English, aksharas (vowel-bearing units) for Telugu."""
    words = text.split()
    if lang == "te":
        weights = [max(1, len(re.findall(r"[\u0C05-\u0C14]|[\u0C15-\u0C39](?![\u0C4D])", w))) for w in words]
    else:
        weights = [max(1, len(re.sub(r"[^\w']", "", w))) for w in words]
    return words, weights

# ---------------------------------------------------------------- render
def render(script, out_dir):
    meta, lines = parse_script(script)
    out = Path(out_dir); out.mkdir(parents=True, exist_ok=True)
    lang, gap = meta["lang"], meta["gap"]
    pieces, t = [], 0.0
    timeline = {"lang": lang, "engine": meta["engine"], "lines": [], "cues": {}}
    words_flat = []
    # batch pass for engines that load a big model once (parler)
    jobs, seen = [], set()
    for L in lines:
        cast = meta["cast"].get(L["who"], {})
        if L["opts"].get("engine", cast.get("engine", meta["engine"])) != "parler" or "file" in L["opts"]:
            continue
        voice = L["opts"].get("voice", cast.get("voice", meta["voice"]))
        speed = float(L["opts"].get("speed", cast.get("speed", meta["speed"])))
        style = L["opts"].get("style", cast.get("style", meta.get("style")))
        for sg in L["segments"]:
            if sg.get("spoken"):
                key = (sg["spoken"], voice, speed, style)
                if key not in seen:
                    seen.add(key)
                    import hashlib
                    jid = hashlib.sha1(json.dumps(key, ensure_ascii=False).encode()).hexdigest()[:12]
                    jobs.append({"id": jid, "key": key, "text": sg["spoken"], "description": parler_description(voice, speed, style, lang)})
    parler_prefetch([{k: v for k, v in j.items()} for j in jobs], out / ".parler-cache")
    f5jobs, f5seen = [], set()
    for L in lines:
        cast = meta["cast"].get(L["who"], {})
        if L["opts"].get("engine", cast.get("engine", meta["engine"])) != "indicf5" or "file" in L["opts"]:
            continue
        ref = L["opts"].get("ref", cast.get("ref", meta.get("ref")))
        if not ref:
            sys.exit(f"line {L['n']}: indicf5 needs ref=clip.wav (a reference voice you have rights to)")
        refp, reft = ref_for(Path(script).parent, ref, L["opts"].get("reftext", cast.get("reftext", meta.get("reftext"))))
        for sg in L["segments"]:
            if sg.get("spoken"):
                key = ("f5", sg["spoken"], refp)
                if key not in f5seen:
                    f5seen.add(key)
                    import hashlib
                    f5jobs.append({"id": hashlib.sha1(json.dumps(key, ensure_ascii=False).encode()).hexdigest()[:12], "key": key,
                                   "text": sg["spoken"], "ref": refp, "ref_text": reft})
    indicf5_prefetch(f5jobs, out / ".indicf5-cache")
    for li, L in enumerate(lines):
        cast = meta["cast"].get(L["who"], {})
        engine = L["opts"].get("engine", cast.get("engine", meta["engine"]))
        voice = L["opts"].get("voice", cast.get("voice", meta["voice"]))
        speed = float(L["opts"].get("speed", cast.get("speed", meta["speed"])))
        start = t
        entry = {"id": f"L{li + 1:02d}", "who": L["who"], "engine": engine, "voice": voice, "text": "", "start": round(start, 3), "segments": [], "words": []}
        if "file" in L["opts"]:
            a = eng_recorded(Path(script).parent / L["opts"]["file"])
            shown = " ".join(s.get("shown", "") for s in L["segments"] if "shown" in s)
            pieces.append(a); dur = len(a) / SR
            entry["segments"].append({"start": round(t, 3), "end": round(t + dur, 3), "text": shown})
            seg_words(entry, shown, t, dur, lang, words_flat, [], timeline)
            t += dur
        else:
            for sgm in L["segments"]:
                if "pause" in sgm:
                    pieces.append(np.zeros(int(sgm["pause"] * SR), np.float32)); t += sgm["pause"]; continue
                if not sgm["spoken"]:
                    for c in sgm["cues"]:
                        timeline["cues"][c["name"]] = round(t, 3)
                    continue
                if engine not in ENGINES and engine != "indicf5":
                    sys.exit(f"line {L['n']}: unknown engine {engine}")
                if engine == "kokoro" and lang == "te":
                    sys.exit(f"line {L['n']}: kokoro can't speak Telugu; set engine google/azure/recorded (espeak for drafts)")
                if engine == "indicf5":
                    ref = L["opts"].get("ref", cast.get("ref", meta.get("ref")))
                    key = ("f5", sgm["spoken"], str((Path(script).parent / ref).resolve()))
                    a = trim(_f5_cache[key])
                elif engine == "parler":
                    a = trim(eng_parler(sgm["spoken"], voice, speed, lang, L["opts"].get("style", cast.get("style", meta.get("style")))))
                else:
                    a = trim(ENGINES[engine](sgm["spoken"], voice, speed, lang))
                dur = len(a) / SR
                pieces.append(a)
                entry["segments"].append({"start": round(t, 3), "end": round(t + dur, 3), "text": sgm["shown"]})
                seg_words(entry, sgm["shown"], t, dur, lang, words_flat, sgm["cues"], timeline)
                t += dur
        entry["end"] = round(t, 3)
        entry["text"] = " ".join(s["text"] for s in entry["segments"]).strip()
        timeline["lines"].append(entry)
        print(f"  {entry['id']} [{L['who']}] {entry['start']:6.2f}–{entry['end']:6.2f}s  {entry['text'][:60]}")
        if li < len(lines) - 1:
            g = float(L["opts"].get("gap", gap))
            pieces.append(np.zeros(int(g * SR), np.float32)); t += g
    audio = np.concatenate(pieces) if pieces else np.zeros(1, np.float32)
    peak = float(np.abs(audio).max() or 1)
    audio = audio / peak * 0.89  # −1 dBFS peak; loudness is set in the mix
    sf.write(out / "voice.wav", audio, SR, subtype="PCM_16")
    timeline["duration"] = round(len(audio) / SR, 3)
    timeline["captions"] = caption_chunks(timeline, lang)
    (out / "timeline.json").write_text(json.dumps(timeline, ensure_ascii=False, indent=2), encoding="utf-8")
    (out / "words.json").write_text(json.dumps(words_flat, ensure_ascii=False, indent=1), encoding="utf-8")
    (out / "cues.json").write_text(json.dumps(timeline["cues"], ensure_ascii=False, indent=2), encoding="utf-8")
    (out / "captions.srt").write_text(srt(timeline, lang), encoding="utf-8")
    print(f"✓ {out/'voice.wav'}  {timeline['duration']:.2f} s · {len(timeline['lines'])} lines · {len(words_flat)} words (times estimated within each segment) · cues: {', '.join(timeline['cues']) or '-'}")
    if any(l["engine"] == "espeak" for l in timeline["lines"]):
        print("  ! espeak is a draft voice: replace before publishing")


def seg_words(entry, shown, t0, dur, lang, words_flat, cues, timeline):
    words, weights = word_units(shown, lang)
    total = sum(weights) or 1
    # leave ~6% at each end for breath/attack, distribute the rest by weight
    lead, body = dur * 0.04, dur * 0.92
    acc, chars = 0, 0
    starts_by_char = []
    for w, k in zip(words, weights):
        s = t0 + lead + body * acc / total; acc += k; e = t0 + lead + body * acc / total
        rec = {"word": w, "start": round(s, 3), "end": round(e, 3), "line": entry["id"], "seg": len(entry["segments"]) - 1}
        entry["words"].append(rec); words_flat.append(rec)
        starts_by_char.append((chars, s)); chars += len(w) + 1
    for c in cues:
        at = t0 + lead
        for ch, s in starts_by_char:
            if ch >= c["at_char"]:
                at = s; break
        else:
            at = t0 + dur
        timeline["cues"][c["name"]] = round(at, 3)


def caption_chunks(tl, lang, max_chars=None):
    """Phone-width caption chunks: never across a pause, ≤ max_chars (Telugu 32, English 42)."""
    max_chars = max_chars or (32 if lang == "te" else 42)
    chunks = []
    for L in tl["lines"]:
        chunk = []
        for w in L["words"] + [None]:
            if w is not None and (not chunk or (w.get("seg") == chunk[-1].get("seg") and len(" ".join(x["word"] for x in chunk + [w])) <= max_chars)):
                chunk.append(w); continue
            if chunk:
                chunks.append({"start": chunk[0]["start"], "end": chunk[-1]["end"], "line": L["id"], "who": L["who"],
                               "words": [{"word": x["word"], "start": x["start"], "end": x["end"]} for x in chunk]})
            chunk = [w] if w else []
    return chunks


def srt(tl, lang):
    def ts(x):
        h, r = divmod(x, 3600); m, s = divmod(r, 60)
        return f"{int(h):02d}:{int(m):02d}:{int(s):02d},{int(round((s - int(s)) * 1000)):03d}"
    return "\n".join(f"{i}\n{ts(c['start'])} --> {ts(c['end'])}\n{' '.join(w['word'] for w in c['words'])}\n"
                     for i, c in enumerate(tl["captions"], 1))

# ---------------------------------------------------------------- mix
def mix(voice, music, sfx, out, lufs, duck):
    inputs, filt = ["-i", voice], []
    if music:
        inputs += ["-stream_loop", "-1", "-i", music]
    if sfx:
        inputs += ["-i", sfx]
    if music:
        thr = 10 ** (-duck / 20)
        filt.append("[0:a]aresample=48000,asplit=2[v][sc]")
        filt.append(f"[1:a]aresample=48000,volume=0.5[m]")
        filt.append(f"[m][sc]sidechaincompress=threshold={thr * 0.05:.4f}:ratio=8:attack=20:release=350[md]")
        mixin = "[v][md]" + ("[2:a]" if sfx else "")
        filt.append(f"{mixin}amix=inputs={3 if sfx else 2}:duration=first:normalize=0[mx]")
    else:
        filt.append("[0:a]aresample=48000" + ("[v];[v][1:a]amix=inputs=2:duration=first:normalize=0[mx]" if sfx else "[mx]"))
    filt.append("[mx]anull[out]")
    tmp = str(Path(out).with_suffix(".premix.wav"))
    subprocess.run(["ffmpeg", "-y", "-v", "error", *inputs, "-filter_complex", ";".join(filt), "-map", "[out]", "-ar", "48000", tmp], check=True)
    # two-pass loudness normalisation: measure, then apply linearly
    m = subprocess.run(["ffmpeg", "-hide_banner", "-i", tmp, "-af", f"loudnorm=I={lufs}:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True)
    js = json.loads(m.stderr[m.stderr.rindex("{"):m.stderr.rindex("}") + 1])
    ln = (f"loudnorm=I={lufs}:TP=-1.5:LRA=11:measured_I={js['input_i']}:measured_TP={js['input_tp']}:"
          f"measured_LRA={js['input_lra']}:measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", tmp, "-af", ln, "-ar", "48000", out], check=True)
    os.remove(tmp)
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", out, "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True)
    i = re.findall(r"I:\s+(-?[0-9.]+) LUFS", r.stderr)
    print(f"✓ {out}  integrated {i[-1] if i else '?'} LUFS (target {lufs})")

# ---------------------------------------------------------------- cli
def main():
    a = sys.argv[1:]
    if not a or a[0] in ("-h", "--help"):
        print(__doc__); return
    cmd = a[0]
    if cmd == "render":
        script = a[1]
        out = a[a.index("--out") + 1] if "--out" in a else str(Path(script).parent / "audio")
        render(script, out)
    elif cmd == "check":
        meta, lines = parse_script(a[1])
        nw = sum(len(s["shown"].split()) for L in lines for s in L["segments"] if "shown" in s)
        wpm = {"en": 155, "te": 120}[meta["lang"]]
        print(f"lang {meta['lang']} · engine {meta['engine']} · {len(lines)} lines · {nw} words · ≈ {nw / wpm * 60:.0f} s at {wpm} wpm")
        for L in lines:
            print(f"  [{L['who']}] " + " | ".join(s.get("shown", f"<pause {s.get('pause')}>") for s in L["segments"]))
    elif cmd == "mix":
        g = lambda k, d=None: a[a.index(k) + 1] if k in a else d
        mix(g("--voice"), g("--music"), g("--sfx"), g("--out", "mix.wav"), float(g("--lufs", -14)), float(g("--duck", 10)))
    elif cmd == "voices":
        lang = a[1] if len(a) > 1 else None
        if lang in (None, "en"):
            try:
                names = sorted(np.load(CACHE / "voices.npz").files)
                en = [v for v in names if v[:2] in ("af", "am", "bf", "bm")]
                print("en · kokoro (offline):\n  US female: " + ", ".join(v for v in en if v.startswith("af")) +
                      "\n  US male:   " + ", ".join(v for v in en if v.startswith("am")) +
                      "\n  UK female: " + ", ".join(v for v in en if v.startswith("bf")) +
                      "\n  UK male:   " + ", ".join(v for v in en if v.startswith("bm")))
            except FileNotFoundError:
                print("en · kokoro: run scripts/voice-setup.sh")
            for e, v in ENGLISH_CLOUD.items():
                print(f"en · {e}: " + ", ".join(v))
        if lang in (None, "te"):
            for e, v in TELUGU_VOICES.items():
                print(f"te · {e}: " + ", ".join(v))
    else:
        print(__doc__); sys.exit(1)


if __name__ == "__main__":
    main()
