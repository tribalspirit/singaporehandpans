import * as Chord from '@tonaljs/chord';
import * as Scale from '@tonaljs/scale';
import { note } from '@tonaljs/core';
import { normalizeToPitchClass } from './normalize';
import { assignOctavesToPitchClasses, sortNotesByPitch } from './utils';
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
 * Extract the 7-note scale from handpan notes.
 * Returns pitch classes in scale degree order (1-7).
 * The first note in handpanNotes is assumed to be the tonic (ding).
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
  
  // If exactly 7 pitch classes, try to identify and order the scale
  if (pcs.length === 7) {
    // The first note is typically the tonic (ding)
    const tonicPc = normalizeToPitchClass(handpanNotes[0]);
    
    // Try to identify the scale using Tonal.js
    for (const mode of ['major', 'minor', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'locrian']) {
      const scale = Scale.get(`${tonicPc} ${mode}`);
      if (scale.notes && scale.notes.length === 7) {
        const scalePcs = scale.notes.map(normalizeToPitchClass);
        const scalePcSet = new Set(scalePcs);
        const handpanPcSet = new Set(pcs);
        
        // Check if sets match exactly
        if (scalePcSet.size === handpanPcSet.size && 
            scalePcSet.size === 7 &&
            [...scalePcSet].every(pc => handpanPcSet.has(pc))) {
          return scalePcs; // Already in degree order
        }
      }
    }
    
    // If no match found, order by pitch starting from tonic
    // This handles non-standard scales
    const tonicNote = note(`${tonicPc}4`);
    const sorted = pcs.sort((a, b) => {
      const n1 = note(`${a}4`);
      const n2 = note(`${b}4`);
      if (n1.midi !== null && n2.midi !== null && tonicNote.midi !== null) {
        // Calculate intervals from tonic
        const interval1 = (n1.midi - tonicNote.midi + 12) % 12;
        const interval2 = (n2.midi - tonicNote.midi + 12) % 12;
        return interval1 - interval2;
      }
      return a.localeCompare(b);
    });
    
    // Ensure tonic is first
    const tonicIndex = sorted.indexOf(tonicPc);
    if (tonicIndex > 0) {
      const reordered = [tonicPc, ...sorted.slice(tonicIndex + 1), ...sorted.slice(0, tonicIndex)];
      return reordered;
    }
    
    return sorted;
  }
  
  // If not 7, return what we have (will handle later)
  return pcs;
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
  
  if (rootNote.midi !== null && thirdNote.midi !== null && fifthNote.midi !== null) {
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
 */
function buildTriadOnDegree(
  scalePcs: string[],
  degree: number, // 1-7
  availableNotes: string[]
): DiatonicTriad | null {
  if (scalePcs.length < 7) {
    return null; // Need 7-note scale
  }

  const rootIndex = (degree - 1) % 7;
  const thirdIndex = (degree + 1) % 7; // +2 scale steps = +1 index
  const fifthIndex = (degree + 3) % 7;  // +4 scale steps = +3 index

  const rootPc = scalePcs[rootIndex];
  const thirdPc = scalePcs[thirdIndex];
  const fifthPc = scalePcs[fifthIndex];

  if (!rootPc || !thirdPc || !fifthPc) {
    return null;
  }

  const triadPcs = [rootPc, thirdPc, fifthPc];
  const availablePcs = availableNotes.map(normalizeToPitchClass);

  // Check if all triad notes are available
  if (!isSubset(triadPcs, availablePcs)) {
    return null;
  }

  // Assign octaves and sort
  const mappedNotes = assignOctavesToPitchClasses(triadPcs, availableNotes);
  const orderedNotes = sortNotesByPitch(mappedNotes);

  if (orderedNotes.length !== 3) {
    return null;
  }

  // Determine quality
  const quality = determineTriadQuality(rootPc, thirdPc, fifthPc);

  // Build display name with short notation
  let displayName = '';
  if (quality === 'major') {
    displayName = rootPc; // Just the root, e.g., "C"
  } else if (quality === 'minor') {
    displayName = `${rootPc}m`; // Root + m, e.g., "Dm"
  } else if (quality === 'diminished') {
    displayName = `${rootPc}°`; // Root + °, e.g., "B°"
  } else if (quality === 'augmented') {
    displayName = `${rootPc}+`; // Root + +, e.g., "C+"
  } else {
    displayName = rootPc; // Fallback
  }
  
  // Build chord name for Tonal.js lookup (for validation)
  let chordType = '';
  if (quality === 'major') chordType = '';
  else if (quality === 'minor') chordType = 'm';
  else if (quality === 'diminished') chordType = 'dim';
  else if (quality === 'augmented') chordType = 'aug';
  
  const chordName = `${rootPc}${chordType}`;

  const chord: PlayableChord = {
    name: `${rootPc}-triad-${degree}`,
    displayName,
    notes: orderedNotes,
    pitchClasses: triadPcs,
    category: 'basic',
  };

  // Determine if tonic (degree 1)
  const isTonic = degree === 1;

  // Determine if relative major (degree 3, and tonic is minor)
  const tonicQuality = determineTriadQuality(
    scalePcs[0],
    scalePcs[2 % 7],
    scalePcs[4 % 7]
  );
  const isRelativeMajor = degree === 3 && tonicQuality === 'minor' && quality === 'major';

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
 * Get all 7 diatonic triads for a handpan scale.
 */
export function getDiatonicTriads(
  handpanNotes: string[],
  availableNotes: string[]
): DiatonicTriad[] {
  // Extract 7-note scale
  const scalePcs = extractScalePitchClasses(handpanNotes);
  
  if (scalePcs.length < 7) {
    // Can't build 7 triads without 7-note scale
    return [];
  }

  // Build all 7 triads
  const triads: DiatonicTriad[] = [];
  for (let degree = 1; degree <= 7; degree++) {
    const triad = buildTriadOnDegree(scalePcs, degree, availableNotes);
    if (triad) {
      triads.push(triad);
    }
  }

  // Determine if minor (check tonic triad quality)
  const tonicTriad = triads.find((t) => t.degree === 1);
  const isMinor = tonicTriad?.chord.displayName.endsWith('m') || false;

  // Order by Circle of Fifths
  return orderTriadsByCircleOfFifths(triads, isMinor);
}
