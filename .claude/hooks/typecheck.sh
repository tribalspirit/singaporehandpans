#!/usr/bin/env bash
# PostToolUse (Write|Edit): fast incremental typecheck for edited TS/TSX files.
# Uses tsc --incremental + a timeout cap so re-runs are 1-3s and a stuck tsc gets reaped.
# Non-blocking: surfaces errors on stderr but ALWAYS exits 0.
# Note: plain tsc does not resolve .astro imports — the authoritative check is `astro check`,
# run by the Stop-time quality gate. This hook is a fast early-warning for pure TS/TSX only.
set -uo pipefail

INPUT=$(cat)
FILE=$(printf '%s' "$INPUT" | node -e 'let d="";process.stdin.on("data",c=>d+=c);process.stdin.on("end",()=>{try{const i=JSON.parse(d);process.stdout.write((i.tool_input&&(i.tool_input.file_path||i.tool_input.path))||"")}catch(e){process.stdout.write("")}})' 2>/dev/null || true)

[ -z "$FILE" ] && exit 0
case "$FILE" in *.ts|*.tsx) ;; *) exit 0 ;; esac

ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo ".")
cd "$ROOT" || exit 0
[ -f tsconfig.json ] || exit 0
command -v timeout >/dev/null 2>&1 || exit 0
mkdir -p node_modules/.cache

OUT=$(timeout 60 npx tsc --noEmit --pretty false --incremental \
        --tsBuildInfoFile node_modules/.cache/tsc-hook.tsbuildinfo 2>&1) || true
if [ -n "$OUT" ]; then
    echo "[typecheck] tsc reported issues after editing $FILE (astro check at Stop is authoritative):" >&2
    printf '%s\n' "$OUT" | head -20 >&2
fi

exit 0
