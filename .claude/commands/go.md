---
description: Task orchestrator for SG Handpan Studio. Classifies the request, routes it through the right flow (spec-driven feature / bug fix / direct edit / review), dispatches the right skills + agents (in parallel where independent), and verifies against the Definition of Done. Trigger with "/go <task>".
---

# /go — Orchestrate the task

You are the orchestrator. Don't just start editing — **classify → route → dispatch → verify**. Decompose the work, pick the right skill/agent/tool for each piece, run independent pieces in parallel, and check the result against acceptance criteria before declaring done.

## Always-on tooling

- **serena** — semantic code retrieval and editing (read symbols, find references, replace bodies). Prefer over reading whole files.
- **context7** — up-to-date docs for third-party libs (Astro, React, Storyblok, TonalJS, Tone.js, Embla, Vitest). Never plan against remembered APIs.
- **sequential-thinking** — any multi-step decision or architecture reasoning.
- **playwright** — run the app in a browser; inspect UI; E2E / visual checks.
- **pkg-versions** — check package updates / version conflicts.
- **github** — PRs, issues, branches for `tribalspirit/singaporehandpans`.
- **sentry** — runtime errors / production incidents.
- **cloudflare-docs** — Cloudflare Pages deploy, Workers, R2, adapter config.

## Project: Singapore Handpan Studio (`sghandpan`)

**Stack:** Astro 4 (hybrid SSR) · React 18 islands · TypeScript 5 (strict) · SCSS + CSS Modules · Vitest · Cloudflare Pages
**Integrations:** Storyblok CMS · Shopify Storefront API · Acuity Scheduling · GA4/GTM
**Key source dirs:** `src/pages/` · `src/components/` · `src/widgets/` · `src/lib/` · `src/styles/`
**Guardrails:** `.specify/memory/constitution.md` (SSG-first, minimal JS, Storyblok-owned content) · SSR-freshness (dynamic pages stay request-time SSR, never build-time prerender).

---

## Step 0 — Branch discipline (MANDATORY for any code change)

Every new requirement/feature is implemented on its own feature branch **off `dev`**, and `main`+`dev` must be synced first. Commit/stash the working tree, then let `/specify` (or `create-new-feature.sh`) run the sync + branch — it fetches origin, fast-forwards `main` and `dev`, rebases `dev` onto `main`, and branches off the synced `dev`. For a bug fix or small change that skips `/specify`, run `bash .specify/scripts/bash/sync-branches.sh` and branch off `dev` yourself. Never work directly on `main` or `dev`. See `rules/common/git-workflow.md`.

## Step 1 — Classify the task

Pick the flow. When unsure, ask one clarifying question rather than guessing.

| The task is… | Route it through |
| --- | --- |
| A **new feature / substantial change** (multi-file, user-facing, needs a spec) | **Spec-Driven flow** → `/specify` → `/plan` → `/tasks` → `/implement` → `/dod` |
| A **GitHub bug / QA report** | `issue-fixer` skill (discover → rewrite → fix → PR → close) |
| A **known, localized bug or small change** (1–2 files, obvious fix) | Direct edit → `/dod --fast` |
| A **review / audit** of existing code | Agents: `code-reviewer` (+ `security-reviewer` if sensitive), or `/simplify` |
| A **question / exploration** ("where is X", "how does Y work") | `Explore` subagent — read-only, protects context |
| A **one-shot lookup or single edit** | Just do it directly — no orchestration overhead |

## Step 2 — Route each piece to a skill (domain context) — invoke it FIRST, before writing code

| Task domain | Skill |
| --- | --- |
| Architecture decision / new-feature constraints | `constitution` (check before starting) |
| Storyblok CMS (content, components, schemas) | `storyblok` |
| Shopify / shop page | `shop` |
| Gallery (lightbox, tag filters, album) | `gallery` |
| Academy handpan memorization widget | `handpan-widget` |
| Music theory, scales, intervals, pedagogy | `music-theory` |
| Correctness/quality evals (theory, transforms, agent behavior) | `eval-harness` |
| Auth, user input, secrets, API endpoints, sensitive features | `security-review` (before finishing such work) |
| Audit `.claude/` config for injection/misconfig | `security-scan` |
| Hunt exploitable, reportable vulnerabilities | `security-bounty-hunter` |
| SEO audit, schema, sitemap/robots, visibility | `seo` |
| Error handling — typed errors, retries, boundaries | `error-handling` |
| Vite / Astro build config, plugins, HMR, env | `vite-patterns` |
| Cloudflare Pages deploy, env, build issues | `deploy` + cloudflare-docs MCP |
| Dev environment, local setup, tokens | `setup` |
| Layout audit, responsive issues, UI bugs | `layout-audit` |
| Find an existing skill before building one | `skill-scout` |
| Find/install a new MCP integration | `smithery-ai-cli` |
| `.claude/` tooling conventions (hooks, scripts, commits) | `everything-claude-code` |
| Post-change quality cleanup | `simplify` |

## Step 3 — Dispatch agents (model tier chosen for you)

Subagents don't see this conversation — brief each one self-contained: goal in one sentence, exact file paths/prior findings, output format, and whether it may write code. Run independent pieces **in parallel** (multiple Agent calls in one message); serialize anything sharing a file/type/config.

| Need | Agent | Tier |
| --- | --- | --- |
| Step-by-step implementation plan grounded in the repo | `planner` | opus |
| Architectural decision / module & data-model design | `architect` | opus |
| New logic or bug fix, test-first | `tdd-guide` | sonnet |
| Code-quality review of a diff | `code-reviewer` | sonnet |
| Security review (input/secrets/external APIs/content) | `security-reviewer` | sonnet |
| Build / typecheck / lint failure | `build-error-resolver` | sonnet |
| Keep README / docs / `.env.example` in sync | `doc-updater` | haiku |
| "Where is X" / broad read-only search | `Explore` (subagent_type) | — |

**Plan-first when ambiguous:** run `architect`/`planner` before fanning out implementation you might have to redo. **Fan-out audits** (independent `Explore` agents per area) → you synthesize → act. **Implement + review:** run `code-reviewer` against the diff once the implementation agent finishes.

## Step 4 — Verify against the Definition of Done

Never call it done on a summary. Check the artifact:

- Read the actual diff (`git diff`), don't trust an agent's self-report.
- Run **`/dod`** (or `/dod --fast` for small changes) — lint + typecheck + tests + build + hygiene. Fix every hard failure at the root; never `--no-verify` or disable a rule to go green.
- Confirm the spec's acceptance criteria / success criteria are actually met.
- The PostToolUse hooks auto-format edits and the Stop hook prints a type/lint signal — but `/dod` is the authoritative gate.

## Output

End with a 1–2 sentence report: what got done, `/dod` status, and anything still open. Skip the play-by-play.

---

$ARGUMENTS
