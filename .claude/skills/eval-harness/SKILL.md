---
name: eval-harness
description: Eval-driven development for SG Handpan Studio. Use to design, write, and run evals — golden-dataset correctness checks for deterministic logic (music theory, data transforms) and pass@k evals for LLM/agent behavior. Trigger when adding logic that must be provably correct, validating the handpan widget's theory, or measuring a prompt/agent's quality.
---

# Eval Harness

Evals are graded checks against a fixed dataset of inputs with known-good expected outputs. They differ from unit tests in intent: a **unit test** proves a function does what the author meant; an **eval** measures whether behavior meets a quality bar across a representative set — and it's how you catch silent regressions in logic that's easy to get subtly wrong (music theory) or non-deterministic (LLM/agent output).

This project has two eval surfaces.

## 1. Deterministic correctness evals (primary — start here)

The Academy handpan widget's music theory (`src/widgets/academy-handpan/theory/`, built on TonalJS) is the highest-value eval target: scales, intervals, enharmonics, and diatonic triads have exactly one correct answer, and regressions there are pedagogically wrong, not just buggy.

**Pattern — golden dataset + Vitest:**

1. Author a golden dataset as data, not assertions — a table of `{ input, expected }` cases sourced from music-theory ground truth (not from the current implementation's output — that would bake in bugs). Use the `music-theory` skill/agent to validate the expected values.

   ```ts
   // src/widgets/academy-handpan/theory/__evals__/diatonic-triads.golden.ts
   export const DIATONIC_TRIAD_CASES = [
     { scale: 'C major',  degree: 1, expected: { root: 'C', quality: 'major',      notes: ['C', 'E', 'G'] } },
     { scale: 'C major',  degree: 2, expected: { root: 'D', quality: 'minor',      notes: ['D', 'F', 'A'] } },
     { scale: 'C major',  degree: 7, expected: { root: 'B', quality: 'diminished', notes: ['B', 'D', 'F'] } },
     { scale: 'D dorian',  degree: 1, expected: { root: 'D', quality: 'minor',     notes: ['D', 'F', 'A'] } },
     // enharmonic edge cases — the ones most likely to regress:
     { scale: 'F# major', degree: 4, expected: { root: 'B', quality: 'major',      notes: ['B', 'D#', 'F#'] } },
     { scale: 'Gb major', degree: 4, expected: { root: 'Cb', quality: 'major',     notes: ['Cb', 'Eb', 'Gb'] } },
   ] as const;
   ```

2. Drive every case through the real implementation and grade with a scorer. Report the **pass rate**, and fail the suite below a threshold (100% for deterministic theory).

   ```ts
   // diatonic-triads.eval.test.ts
   import { describe, it, expect } from 'vitest';
   import { DIATONIC_TRIAD_CASES } from './diatonic-triads.golden';
   import { getDiatonicTriad } from '../diatonicTriads';

   describe('eval: diatonic triads', () => {
     const results = DIATONIC_TRIAD_CASES.map((c) => {
       const got = getDiatonicTriad(c.scale, c.degree);
       const pass =
         got.root === c.expected.root &&
         got.quality === c.expected.quality &&
         got.notes.join() === c.expected.notes.join();
       return { c, pass };
     });
     const rate = results.filter((r) => r.pass).length / results.length;

     it('passes 100% of golden theory cases', () => {
       const fails = results.filter((r) => !r.pass)
         .map((r) => `${r.c.scale} deg ${r.c.degree}`);
       expect(fails, `failed: ${fails.join(', ')}`).toHaveLength(0);
       expect(rate).toBe(1);
     });
   });
   ```

   Run: `npx vitest run "**/*.eval.test.ts"`. Add `test:evals` to `package.json` scripts if you want a dedicated entrypoint. Grow the dataset every time a theory bug is found — the failing case becomes a permanent golden case (regression-locking).

**Other deterministic targets:** Storyblok→view-model transforms in `src/lib/`, gallery tag-filter logic, SEO metadata builders. Same pattern: golden `{input, expected}` table + scorer + threshold.

## 2. LLM / agent evals (pass@k)

Use when measuring a non-deterministic component — e.g., whether the `music-theory` agent answers correctly, or whether a prompt reliably produces valid output. Because output varies per run, grade **pass@k**: run each case `k` times, count a case passed if ≥1 (or a set fraction) of runs meet the rubric.

- **Dataset:** a set of prompts/questions with a rubric or expected answer key (theory questions have deterministic answers — grade exactly; open-ended ones need a rubric or an LLM-judge).
- **Metric:** `pass@k` (did it succeed within k attempts) and consistency (how many of k passed). Report both — high pass@1 and low variance is the goal.
- **Adversarial grading:** for LLM-judged rubrics, prefer an independent judge prompted to *refute* the answer; default to "fail" on uncertainty so borderline cases don't inflate the score.
- Keep these out of the default `npm test` path (they cost tokens and are slow); run on demand or in a scheduled job.

## How to use this skill

1. Decide the surface: deterministic → golden dataset in `__evals__/`; non-deterministic → pass@k dataset.
2. Source expected values from ground truth (music-theory skill for theory), never from current output.
3. Write the scorer, set the threshold, wire the runner.
4. On any bug, add the reproducing case to the golden set before fixing — lock the regression.
5. Report pass rate / pass@k, not just red-green.

## Definition of a good eval

- Cases are representative and include the edge cases most likely to regress (enharmonics, empty CMS responses, boundary tags).
- Expected values are independently correct, not implementation-derived.
- The threshold is explicit and enforced.
- Failures name the exact case, so the next engineer knows what broke.
