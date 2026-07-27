#!/usr/bin/env bash
# MANDATORY pre-work sync: bring main and dev up to date from origin and rebase dev onto main,
# so every new feature branch starts from a dev that is current with main.
# Leaves you checked out on `dev`. Aborts (non-zero) on a dirty tree or a rebase conflict.
#
# Usage: sync-branches.sh [--main <name>] [--dev <name>]  (defaults: main, dev)
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
. "$SCRIPT_DIR/common.sh"

MAIN_BRANCH="main"
DEV_BRANCH="dev"
while [ $# -gt 0 ]; do
    case "$1" in
        --main) MAIN_BRANCH="$2"; shift 2 ;;
        --dev) DEV_BRANCH="$2"; shift 2 ;;
        -h|--help) echo "Usage: sync-branches.sh [--main <name>] [--dev <name>]"; exit 0 ;;
        *) shift ;;
    esac
done

if ! has_git; then
    echo "[sync] Not a git repo — nothing to sync." >&2
    exit 0
fi

cd "$(get_repo_root)"

# Refuse to sync over uncommitted work — rebase would be destructive/ambiguous.
if [ -n "$(git status --porcelain)" ]; then
    echo "ERROR: working tree is not clean. Commit or stash before syncing branches." >&2
    git status --short >&2
    exit 1
fi

if ! git remote get-url origin >/dev/null 2>&1; then
    echo "[sync] No 'origin' remote — skipping fetch; will only rebase local $DEV_BRANCH onto $MAIN_BRANCH." >&2
    HAS_ORIGIN=false
else
    HAS_ORIGIN=true
    echo "[sync] Fetching origin..."
    git fetch --prune origin || { echo "ERROR: git fetch failed." >&2; exit 1; }
fi

START_BRANCH="$(git rev-parse --abbrev-ref HEAD)"

# update_from_origin <branch> <mode>
#   mode=ff     fast-forward only; abort on divergence (for main — must never diverge).
#   mode=reset  hard-reset local branch to origin (for dev — origin is canonical, and a
#               prior sync rebased local dev onto main so it no longer fast-forwards from
#               origin/dev; reconcile by taking the remote state before re-rebasing).
update_from_origin() {
    local br="$1" mode="${2:-ff}"
    git show-ref --verify --quiet "refs/heads/$br" || {
        echo "[sync] Local branch '$br' not found — skipping." >&2; return 0; }
    git checkout "$br" >/dev/null 2>&1 || { echo "ERROR: cannot checkout $br." >&2; return 1; }
    if [ "$HAS_ORIGIN" = true ] && git show-ref --verify --quiet "refs/remotes/origin/$br"; then
        if [ "$mode" = reset ]; then
            echo "[sync] Resetting $br to origin/$br (canonical remote state)..."
            git reset --hard "origin/$br" || {
                echo "ERROR: cannot reset $br to origin/$br." >&2; return 1; }
        else
            echo "[sync] Updating $br from origin/$br (fast-forward only)..."
            git pull --ff-only origin "$br" || {
                echo "ERROR: $br has diverged from origin/$br and cannot fast-forward. Resolve manually." >&2
                return 1; }
        fi
    fi
    return 0
}

update_from_origin "$MAIN_BRANCH" ff    || exit 1
update_from_origin "$DEV_BRANCH"  reset || exit 1

# Rebase dev onto main so dev contains everything in main.
git checkout "$DEV_BRANCH" >/dev/null 2>&1 || { echo "ERROR: cannot checkout $DEV_BRANCH." >&2; exit 1; }
echo "[sync] Rebasing $DEV_BRANCH onto $MAIN_BRANCH..."
if ! git rebase "$MAIN_BRANCH"; then
    echo "ERROR: rebase of $DEV_BRANCH onto $MAIN_BRANCH hit conflicts." >&2
    echo "       Resolve them, run 'git rebase --continue', then re-run sync (or 'git rebase --abort' to back out)." >&2
    exit 1
fi

echo "[sync] Done. $DEV_BRANCH is current with $MAIN_BRANCH; you are on $DEV_BRANCH (was $START_BRANCH)."
if [ "$HAS_ORIGIN" = true ]; then
    echo "[sync] Note: if $DEV_BRANCH was rebased, pushing requires 'git push --force-with-lease origin $DEV_BRANCH' (coordinate with the team)." >&2
fi
exit 0
