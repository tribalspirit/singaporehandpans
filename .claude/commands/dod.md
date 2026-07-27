---
description: Definition-of-Done gate. Runs lint + typecheck + tests + build and hygiene checks against the constitution, then reports pass/fail. Run before every commit/PR. Trigger with "/dod" (use "/dod --fast" to skip the build).
---

# /dod — Definition of Done gate

The authoritative "is this shippable?" check for SG Handpan Studio. Enforces the constitution's Definition of Done (`.specify/memory/constitution.md`) and the review checklist in `rules/common/code-review.md`. **Never commit on a red DoD.**

## 1. Run the automated gate

```bash
bash .specify/scripts/bash/dod-check.sh
```

Use `bash .specify/scripts/bash/dod-check.sh --fast` for a quick pre-check that skips the production build.

**Hard gates** (must be green, script exits non-zero otherwise):
- `npm run lint` — ESLint clean
- `npx astro check` — TypeScript strict typecheck clean
- `npm test` — Vitest passing
- `npm run build` — production SSG build succeeds (unless `--fast`)
- No `console.log` / `console.debug` / `debugger` in `src/` (tests excluded)

**Soft checks** (reported, non-blocking): leftover TODO/FIXME markers.

## 2. Verify the human-judgment items

The script prints these as reminders because they need eyes, not just exit codes. Confirm each for the changed surface:

- [ ] **SEO** — every affected route ships prerendered HTML with unique `<title>` + meta description, canonical URL, and OG/Twitter tags; sitemap/robots still valid. (Use the `seo` skill if unsure.)
- [ ] **Performance** — Lighthouse mobile acceptable; no new layout shift; islands hydrate strategically (`client:visible`/`client:idle`); CWV budgets in `rules/web/performance.md` respected.
- [ ] **Accessibility** — keyboard nav works; focus visible; semantic landmarks/headings; images have alt or are decorative; contrast holds.
- [ ] **Content** — Storyblok-owned content is editable with graceful fallbacks when the CMS is unreachable; no hardcoded content.
- [ ] **Security** — if the change touched input handling, secrets, or external APIs, the `security-reviewer` agent / `security-review` skill signed off.

## 3. On failure

Diagnose and fix the **root cause**. Do not `--no-verify`, disable lint rules, skip tests, or comment out failing assertions to go green. If a gate reveals a spec problem, loop back to `/plan` or `/tasks`.

## Output

Report the gate summary (pass/fail per hard gate), the state of each human-judgment item, and a clear verdict: **DoD PASSED** (safe to commit/PR) or **DoD FAILED** with the specific blockers.
