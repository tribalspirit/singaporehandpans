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
 * Get interval in semitones between two pitch classes.
 */
function getIntervalInSemitones(pc1: string, pc2: string): number {
  // Convert to notes with octave for MIDI calculation
  const n1 = note(`${pc1}4`);
  const n2 = note(`${pc2}4`);
  if (n1.midi !== null && n2.midi !== null) {
    let interval = n2.midi - n1.midi;
    // Normalize to 0-11 range
    if (interval < 0) interval += 12;
    return interval;
  }
  return 0;
}

/**
 * Determine triad quality from intervals.
 */
function determineTriadQuality(
  rootPc: string,
  thirdPc: string,
  fifthPc: string
): 'major' | 'minor' | 'diminished' | 'augmented' {
  const rootToThird = getIntervalInSemitones(rootPc, thirdPc);
  const rootToFifth = getIntervalInSemitones(rootPc, fifthPc);

  if (rootToThird === 4 && rootToFifth === 7) return 'major';
  if (rootToThird === 3 && rootToFifth === 7) return 'minor';
  if (rootToThird === 3 && rootToFifth === 6) return 'diminished';
  if (rootToThird === 4 && rootToFifth === 8) return 'augmented';

  // Fallback: try to determine from actual notes
  const rootNote = note(`${rootPc}4`);
  const thirdNote = note(`${thirdPc}4`);
  const fifthNote = note(`${fifthPc}4`);

  if (
    rootNote.midi !== null &&
    thirdNote.midi !== null &&
    fifthNote.midi !== null
  ) {
    const thirdInterval = (thirdNote.midi - rootNote.midi + 12) % 12;
    const fifthInterval = (fifthNote.midi - rootNote.midi + 12) % 12;

    if (thirdInterval === 4 && fifthInterval === 7) return 'major';
    if (thirdInterval === 3 && fifthInterval === 7) return 'minor';
    if (thirdInterval === 3 && fifthInterval === 6) return 'diminished';
    if (thirdInterval === 4 && fifthInterval === 8) return 'augmented';
  }

  return 'minor'; // Default fallback
}

/**
 * Build a triad on a specific scale degree.
 * Works with scales of 5-7 notes.
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
  const thirdIndex = (degree + 1) % scaleSize;
  const fifthIndex = (degree + 3) % scaleSize;

  const rootPc = scalePcs[rootIndex];
  const thirdPc = scalePcs[thirdIndex];
  const fifthPc = scalePcs[fifthIndex];

  if (!rootPc || !thirdPc || !fifthPc) {
    return null;
  }

  const triadPcs = [rootPc, thirdPc, fifthPc];
  const availablePcs = availableNotes.map(normalizeToPitchClass);

  if (!isSubset(triadPcs, availablePcs)) {
    return null;
  }

  const mappedNotes = assignAllOctavesToPitchClasses(triadPcs, availableNotes);
  const orderedNotes = sortNotesByPitch(mappedNotes);

  if (orderedNotes.length < 3) {
    return null;
  }

  const quality = determineTriadQuality(rootPc, thirdPc, fifthPc);

  let displayName = '';
  if (quality === 'major') {
    displayName = rootPc;
  } else if (quality === 'minor') {
    displayName = `${rootPc}m`;
  } else if (quality === 'diminished') {
    displayName = `${rootPc}°`;
  } else if (quality === 'augmented') {
    displayName = `${rootPc}+`;
  } else {
    displayName = rootPc;
  }

  const chord: PlayableChord = {
    name: `${rootPc}-triad-${degree}`,
    displayName,
    notes: orderedNotes,
    pitchClasses: triadPcs,
    category: 'basic',
  };

  const isTonic = degree === 1;

  const tonicQuality = determineTriadQuality(
    scalePcs[0],
    scalePcs[2 % scaleSize],
    scalePcs[4 % scaleSize]
  );
  const isRelativeMajor =
    degree === 3 && tonicQuality === 'minor' && quality === 'major';

  return {
    degree,
    root: rootPc,
    chord,
    isTonic,
    isRelativeMajor,
  };
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

  // Add any remaining triads (shouldn't happen if we have exactly 7)
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
 * Returns triads if at least 3 can be built from the scale.
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

  if (triads.length < 3) {
    return [];
  }

  const tonicTriad = triads.find((t) => t.degree === 1);
  const isMinor = tonicTriad?.chord.displayName.endsWith('m') || false;

  return orderTriadsByCircleOfFifths(triads, isMinor);
}
