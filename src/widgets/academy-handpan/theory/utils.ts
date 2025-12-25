import { normalizeToPitchClass, parseNote } from './normalize';
import { stableSort } from './pcset';
import { note } from '@tonaljs/core';

export function assignOctavesToPitchClasses(
  pitchClasses: string[],
  availableNotes: string[]
): string[] {
  const availableMap = new Map<string, string[]>();
  
  for (const note of availableNotes) {
    const pc = normalizeToPitchClass(note);
    if (!availableMap.has(pc)) {
      availableMap.set(pc, []);
    }
    availableMap.get(pc)!.push(note);
  }

  const result: string[] = [];
  const usedNotes = new Set<string>();

  for (const pc of pitchClasses) {
    const candidates = availableMap.get(pc) || [];
    
    if (candidates.length === 0) {
      continue;
    }

    const sortedCandidates = stableSort(candidates, (n) => {
      const parsed = parseNote(n);
      return parsed.octave !== null ? parsed.octave.toString() : '999';
    });

    for (const candidate of sortedCandidates) {
      if (!usedNotes.has(candidate)) {
        result.push(candidate);
        usedNotes.add(candidate);
        break;
      }
    }
  }

  return result;
}

export function sortNotesByPitch(notes: string[]): string[] {
  return stableSort(notes, (noteStr) => {
    try {
      const tonalNote = note(noteStr);
      if (tonalNote.midi !== null && tonalNote.midi !== undefined) {
        return tonalNote.midi.toString().padStart(4, '0');
      }
      const parsed = parseNote(noteStr);
      const octave = parsed.octave !== null ? parsed.octave : 999;
      return `${octave.toString().padStart(3, '0')}_${parsed.pitchClass}`;
    } catch {
      return noteStr;
    }
  });
}

export function deduplicateNotes(notes: string[]): string[] {
  const seen = new Set<string>();
  return notes.filter((note) => {
    if (seen.has(note)) {
      return false;
    }
    seen.add(note);
    return true;
  });
}


