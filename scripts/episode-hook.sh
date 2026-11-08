#!/bin/bash
# PostToolUse hook (.claude/settings.json): right after Claude edits an episode (or the dialect or
# pronunciation lists), the checks of scripts/validate.py for that episode are shown to Claude: Egyptian
# narration (content/dialect.yaml), the voice's spellings, the format's structure, sources, schema.
# Exit 2 hands the findings back to Claude; nothing to report, exit 0. Edits made through Bash are not
# seen here: the skills run validate.py too, and so does the CI.

file=$(python3 -c 'import json,sys; print(json.load(sys.stdin).get("tool_input", {}).get("file_path", ""))' 2>/dev/null)
case "$file" in
  */content/episodes/*.yaml) pattern="content/episodes/$(basename "$file")" ;;
  */content/dialect.yaml|*/content/pronunciation.yaml) pattern="content/episodes/" ;;
  *) exit 0 ;;
esac

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
findings=$(uv run -q --with jsonschema --with pyyaml scripts/validate.py 2>/dev/null | grep -E '^(ERROR|warning) ' | grep -F "$pattern")
if [ -n "$findings" ]; then
  echo "scripts/validate.py after this edit:" >&2
  echo "$findings" >&2
  exit 2
fi
exit 0
