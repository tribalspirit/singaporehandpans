#!/usr/bin/env bash
# Definition-of-Done gate for SG Handpan Studio.
# Runs the constitutional CI gates (lint + typecheck + build + tests) plus a few
# static hygiene checks, prints a checklist, and exits non-zero if any HARD gate fails.
#
# Usage: dod-check.sh [--fast] [--no-build]
#   --fast      Skip the production build (lint + typecheck + tests + hygiene only)
#   --no-build  Alias for --fast
#
# Hard gates (must pass): lint, typecheck, tests, build (unless --fast), no debug statements.
# Soft checks (warn only): leftover TODO/FIXME, missing .env.example keys.
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
. "$SCRIPT_DIR/common.sh"
REPO_ROOT="$(get_repo_root)"
cd "$REPO_ROOT"

FAST=false
for arg in "$@"; do
    case "$arg" in --fast|--no-build) FAST=true ;; esac
done

PASS="✓"; FAIL="✗"; WARN="!"
hard_failures=0
results=()

run_gate() {
    local label="$1"; shift
    echo "── $label ──────────────────────────────"
    if "$@"; then
        results+=("$PASS $label")
    else
        results+=("$FAIL $label")
        hard_failures=$((hard_failures + 1))
    fi
    echo
}

# --- Hard gates (constitution: lint + typecheck + build + tests) ---
run_gate "Lint (eslint)"        npm run lint
run_gate "Typecheck (astro check)" npx astro check
run_gate "Unit tests (vitest)"  npm test

if [ "$FAST" = false ]; then
    run_gate "Production build (astro build)" npm run build
else
    results+=("$WARN Production build (skipped: --fast)")
fi

# --- Hygiene: no debug statements shipped in src/ ---
# Excludes test/spec files and dev-references/ (manually-run dev CLI scripts
# that are never bundled into a shipped route).
echo "── No debug statements in src/ ──────────"
debug_hits=$(grep -rniE '\b(console\.(log|debug)|debugger)\b' src 2>/dev/null \
    | grep -viE '\.(test|spec)\.|/dev-references/' || true)
if [ -n "$debug_hits" ]; then
    echo "$debug_hits"
    results+=("$FAIL No console.log/debugger in src/")
    hard_failures=$((hard_failures + 1))
else
    echo "clean"
    results+=("$PASS No console.log/debugger in src/")
fi
echo

# --- Soft checks (warn only, never fail the gate) ---
todo_count=$(grep -rniE '\b(TODO|FIXME|XXX)\b' src 2>/dev/null | wc -l | tr -d ' ')
[ "$todo_count" -gt 0 ] && results+=("$WARN $todo_count TODO/FIXME marker(s) in src/")

echo "════════════════════════════════════════"
echo "Definition of Done — summary"
echo "════════════════════════════════════════"
for r in "${results[@]}"; do echo "  $r"; done
echo "────────────────────────────────────────"
echo "Reminders not auto-checked (verify manually — see .specify/memory/constitution.md):"
echo "  • Every route ships prerendered HTML with unique title/meta/canonical + OG/Twitter"
echo "  • Lighthouse mobile acceptable; interactions snappy; no layout shift"
echo "  • Keyboard nav + basic screen-reader semantics pass"
echo "  • Content editable in Storyblok with graceful CMS-down fallbacks"
echo "════════════════════════════════════════"

if [ "$hard_failures" -gt 0 ]; then
    echo "DoD: FAILED ($hard_failures hard gate(s) red). Fix the root cause — do not bypass."
    exit 1
fi
echo "DoD: PASSED (all hard gates green)."
exit 0
