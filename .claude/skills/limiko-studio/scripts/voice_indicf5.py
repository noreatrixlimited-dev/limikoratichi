#!/usr/bin/env python3
"""Batch renderer for AI4Bharat IndicF5 (MIT): Telugu (and other Indian languages) in the voice of a reference clip.
Called by voice.py (engine `indicf5`).

    voice_indicf5.py <jobs.json> <out_dir>
jobs.json: [{"id": "j0", "text": "…", "ref": "/abs/ref.wav", "ref_text": "transcript of ref.wav"}, …]

Reference clip: 5–12 s, one speaker, clean, with its exact transcript. Only voices you have the right to use
(your own, a consenting artist, or a voice the studio generated, e.g. a Parler line).
Runs in ~/.cache/limiko-voice/venv-f5 (separate from parler's venv-te). Needs HF_TOKEN from an account that accepted ai4bharat/IndicF5 terms.
The model repo ships its own loading code (trust_remote_code): official AI4Bharat repo, pinned by revision.
"""
import json, os, sys, time
from pathlib import Path

MODEL = os.environ.get("LIMIKO_INDICF5_MODEL", "ai4bharat/IndicF5")
REVISION = os.environ.get("LIMIKO_INDICF5_REVISION")  # pin a commit once a good one is verified


def load_model(tok):
    """Build the model on real CPU tensors and load its weights ourselves.
    transformers 5 builds remote-code models on the 'meta' device, but IndicF5's constructor loads its vocoder there
    and fails; it also wraps both nets in torch.compile, which is slow to warm up on CPU. So: construct with
    torch.compile as a no-op, then load model.safetensors (keys saved with the compile prefix '_orig_mod.')."""
    import torch
    from transformers import AutoConfig
    from transformers.dynamic_module_utils import get_class_from_dynamic_module
    from huggingface_hub import hf_hub_download
    from safetensors.torch import load_file
    rev = {"revision": REVISION} if REVISION else {}
    cfg = AutoConfig.from_pretrained(MODEL, trust_remote_code=True, token=tok, **rev)
    cls = get_class_from_dynamic_module(cfg.auto_map["AutoModel"], MODEL, token=tok, **rev)
    real_compile = torch.compile
    torch.compile = lambda m, *a, **k: m
    try:
        model = cls(cfg)
    finally:
        torch.compile = real_compile
    sd = load_file(hf_hub_download(MODEL, "model.safetensors", token=tok, **rev))
    sd = {k.replace("._orig_mod", ""): v for k, v in sd.items()}
    missing, unexpected = model.load_state_dict(sd, strict=False)
    if missing or unexpected:
        print(f"  indicf5: {len(missing)} missing / {len(unexpected)} unexpected weights", file=sys.stderr)
        if len(missing) > 5:
            sys.exit("indicf5: weights don't match the model; pin LIMIKO_INDICF5_REVISION to a known-good commit")
    return model.eval()


def main():
    jobs = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    out = Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)
    todo = [j for j in jobs if not (out / f"{j['id']}.wav").exists()]
    if not todo:
        return
    import numpy as np, soundfile as sf
    # f5_tts imports its training dataset code (HF `datasets` → pyarrow) even for inference. When that stack can't load
    # (pyarrow built for NumPy 2 while F5 pins NumPy 1.x), give it a stand-in: inference never touches these names.
    try:
        import datasets  # noqa: F401
    except Exception:
        import types
        stub = types.ModuleType("datasets")
        stub.Dataset = type("Dataset", (), {})
        stub.load_from_disk = stub.load_dataset = lambda *a, **k: (_ for _ in ()).throw(RuntimeError("datasets unavailable (inference only)"))
        sys.modules["datasets"] = stub

    tok = os.environ.get("HF_TOKEN") or os.environ.get("HUGGING_FACE_HUB_TOKEN")
    t0 = time.time()
    model = load_model(tok)
    # newer torchaudio reads files only through the optional torchcodec package; F5 just needs (waveform, rate)
    import torch, torchaudio
    def _load(path, *a, **k):
        data, sr = sf.read(str(path), dtype="float32", always_2d=True)
        return torch.from_numpy(data.T.copy()), sr
    torchaudio.load = _load
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
