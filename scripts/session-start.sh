#!/bin/bash
# SessionStart hook (see .claude/settings.json). Runs in cloud sessions only.
# Prints a short status that Claude reads at the start of the session,
# and installs the Remotion project dependencies once video/ exists.

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0

echo "== quran-themes-demo: environment status =="
if [ -f /opt/venvs/READY ]; then
  sed 's/^/  /' /opt/venvs/READY
else
  echo "  /opt/venvs/READY missing: the environment setup script was not run."
  echo "  Ask the owner to paste infra/claude-cloud-setup.sh into the environment's Setup script"
  echo "  (docs/cloud-environment.md), or run it now with: bash infra/claude-cloud-setup.sh"
fi

# Remotion project: install dependencies when package files changed since the last install.
if [ -f video/package.json ]; then
  hashes=video/node_modules/.install.sha256
  if ! sha256sum --check --status "$hashes" 2>/dev/null; then
    rm -f "$hashes"
    echo "  installing video/ dependencies..."
    if (cd video && { [ -f package-lock.json ] && npm ci --no-audit --no-fund || npm install --no-audit --no-fund; }) >/tmp/npm-install.log 2>&1; then
      sha256sum video/package.json video/package-lock.json 2>/dev/null > "$hashes" || rm -f "$hashes"
      echo "  video/ dependencies: ok"
    else
      echo "  video/ dependencies: FAILED (see /tmp/npm-install.log)"
    fi
  fi
fi
exit 0
