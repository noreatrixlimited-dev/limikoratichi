#!/usr/bin/env python3
"""Batch renderer for AI4Bharat IndicF5 (MIT): Telugu (and other Indian languages) in the voice of a reference clip.
Called by voice.py (engine `indicf5`).

    voice_indicf5.py <jobs.json> <out_dir>
jobs.json: [{"id": "j0", "text": "…", "ref": "/abs/ref.wav", "ref_text": "transcript of ref.wav"}, …]

Reference clip: 5–12 s, one speaker, clean, with its exact transcript. Only voices you have the right to use
(your own, a consenting artist, or a voice the studio generated, e.g. a Parler line).
Runs in ~/.cache/limiko-voice/venv-te. Needs HF_TOKEN from an account that accepted ai4bharat/IndicF5 terms.
The model repo ships its own loading code (trust_remote_code): official AI4Bharat repo, pinned by revision.
"""
import json, os, sys, time
from pathlib import Path

MODEL = os.environ.get("LIMIKO_INDICF5_MODEL", "ai4bharat/IndicF5")
REVISION = os.environ.get("LIMIKO_INDICF5_REVISION")  # pin a commit once a good one is verified


def main():
    jobs = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    out = Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)
    todo = [j for j in jobs if not (out / f"{j['id']}.wav").exists()]
    if not todo:
        return
    import numpy as np, soundfile as sf
    from transformers import AutoModel
    tok = os.environ.get("HF_TOKEN") or os.environ.get("HUGGING_FACE_HUB_TOKEN")
    t0 = time.time()
    model = AutoModel.from_pretrained(MODEL, trust_remote_code=True, token=tok, **({"revision": REVISION} if REVISION else {}))
    print(f"  indicf5: model loaded in {time.time() - t0:.0f}s ({len(todo)} segments)", file=sys.stderr)
    for j in todo:
        t1 = time.time()
        audio = model(j["text"], ref_audio_path=j["ref"], ref_text=j["ref_text"])
        a = np.asarray(audio, dtype=np.float32)
        if a.dtype.kind == "i" or np.abs(a).max() > 1.5:
            a = a / 32768.0
        sf.write(out / f"{j['id']}.wav", a, 24000)
        print(f"  indicf5: {j['id']} {len(a) / 24000:.1f}s audio in {time.time() - t1:.0f}s", file=sys.stderr)


if __name__ == "__main__":
    main()
