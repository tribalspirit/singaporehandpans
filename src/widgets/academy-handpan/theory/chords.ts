import * as ChordType from '@tonaljs/chord-type';
import * as Chord from '@tonaljs/chord';
import * as ChordDetect from '@tonaljs/chord-detect';
import { note } from '@tonaljs/core';
import { isSubset, stableSort, deduplicateBy } from './pcset';
import { normalizeToPitchClass } from './normalize';
import { assignOctavesToPitchClasses, sortNotesByPitch } from './utils';

export interface PlayableChord {
  name: string;
  displayName: string;
  notes: string[];
  pitchClasses: string[];
  category: 'basic' | 'advanced';
  rootPc?: string;
}

interface ChordCandidate {
  pcsetKey: string;
  pitchClasses: string[];
  source: 'tonal' | 'voicing';
  tonicAttempt?: string;
  typeAttempt?: string;
  voicingTag?: string;
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

function getPcsetKey(pitchClasses: string[]): string {
  return [...pitchClasses].sort().join(',');
}

function isTertianTriad(pitchClasses: string[], rootPc: string): boolean {
  if (pitchClasses.length !== 3) return false;
  
  const rootNote = note(`${rootPc}4`);
  if (!rootNote.midi && rootNote.midi !== 0) return false;
  
  const intervals: number[] = [];
  for (const pc of pitchClasses) {
    if (pc === rootPc) continue;
    const otherNote = note(`${pc}4`);
    if (otherNote.midi !== null && rootNote.midi !== null) {
      let interval = (otherNote.midi - rootNote.midi + 12) % 12;
      intervals.push(interval);
    }
  }
  
  intervals.sort((a, b) => a - b);
  
  const isMajor = intervals.length === 2 && intervals[0] === 4 && intervals[1] === 7;
  const isMinor = intervals.length === 2 && intervals[0] === 3 && intervals[1] === 7;
  const isDiminished = intervals.length === 2 && intervals[0] === 3 && intervals[1] === 6;
  const isAugmented = intervals.length === 2 && intervals[0] === 4 && intervals[1] === 8;
  
  return isMajor || isMinor || isDiminished || isAugmented;
}

function categorizeChord(pitchClasses: string[], rootPc: string): 'basic' | 'advanced' {
  if (pitchClasses.length === 3 && isTertianTriad(pitchClasses, rootPc)) {
    return 'basic';
  }
  return 'advanced';
}

function extractRootFromChordName(chordName: string): string {
  const withoutSlash = chordName.split('/')[0];
  const match = withoutSlash.match(/^([A-G]#?b?)/);
  if (match) {
    return normalizeToPitchClass(match[1]);
  }
  return normalizeToPitchClass(withoutSlash);
}

function detectCanonicalChord(pitchClasses: string[], scaleTonic?: string): { rootPc: string; displayName: string } | null {
  if (pitchClasses.length === 0) return null;
  
  const notesForDetect = pitchClasses.map(pc => `${pc}4`);
  const detected = ChordDetect.detect(notesForDetect);
  
  if (!detected || detected.length === 0) {
    return null;
  }
  
  let bestMatch = detected[0];
  let bestScore = 0;
  
  for (const candidate of detected) {
    let score = 0;
    
    const candidateChord = Chord.get(candidate);
    if (!candidateChord.notes || candidateChord.notes.length === 0) continue;
    
    const candidatePcs = candidateChord.notes.map(normalizeToPitchClass);
    const candidatePcSet = new Set(candidatePcs);
    const inputPcSet = new Set(pitchClasses);
    
    if (candidatePcSet.size !== inputPcSet.size) continue;
    if (![...candidatePcSet].every(pc => inputPcSet.has(pc))) continue;
    
    const rootPc = extractRootFromChordName(candidate);
    
    if (!pitchClasses.includes(rootPc)) {
      continue;
    }
    
    score += 10;
    
    const lowerName = candidate.toLowerCase();
    if (lowerName.includes('m7') || lowerName.includes('maj7') || lowerName.includes('7') || 
        lowerName.includes('9') || lowerName.includes('add9') || lowerName.includes('sus')) {
      score += 5;
    }
    
    if (lowerName.includes('dim') || lowerName.includes('aug') || lowerName.includes('unknown')) {
      score -= 5;
    }
    
    if (scaleTonic && rootPc === scaleTonic) {
      score += 3;
    }
    
    if (lowerName.includes('m7') && !lowerName.includes('maj7')) {
      score += 2;
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = candidate;
    }
  }
  
  if (bestScore === 0) return null;
  
  const bestChord = Chord.get(bestMatch);
  const rootPc = extractRootFromChordName(bestMatch);
  
  if (!pitchClasses.includes(rootPc)) {
    return null;
  }
  
  const matchWithoutSlash = bestMatch.split('/')[0];
  const lowerMatch = matchWithoutSlash.toLowerCase();
  let displayName = '';
  
  if (lowerMatch.includes('sus2')) {
    displayName = `${rootPc}sus2`;
  } else if (lowerMatch.includes('sus4') || lowerMatch.includes('suspended fourth')) {
    displayName = `${rootPc}sus4`;
  } else if (lowerMatch.includes('sus') || lowerMatch.includes('suspended')) {
    displayName = `${rootPc}sus`;
  } else if (lowerMatch.includes('maj9') || lowerMatch.includes('major ninth')) {
    displayName = `${rootPc}maj9`;
  } else if (lowerMatch.includes('m9') || (lowerMatch.includes('minor') && lowerMatch.includes('9'))) {
    displayName = `${rootPc}m9`;
  } else if (lowerMatch.includes('9') && !lowerMatch.includes('add')) {
    displayName = `${rootPc}9`;
  } else if (lowerMatch.includes('add9')) {
    displayName = `${rootPc}add9`;
  } else if (lowerMatch.includes('add')) {
    const addMatch = lowerMatch.match(/add(\d+)/);
    if (addMatch) {
      displayName = `${rootPc}add${addMatch[1]}`;
    } else {
      displayName = formatChordDisplayName(bestChord, rootPc, '');
    }
  } else {
    displayName = formatChordDisplayName(bestChord, rootPc, '');
  }
  
  if (!displayName || displayName === rootPc) {
    const intervals = bestChord.intervals || [];
    if (intervals.length === 3) {
      if (lowerMatch.includes('minor')) {
        displayName = `${rootPc}m`;
      } else if (lowerMatch.includes('diminished')) {
        displayName = `${rootPc}°`;
      } else if (lowerMatch.includes('augmented')) {
        displayName = `${rootPc}+`;
      } else {
        displayName = rootPc;
      }
    } else if (intervals.length === 5) {
      if (lowerMatch.includes('maj9') || lowerMatch.includes('major ninth')) {
        displayName = `${rootPc}maj9`;
      } else if (lowerMatch.includes('m9') || (lowerMatch.includes('minor') && lowerMatch.includes('9'))) {
        displayName = `${rootPc}m9`;
      } else if (lowerMatch.includes('9')) {
        displayName = `${rootPc}9`;
      } else {
        displayName = formatChordDisplayName(bestChord, rootPc, '');
      }
    } else {
      displayName = formatChordDisplayName(bestChord, rootPc, '');
    }
  }
  
  return { rootPc, displayName };
}

function generateVoicingCandidates(availableNotes: string[]): ChordCandidate[] {
  const availablePitchClasses = new Set(availableNotes.map(normalizeToPitchClass));
  const candidates: ChordCandidate[] = [];
  const seenKeys = new Set<string>();

  const voicingTypes = ['sus2', 'sus4', 'add9'];

  for (const tonic of TONICS) {
    for (const voicingType of voicingTypes) {
      try {
        const chordData = Chord.get(`${tonic}${voicingType}`);
        if (!chordData.notes || chordData.notes.length === 0) {
          continue;
        }

        const pitchClasses = chordData.notes.map(normalizeToPitchClass);
        const uniquePcs = Array.from(new Set(pitchClasses));
        
        if (uniquePcs.length < 3) continue;

        if (isSubset(uniquePcs, Array.from(availablePitchClasses))) {
          const pcsetKey = getPcsetKey(uniquePcs);
          if (seenKeys.has(pcsetKey)) continue;
          seenKeys.add(pcsetKey);

          candidates.push({
            pcsetKey,
            pitchClasses: uniquePcs,
            source: 'voicing',
            tonicAttempt: tonic,
            voicingTag: voicingType,
          });
        }
      } catch {
        continue;
      }
    }
  }

  return candidates;
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

  if (noteCount === 4 || noteCount === 5) {
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

  if (noteCount === 5) {
    if (lowerName.includes('ninth') || lowerName.includes('9')) {
      if (lowerName.includes('minor')) {
        if (lowerName.includes('major seventh') || lowerName.includes('maj7')) {
          return `${tonic}mM9`;
        }
        return `${tonic}m9`;
      } else if (lowerName.includes('major seventh') || lowerName.includes('maj7')) {
        return `${tonic}maj9`;
      } else {
        return `${tonic}9`;
      }
    }
  }

  return name || `${tonic}${type}`;
}

function buildChordCandidates(availableNotes: string[]): ChordCandidate[] {
  const availablePitchClasses = availableNotes.map(normalizeToPitchClass);
  const availablePitchClassSet = new Set(availablePitchClasses);
  const chordTypes = getAllChordTypes();
  const candidates: ChordCandidate[] = [];
  const seenKeys = new Set<string>();

  for (const tonic of TONICS) {
    for (const type of chordTypes) {
      const chordPitchClasses = getChordPitchClasses(tonic, type);
      
      if (chordPitchClasses.length === 0 || chordPitchClasses.length > 5) {
        continue;
      }

      const uniquePcs = Array.from(new Set(chordPitchClasses));
      if (uniquePcs.length !== chordPitchClasses.length) continue;

      if (isSubset(uniquePcs, availablePitchClasses)) {
        const pcsetKey = getPcsetKey(uniquePcs);
        if (seenKeys.has(pcsetKey)) continue;
        seenKeys.add(pcsetKey);

        candidates.push({
          pcsetKey,
          pitchClasses: uniquePcs,
          source: 'tonal',
          tonicAttempt: tonic,
          typeAttempt: type,
        });
      }
    }
  }

  const voicingCandidates = generateVoicingCandidates(availableNotes);
  for (const candidate of voicingCandidates) {
    if (!seenKeys.has(candidate.pcsetKey)) {
      seenKeys.add(candidate.pcsetKey);
      candidates.push(candidate);
    }
  }

  return candidates;
}

function extractScaleTonic(availableNotes: string[]): string | undefined {
  if (availableNotes.length === 0) return undefined;
  return normalizeToPitchClass(availableNotes[0]);
}

export function findPlayableChords(availableNotes: string[]): PlayableChord[] {
  const candidates = buildChordCandidates(availableNotes);
  const scaleTonic = extractScaleTonic(availableNotes);
  
  const chordsByPcset = new Map<string, PlayableChord>();
  
  for (const candidate of candidates) {
    if (candidate.pitchClasses.length < 3 || candidate.pitchClasses.length > 5) {
      continue;
    }
    
    const canonical = detectCanonicalChord(candidate.pitchClasses, scaleTonic);
    
    if (!canonical) {
      continue;
    }
    
    const mappedNotes = assignOctavesToPitchClasses(candidate.pitchClasses, availableNotes);
    const orderedNotes = sortNotesByPitch(mappedNotes);
    
    if (orderedNotes.length !== candidate.pitchClasses.length) {
      continue;
    }
    
    const category = categorizeChord(candidate.pitchClasses, canonical.rootPc);
    
    const existing = chordsByPcset.get(candidate.pcsetKey);
    if (!existing || existing.category === 'advanced' && category === 'basic') {
      chordsByPcset.set(candidate.pcsetKey, {
        name: `${canonical.rootPc}${candidate.typeAttempt || candidate.voicingTag || ''}`,
        displayName: canonical.displayName,
        notes: orderedNotes,
        pitchClasses: candidate.pitchClasses,
        category,
        rootPc: canonical.rootPc,
      });
    }
  }
  
  const chords = Array.from(chordsByPcset.values()).filter(chord => 
    chord.pitchClasses.length >= 3 && chord.pitchClasses.length <= 5
  );
  
  const sorted = stableSort(chords, (chord) => {
    const categoryOrder = chord.category === 'basic' ? '0' : '1';
    const rootOrder = chord.rootPc || 'Z';
    return `${categoryOrder}_${rootOrder}_${chord.displayName}`;
  });
  
  return sorted;
}

