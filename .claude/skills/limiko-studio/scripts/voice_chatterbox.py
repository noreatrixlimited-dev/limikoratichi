#!/usr/bin/env python3
"""Batch renderer for Chatterbox (Resemble AI, MIT): expressive English narration. Called by voice.py (engine `chatterbox`).

    voice_chatterbox.py <jobs.json> <out_dir>
jobs.json: [{"id": "…", "text": "…", "ref": "/abs/clip.wav" | null, "emotion": 0.5, "cfg": 0.5, "speed": 1.0}, …]

emotion: 0.25 (flat, calm) … 0.5 (natural, default) … 1.0+ (dramatic, excited). Kids / gaming 0.6–0.8, documentary 0.4.
cfg:     how closely it follows the reference's pacing; lower (0.3) = slower, more deliberate delivery.
ref:     optional 5–15 s clip of a voice you have the right to use (your own, a consenting artist, or a studio-made
         voice). Without it the model's built-in default voice is used.
speed:   applied after generation with ffmpeg atempo (pitch kept).
Every output carries the model's imperceptible audio watermark (Resemble's Perth), as shipped by the authors.
Runs in ~/.cache/limiko-voice/venv-cb (shares torch with venv-f5; see scripts/voice-setup.sh --chatterbox).
"""
import json, os, subprocess, sys, tempfile, time, warnings
from pathlib import Path

warnings.filterwarnings("ignore")
os.environ.setdefault("TRANSFORMERS_VERBOSITY", "error")


def main():
    jobs = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    out = Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)
    todo = [j for j in jobs if not (out / f"{j['id']}.wav").exists()]
    if not todo:
        return
    import numpy as np, soundfile as sf, torch
    torch.manual_seed(7)   # repeatable takes
    from chatterbox.tts import ChatterboxTTS
    t0 = time.time()
    model = ChatterboxTTS.from_pretrained(device="cuda" if torch.cuda.is_available() else "cpu")
    print(f"  chatterbox: model loaded in {time.time() - t0:.0f}s ({len(todo)} segments)", file=sys.stderr)
    for j in todo:
        t1 = time.time()
        kw = {"exaggeration": float(j.get("emotion", 0.5)), "cfg_weight": float(j.get("cfg", 0.5))}
        if j.get("ref"):
            kw["audio_prompt_path"] = j["ref"]
        # neural TTS sometimes stops early (more often at high emotion): a take shorter than ~0.17 s per word (faster than ~350 wpm) is
        # retried with a new seed and a slower, steadier delivery; the longest take is kept
        need = 0.17 * len(j["text"].split())   # verified by ASR: excited takes at ~0.2 s/word are complete
        best = None
        for attempt in range(3):
            torch.manual_seed(7 + attempt)
            wav = model.generate(j["text"], **kw)
            a = wav.squeeze(0).detach().cpu().numpy().astype(np.float32)
            if best is None or len(a) > len(best):
                best = a
            if len(a) / model.sr >= need:
                break
            kw["cfg_weight"] = max(0.2, kw["cfg_weight"] - 0.15)
            print(f"  chatterbox: {j['id']} take {attempt + 1} too short ({len(a) / model.sr:.1f}s), retrying slower", file=sys.stderr)
        a = best
        dst = out / f"{j['id']}.wav"
        sp = float(j.get("speed", 1.0))
        if abs(sp - 1.0) > 0.01:
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tf:
                sf.write(tf.name, a, model.sr)
            subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", tf.name, "-filter:a", f"atempo={min(2.0, max(0.5, sp))}", str(dst)], check=True)
            os.unlink(tf.name)
        else:
            sf.write(dst, a, model.sr)
        print(f"  chatterbox: {j['id']} {len(a) / model.sr:.1f}s audio in {time.time() - t1:.0f}s", file=sys.stderr)


if __name__ == "__main__":
    main()
