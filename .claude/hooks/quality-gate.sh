#!/usr/bin/env bash
# Stop hook: end-of-turn quality signal. Runs the authoritative typecheck (astro check) and lint
# and prints a compact summary so type/lint drift is visible before you commit.
# Non-blocking: reports status but ALWAYS exits 0 (the hard gate is `/dod` before commit).
# Skips silently when the working tree has no source changes, to stay quiet on doc-only turns.
set -uo pipefail

ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo ".")
cd "$ROOT" || exit 0

# Only run when source files changed this session — keep quiet otherwise.
if git rev-parse --show-toplevel >/dev/null 2>&1; then
    CHANGED=$(git status --porcelain -- '*.ts' '*.tsx' '*.astro' '*.js' '*.jsx' 2>/dev/null || true)
    [ -z "$CHANGED" ] && exit 0
fi

command -v timeout >/dev/null 2>&1 && TO="timeout 120" || TO=""

echo "── quality gate (non-blocking; run /dod before committing) ──" >&2

if $TO npx astro check >/tmp/qgate-astro.log 2>&1; then
    echo "  ✓ typecheck (astro check)" >&2
else
    echo "  ✗ typecheck (astro check) — see /tmp/qgate-astro.log" >&2
    tail -8 /tmp/qgate-astro.log >&2
fi

if npm run lint >/tmp/qgate-lint.log 2>&1; then
    echo "  ✓ lint (eslint)" >&2
else
    echo "  ✗ lint (eslint) — see /tmp/qgate-lint.log" >&2
    tail -8 /tmp/qgate-lint.log >&2
fi

exit 0
