#!/usr/bin/env bash
# Create a new feature: numbered branch + specs/ dir seeded from spec-template.
# Bash port of create-new-feature.ps1.
#
# Usage: create-new-feature.sh [--json] [--short-name <name>] <feature description>
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
. "$SCRIPT_DIR/common.sh"

JSON=false
SHORT_NAME=""
BASE_BRANCH="dev"     # Every feature branches off dev (mandatory branching policy).
SYNC=true             # Sync main+dev and rebase dev onto main before branching.
ARGS=()
while [ $# -gt 0 ]; do
    case "$1" in
        --json) JSON=true; shift ;;
        --short-name) SHORT_NAME="$2"; shift 2 ;;
        --base) BASE_BRANCH="$2"; shift 2 ;;
        --no-sync) SYNC=false; shift ;;
        -h|--help)
            echo "Usage: create-new-feature.sh [--json] [--short-name <name>] [--base <branch>] [--no-sync] <feature description>"
            echo "  Branches off '$BASE_BRANCH' by default and syncs main+dev first (mandatory policy)."
            exit 0 ;;
        *) ARGS+=("$1"); shift ;;
    esac
done

if [ ${#ARGS[@]} -eq 0 ]; then
    echo "Usage: create-new-feature.sh [--json] [--short-name <name>] <feature description>" >&2
    exit 1
fi
FEATURE_DESC="${ARGS[*]}"

REPO_ROOT="$(get_repo_root)"
cd "$REPO_ROOT"
SPECS_DIR="$REPO_ROOT/specs"
mkdir -p "$SPECS_DIR"

clean_branch_name() {
    echo "$1" | tr '[:upper:]' '[:lower:]' \
        | sed -E 's/[^a-z0-9]+/-/g; s/-{2,}/-/g; s/^-//; s/-$//'
}

# Derive a 3-4 word slug, dropping stop words.
derive_slug() {
    local desc="$1"
    local stop=" i a an the to for of in on at by with from is are was were be been being have has had do does did will would should could can may might must shall this that these those my your our their want need add get set "
    local words meaningful=() w
    words=$(echo "$desc" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/ /g')
    for w in $words; do
        [ "${#w}" -ge 3 ] || continue
        case "$stop" in *" $w "*) continue ;; esac
        meaningful+=("$w")
    done
    if [ ${#meaningful[@]} -gt 0 ]; then
        local take=3
        [ ${#meaningful[@]} -ge 4 ] && take=4
        ( IFS='-'; echo "${meaningful[*]:0:$take}" )
    else
        clean_branch_name "$desc" | cut -d- -f1-3
    fi
}

# Highest existing feature number across specs/ dirs and git branches.
highest_number() {
    local highest=0 num name branch
    if [ -d "$SPECS_DIR" ]; then
        for d in "$SPECS_DIR"/*/; do
            [ -d "$d" ] || continue
            name=$(basename "$d")
            if [[ "$name" =~ ^([0-9]+) ]]; then
                num=$((10#${BASH_REMATCH[1]}))
                [ "$num" -gt "$highest" ] && highest=$num
            fi
        done
    fi
    if has_git; then
        while IFS= read -r branch; do
            branch=$(echo "$branch" | sed -E 's/^[* ]+//; s#^remotes/[^/]+/##')
            if [[ "$branch" =~ ^([0-9]+)- ]]; then
                num=$((10#${BASH_REMATCH[1]}))
                [ "$num" -gt "$highest" ] && highest=$num
            fi
        done < <(git branch -a 2>/dev/null || true)
    fi
    echo "$highest"
}

if [ -n "$SHORT_NAME" ]; then
    SLUG="$(clean_branch_name "$SHORT_NAME")"
else
    SLUG="$(derive_slug "$FEATURE_DESC")"
fi

NEXT=$(( $(highest_number) + 1 ))
FEATURE_NUM=$(printf '%03d' "$NEXT")
BRANCH_NAME="${FEATURE_NUM}-${SLUG}"

# GitHub caps branch names at 244 bytes.
if [ ${#BRANCH_NAME} -gt 244 ]; then
    BRANCH_NAME="${FEATURE_NUM}-$(echo "$SLUG" | cut -c1-240 | sed -E 's/-$//')"
fi

if has_git; then
    # MANDATORY: sync main+dev and rebase dev onto main so the feature starts from a current base.
    if [ "$SYNC" = true ]; then
        if ! bash "$SCRIPT_DIR/sync-branches.sh"; then
            echo "[specify] Branch sync failed — resolve it (or re-run with --no-sync) before creating a feature branch." >&2
            exit 1
        fi
    fi
    # Branch off the base (dev by default).
    if git show-ref --verify --quiet "refs/heads/$BASE_BRANCH"; then
        git checkout "$BASE_BRANCH" >/dev/null 2>&1
    else
        echo "[specify] Warning: base branch '$BASE_BRANCH' not found; branching off current HEAD." >&2
    fi
    git checkout -b "$BRANCH_NAME" >/dev/null 2>&1 || \
        echo "[specify] Warning: failed to create git branch: $BRANCH_NAME" >&2
else
    echo "[specify] Warning: Git repository not detected; skipped branch creation for $BRANCH_NAME" >&2
fi

FEATURE_DIR="$SPECS_DIR/$BRANCH_NAME"
mkdir -p "$FEATURE_DIR"
SPEC_FILE="$FEATURE_DIR/spec.md"
TEMPLATE="$REPO_ROOT/.specify/templates/spec-template.md"
if [ -f "$TEMPLATE" ]; then cp "$TEMPLATE" "$SPEC_FILE"; else : > "$SPEC_FILE"; fi

if [ "$JSON" = true ]; then
    printf '{"BRANCH_NAME":"%s","SPEC_FILE":"%s","FEATURE_NUM":"%s","HAS_GIT":%s}\n' \
        "$BRANCH_NAME" "$SPEC_FILE" "$FEATURE_NUM" "$(has_git && echo true || echo false)"
else
    echo "BRANCH_NAME: $BRANCH_NAME"
    echo "SPEC_FILE: $SPEC_FILE"
    echo "FEATURE_NUM: $FEATURE_NUM"
    echo "SPECIFY_FEATURE=$BRANCH_NAME  (export this to target the feature in later steps)"
fi
