# Git Workflow

## Branching Policy (MANDATORY)

**Every new requirement/feature is implemented on its own feature branch created off `dev` — never directly on `main` or `dev`.**

Before starting ANY new work, you MUST sync so the feature starts from a current base:

1. `git fetch --prune origin`
2. Fast-forward `main` from `origin/main`, and `dev` from `origin/dev`.
3. Rebase `dev` onto `main` (so `dev` contains everything in `main`).
4. Create the feature branch off the freshly-synced `dev`.

This is automated — do not do it by hand unless the script fails:

```bash
bash .specify/scripts/bash/sync-branches.sh          # steps 1–3 (leaves you on dev)
bash .specify/scripts/bash/create-new-feature.sh "<feature>"   # syncs, then branches off dev
```

`/specify` runs both for you. The working tree must be clean before syncing (commit or stash first) — the sync aborts on a dirty tree or a rebase conflict rather than guessing. Feature branches merge back into `dev`; `dev` promotes to `main` via the normal PR/merge flow. Never rebase or force-push a shared branch without coordinating with the team.

## Commit Message Format
```
<type>: <description>

<optional body>
```

Types: feat, fix, refactor, docs, test, chore, perf, ci

Note: Attribution disabled globally via ~/.claude/settings.json.

## Pull Request Workflow

When creating PRs:
1. Analyze full commit history (not just latest commit)
2. Use `git diff [base-branch]...HEAD` to see all changes
3. Draft comprehensive PR summary
4. Include test plan with TODOs
5. Push with `-u` flag if new branch

> For the full development process (planning, TDD, code review) before git operations,
> see [development-workflow.md](./development-workflow.md).
