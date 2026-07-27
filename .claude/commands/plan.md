---
description: Spec-Driven step 2 — turn a spec into a technical implementation plan. Seeds specs/<branch>/plan.md and any design docs (research, data-model, contracts). Trigger with "/plan".
---

# /plan — Design the implementation

You are running **step 2 of the Spec-Driven Development flow**. The spec (WHAT/WHY) exists; you now decide HOW, consistent with the constitution and this repo's conventions.

## Steps

1. **Load context.** Run:

   ```bash
   bash .specify/scripts/bash/setup-plan.sh --json
   ```

   Read `FEATURE_SPEC` (the spec) and confirm there are no open `[NEEDS CLARIFICATION]` markers — if there are, stop and resolve them with the user first. The command seeds `plan.md` from `.specify/templates/plan-template.md`.

2. **Delegate the design.** For any non-trivial feature, dispatch the **`architect`** agent (system/data design, module boundaries, trade-offs) and/or the **`planner`** agent (step-by-step implementation strategy). Give the agent the full spec text — it has no prior context. Reuse existing patterns: point it at `src/pages/`, `src/components/`, `src/widgets/`, `src/lib/`, `src/styles/` and the relevant project skill (`/storyblok`, `/shop`, `/gallery`, `/handpan-widget`, `/music-theory`).

3. **Check constraints (the "Constitution Check" gate).** Before writing the plan, verify the approach honors: SSG-first / minimal client JS (islands only), SCSS + CSS Modules (no Tailwind), TypeScript strict, content owned by Storyblok with graceful fallbacks, SEO baseline, accessibility, mobile-first. Record any justified deviation explicitly in the plan; an unjustified violation means redesign, not a waiver.

4. **Write `plan.md`** with: chosen approach and why, architecture/module boundaries, the tech touchpoints (files/dirs to add or change), external touchpoints (Storyblok schema, Acuity, Cloudflare), risks, and a testing strategy. Create supporting docs in the feature dir when useful: `research.md` (options weighed), `data-model.md` (entities/content types), `contracts/` (API or Storyblok component schemas).

5. **Verify library facts** with **context7** MCP for any Astro/React/Storyblok/Tone.js/Tonal API you rely on. Don't plan against remembered APIs.

## Output

Summarize the chosen approach in a few sentences, list the design docs written, and note open risks. End with: "Next: `/tasks` to break this into an ordered task list." Do not start implementing.
