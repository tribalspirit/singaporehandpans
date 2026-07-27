---
description: Spec-Driven step 4 — execute tasks.md test-first, story by story, verifying each checkpoint. Trigger with "/implement" (optionally name a story/task, e.g. "/implement US1").
---

# /implement — Execute the task list

You are running **step 4 of the Spec-Driven Development flow**. Turn `tasks.md` into working, verified code. Track progress with TodoWrite mirroring the task IDs.

## Steps

1. **Confirm you're ready to build:**

   ```bash
   bash .specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks
   ```

   This fails unless `plan.md` and `tasks.md` both exist.

2. **Work in task order, respecting phases.** Setup → Foundational (must finish before any story) → user stories in priority order (P1 first = MVP). If `$ARGUMENTS` names a story (e.g. `US1`) or task IDs, scope to those. Stop at each **Checkpoint** and confirm the story works independently before moving on.

3. **TDD loop for logic tasks** (use the **`tdd-guide`** agent for non-trivial ones): write the test (RED) → confirm it fails → minimal implementation (GREEN) → refactor → `npm test`. For visual work, verify with **playwright** / `npm run audit` against the breakpoints in `rules/web/testing.md` (320/768/1024/1440).

4. **Parallelize `[P]` tasks** that touch different files by dispatching agents via the Agent tool — but never two agents editing the same file. Serialize anything sharing a file, type, or config. Give each agent the task text, exact file paths, and the relevant project skill as a self-contained brief.

5. **Route by domain** as you go (same table as `/go`): Storyblok → `/storyblok`, shop → `/shop`, gallery → `/gallery`, widget → `/handpan-widget` + `/music-theory`, security-sensitive → `security-reviewer` agent, build breakage → `build-error-resolver` agent.

6. **Check off tasks** in `tasks.md` (`[ ]` → `[x]`) as each is verified — not when written.

## Gate before you call it done

Run the Definition-of-Done gate and fix every hard failure at the root (never `--no-verify`, never disable a rule to pass):

```bash
/dod
```

## Output

Report which stories/tasks completed, test + build status (from `/dod`), and anything deferred. End with: "Next: `/dod` clean → commit and open a PR (see `issue-fixer` / git-workflow rules)."
