import * as Scale from '@tonaljs/scale';
import { note } from '@tonaljs/core';
import { normalizeToPitchClass } from './normalize';
import { assignAllOctavesToPitchClasses, sortNotesByPitch } from './utils';
import { isSubset } from './pcset';
import type { PlayableChord } from './chords';

export interface DiatonicTriad {
  degree: number;
  root: string;
  chord: PlayableChord;
  isTonic: boolean;
  isRelativeMajor: boolean;
}

/**
 * Extract scale pitch classes from handpan notes.
 * Returns pitch classes in scale degree order starting from tonic.
 * The first note in handpanNotes is assumed to be the tonic (ding).
 * Works with scales of 5-7 notes (pentatonic, hexatonic, heptatonic).
 */
function extractScalePitchClasses(handpanNotes: string[]): string[] {
  if (handpanNotes.length === 0) {
    return [];
  }

  // Get unique pitch classes
  const uniquePcs = new Set<string>();
  for (const noteStr of handpanNotes) {
    uniquePcs.add(normalizeToPitchClass(noteStr));
  }

  const pcs = Array.from(uniquePcs);
  const tonicPc = normalizeToPitchClass(handpanNotes[0]);

  // For 7-note scales, try to identify using Tonal.js
  if (pcs.length === 7) {
    for (const mode of [
      'major',
      'minor',
      'dorian',
      'phrygian',
      'lydian',
      'mixolydian',
      'locrian',
    ]) {
      const scale = Scale.get(`${tonicPc} ${mode}`);
      if (scale.notes && scale.notes.length === 7) {
        const scalePcs = scale.notes.map(normalizeToPitchClass);
        const scalePcSet = new Set(scalePcs);
        const handpanPcSet = new Set(pcs);

        if (
          scalePcSet.size === handpanPcSet.size &&
          scalePcSet.size === 7 &&
          [...scalePcSet].every((pc) => handpanPcSet.has(pc))
        ) {
          return scalePcs;
        }
      }
    }
  }

  // For all scales (5-7 notes), order by pitch intervals from tonic
  const tonicNote = note(`${tonicPc}4`);
  const sorted = pcs.sort((a, b) => {
    const n1 = note(`${a}4`);
    const n2 = note(`${b}4`);
    if (n1.midi !== null && n2.midi !== null && tonicNote.midi !== null) {
      const interval1 = (n1.midi - tonicNote.midi + 12) % 12;
      const interval2 = (n2.midi - tonicNote.midi + 12) % 12;
      return interval1 - interval2;
    }
    return a.localeCompare(b);
  });

  // Ensure tonic is first
  const tonicIndex = sorted.indexOf(tonicPc);
  if (tonicIndex > 0) {
    return [
      tonicPc,
      ...sorted.slice(tonicIndex + 1),
      ...sorted.slice(0, tonicIndex),
    ];
  }

  return sorted;
}

/**
 * Get interval in semitones between two pitch classes (0-11).
 */
function getIntervalInSemitones(pc1: string, pc2: string): number {
  const n1 = note(`${pc1}4`);
  const n2 = note(`${pc2}4`);
  if (n1.midi !== null && n2.midi !== null) {
    return (((n2.midi - n1.midi) % 12) + 12) % 12;
  }
  return 0;
}

/**
 * Determine triad quality from intervals.
 * Returns null if intervals don't match any known triad template.
 */
function determineTriadQuality(
  rootPc: string,
  thirdPc: string,
  fifthPc: string
): 'major' | 'minor' | 'diminished' | 'augmented' | null {
  const rootToThird = getIntervalInSemitones(rootPc, thirdPc);
  const rootToFifth = getIntervalInSemitones(rootPc, fifthPc);

  if (rootToThird === 4 && rootToFifth === 7) return 'major';
  if (rootToThird === 3 && rootToFifth === 7) return 'minor';
  if (rootToThird === 3 && rootToFifth === 6) return 'diminished';
  if (rootToThird === 4 && rootToFifth === 8) return 'augmented';

  return null;
}

/**
 * Try to build a triad result from root, third, fifth pitch classes.
 * Returns null if notes aren't available or quality is invalid.
 */
function tryBuildTriad(
  rootPc: string,
  thirdPc: string,
  fifthPc: string,
  degree: number,
  availableNotes: string[]
): DiatonicTriad | null {
  const triadPcs = [rootPc, thirdPc, fifthPc];
  const availablePcs = availableNotes.map(normalizeToPitchClass);

  if (!isSubset(triadPcs, availablePcs)) {
    return null;
  }

  const quality = determineTriadQuality(rootPc, thirdPc, fifthPc);
  if (!quality) return null;

  const mappedNotes = assignAllOctavesToPitchClasses(triadPcs, availableNotes);
  const orderedNotes = sortNotesByPitch(mappedNotes);

  if (orderedNotes.length < 3) {
    return null;
  }

  let displayName = '';
  if (quality === 'major') {
    displayName = rootPc;
  } else if (quality === 'minor') {
    displayName = `${rootPc}m`;
  } else if (quality === 'diminished') {
    displayName = `${rootPc}°`;
  } else if (quality === 'augmented') {
    displayName = `${rootPc}+`;
  }

  const chord: PlayableChord = {
    name: `${rootPc}-triad-${degree}`,
    displayName,
    notes: orderedNotes,
    pitchClasses: triadPcs,
    category: 'basic',
  };

  return {
    degree,
    root: rootPc,
    chord,
    isTonic: degree === 1,
    isRelativeMajor: false, // Set later in getDiatonicTriads
  };
}

/**
 * Build a triad on a specific scale degree.
 * Strategy 1: Traditional stacking (positions +2 and +4) — works for 7-note scales.
 * Strategy 2: Interval-based search with P5 preference — handles non-heptatonic scales.
 * Returns null if no valid triad can be built on this degree.
 */
function buildTriadOnDegree(
  scalePcs: string[],
  degree: number,
  availableNotes: string[]
): DiatonicTriad | null {
  const scaleSize = scalePcs.length;
  if (scaleSize < 5) {
    return null;
  }

  const rootIndex = (degree - 1) % scaleSize;
  const rootPc = scalePcs[rootIndex];
  if (!rootPc) return null;

  // Strategy 1: Traditional stacking (skip every other note)
  const tradThirdPc = scalePcs[(rootIndex + 2) % scaleSize];
  const tradFifthPc = scalePcs[(rootIndex + 4) % scaleSize];
  const tradResult = tryBuildTriad(
    rootPc,
    tradThirdPc,
    tradFifthPc,
    degree,
    availableNotes
  );
  if (tradResult) return tradResult;

  // Strategy 2: Interval-based search
  // Collect all third candidates (3=m3 or 4=M3 semitones above root)
  const thirdCandidates: Array<{ pc: string; interval: number }> = [];
  // Collect all fifth candidates (6=dim5, 7=P5, or 8=aug5 semitones above root)
  const fifthCandidates: Array<{ pc: string; interval: number }> = [];

  for (let i = 1; i < scaleSize; i++) {
    const idx = (rootIndex + i) % scaleSize;
    const interval = getIntervalInSemitones(rootPc, scalePcs[idx]);
    if (interval === 3 || interval === 4) {
      thirdCandidates.push({ pc: scalePcs[idx], interval });
    }
    if (interval === 6 || interval === 7 || interval === 8) {
      fifthCandidates.push({ pc: scalePcs[idx], interval });
    }
  }

  if (thirdCandidates.length === 0 || fifthCandidates.length === 0) {
    return null;
  }

  // Sort fifths: P5 (7) preferred, then dim5 (6), then aug5 (8)
  const fifthPriority = [7, 6, 8];
  fifthCandidates.sort(
    (a, b) =>
      fifthPriority.indexOf(a.interval) - fifthPriority.indexOf(b.interval)
  );

  // Try all (fifth, third) combinations, return first valid triad
  for (const fifth of fifthCandidates) {
    for (const third of thirdCandidates) {
      const result = tryBuildTriad(
        rootPc,
        third.pc,
        fifth.pc,
        degree,
        availableNotes
      );
      if (result) return result;
    }
  }

  return null;
}

/**
 * Order triads by Circle of Fifths (functional harmony order).
 * For minor: ii° → v → i → iv → VII → III → VI
 * For major: vii° → iii → vi → ii → V → I → IV
 */
function orderTriadsByCircleOfFifths(
  triads: DiatonicTriad[],
  isMinor: boolean
): DiatonicTriad[] {
  // Functional harmony ordering
  const minorOrder = [2, 5, 1, 4, 7, 3, 6]; // ii° → v → i → iv → VII → III → VI
  const majorOrder = [7, 3, 6, 2, 5, 1, 4]; // vii° → iii → vi → ii → V → I → IV

  const order = isMinor ? minorOrder : majorOrder;
  const ordered: DiatonicTriad[] = [];
  const used = new Set<number>();

  // Add triads in functional order
  for (const degree of order) {
    const triad = triads.find((t) => t.degree === degree);
    if (triad && !used.has(degree)) {
      ordered.push(triad);
      used.add(degree);
    }
  }

  // Add any remaining triads not in the standard order
  for (const triad of triads) {
    if (!used.has(triad.degree)) {
      ordered.push(triad);
    }
  }

  return ordered;
}

/**
 * Get all diatonic triads for a handpan scale.
 * Works with scales of 5-7 notes (pentatonic, hexatonic, heptatonic).
 * Returns triads if at least 1 can be built from the scale.
 */
export function getDiatonicTriads(
  handpanNotes: string[],
  availableNotes: string[]
): DiatonicTriad[] {
  const scalePcs = extractScalePitchClasses(handpanNotes);

  if (scalePcs.length < 5) {
    return [];
  }

  const scaleSize = scalePcs.length;
  const triads: DiatonicTriad[] = [];

  for (let degree = 1; degree <= scaleSize; degree++) {
    const triad = buildTriadOnDegree(scalePcs, degree, availableNotes);
    if (triad) {
      triads.push(triad);
    }
  }

  if (triads.length < 1) {
    return [];
  }

  // Determine tonic triad quality and set isRelativeMajor
  const tonicTriad = triads.find((t) => t.degree === 1);
  const tonicIsMinor = tonicTriad?.chord.displayName.endsWith('m') || false;
  const tonicPc = scalePcs[0];

  for (const triad of triads) {
    // isRelativeMajor: root is 3 semitones above tonic, quality is major, tonic is minor
    const intervalFromTonic = getIntervalInSemitones(tonicPc, triad.root);
    triad.isRelativeMajor =
      intervalFromTonic === 3 &&
      tonicIsMinor &&
      !triad.chord.displayName.endsWith('m') &&
      !triad.chord.displayName.endsWith('°') &&
      !triad.chord.displayName.endsWith('+');
  }

  return orderTriadsByCircleOfFifths(triads, tonicIsMinor);
}
