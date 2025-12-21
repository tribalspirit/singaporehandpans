import * as Scale from '@tonaljs/scale';
import { isSubset, stableSort, deduplicateBy } from './pcset';
import { normalizeToPitchClass } from './normalize';
import { assignOctavesToPitchClasses, sortNotesByPitch } from './utils';

export interface PlayableScale {
  name: string;
  displayName: string;
  notes: string[];
  pitchClasses: string[];
}

const COMMON_SCALE_TYPES = [
  'major',
  'minor',
  'dorian',
  'phrygian',
  'lydian',
  'mixolydian',
  'locrian',
  'pentatonic',
  'major pentatonic',
  'minor pentatonic',
  'blues',
  'harmonic minor',
  'melodic minor',
  'whole tone',
  'diminished',
];

const TONICS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function generateScaleCandidates(): Array<{ tonic: string; type: string }> {
  const candidates: Array<{ tonic: string; type: string }> = [];
  
  for (const tonic of TONICS) {
    for (const type of COMMON_SCALE_TYPES) {
      candidates.push({ tonic, type });
    }
  }
  
  return candidates;
}

function getScalePitchClasses(tonic: string, type: string): string[] {
  const scale = Scale.get(`${tonic} ${type}`);
  if (!scale.notes || scale.notes.length === 0) {
    return [];
  }
  return scale.notes.map(normalizeToPitchClass);
}

export function findPlayableScales(availableNotes: string[]): PlayableScale[] {
  const availablePitchClasses = availableNotes.map(normalizeToPitchClass);
  const candidates = generateScaleCandidates();
  const playable: PlayableScale[] = [];

  for (const { tonic, type } of candidates) {
    const scalePitchClasses = getScalePitchClasses(tonic, type);
    
    if (scalePitchClasses.length === 0) {
      continue;
    }

    if (isSubset(scalePitchClasses, availablePitchClasses)) {
      const mappedNotes = assignOctavesToPitchClasses(scalePitchClasses, availableNotes);
      const orderedNotes = sortNotesByPitch(mappedNotes);
      const displayName = `${tonic} ${type}`;
      
      playable.push({
        name: `${tonic} ${type}`,
        displayName,
        notes: orderedNotes,
        pitchClasses: scalePitchClasses,
      });
    }
  }

  const deduplicated = deduplicateBy(playable, (scale) => scale.pitchClasses.join(','));
  
  return stableSort(deduplicated, (scale) => scale.displayName);
}

