/**
 * Theory Sanity Check
 * 
 * Validates diatonic triad generation for all handpan scales.
 * Run with: npx tsx src/widgets/academy-handpan/dev-references/theorySanityCheck.ts
 */

import { getAllHandpanConfigs } from '../config/handpans';
import { getDiatonicTriads } from '../theory/diatonicTriads';
import { normalizeToPitchClass } from '../theory/normalize';

interface ValidationResult {
  handpanId: string;
  handpanName: string;
  scaleName: string;
  passed: boolean;
  errors: string[];
  triads: Array<{
    degree: number;
    root: string;
    displayName: string;
    notes: string[];
    pitchClasses: string[];
  }>;
}

function validateHandpan(handpanId: string, handpanName: string, scaleName: string, notes: string[]): ValidationResult {
  const errors: string[] = [];
  const triads = getDiatonicTriads(notes, notes);
  
  // Check: Exactly 7 triads
  if (triads.length !== 7) {
    errors.push(`Expected 7 triads, got ${triads.length}`);
  }
  
  // Check: All triads have 3 unique notes
  for (const triad of triads) {
    if (triad.chord.notes.length !== 3) {
      errors.push(`Triad ${triad.degree} (${triad.chord.displayName}) has ${triad.chord.notes.length} notes, expected 3`);
    }
    
    const uniqueNotes = new Set(triad.chord.notes);
    if (uniqueNotes.size !== 3) {
      errors.push(`Triad ${triad.degree} (${triad.chord.displayName}) has duplicate notes`);
    }
    
    // Check: All notes are from available notes
    const availablePcs = new Set(notes.map(normalizeToPitchClass));
    for (const note of triad.chord.notes) {
      const pc = normalizeToPitchClass(note);
      if (!availablePcs.has(pc)) {
        errors.push(`Triad ${triad.degree} (${triad.chord.displayName}) contains note ${note} (${pc}) not in handpan`);
      }
    }
  }
  
  // Check: No duplicate triads (by pitch class set)
  const pcSets = new Set<string>();
  for (const triad of triads) {
    const pcSet = triad.chord.pitchClasses.sort().join(',');
    if (pcSets.has(pcSet)) {
      errors.push(`Duplicate triad found: ${triad.chord.displayName} (pitch classes: ${pcSet})`);
    }
    pcSets.add(pcSet);
  }
  
  // Check: Tonic exists (degree 1)
  const tonic = triads.find(t => t.degree === 1);
  if (!tonic) {
    errors.push('Tonic triad (degree 1) is missing');
  }
  
  // Check: All degrees 1-7 are present
  const degrees = new Set(triads.map(t => t.degree));
  for (let d = 1; d <= 7; d++) {
    if (!degrees.has(d)) {
      errors.push(`Degree ${d} triad is missing`);
    }
  }
  
  return {
    handpanId,
    handpanName,
    scaleName,
    passed: errors.length === 0,
    errors,
    triads: triads.map(t => ({
      degree: t.degree,
      root: t.root,
      displayName: t.chord.displayName,
      notes: t.chord.notes,
      pitchClasses: t.chord.pitchClasses,
    })),
  };
}

function runSanityCheck() {
  console.log('=== Theory Sanity Check ===\n');
  
  const configs = getAllHandpanConfigs();
  const results: ValidationResult[] = [];
  
  for (const config of configs) {
    const result = validateHandpan(config.id, config.name, config.scaleName, config.notes);
    results.push(result);
  }
  
  // Print results
  let totalPassed = 0;
  let totalFailed = 0;
  
  for (const result of results) {
    console.log(`\n[${result.passed ? 'PASS' : 'FAIL'}] ${result.handpanName} (${result.scaleName})`);
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
        const flags = [
          triad.degree === 1 ? 'TONIC' : '',
          result.triads.find(t => t.degree === 3 && t.root === triad.root && triad.degree === 3) ? 'REL-MAJ' : '',
        ].filter(Boolean).join(' ');
        console.log(`    ${triad.degree}. ${triad.displayName} (${triad.notes.join(' ')}) ${flags ? `[${flags}]` : ''}`);
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
if (require.main === module) {
  runSanityCheck();
}

export { validateHandpan, runSanityCheck };

