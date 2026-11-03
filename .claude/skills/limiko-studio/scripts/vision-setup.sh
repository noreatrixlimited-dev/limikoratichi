#!/usr/bin/env bash
# One-time setup for gaming edits: scripts/gameedit.py and scripts/charglow.py.
# Builds ~/.cache/limiko-voice/venv-vision. To save disk it reuses torch + transformers from the Telugu voice
# venv (venv-te, made by voice-setup.sh --telugu) when present; otherwise installs its own.
# Model: facebook/detr-resnet-50-panoptic (Apache-2.0), downloaded from Hugging Face on first use (~170 MB).
set -euo pipefail
C="${LIMIKO_VOICE_CACHE:-$HOME/.cache/limiko-voice}"
mkdir -p "$C" && cd "$C"
if [ ! -x venv-vision/bin/python ]; then
  python3 -m venv venv-vision
  if [ -x venv-te/bin/python ] && venv-te/bin/python -c "import torch, transformers" 2>/dev/null; then
    SP=$(venv-te/bin/python -c "import site;print(site.getsitepackages()[0])")
    echo "$SP" > "$(venv-vision/bin/python -c "import site;print(site.getsitepackages()[0])")/zz-share-venv-te.pth"
    echo "· sharing torch + transformers from venv-te"
  else
    if command -v nvidia-smi >/dev/null 2>&1; then venv-vision/bin/pip -q install torch
    else venv-vision/bin/pip -q install torch --index-url https://download.pytorch.org/whl/cpu 2>/dev/null || venv-vision/bin/pip -q install torch; fi
    venv-vision/bin/pip -q install "transformers>=4.40,<5" soundfile
  fi
fi
venv-vision/bin/pip -q install --no-cache-dir timm opencv-python-headless
venv-vision/bin/python -c "import torch, transformers, timm, cv2, soundfile; print('✓ venv-vision ready: torch', torch.__version__, '· opencv', cv2.__version__)"
