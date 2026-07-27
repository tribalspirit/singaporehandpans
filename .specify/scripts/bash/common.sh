#!/usr/bin/env bash
# Common helpers for the Spec-Driven Development workflow (bash port of common.ps1).
# Source this file: . "$(dirname "$0")/common.sh"

get_repo_root() {
    if root=$(git rev-parse --show-toplevel 2>/dev/null); then
        printf '%s\n' "$root"
        return
    fi
    # Non-git fallback: two levels up from .specify/scripts/bash
    ( cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd )
}

has_git() {
    git rev-parse --show-toplevel >/dev/null 2>&1
}

get_current_branch() {
    # Explicit override wins (lets non-git / detached flows target a feature).
    if [ -n "${SPECIFY_FEATURE:-}" ]; then
        printf '%s\n' "$SPECIFY_FEATURE"
        return
    fi
    if branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null); then
        printf '%s\n' "$branch"
        return
    fi
    # Non-git: newest numbered feature dir under specs/
    local specs_dir latest highest num
    specs_dir="$(get_repo_root)/specs"
    latest=""
    highest=0
    if [ -d "$specs_dir" ]; then
        for d in "$specs_dir"/*/; do
            [ -d "$d" ] || continue
            name=$(basename "$d")
            if [[ "$name" =~ ^([0-9]{3})- ]]; then
                num=$((10#${BASH_REMATCH[1]}))
                if [ "$num" -gt "$highest" ]; then highest=$num; latest=$name; fi
            fi
        done
    fi
    printf '%s\n' "${latest:-main}"
}

# Populates FEATURE_* path variables in the caller's scope.
get_feature_paths() {
    REPO_ROOT="$(get_repo_root)"
    CURRENT_BRANCH="$(get_current_branch)"
    if has_git; then HAS_GIT=true; else HAS_GIT=false; fi
    FEATURE_DIR="$REPO_ROOT/specs/$CURRENT_BRANCH"
    FEATURE_SPEC="$FEATURE_DIR/spec.md"
    IMPL_PLAN="$FEATURE_DIR/plan.md"
    TASKS="$FEATURE_DIR/tasks.md"
    RESEARCH="$FEATURE_DIR/research.md"
    DATA_MODEL="$FEATURE_DIR/data-model.md"
    QUICKSTART="$FEATURE_DIR/quickstart.md"
    CONTRACTS_DIR="$FEATURE_DIR/contracts"
}

# Returns 0 if on a valid feature branch (or non-git, which is allowed).
check_feature_branch() {
    local branch="$1" has_git_flag="$2"
    if [ "$has_git_flag" != "true" ]; then
        echo "[specify] Warning: Git repository not detected; skipped branch validation" >&2
        return 0
    fi
    if [[ ! "$branch" =~ ^[0-9]{3}- ]]; then
        echo "ERROR: Not on a feature branch. Current branch: $branch"
        echo "Feature branches should be named like: 001-feature-name"
        return 1
    fi
    return 0
}
