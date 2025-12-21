export type PitchClass = string;

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_EQUIVALENTS: Record<string, string> = {
  'Db': 'C#',
  'Eb': 'D#',
  'Gb': 'F#',
  'Ab': 'G#',
  'Bb': 'A#',
};

export function parseNote(note: string): { pitchClass: PitchClass; octave: number | null } {
  const match = note.match(/^([A-G])(#|b)?(\d+)?$/);
  
  if (!match) {
    throw new Error(`Invalid note format: ${note}`);
  }

  const [, baseNote, accidental, octaveStr] = match;
  const octave = octaveStr ? parseInt(octaveStr, 10) : null;
  
  let pitchClass = baseNote;
  if (accidental === '#') {
    pitchClass = `${baseNote}#`;
  } else if (accidental === 'b') {
    const flatNote = `${baseNote}b`;
    pitchClass = FLAT_EQUIVALENTS[flatNote] || flatNote;
  }

  if (pitchClass in FLAT_EQUIVALENTS) {
    pitchClass = FLAT_EQUIVALENTS[pitchClass];
  }

  return { pitchClass, octave };
}

export function normalizeToPitchClass(note: string): PitchClass {
  const { pitchClass } = parseNote(note);
  return pitchClass;
}

export function getPitchClassSet(notes: string[]): Set<PitchClass> {
  return new Set(notes.map(normalizeToPitchClass));
}

export function hasPitchClass(note: string, pitchClass: PitchClass): boolean {
  return normalizeToPitchClass(note) === pitchClass;
}

export function getSemitoneOffset(pitchClass: PitchClass): number {
  const normalized = FLAT_EQUIVALENTS[pitchClass] || pitchClass;
  const index = NOTE_NAMES.indexOf(normalized);
  return index >= 0 ? index : 0;
}

export function addSemitones(pitchClass: PitchClass, semitones: number): PitchClass {
  const currentIndex = getSemitoneOffset(pitchClass);
  const newIndex = (currentIndex + semitones + 12) % 12;
  return NOTE_NAMES[newIndex];
}

