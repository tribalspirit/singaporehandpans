import { note } from '@tonaljs/core';

export type PitchClass = string;

export interface ParsedNote {
  pitchClass: PitchClass;
  octave: number | null;
}

export function parseNote(noteStr: string): ParsedNote {
  const parsed = note(noteStr);

  if (!parsed.name) {
    throw new Error(`Invalid note format: ${noteStr}`);
  }

  return {
    pitchClass: parsed.pc || parsed.name,
    octave: parsed.oct !== undefined ? parsed.oct : null,
  };
}

/**
 * One canonical name per pitch class, indexed by chroma.
 *
 * Which spelling is canonical does not matter for comparison, only that it is
 * the *same* one for every enharmonic spelling of a pitch. These twelve are
 * kept from the previous table so chord display names are unchanged.
 */
const CANONICAL_PITCH_CLASS_NAMES = [
  'C',
  'C#',
  'D',
  'Eb',
  'E',
  'F',
  'F#',
  'G',
  'Ab',
  'A',
  'Bb',
  'B',
];

/**
 * Reduce a note to one canonical name per pitch class, ignoring octave.
 *
 * This must be *total*: every spelling of a pitch has to land on the same
 * name. An earlier version mapped A#/D#/G# to flats but left C#/F# as sharps
 * and passed Db/Gb/Cb/E# through untouched, so two spellings of one pitch
 * canonicalised differently and every set comparison built on it disagreed
 * with itself. Tonal returns Ab7sus4 as Ab/Db/Eb/Gb; a C# Kurd holds those
 * pitches spelled C#/D#/F#; the subset check failed and the chord vanished
 * from that key while staying available in D.
 *
 * Deriving from chroma rather than a lookup table makes it total by
 * construction, including double accidentals.
 *
 * This is for *comparison only*. Display spelling is a separate decision and
 * belongs to `core/spelling/keySpelling.ts`, which is key-aware.
 */
export function normalizeToPitchClass(noteStr: string): PitchClass {
  const parsed = note(noteStr);

  if (parsed.chroma !== undefined && parsed.chroma !== null) {
    return CANONICAL_PITCH_CLASS_NAMES[parsed.chroma];
  }

  return parsed.pc || parsed.name || noteStr;
}

export function getPitchClassSet(notes: string[]): Set<PitchClass> {
  return new Set(notes.map(normalizeToPitchClass));
}

export function hasPitchClass(note: string, pitchClass: PitchClass): boolean {
  return normalizeToPitchClass(note) === pitchClass;
}

/**
 * Spell a canonical pitch class the way this tuning already spells it.
 *
 * Chord names are built from canonical pitch classes, which are a fixed twelve
 * names chosen for comparison. Displaying those directly contradicts the pads:
 * a C# tuning whose pads read G# would name its chord Abm7.
 *
 * Re-deriving the spelling from the tonic is not reliable either, because the
 * tritone is legitimately either an augmented 4th or a diminished 5th — a D
 * tuning whose pad reads Ab would get G# back. Reading the spelling off the
 * tuning's own notes sidesteps that: the chord root is by construction a pitch
 * the instrument has, so its name is whatever that pad is called.
 */
export function spellPitchClassAsTuned(
  canonicalPitchClass: string,
  availableNotes: string[]
): string {
  for (const noteStr of availableNotes) {
    const spelled = noteStr.replace(/\d+$/, '');
    if (normalizeToPitchClass(spelled) === canonicalPitchClass) {
      return spelled;
    }
  }

  return canonicalPitchClass;
}
