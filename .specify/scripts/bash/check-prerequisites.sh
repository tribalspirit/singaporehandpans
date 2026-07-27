#!/usr/bin/env bash
# Prerequisite check + path discovery for the SDD workflow. Bash port of check-prerequisites.ps1.
#
# Usage: check-prerequisites.sh [--json] [--require-tasks] [--include-tasks] [--paths-only]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
. "$SCRIPT_DIR/common.sh"

JSON=false; REQUIRE_TASKS=false; INCLUDE_TASKS=false; PATHS_ONLY=false
while [ $# -gt 0 ]; do
    case "$1" in
        --json) JSON=true ;;
        --require-tasks) REQUIRE_TASKS=true ;;
        --include-tasks) INCLUDE_TASKS=true ;;
        --paths-only) PATHS_ONLY=true ;;
        -h|--help)
            echo "Usage: check-prerequisites.sh [--json] [--require-tasks] [--include-tasks] [--paths-only]"
            exit 0 ;;
    esac
    shift
done

get_feature_paths
check_feature_branch "$CURRENT_BRANCH" "$HAS_GIT" || exit 1

if [ "$PATHS_ONLY" = true ]; then
    if [ "$JSON" = true ]; then
        printf '{"REPO_ROOT":"%s","BRANCH":"%s","FEATURE_DIR":"%s","FEATURE_SPEC":"%s","IMPL_PLAN":"%s","TASKS":"%s"}\n' \
            "$REPO_ROOT" "$CURRENT_BRANCH" "$FEATURE_DIR" "$FEATURE_SPEC" "$IMPL_PLAN" "$TASKS"
    else
        echo "REPO_ROOT: $REPO_ROOT"
        echo "BRANCH: $CURRENT_BRANCH"
        echo "FEATURE_DIR: $FEATURE_DIR"
        echo "FEATURE_SPEC: $FEATURE_SPEC"
        echo "IMPL_PLAN: $IMPL_PLAN"
        echo "TASKS: $TASKS"
    fi
    exit 0
fi

if [ ! -d "$FEATURE_DIR" ]; then
    echo "ERROR: Feature directory not found: $FEATURE_DIR"
    echo "Run /specify first to create the feature structure."
    exit 1
fi
if [ ! -f "$IMPL_PLAN" ]; then
    echo "ERROR: plan.md not found in $FEATURE_DIR"
    echo "Run /plan first to create the implementation plan."
    exit 1
fi
if [ "$REQUIRE_TASKS" = true ] && [ ! -f "$TASKS" ]; then
    echo "ERROR: tasks.md not found in $FEATURE_DIR"
    echo "Run /tasks first to create the task list."
    exit 1
fi

docs=()
[ -f "$RESEARCH" ] && docs+=("research.md")
[ -f "$DATA_MODEL" ] && docs+=("data-model.md")
{ [ -d "$CONTRACTS_DIR" ] && [ -n "$(ls -A "$CONTRACTS_DIR" 2>/dev/null)" ]; } && docs+=("contracts/")
[ -f "$QUICKSTART" ] && docs+=("quickstart.md")
{ [ "$INCLUDE_TASKS" = true ] && [ -f "$TASKS" ]; } && docs+=("tasks.md")

if [ "$JSON" = true ]; then
    printf '{"FEATURE_DIR":"%s","AVAILABLE_DOCS":[' "$FEATURE_DIR"
    for i in "${!docs[@]}"; do
        [ "$i" -gt 0 ] && printf ','
        printf '"%s"' "${docs[$i]}"
    done
    printf ']}\n'
else
    echo "FEATURE_DIR: $FEATURE_DIR"
    echo "AVAILABLE_DOCS:"
    for d in "${docs[@]}"; do echo "  ✓ $d"; done
fi
