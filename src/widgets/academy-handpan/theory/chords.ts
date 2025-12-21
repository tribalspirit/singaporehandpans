import * as ChordType from '@tonaljs/chord-type';
import { chord } from '@tonaljs/core';
import { isSubset, stableSort, deduplicateBy } from './pcset';
import { normalizeToPitchClass } from './normalize';
import { assignOctavesToPitchClasses, sortNotesByPitch } from './utils';

export interface PlayableChord {
  name: string;
  displayName: string;
  notes: string[];
  pitchClasses: string[];
  category: 'basic' | 'advanced';
}

const TONICS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function getAllChordTypes(): string[] {
  return ChordType.names();
}

function getChordPitchClasses(tonic: string, type: string): string[] {
  const chordData = chord(`${tonic}${type}`);
  if (!chordData.notes || chordData.notes.length === 0) {
    return [];
  }
  return chordData.notes.map(normalizeToPitchClass);
}

function getChordNotes(tonic: string, type: string): string[] {
  const chordData = chord(`${tonic}${type}`);
  return chordData.notes || [];
}

function categorizeChord(pitchClassCount: number): 'basic' | 'advanced' {
  return pitchClassCount === 3 ? 'basic' : 'advanced';
}

export function findPlayableChords(availableNotes: string[]): PlayableChord[] {
  const availablePitchClasses = availableNotes.map(normalizeToPitchClass);
  const chordTypes = getAllChordTypes();
  const playable: PlayableChord[] = [];

  for (const tonic of TONICS) {
    for (const type of chordTypes) {
      const chordPitchClasses = getChordPitchClasses(tonic, type);
      
      if (chordPitchClasses.length === 0 || chordPitchClasses.length > 4) {
        continue;
      }

      if (isSubset(chordPitchClasses, availablePitchClasses)) {
        const mappedNotes = assignOctavesToPitchClasses(chordPitchClasses, availableNotes);
        const orderedNotes = sortNotesByPitch(mappedNotes);
        const chordData = chord(`${tonic}${type}`);
        const displayName = chordData.name || `${tonic}${type}`;
        const category = categorizeChord(chordPitchClasses.length);
        
        playable.push({
          name: `${tonic}${type}`,
          displayName,
          notes: orderedNotes,
          pitchClasses: chordPitchClasses,
          category,
        });
      }
    }
  }

  const deduplicated = deduplicateBy(playable, (chord) => chord.pitchClasses.join(','));
  
  const sorted = stableSort(deduplicated, (chord) => {
    const categoryOrder = chord.category === 'basic' ? '0' : '1';
    return `${categoryOrder}_${chord.displayName}`;
  });
  
  return sorted;
}

