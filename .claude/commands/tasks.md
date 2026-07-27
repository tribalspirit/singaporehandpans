---
description: Spec-Driven step 3 — break the plan into an ordered, dependency-aware task list grouped by user story. Writes specs/<branch>/tasks.md. Trigger with "/tasks".
---

# /tasks — Break the plan into tasks

You are running **step 3 of the Spec-Driven Development flow**. Convert `plan.md` + `spec.md` into a concrete, ordered `tasks.md` that a developer (or the `/implement` step) can execute mechanically.

## Steps

1. **Confirm prerequisites and paths:**

   ```bash
   bash .specify/scripts/bash/check-prerequisites.sh --json
   ```

   This fails if `plan.md` is missing (run `/plan` first) and lists the available design docs (`research.md`, `data-model.md`, `contracts/`).

2. **Generate tasks** into `FEATURE_DIR/tasks.md`, seeded from `.specify/templates/tasks-template.md`. Follow the template's structure:
   - **Group by user story** (US1/US2/US3…) so each story is independently implementable and testable — each an MVP increment.
   - Phase 1 Setup → Phase 2 Foundational (blocking) → per-story phases → Polish.
   - Use the `[ID] [P?] [Story] Description` format. Mark `[P]` only for tasks in **different files with no dependency**.
   - **Every task names exact file paths** in this repo's layout (`src/pages/`, `src/components/<feature>/`, `src/widgets/`, `src/lib/`, `src/styles/`, `tests/`).

3. **Tests-first where the spec has logic.** For deterministic logic (music theory, data transforms, lib utilities), include test tasks BEFORE their implementation task, per the TDD rule in `rules/common/testing.md`. For purely visual work, prefer Playwright visual-regression tasks over brittle markup assertions (`rules/web/testing.md`). Delete the template's sample tasks — keep only real ones.

4. **Order by dependency:** models/content-types → lib/services → components/islands → pages/routes → integration → polish. Note parallel opportunities explicitly.

## Output

Report the task count, the story grouping, and which tasks are `[P]`-parallelizable. End with: "Next: `/implement` to execute, or hand specific tasks to agents via `/go`." Do not start implementing.
