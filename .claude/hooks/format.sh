#!/usr/bin/env bash
# PostToolUse (Write|Edit): auto-format the edited file with the repo's prettier + eslint --fix.
# Reads the hook JSON on stdin, acts only on the touched file, and ALWAYS exits 0 (never blocks tool use).
set -uo pipefail

INPUT=$(cat)
FILE=$(printf '%s' "$INPUT" | node -e 'let d="";process.stdin.on("data",c=>d+=c);process.stdin.on("end",()=>{try{const i=JSON.parse(d);process.stdout.write((i.tool_input&&(i.tool_input.file_path||i.tool_input.path))||"")}catch(e){process.stdout.write("")}})' 2>/dev/null || true)

[ -z "$FILE" ] && exit 0
[ -f "$FILE" ] || exit 0

ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo ".")
cd "$ROOT" || exit 0
BIN="node_modules/.bin"

case "$FILE" in
    *.js|*.jsx|*.ts|*.tsx|*.astro|*.json|*.md|*.css|*.scss|*.yml|*.yaml)
        [ -x "$BIN/prettier" ] && "$BIN/prettier" --write "$FILE" >/dev/null 2>&1 || true ;;
esac
case "$FILE" in
    *.js|*.jsx|*.ts|*.tsx|*.astro)
        [ -x "$BIN/eslint" ] && "$BIN/eslint" --fix "$FILE" >/dev/null 2>&1 || true ;;
esac

exit 0
