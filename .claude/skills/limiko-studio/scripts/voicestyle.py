#!/usr/bin/env python3
"""Measure how a narration is delivered, and compare ours with a reference (the "accent" of a channel's voice).

    voicestyle.py analyze <audio> [--lang en|te] [--out profile.json]
    voicestyle.py compare <reference audio> <our audio> [--lang en]      what to change so ours sounds like the reference
    voicestyle.py pick <reference audio> <candidate audio…> [--text "the script"]   rank candidate voices (closest + clearest)
    The reference can also be a saved profile: shared/voice-profiles/<name>.json (e.g. facts-short-firm.json).

Measures (all from the audio, nothing copied):
    pace        words per minute while speaking, and overall (with pauses)
    pauses      count per minute, median and long pauses (sentence breaks), longest
    phrases     median spoken stretch between pauses (seconds and words)
    pitch       median F0 (Hz), range (semitones, 10th–90th percentile): low = flat/firm, high = lively
    energy      loudness (LUFS), dynamic range (dB) between loud and soft syllables, attack (how punchy word onsets are)
    tone        spectral centroid (brightness) and the share of energy below 300 Hz (chest / depth)
    clarity     ASR word accuracy against the script when --text is given (otherwise ASR confidence)
Runs in ~/.cache/limiko-voice/venv-te (librosa + torch + transformers); English ASR facebook/wav2vec2-base-960h,
Telugu ASR wav2vec2-large-xlsr-53-telugu (both Apache-2.0). Reference audio stays local: only numbers are written.
"""
import argparse, json, os, re, subprocess, sys, warnings
from pathlib import Path

warnings.filterwarnings("ignore")
os.environ.setdefault("TRANSFORMERS_VERBOSITY", "error")
CACHE = Path(os.environ.get("LIMIKO_VOICE_CACHE", Path.home() / ".cache" / "limiko-voice"))
VENV = CACHE / "venv-te" / "bin" / "python"
try:
    import numpy as np, librosa, soundfile as sf  # noqa: F401
except ImportError:
    if VENV.exists() and Path(sys.prefix).resolve() != (CACHE / "venv-te").resolve():
        os.execv(str(VENV), [str(VENV), *sys.argv])
    sys.exit("needs librosa: run scripts/voice-setup.sh --telugu (venv-te)")

SR = 16000
ASR = {"en": "facebook/wav2vec2-base-960h", "te": str(CACHE / "models" / "wav2vec2-large-xlsr-53-telugu")}


def load(path):
    a, sr = librosa.load(path, sr=SR, mono=True)
    return a.astype(np.float32)


def lufs(path):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(path), "-af", "ebur128=framelog=quiet", "-f", "null", "-"], capture_output=True, text=True)
    m = re.findall(r"I:\s+(-?[\d.]+) LUFS", r.stderr)
    return float(m[-1]) if m else None


_asr = {}


def transcribe(a, lang):
    import torch
    from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor
    if lang not in _asr:
        p = Wav2Vec2Processor.from_pretrained(ASR[lang]); m = Wav2Vec2ForCTC.from_pretrained(ASR[lang]).eval()
        _asr[lang] = (p, m)
    p, m = _asr[lang]
    out, confs = [], []
    for i in range(0, len(a), SR * 20):
        with torch.no_grad():
            lg = m(p(a[i:i + SR * 20], sampling_rate=SR, return_tensors="pt").input_values).logits
        pr = lg.softmax(-1).max(-1).values[0].numpy(); ids = lg.argmax(-1)
        keep = ids[0].numpy() != p.tokenizer.pad_token_id
        confs.append(float(pr[keep].mean()) if keep.any() else 0.0)
        out.append(p.batch_decode(ids)[0])
    return " ".join(out).strip(), float(np.mean(confs)) if confs else 0.0


def norm_words(s):
    return re.sub(r"[^\w\s']", " ", s.lower()).split()


def word_accuracy(ref_text, hyp):
    r, h = norm_words(ref_text), norm_words(hyp)
    if not r:
        return None
    d = list(range(len(h) + 1))
    for i in range(1, len(r) + 1):
        prev, d[0] = d[0], i
        for j in range(1, len(h) + 1):
            cur = d[j]; d[j] = min(d[j] + 1, d[j - 1] + 1, prev + (r[i - 1] != h[j - 1])); prev = cur
    return max(0.0, 1 - d[len(h)] / len(r))


def analyze(path, lang="en", text=None):
    a = load(path); dur = len(a) / SR
    # speech vs pause: RMS in 20 ms frames against an adaptive floor
    hop = int(0.02 * SR); rms = librosa.feature.rms(y=a, frame_length=hop * 2, hop_length=hop)[0]
    db = 20 * np.log10(rms + 1e-6); floor = np.percentile(db, 10); speech = db > max(floor + 12, np.percentile(db, 30))
    # pauses ≥ 120 ms
    pauses, run = [], 0
    for s in speech:
        if not s: run += 1
        else:
            if run * 0.02 >= 0.12: pauses.append(run * 0.02)
            run = 0
    spoken = speech.sum() * 0.02
    phrases, cur = [], 0
    for s in speech:
        if s: cur += 1
        elif cur: phrases.append(cur * 0.02); cur = 0
    phrases = [p for p in phrases if p > 0.25]
    hyp, conf = transcribe(a, lang)
    nw = len(norm_words(hyp)) if lang == "en" or not text else len(text.split())
    if text:
        nw = len(norm_words(text))
    f0, vf, _ = librosa.pyin(a, fmin=60, fmax=400, sr=SR, frame_length=1024, hop_length=320)
    f0 = f0[vf & ~np.isnan(f0)]
    p10, p50, p90 = (np.percentile(f0, [10, 50, 90]) if len(f0) else (0, 0, 0))
    S = np.abs(librosa.stft(a, n_fft=1024, hop_length=320)); freqs = librosa.fft_frequencies(sr=SR, n_fft=1024)
    cent = librosa.feature.spectral_centroid(S=S, sr=SR)[0]
    low = S[freqs < 300].sum() / (S.sum() + 1e-9)
    onset = librosa.onset.onset_strength(y=a, sr=SR, hop_length=320)
    sp_db = db[speech]
    prof = {
        "file": Path(path).name, "duration_s": round(dur, 2), "words": nw,
        "pace_wpm_speaking": round(nw / (spoken / 60), 1) if spoken else None,
        "pace_wpm_overall": round(nw / (dur / 60), 1),
        "pauses_per_min": round(len(pauses) / (dur / 60), 1),
        "pause_median_s": round(float(np.median(pauses)), 2) if pauses else 0,
        "pause_long_share": round(sum(p >= 0.35 for p in pauses) / max(1, len(pauses)), 2),
        "pause_longest_s": round(max(pauses), 2) if pauses else 0,
        "phrase_median_s": round(float(np.median(phrases)), 2) if phrases else 0,
        "pitch_median_hz": round(float(p50), 1), "pitch_range_st": round(float(12 * np.log2(p90 / p10)), 1) if p10 else 0,
        "loudness_lufs": lufs(path), "dynamics_db": round(float(np.percentile(sp_db, 95) - np.percentile(sp_db, 20)), 1) if len(sp_db) else 0,
        "attack": round(float(np.percentile(onset, 95) / (np.median(onset) + 1e-6)), 2),
        "brightness_hz": round(float(np.median(cent)), 0), "depth_low_share": round(float(low), 3),
        "asr_confidence": round(conf, 3),
    }
    if text:
        prof["clarity_word_accuracy"] = round(word_accuracy(text, hyp), 3)
    prof["transcript"] = hyp[:4000]
    return prof


ADVICE = [  # (metric, tolerance, advice if ours is lower, advice if ours is higher)
    ("pace_wpm_speaking", 0.08, "speak faster (engine speed up, or shorter pauses inside lines)", "slow down (speed 0.9–0.95, or Chatterbox cfg lower)"),
    ("pauses_per_min", 0.25, "add pauses: split long lines, use {pause 0.3} between beats", "fewer pauses: join short lines into one sentence"),
    ("pause_median_s", 0.25, "longer pauses between lines (front matter gap: up)", "shorter pauses (gap: down)"),
    ("pitch_range_st", 0.2, "more melody: raise emotion (Chatterbox) or use a livelier voice", "flatter, firmer delivery: lower emotion (0.4–0.5)"),
    ("pitch_median_hz", 0.12, "a higher voice", "a deeper voice (a lower-pitched speaker or reference clip)"),
    ("attack", 0.15, "punchier word onsets: stronger emotion, crisper voice", "softer onsets"),
    ("brightness_hz", 0.15, "brighter, more forward tone (crisper voice; light presence EQ +2 dB at 3–5 kHz)", "warmer, darker tone (less treble)"),
    ("depth_low_share", 0.25, "more chest (deeper voice, or low-shelf +2 dB at 150 Hz)", "less boom (high-pass at 90 Hz)"),
]


def reference(path, lang):
    if str(path).endswith(".json"):
        d = json.loads(Path(path).read_text(encoding="utf-8"))
        return d.get("targets", d)
    return analyze(path, lang)


def compare(ref, ours):
    rows, todo = [], []
    for k, tol, lo, hi in ADVICE:
        a, b = ref.get(k), ours.get(k)
        if not a or b is None:
            continue
        d = (b - a) / abs(a)
        mark = "ok" if abs(d) <= tol else ("lower" if d < 0 else "higher")
        rows.append((k, a, b, f"{d:+.0%}", mark))
        if mark == "lower": todo.append(f"{k}: {lo}")
        elif mark == "higher": todo.append(f"{k}: {hi}")
    if ours.get("asr_confidence", 1) < ref.get("asr_confidence", 0) - 0.03:
        todo.append("clarity: the recogniser is less sure of our words than of the reference: use a clearer voice, slower pace or less emotion")
    return rows, todo


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sp = ap.add_subparsers(dest="cmd", required=True)
    a1 = sp.add_parser("analyze"); a1.add_argument("audio"); a1.add_argument("--lang", default="en"); a1.add_argument("--text"); a1.add_argument("--out")
    a2 = sp.add_parser("compare"); a2.add_argument("ref"); a2.add_argument("ours"); a2.add_argument("--lang", default="en"); a2.add_argument("--text")
    a3 = sp.add_parser("pick"); a3.add_argument("ref"); a3.add_argument("cands", nargs="+"); a3.add_argument("--lang", default="en"); a3.add_argument("--text")
    a = ap.parse_args()
    if a.cmd == "analyze":
        p = analyze(a.audio, a.lang, a.text)
        s = json.dumps(p, indent=2, ensure_ascii=False)
        (Path(a.out).write_text(s + "\n", encoding="utf-8") if a.out else None); print(s)
    elif a.cmd == "compare":
        ref, ours = reference(a.ref, a.lang), analyze(a.ours, a.lang, a.text)
        rows, todo = compare(ref, ours)
        print(f"{'metric':22} {'reference':>10} {'ours':>10} {'diff':>7}  ")
        for k, x, y, d, m in rows: print(f"{k:22} {x:>10} {y:>10} {d:>7}  {m}")
        print(f"{'asr_confidence':22} {ref.get('asr_confidence', '-'):>10} {ours['asr_confidence']:>10}")
        if "clarity_word_accuracy" in ours: print(f"clarity (word accuracy vs script): {ours['clarity_word_accuracy']:.0%}")
        print("\nto sound closer to the reference:" if todo else "\nclose to the reference on every measure")
        for t in todo: print("  -", t)
    else:
        ref = reference(a.ref, a.lang); res = []
        for c in a.cands:
            o = analyze(c, a.lang, a.text); rows, todo = compare(ref, o)
            off = sum(1 for r in rows if r[4] != "ok"); clar = o.get("clarity_word_accuracy", o["asr_confidence"])
            res.append((off - 4 * clar, c, off, clar, o))
        res.sort()
        for _, c, off, clar, o in res:
            print(f"{Path(c).name:40} off on {off} measures · clarity {clar:.0%} · {o['pace_wpm_speaking']} wpm · pitch {o['pitch_median_hz']} Hz ±{o['pitch_range_st']} st")
        print("best:", Path(res[0][1]).name)


if __name__ == "__main__":
    main()
