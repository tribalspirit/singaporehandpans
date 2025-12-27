import * as Pcset from '@tonaljs/pcset';
import { normalizeToPitchClass } from './normalize';

export function toPcSet(notes: string[]): string {
  const pitchClasses = notes.map(normalizeToPitchClass);
  const chroma = Pcset.chroma(pitchClasses);
  return chroma;
}

export function isSubset(candidateNotes: string[], availableNotes: string[]): boolean {
  if (candidateNotes.length === 0) {
    return true;
  }
  if (availableNotes.length === 0) {
    return false;
  }
  
  const candidateChroma = toPcSet(candidateNotes);
  const availableChroma = toPcSet(availableNotes);
  
  const isSubsetFn = Pcset.isSubsetOf(availableChroma);
  return isSubsetFn(candidateChroma);
}

export function isSuperset(availableNotes: string[], candidateNotes: string[]): boolean {
  return isSubset(candidateNotes, availableNotes);
}

export function stableSort<T>(items: T[], keyFn: (item: T) => string): T[] {
  return [...items].sort((a, b) => {
    const keyA = keyFn(a);
    const keyB = keyFn(b);
    return keyA.localeCompare(keyB);
  });
}

export function deduplicateBy<T>(items: T[], keyFn: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

