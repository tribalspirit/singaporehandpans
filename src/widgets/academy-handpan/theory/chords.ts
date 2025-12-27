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

function getAvailableTonics(availableNotes: string[]): string[] {
  const pcs = new Set(availableNotes.map(normalizeToPitchClass));
  return Array.from(pcs).sort();
}

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

function getPitchClassSemitone(pc: string): number {
  const n = note(`${pc}4`);
  if (n.midi !== null && n.midi !== undefined) {
    return n.midi % 12;
  }
  return 0;
}

function getIntervalsFromRoot(pitchClasses: string[], rootPc: string): number[] {
  const rootSemitone = getPitchClassSemitone(rootPc);
  const intervals: number[] = [];
  
  for (const pc of pitchClasses) {
    if (pc === rootPc) {
      intervals.push(0);
    } else {
      const pcSemitone = getPitchClassSemitone(pc);
      const interval = (pcSemitone - rootSemitone + 12) % 12;
      intervals.push(interval);
    }
  }
  
  return intervals.sort((a, b) => a - b);
}

interface ChordTemplate {
  intervals: number[];
  displayName: (root: string) => string;
  category: 'basic' | 'advanced';
  priority: number;
}

const CHORD_TEMPLATES: ChordTemplate[] = [
  { intervals: [0, 4, 7], displayName: (r) => r, category: 'basic', priority: 10 },
  { intervals: [0, 3, 7], displayName: (r) => `${r}m`, category: 'basic', priority: 10 },
  { intervals: [0, 3, 6], displayName: (r) => `${r}°`, category: 'basic', priority: 10 },
  { intervals: [0, 4, 8], displayName: (r) => `${r}+`, category: 'basic', priority: 10 },
  { intervals: [0, 2, 7], displayName: (r) => `${r}sus2`, category: 'advanced', priority: 9 },
  { intervals: [0, 5, 7], displayName: (r) => `${r}sus4`, category: 'advanced', priority: 9 },
  { intervals: [0, 4, 7, 10], displayName: (r) => `${r}7`, category: 'advanced', priority: 8 },
  { intervals: [0, 4, 7, 11], displayName: (r) => `${r}maj7`, category: 'advanced', priority: 8 },
  { intervals: [0, 3, 7, 10], displayName: (r) => `${r}m7`, category: 'advanced', priority: 9 },
  { intervals: [0, 3, 6, 10], displayName: (r) => `${r}ø7`, category: 'advanced', priority: 8 },
  { intervals: [0, 3, 6, 9], displayName: (r) => `${r}°7`, category: 'advanced', priority: 7 },
  { intervals: [0, 4, 7, 9], displayName: (r) => `${r}6`, category: 'advanced', priority: 7 },
  { intervals: [0, 3, 7, 9], displayName: (r) => `${r}m6`, category: 'advanced', priority: 7 },
  { intervals: [0, 5, 7, 10], displayName: (r) => `${r}7sus4`, category: 'advanced', priority: 7 },
  { intervals: [0, 4, 7, 9, 2], displayName: (r) => `${r}6add9`, category: 'advanced', priority: 6 },
  { intervals: [0, 4, 7, 11, 2], displayName: (r) => `${r}maj9`, category: 'advanced', priority: 7 },
  { intervals: [0, 3, 7, 10, 2], displayName: (r) => `${r}m9`, category: 'advanced', priority: 7 },
  { intervals: [0, 4, 7, 10, 2], displayName: (r) => `${r}9`, category: 'advanced', priority: 7 },
  { intervals: [0, 5, 7, 10, 2], displayName: (r) => `${r}9sus4`, category: 'advanced', priority: 6 },
  { intervals: [0, 4, 7, 2], displayName: (r) => `${r}add9`, category: 'advanced', priority: 7 },
];

function arraysEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((val, idx) => val === b[idx]);
}

function analyzeChordPcset(pitchClasses: string[], scaleTonic?: string): { rootPc: string; displayName: string; category: 'basic' | 'advanced' } | null {
  if (pitchClasses.length < 3 || pitchClasses.length > 5) {
    return null;
  }
  
  let bestMatch: { rootPc: string; displayName: string; category: 'basic' | 'advanced'; priority: number } | null = null;
  
  for (const candidateRoot of pitchClasses) {
    const intervals = getIntervalsFromRoot(pitchClasses, candidateRoot);
    
    for (const template of CHORD_TEMPLATES) {
      if (arraysEqual(intervals, template.intervals)) {
        const priority = template.priority + (scaleTonic && candidateRoot === scaleTonic ? 2 : 0);
        
        if (!bestMatch || priority > bestMatch.priority || 
            (priority === bestMatch.priority && candidateRoot === scaleTonic)) {
          bestMatch = {
            rootPc: candidateRoot,
            displayName: template.displayName(candidateRoot),
            category: template.category,
            priority,
          };
        }
      }
    }
  }
  
  if (bestMatch) {
    return {
      rootPc: bestMatch.rootPc,
      displayName: bestMatch.displayName,
      category: bestMatch.category,
    };
  }
  
  return null;
}

function generateCuratedCandidates(availableNotes: string[]): ChordCandidate[] {
  const availablePitchClasses = new Set(availableNotes.map(normalizeToPitchClass));
  const tonics = getAvailableTonics(availableNotes);
  const candidates: ChordCandidate[] = [];
  const seenKeys = new Set<string>();

  const curatedTypes = ['7', 'maj7', 'm7', 'm7b5', 'dim7', '6', 'm6', 'sus2', 'sus4', 'add9', '9', 'maj9', 'm9', '7sus4', '9sus4'];

  for (const tonic of tonics) {
    for (const type of curatedTypes) {
      try {
        const chordData = Chord.get(`${tonic}${type}`);
        if (!chordData.notes || chordData.notes.length === 0) {
          continue;
        }

        const pitchClasses = chordData.notes.map(normalizeToPitchClass);
        const uniquePcs = Array.from(new Set(pitchClasses));
        
        if (uniquePcs.length < 3 || uniquePcs.length > 5) continue;

        if (isSubset(uniquePcs, Array.from(availablePitchClasses))) {
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
  const candidates: ChordCandidate[] = [];
  const seenKeys = new Set<string>();

  const curatedCandidates = generateCuratedCandidates(availableNotes);
  for (const candidate of curatedCandidates) {
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
    
    const analyzed = analyzeChordPcset(candidate.pitchClasses, scaleTonic);
    
    if (!analyzed) {
      continue;
    }
    
    const mappedNotes = assignOctavesToPitchClasses(candidate.pitchClasses, availableNotes);
    const orderedNotes = sortNotesByPitch(mappedNotes);
    
    if (orderedNotes.length !== candidate.pitchClasses.length) {
      continue;
    }
    
    const existing = chordsByPcset.get(candidate.pcsetKey);
    if (!existing || existing.category === 'advanced' && analyzed.category === 'basic') {
      chordsByPcset.set(candidate.pcsetKey, {
        name: analyzed.displayName,
        displayName: analyzed.displayName,
        notes: orderedNotes,
        pitchClasses: candidate.pitchClasses,
        category: analyzed.category,
        rootPc: analyzed.rootPc,
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

