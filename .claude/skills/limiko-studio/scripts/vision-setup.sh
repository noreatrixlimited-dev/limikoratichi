#!/usr/bin/env bash
# One-time setup for gaming edits: scripts/gameedit.py and scripts/charglow.py.
# Builds ~/.cache/limiko-voice/venv-vision. To save disk it reuses torch + transformers from the Telugu voice
# venv (venv-te, made by voice-setup.sh --telugu) when present; otherwise installs its own.
# Models (Apache-2.0): facebook/detr-resnet-50-panoptic (identify) + facebook/sam2.1-hiera-tiny (track), ~330 MB.
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
# SAM 2 video tracking needs transformers >= 4.57; installed inside venv-vision only (shadows venv-te's pinned 4.46,
# which the Telugu voice keeps using). The pip resolver warning about parler-tts here is expected and harmless.
venv-vision/bin/pip -q install --no-cache-dir timm opencv-python-headless "transformers>=4.57,<5" 2>&1 | grep -v "parler-tts" || true
venv-vision/bin/python -c "from huggingface_hub import snapshot_download as s; [s(m) for m in ('facebook/detr-resnet-50-panoptic', 'facebook/sam2.1-hiera-tiny')]" >/dev/null && echo "✓ models: DETR panoptic + SAM 2.1 tiny"
venv-vision/bin/python -c "import torch, transformers, timm, cv2, soundfile; print('✓ venv-vision ready: torch', torch.__version__, '· opencv', cv2.__version__)"
