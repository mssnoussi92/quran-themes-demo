#!/bin/bash
# Setup script for the Claude Code cloud environment of quran-themes-demo.
#
# Paste this whole file into: claude.ai/code > environment picker > (environment) > Setup script.
# See docs/cloud-environment.md for the network allowlist this script needs.
#
# Constraints from the platform:
#   - runs as root on Ubuntu 24.04, before Claude Code starts;
#   - must exit 0, otherwise the session does not start;
#   - finishing in about 5 minutes lets the environment be cached (snapshot reused by later sessions);
#   - the environment variables of the environment are NOT set yet when it runs.
#
# Keep the package pins in sync with requirements/*.txt.

set -uo pipefail
log() { echo "[setup] $(date -u +%H:%M:%S) $*"; }

SILMA_PKGS=("silma-tts==1.0.5")
VOICETUT_PKGS=("voicetut-tts==0.1.1" "omnivoice==0.2.1")
VENVS=/opt/venvs

# 1) System packages: ffmpeg (MP3 and video), libsndfile (audio I/O), Arabic fonts.
log "apt packages"
(apt-get update -qq \
  && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq --no-install-recommends \
       ffmpeg libsndfile1 fonts-hosny-amiri fonts-noto-core >/dev/null) \
  || log "WARNING: apt install failed (non-blocking)"

# 2) uv (preinstalled on the cloud image; installed from PyPI otherwise).
command -v uv >/dev/null 2>&1 || pip install -q uv || log "WARNING: could not install uv"

# 3) One Python 3.12 venv per TTS engine (their dependencies conflict), CPU-only PyTorch.
install_venv() {
  local name=$1; shift
  log "venv $name: start"
  rm -f "$VENVS/$name/.installed"
  if uv venv -q --allow-existing --python 3.12 "$VENVS/$name" \
     && uv pip install -q --python "$VENVS/$name/bin/python" --torch-backend cpu "$@"; then
    touch "$VENVS/$name/.installed"
    log "venv $name: ok"
  else
    log "WARNING: venv $name failed; run this script again inside the session to see the error"
  fi
}
mkdir -p "$VENVS"
install_venv silma "${SILMA_PKGS[@]}" &
install_venv voicetut "${VOICETUT_PKGS[@]}" &
wait

# 4) Prefetch model weights so they land in the cached snapshot.
#    Each prefetch is capped; anything not downloaded here is fetched on first use.
prefetch() {
  local label=$1; shift
  log "prefetch $label: start"
  if timeout 150 "$@" >/dev/null 2>&1; then log "prefetch $label: ok"
  else log "prefetch $label: incomplete (will download on first use)"; fi
}
if [ -f "$VENVS/silma/.installed" ]; then
  prefetch silma "$VENVS/silma/bin/python" -c "
from huggingface_hub import hf_hub_download as d
for f in ('model.pt', 'vocab.txt'):
    d('silma-ai/silma-tts', f)
for f in ('config.yaml', 'pytorch_model.bin'):
    d('charactr/vocos-mel-24khz', f)
from catt_tashkeel import CATTEncoderOnly
CATTEncoderOnly()
" &
fi
if [ -f "$VENVS/voicetut/.installed" ]; then
  prefetch voicetut "$VENVS/voicetut/bin/python" -c "
from huggingface_hub import snapshot_download
snapshot_download('mohammedaly22/VoiceTut-TTS')
" &
fi
wait

# 5) Readiness marker read by scripts/session-start.sh.
{
  echo "setup_date=$(date -u +%FT%TZ)"
  for v in silma voicetut; do
    if [ -f "$VENVS/$v/.installed" ]; then echo "venv_$v=ok"; else echo "venv_$v=FAILED (see docs/cloud-environment.md, network allowlist)"; fi
  done
  command -v ffmpeg >/dev/null 2>&1 && echo "ffmpeg=ok" || echo "ffmpeg=missing"
} > "$VENVS/READY"
log "done"
exit 0
