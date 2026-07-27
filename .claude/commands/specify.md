---
description: Spec-Driven step 1 — turn a feature idea into a testable spec. Creates a numbered feature branch + specs/<branch>/spec.md from the template, then fills it in. Trigger with "/specify <feature description>".
---

# /specify — Create a feature specification

You are running **step 1 of the Spec-Driven Development flow**: `specify → plan → tasks → implement → dod`. Your job is to produce a clear, testable **spec.md** describing WHAT and WHY — never HOW (no tech stack, no file layout, no APIs).

## Steps

1. **Check the constitution first.** Read `.specify/memory/constitution.md` (or invoke the `constitution` skill). The spec must respect its scope, non-goals, and principles. If the request conflicts with a non-goal (custom backend, user accounts, payments), flag it before proceeding.

2. **Scaffold the feature (branches off `dev`, syncs first — MANDATORY).** Commit or stash any working-tree changes first (the sync aborts on a dirty tree). Then run from the repo root:

   ```bash
   bash .specify/scripts/bash/create-new-feature.sh --json "$ARGUMENTS"
   ```

   This enforces the branching policy in `rules/common/git-workflow.md`: it fetches origin, fast-forwards `main` and `dev`, rebases `dev` onto `main`, and creates the new feature branch **off the synced `dev`**. If the sync fails (dirty tree, divergence, or rebase conflict), stop and resolve it — do not proceed with `--no-sync` unless you understand why. Parse the JSON for `BRANCH_NAME` and `SPEC_FILE`. All later steps operate on this feature; if you are not on the created branch, `export SPECIFY_FEATURE=<BRANCH_NAME>` so the other scripts target it.

3. **Fill in the spec.** Edit `SPEC_FILE` (seeded from `.specify/templates/spec-template.md`). Replace every placeholder:
   - **User Scenarios** — prioritized user stories (P1/P2/P3), each independently testable, each an MVP slice. Given/When/Then acceptance scenarios.
   - **Requirements** — numbered `FR-00N` functional requirements, testable and unambiguous.
   - **Success Criteria** — measurable, technology-agnostic `SC-00N` outcomes.
   - **Edge Cases** — real boundary/error conditions for this feature.

4. **Mark unknowns, don't invent them.** Where a decision isn't specified, insert `[NEEDS CLARIFICATION: <question>]` rather than guessing. Then ask the user those questions before finishing. Do not carry a spec forward with open clarifications.

5. **Stay out of implementation.** No components, no libraries, no schemas. If you catch yourself writing "how", move it to a note for `/plan`.

## Output

Report the branch name, the spec path, and any `[NEEDS CLARIFICATION]` items. End with: "Next: `/plan` to design the implementation." Do not start planning or coding.
