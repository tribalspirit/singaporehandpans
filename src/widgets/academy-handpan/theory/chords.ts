import * as ChordType from '@tonaljs/chord-type';
import * as Chord from '@tonaljs/chord';
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
  const chordData = Chord.get(`${tonic}${type}`);
  if (!chordData.notes || chordData.notes.length === 0) {
    return [];
  }
  return chordData.notes.map(normalizeToPitchClass);
}

function getChordNotes(tonic: string, type: string): string[] {
  const chordData = Chord.get(`${tonic}${type}`);
  return chordData.notes || [];
}

function categorizeChord(pitchClassCount: number): 'basic' | 'advanced' {
  return pitchClassCount === 3 ? 'basic' : 'advanced';
}

function formatChordDisplayName(chordData: ReturnType<typeof Chord.get>, tonic: string, type: string): string {
  const name = chordData.name || '';
  const intervals = chordData.intervals || [];
  const noteCount = intervals.length;
  const lowerName = name.toLowerCase();

  if (noteCount === 3) {
    if (lowerName.includes('diminished')) {
      return `${tonic}°`;
    }
    if (lowerName.includes('augmented')) {
      return `${tonic}+`;
    }
    if (lowerName.includes('minor')) {
      return `${tonic}m`;
    }
    return tonic;
  }

  if (noteCount === 4) {
    let quality = '';
    let extension = '';

    if (lowerName.includes('sixth') || lowerName.includes('6')) {
      if (lowerName.includes('minor')) {
        quality = 'm';
        extension = '6';
      } else {
        quality = '';
        extension = '6';
      }
    } else if (lowerName.includes('diminished seventh') || lowerName.includes('dim7')) {
      quality = '°';
      extension = '7';
    } else if (lowerName.includes('half diminished') || lowerName.includes('m7b5') || lowerName.includes('ø7')) {
      quality = 'ø';
      extension = '7';
    } else if (lowerName.includes('major seventh') || lowerName.includes('maj7')) {
      if (lowerName.includes('minor')) {
        quality = 'm';
        extension = 'M7';
      } else {
        quality = '';
        extension = 'maj7';
      }
    } else if (lowerName.includes('minor seventh') || lowerName.includes('m7')) {
      quality = 'm';
      extension = '7';
    } else if (lowerName.includes('dominant seventh') || lowerName.includes('seventh') || lowerName.includes('7')) {
      if (lowerName.includes('minor')) {
        quality = 'm';
        extension = '7';
      } else {
        quality = '';
        extension = '7';
      }
    } else if (lowerName.includes('augmented')) {
      quality = '+';
      if (lowerName.includes('seventh') || lowerName.includes('7')) {
        extension = '7';
      }
    } else if (lowerName.includes('diminished')) {
      quality = '°';
    } else if (lowerName.includes('minor')) {
      quality = 'm';
    }

    if (lowerName.includes('suspended') || lowerName.includes('sus')) {
      if (lowerName.includes('sus2')) {
        return `${tonic}sus2`;
      } else if (lowerName.includes('sus4')) {
        return `${tonic}sus4`;
      } else {
        return `${tonic}sus`;
      }
    }

    if (lowerName.includes('add')) {
      const addMatch = lowerName.match(/add(\d+)/);
      if (addMatch) {
        return `${tonic}add${addMatch[1]}`;
      }
    }

    return `${tonic}${quality}${extension}`;
  }

  return name || `${tonic}${type}`;
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
        
        const expectedLength = chordPitchClasses.length;
        const actualLength = orderedNotes.length;
        
        if (actualLength !== expectedLength) {
          continue;
        }
        
        const allNotesAvailable = orderedNotes.every((note) => {
          const notePitchClass = normalizeToPitchClass(note);
          return availablePitchClasses.includes(notePitchClass);
        });
        
        if (!allNotesAvailable) {
          continue;
        }
        
        const chordData = Chord.get(`${tonic}${type}`);
        const displayName = formatChordDisplayName(chordData, tonic, type);
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

