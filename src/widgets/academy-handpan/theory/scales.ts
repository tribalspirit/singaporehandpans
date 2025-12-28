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

// Only the 7 main modes (Ionian/major, Dorian, Phrygian, Lydian, Mixolydian, Aeolian/minor, Locrian)
const MAIN_SCALE_TYPES = [
  'major',      // Ionian
  'dorian',
  'phrygian',
  'lydian',
  'mixolydian',
  'minor',      // Aeolian
  'locrian',
];

const TONICS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function generateScaleCandidates(): Array<{ tonic: string; type: string }> {
  const candidates: Array<{ tonic: string; type: string }> = [];
  
  for (const tonic of TONICS) {
    for (const type of MAIN_SCALE_TYPES) {
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

    // Only include scales where ALL pitch classes are available (exact subset match)
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
  
  // Sort: prioritize D minor, then by tonic, then by mode order
  const sorted = stableSort(deduplicated, (scale) => {
    const isDMinor = scale.name === 'D minor';
    const parts = scale.name.split(' ');
    const tonic = parts[0] || '';
    const mode = parts.slice(1).join(' ') || '';
    const modeOrder = MAIN_SCALE_TYPES.indexOf(mode);
    return `${isDMinor ? '0' : '1'}_${tonic}_${modeOrder.toString().padStart(2, '0')}`;
  });
  
  return sorted;
}

