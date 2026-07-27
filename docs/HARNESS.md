# Development Harness

The Claude Code harness for SG Handpan Studio: a spec-driven flow, a Definition-of-Done gate, evals, automated hooks, and an orchestrator that routes work to the right skills and agents. Start with `/go <task>` — it classifies the request and picks the flow for you.

## Orchestrator

**`/go <task>`** ([.claude/commands/go.md](../.claude/commands/go.md)) is the entry point. It classifies the task (feature / bug / small change / review / question), routes it through the matching flow, dispatches skills and agents (in parallel where independent), and verifies against the Definition of Done. You can also invoke any step directly.

## Spec-Driven Development flow

For any substantial feature. Each step is a slash command that drives the templates in [.specify/templates/](../.specify/templates/) and the bash scripts in [.specify/scripts/bash/](../.specify/scripts/bash/).

| Step         | Command            | Produces                                    | Notes                                                                                        |
| ------------ | ------------------ | ------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 1. Specify   | `/specify <desc>`  | `specs/<branch>/spec.md`                    | WHAT/WHY only. Creates a numbered feature branch. Marks unknowns as `[NEEDS CLARIFICATION]`. |
| 2. Plan      | `/plan`            | `plan.md` (+ research/data-model/contracts) | HOW. Delegates to `architect`/`planner`. Constitution check.                                 |
| 3. Tasks     | `/tasks`           | `tasks.md`                                  | Ordered, dependency-aware, grouped by user story, tests-first for logic.                     |
| 4. Implement | `/implement [US1]` | code + tests                                | Executes task-by-task via `tdd-guide`; parallelizes `[P]` tasks.                             |
| 5. Gate      | `/dod`             | pass/fail verdict                           | Must be green before commit.                                                                 |

The bash scripts replace the original PowerShell ones (which don't run on macOS/Linux). They auto-number features, create the branch, seed templates, and report paths as JSON. Set `SPECIFY_FEATURE=<branch>` to target a feature when not on its git branch.

## Definition of Done

**`/dod`** ([.claude/commands/dod.md](../.claude/commands/dod.md)) runs [.specify/scripts/bash/dod-check.sh](../.specify/scripts/bash/dod-check.sh):

- **Hard gates** (block commit): `npm run lint`, `npx astro check`, `npm test`, `npm run build`, and no `console.log`/`debugger` in `src/`.
- **Human-judgment items** (printed as reminders): SEO metadata, Lighthouse/CWV, accessibility, Storyblok fallbacks, security sign-off.

Use `/dod --fast` to skip the build for a quick pre-check. Derived from the constitution's Definition of Done and `rules/common/code-review.md`. Never bypass a red gate — fix the root cause.

## Evals

**`eval-harness`** skill ([.claude/skills/eval-harness/SKILL.md](../.claude/skills/eval-harness/SKILL.md)) — eval-driven development:

- **Deterministic correctness evals** — golden `{input, expected}` datasets in `__evals__/` graded by a scorer, run via Vitest (`*.eval.test.ts`). Primary target: the handpan widget's music theory (`src/widgets/academy-handpan/theory/`), plus `src/lib` transforms. Every bug found becomes a permanent golden case.
- **LLM/agent evals** — `pass@k` for non-deterministic behavior (e.g. the `music-theory` agent), with adversarial grading. Run on demand, kept out of `npm test`.

## Agents

Model tiers are assigned per role (opus for reasoning, sonnet for review/build, haiku for docs). Files in [.claude/agents/](../.claude/agents/).

| Agent                  | Tier   | Use                                                   |
| ---------------------- | ------ | ----------------------------------------------------- |
| `planner`              | opus   | Step-by-step implementation plan grounded in the repo |
| `architect`            | opus   | Architectural decisions, module & data-model design   |
| `tdd-guide`            | sonnet | New logic / bug fixes, test-first                     |
| `code-reviewer`        | sonnet | Code-quality review of a diff                         |
| `security-reviewer`    | sonnet | Security review (input/secrets/external APIs/content) |
| `build-error-resolver` | sonnet | Build / typecheck / lint failures                     |
| `doc-updater`          | haiku  | Keep README/docs/`.env.example` in sync               |

## Automated hooks

Wired in [.claude/settings.json](../.claude/settings.json). All hooks are non-blocking (exit 0) — the authoritative gate is `/dod`.

- **PostToolUse (Write|Edit)** → [format.sh](../.claude/hooks/format.sh): prettier + `eslint --fix` on the edited file. → [typecheck.sh](../.claude/hooks/typecheck.sh): fast incremental `tsc` for edited `.ts/.tsx` (early warning only; `astro check` is authoritative).
- **Stop** → [quality-gate.sh](../.claude/hooks/quality-gate.sh): runs `astro check` + `npm run lint` and prints a summary when source files changed this turn.

> **Caveat:** the per-edit `typecheck.sh` uses plain `tsc`, which can't resolve `.astro` imports and may report spurious errors for those; it's an early-warning aid only. Remove it from `settings.json` if the noise outweighs the signal — the Stop gate and `/dod` both run the correct `astro check`.

## Typical loops

- **New feature:** `/go build <feature>` → `/specify` → `/plan` → `/tasks` → `/implement` → `/dod` → commit/PR.
- **Bug from QA:** `/go fix issue #N` → `issue-fixer` skill (rewrite → fix → PR → close).
- **Small known fix:** direct edit → `/dod --fast` → commit.
- **Review:** `/go review the diff` → `code-reviewer` (+ `security-reviewer` if sensitive).
