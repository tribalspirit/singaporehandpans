/**
 * Theory Sanity Check
 *
 * Validates diatonic triad generation for all handpan scales.
 * Run with: npx tsx src/widgets/academy-handpan/dev-references/theorySanityCheck.ts
 */

import { getAllHandpanConfigs } from '../config/handpans';
import { getDiatonicTriads } from '../theory/diatonicTriads';
import { normalizeToPitchClass } from '../theory/normalize';
import { note } from '@tonaljs/core';

/** Valid triad interval templates */
const VALID_TEMPLATES: number[][] = [
  [0, 3, 7], // minor
  [0, 4, 7], // major
  [0, 3, 6], // diminished
  [0, 4, 8], // augmented
];

interface ValidationResult {
  handpanId: string;
  handpanName: string;
  scaleName: string;
  scaleSize: number;
  passed: boolean;
  errors: string[];
  triads: Array<{
    degree: number;
    root: string;
    displayName: string;
    notes: string[];
    pitchClasses: string[];
    intervals: number[];
  }>;
}

function getIntervals(pitchClasses: string[]): number[] {
  const rootMidi = note(`${pitchClasses[0]}4`).midi;
  if (rootMidi === null) return [];
  return pitchClasses.map((pc) => {
    const midi = note(`${pc}4`).midi;
    if (midi === null) return -1;
    return (((midi - rootMidi) % 12) + 12) % 12;
  });
}

function validateHandpan(
  handpanId: string,
  handpanName: string,
  scaleName: string,
  notes: string[]
): ValidationResult {
  const errors: string[] = [];
  const triads = getDiatonicTriads(notes, notes);
  const uniquePcs = new Set(notes.map(normalizeToPitchClass));
  const scaleSize = uniquePcs.size;

  // Check: At least 1 triad for 5+ note scales
  if (scaleSize >= 5 && triads.length < 1) {
    errors.push(
      `Expected at least 1 triad for ${scaleSize}-note scale, got ${triads.length}`
    );
  }

  // Check: Triad count is reasonable for scale size
  if (triads.length > scaleSize) {
    errors.push(
      `More triads (${triads.length}) than scale degrees (${scaleSize})`
    );
  }

  // Check: All triads have 3 unique notes
  for (const triad of triads) {
    if (triad.chord.notes.length < 3) {
      errors.push(
        `Triad ${triad.degree} (${triad.chord.displayName}) has ${triad.chord.notes.length} notes, expected at least 3`
      );
    }

    const uniqueTriadPcs = new Set(triad.chord.pitchClasses);
    if (uniqueTriadPcs.size !== 3) {
      errors.push(
        `Triad ${triad.degree} (${triad.chord.displayName}) has ${uniqueTriadPcs.size} unique pitch classes, expected 3`
      );
    }

    // Check: All pitch classes are from the scale
    const availablePcs = new Set(notes.map(normalizeToPitchClass));
    for (const pc of triad.chord.pitchClasses) {
      if (!availablePcs.has(pc)) {
        errors.push(
          `Triad ${triad.degree} (${triad.chord.displayName}) contains PC ${pc} not in scale`
        );
      }
    }

    // Check: Intervals match a valid triad template
    const intervals = getIntervals(triad.chord.pitchClasses);
    const matchesTemplate = VALID_TEMPLATES.some(
      (t) =>
        t[0] === intervals[0] && t[1] === intervals[1] && t[2] === intervals[2]
    );
    if (!matchesTemplate) {
      errors.push(
        `Triad ${triad.degree} (${triad.chord.displayName}) has invalid intervals [${intervals.join(',')}]`
      );
    }

    // Check: All concrete notes are from available notes
    for (const n of triad.chord.notes) {
      if (!notes.includes(n)) {
        errors.push(
          `Triad ${triad.degree} (${triad.chord.displayName}) contains note ${n} not in handpan`
        );
      }
    }
  }

  // Note: Duplicate pitch class sets can occur legitimately with augmented triads
  // (e.g., Onoleo's E+, Ab+, C+ all share {Ab,C,E} because augmented triads are symmetric)

  // Check: Degree numbers are valid
  for (const triad of triads) {
    if (triad.degree < 1 || triad.degree > scaleSize) {
      errors.push(
        `Triad degree ${triad.degree} out of range [1, ${scaleSize}]`
      );
    }
  }

  return {
    handpanId,
    handpanName,
    scaleName,
    scaleSize,
    passed: errors.length === 0,
    errors,
    triads: triads.map((t) => ({
      degree: t.degree,
      root: t.root,
      displayName: t.chord.displayName,
      notes: t.chord.notes,
      pitchClasses: t.chord.pitchClasses,
      intervals: getIntervals(t.chord.pitchClasses),
    })),
  };
}

function runSanityCheck() {
  console.log('=== Theory Sanity Check ===\n');

  const configs = getAllHandpanConfigs();
  const results: ValidationResult[] = [];

  for (const config of configs) {
    const result = validateHandpan(
      config.id,
      config.name,
      config.scaleName,
      config.notes
    );
    results.push(result);
  }

  // Print results
  let totalPassed = 0;
  let totalFailed = 0;

  for (const result of results) {
    const status = result.passed ? 'PASS' : 'FAIL';
    console.log(
      `\n[${status}] ${result.handpanName} (${result.scaleName}) - ${result.scaleSize} PCs`
    );
    console.log(`  ID: ${result.handpanId}`);
    console.log(`  Triads: ${result.triads.length}`);

    if (result.errors.length > 0) {
      console.log(`  Errors:`);
      for (const error of result.errors) {
        console.log(`    - ${error}`);
      }
      totalFailed++;
    } else {
      console.log(`  Triads:`);
      for (const triad of result.triads) {
        const flags = [triad.degree === 1 ? 'TONIC' : '']
          .filter(Boolean)
          .join(' ');
        console.log(
          `    ${triad.degree}. ${triad.displayName} [${triad.intervals.join(',')}] (${triad.notes.join(' ')}) ${flags ? `[${flags}]` : ''}`
        );
      }
      totalPassed++;
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Total: ${results.length}`);
  console.log(`Passed: ${totalPassed}`);
  console.log(`Failed: ${totalFailed}`);

  if (totalFailed === 0) {
    console.log(`\n✅ All handpan scales passed validation!`);
  } else {
    console.log(`\n❌ ${totalFailed} handpan scale(s) failed validation.`);
    process.exit(1);
  }
}

// Run if executed directly
runSanityCheck();

export { validateHandpan, runSanityCheck };
