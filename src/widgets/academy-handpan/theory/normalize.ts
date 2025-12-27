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

const ENHARMONIC_MAP: Record<string, string> = {
  'A#': 'Bb',
  'C#': 'C#',
  'D#': 'Eb',
  'F#': 'F#',
  'G#': 'Ab',
};

export function normalizeToPitchClass(noteStr: string): PitchClass {
  const parsed = note(noteStr);
  const pc = parsed.pc || parsed.name || noteStr;
  
  if (ENHARMONIC_MAP[pc]) {
    return ENHARMONIC_MAP[pc];
  }
  
  return pc;
}

export function getPitchClassSet(notes: string[]): Set<PitchClass> {
  return new Set(notes.map(normalizeToPitchClass));
}

export function hasPitchClass(note: string, pitchClass: PitchClass): boolean {
  return normalizeToPitchClass(note) === pitchClass;
}

