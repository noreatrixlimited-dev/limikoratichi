#!/usr/bin/env bash
# One-time setup for scripts/voice.py.
# Builds an offline English voice engine (Kokoro-82M, Apache-2.0) from package registries only
# (npm + PyPI), so it works where model hosts are blocked. Cache: ~/.cache/limiko-voice
set -euo pipefail
C="${LIMIKO_VOICE_CACHE:-$HOME/.cache/limiko-voice}"
mkdir -p "$C" && cd "$C"

if [ ! -f kokoro-q8.onnx ]; then
  echo "↓ Kokoro weights (npm: kokoro-q8-shards, Apache-2.0)"
  npm pack kokoro-q8-shards@1.0.0 --silent >/dev/null
  mkdir -p shards && tar xzf kokoro-q8-shards-1.0.0.tgz -C shards
  cat shards/package/kokoro-q8.part{0..5}.bin > kokoro-q8.onnx
  echo "fbae9257e1e05ffc727e951ef9b9c98418e6d79f1c9b6b13bd59f5c9028a1478  kokoro-q8.onnx" | sha256sum -c -
  rm -rf shards kokoro-q8-shards-1.0.0.tgz
fi

if [ ! -d venv ]; then
  echo "↓ Python runtime (PyPI: kokoro-onnx, soundfile)"
  python3 -m venv venv
  venv/bin/pip -q install kokoro-onnx==0.6.1 soundfile
fi

if [ ! -f voices.npz ]; then
  echo "↓ Kokoro voices (npm: kokoro-js, Apache-2.0)"
  npm pack kokoro-js@1.2.1 --silent >/dev/null
  mkdir -p js && tar xzf kokoro-js-1.2.1.tgz -C js
  venv/bin/python - <<'EOF'
import numpy as np, glob, os
v = {os.path.basename(f)[:-4]: np.fromfile(f, dtype=np.float32).reshape(-1, 1, 256)
     for f in sorted(glob.glob('js/package/voices/*.bin'))}
np.savez('voices.npz', **v)
print(f"  {len(v)} voices")
EOF
  rm -rf js kokoro-js-1.2.1.tgz
fi

# Native Telugu voice (optional): AI4Bharat Indic Parler-TTS, Apache-2.0.  bash voice-setup.sh --telugu
# Needs huggingface.co reachable and HF_TOKEN from an account that accepted the model's terms
# (https://huggingface.co/ai4bharat/indic-parler-tts). ~3 GB for torch + model; CPU works (slow), GPU is fast.
if [ "${1:-}" = "--telugu" ]; then
  if [ ! -x venv-te/bin/python ] || ! venv-te/bin/python -c "import parler_tts" 2>/dev/null; then
    echo "↓ Telugu voice runtime (PyPI torch + github huggingface/parler-tts)"
    python3 -m venv venv-te
    venv-te/bin/pip -q install torch soundfile
    venv-te/bin/pip -q install "git+https://github.com/huggingface/parler-tts.git"
  fi
  if [ -n "${HF_TOKEN:-}" ]; then
    echo "↓ model ai4bharat/indic-parler-tts (first time ~3.8 GB)"
    venv-te/bin/python -c "from huggingface_hub import snapshot_download as s; import os; s('ai4bharat/indic-parler-tts', token=os.environ['HF_TOKEN'])" \
      && echo "✓ native Telugu voice ready (engine: parler)"
  else
    echo "· set HF_TOKEN, then run this again to download the model"
  fi
fi

# Telugu draft voice (robotic; for timing drafts only). Needs apt.
if ! command -v espeak-ng >/dev/null 2>&1; then
  (apt-get install -y -q espeak-ng >/dev/null 2>&1 || true)
fi
command -v espeak-ng >/dev/null && echo "✓ espeak-ng (Telugu draft voice)" || echo "· espeak-ng not installed (Telugu drafts unavailable)"
echo "✓ voice engine ready in $C"
