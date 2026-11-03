#!/usr/bin/env python3
"""Batch renderer for AI4Bharat Indic Parler-TTS (Apache-2.0). Called by voice.py (engine `parler`).

    voice_parler.py <jobs.json> <out_dir>
jobs.json: [{"id": "j0", "text": "…", "description": "Lalitha speaks …"}, …]  →  out_dir/<id>.wav (24 kHz mono)

Runs in its own venv (~/.cache/limiko-voice/venv-te: torch + parler-tts). Needs a Hugging Face token with the
model's terms accepted (env HF_TOKEN). The model is loaded once per batch.
"""
import json, os, sys, time
from pathlib import Path

MODEL = os.environ.get("LIMIKO_PARLER_MODEL", "ai4bharat/indic-parler-tts")


def main():
    jobs = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    out = Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)
    todo = [j for j in jobs if not (out / f"{j['id']}.wav").exists()]
    if not todo:
        return
    import torch, soundfile as sf
    from parler_tts import ParlerTTSForConditionalGeneration
    from transformers import AutoTokenizer
    torch.manual_seed(int(os.environ.get("LIMIKO_PARLER_SEED", "7")))
    t0 = time.time()
    tok = os.environ.get("HF_TOKEN") or os.environ.get("HUGGING_FACE_HUB_TOKEN")
    model = ParlerTTSForConditionalGeneration.from_pretrained(MODEL, token=tok).eval()
    tokenizer = AutoTokenizer.from_pretrained(MODEL, token=tok)
    desc_tok = AutoTokenizer.from_pretrained(model.config.text_encoder._name_or_path, token=tok)
    sr = model.config.sampling_rate
    print(f"  parler: model loaded in {time.time() - t0:.0f}s ({len(todo)} segments)", file=sys.stderr)
    for j in todo:
        t1 = time.time()
        d = desc_tok(j["description"], return_tensors="pt")
        p = tokenizer(j["text"], return_tensors="pt")
        with torch.no_grad():
            audio = model.generate(input_ids=d.input_ids, attention_mask=d.attention_mask,
                                   prompt_input_ids=p.input_ids, prompt_attention_mask=p.attention_mask)
        a = audio.cpu().numpy().squeeze()
        sf.write(out / f"{j['id']}.wav", a, sr)
        print(f"  parler: {j['id']} {len(a) / sr:.1f}s audio in {time.time() - t1:.0f}s", file=sys.stderr)


if __name__ == "__main__":
    main()
