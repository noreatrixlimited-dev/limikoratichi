#!/usr/bin/env bash
# One command to set up the studio. Pick what you need; each part is skipped if it is already installed.
#
#   bash scripts/setup.sh                 renderer + English voice  (≈ 0.5 GB)
#   bash scripts/setup.sh --telugu        + native Telugu voices (Parler, IndicF5)   (≈ +5 GB, needs Hugging Face access)
#   bash scripts/setup.sh --vision        + gaming edits: character identify/track, thumbnails (≈ +0.5 GB, after --telugu)
#   bash scripts/setup.sh --all           everything
#   bash scripts/setup.sh --check         only report what is installed
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; SKILL="$(dirname "$HERE")"; CACHE="$HOME/.cache/limiko-voice"
TE=0; VI=0; CHECK=0
for a in "$@"; do case "$a" in --telugu) TE=1;; --vision) VI=1;; --all) TE=1; VI=1;; --check) CHECK=1;; *) echo "unknown option $a"; exit 1;; esac; done

ok() { printf '  \033[32m✓\033[0m %s\n' "$1"; }
no() { printf '  \033[33m·\033[0m %s\n' "$1"; }
status() {
  echo "Limiko Studio setup:"
  for t in node ffmpeg python3; do command -v $t >/dev/null && ok "$t" || no "$t missing (install it first)"; done
  [ -d "$SKILL/frames/node_modules/three" ] && ok "renderer packages (three.js, MathJax, fonts)" || no "renderer packages"
  node -e "require('playwright')" 2>/dev/null && ok "Playwright + Chromium" || no "Playwright (npm i -g playwright && npx playwright install chromium)"
  [ -f "$CACHE/kokoro-q8.onnx" ] && ok "English voice (Kokoro)" || no "English voice"
  [ -x "$CACHE/venv-te/bin/python" ] && ok "Telugu voice (Indic Parler-TTS)" || no "Telugu voice (--telugu)"
  [ -x "$CACHE/venv-f5/bin/python" ] && ok "Telugu reference-voice engine (IndicF5)" || no "IndicF5 (--telugu)"
  [ -x "$CACHE/venv-vision/bin/python" ] && ok "gaming vision (DETR + SAM 2)" || no "gaming vision (--vision)"
}
if [ $CHECK = 1 ]; then status; exit 0; fi

for t in node ffmpeg python3; do command -v $t >/dev/null || { echo "$t is required"; exit 1; }; done
echo "→ renderer packages"; (cd "$SKILL/frames" && npm ci --no-audit --no-fund)
node -e "require('playwright')" 2>/dev/null || echo "  note: Playwright not found. Install once: npm i -g playwright && npx playwright install --with-deps chromium"
[ -f "$CACHE/kokoro-q8.onnx" ] || { echo "→ English voice"; bash "$HERE/voice-setup.sh"; }
if [ $TE = 1 ]; then echo "→ Telugu voices"; bash "$HERE/voice-setup.sh" --telugu; fi
if [ $VI = 1 ]; then echo "→ gaming vision"; bash "$HERE/vision-setup.sh"; fi
status
echo "Next: python3 scripts/make.py new my-first-film --format facts --lang en,te"
