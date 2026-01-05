import type {
  HandpanScaleFamilyTemplate,
  HandpanConfig,
  PitchClass,
  Note,
} from './types';
import { generateHandpanLayout } from './layoutHelpers';
import { note } from '@tonaljs/core';

const PITCH_CLASS_TO_SEMITONE: Record<PitchClass, number> = {
  C: 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  F: 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
};

const SEMITONE_TO_PITCH_CLASS: string[] = [
  'C',
  'C#',
  'D',
  'Eb',
  'E',
  'F',
  'F#',
  'G',
  'Ab',
  'A',
  'Bb',
  'B',
];

const DING_OCTAVE = 3;

function transposePitchClass(pc: PitchClass, semitones: number): PitchClass {
  const baseSemitone = PITCH_CLASS_TO_SEMITONE[pc];
  const newSemitone = (baseSemitone + semitones) % 12;
  return SEMITONE_TO_PITCH_CLASS[newSemitone] as PitchClass;
}

function noteToMidi(noteStr: Note): number {
  const tonalNote = note(noteStr);
  if (tonalNote.midi !== null && tonalNote.midi !== undefined) {
    return tonalNote.midi;
  }
  throw new Error(`Cannot get MIDI value for note: ${noteStr}`);
}

function bumpOctave(noteStr: Note): Note {
  const tonalNote = note(noteStr);
  if (tonalNote.oct === undefined || tonalNote.oct === null) {
    throw new Error(`Note has no octave: ${noteStr}`);
  }
  const newOctave = tonalNote.oct + 1;
  return `${tonalNote.pc}${newOctave}` as Note;
}

function buildNotesFromOrderedRingIntervals(
  tonicPc: PitchClass,
  ringIntervals: number[]
): Note[] {
  const ding = `${tonicPc}${DING_OCTAVE}` as Note;
  const notes: Note[] = [ding];

  let prev = ding;
  for (const semis of ringIntervals) {
    const nextPc = transposePitchClass(tonicPc, semis);
    let candidate = `${nextPc}${DING_OCTAVE}` as Note;

    while (noteToMidi(candidate) <= noteToMidi(prev)) {
      candidate = bumpOctave(candidate);
    }

    notes.push(candidate);
    prev = candidate;
  }

  return notes;
}

function buildNotesFromIntervals(
  tonicPc: PitchClass,
  intervalsPcSemitones: number[],
  targetNoteCount: number
): Note[] {
  const tonicSemitone = PITCH_CLASS_TO_SEMITONE[tonicPc];
  const uniquePcs = intervalsPcSemitones.map(
    (interval) => (tonicSemitone + interval) % 12
  );

  const pcToName = (pcValue: number): string => {
    const pcNames: Record<number, string> = {
      0: 'C',
      1: tonicPc.includes('#') ? 'C#' : 'Db',
      2: 'D',
      3: tonicPc.includes('#') ? 'D#' : 'Eb',
      4: 'E',
      5: 'F',
      6: tonicPc.includes('#') ? 'F#' : 'Gb',
      7: 'G',
      8: tonicPc.includes('#') ? 'G#' : 'Ab',
      9: 'A',
      10: tonicPc.includes('#') ? 'A#' : 'Bb',
      11: 'B',
    };
    return pcNames[pcValue];
  };

  const ding: Note = `${tonicPc}${DING_OCTAVE}`;
  const notes: Note[] = [ding];

  const midiBase = tonicSemitone + DING_OCTAVE * 12;

  const ringNotesNeeded = targetNoteCount - 1;
  const pcCount = uniquePcs.length;

  if (ringNotesNeeded <= 0) {
    return notes;
  }

  if (pcCount === 0) {
    return notes;
  }

  const tonicPcValue = tonicSemitone % 12;
  const nonTonicPcs = uniquePcs.filter((pc) => pc !== tonicPcValue);

  const fifthInterval = 7;
  const fifthPc = (tonicPcValue + fifthInterval) % 12;
  const hasFifth = nonTonicPcs.includes(fifthPc);

  const ringMidiValues: number[] = [];
  const usedPcs = new Map<number, number>();

  let currentMidi = hasFifth
    ? fifthPc + DING_OCTAVE * 12
    : nonTonicPcs[0] + DING_OCTAVE * 12;

  if (currentMidi <= midiBase) {
    currentMidi += 12;
  }
  currentMidi--;

  while (ringMidiValues.length < ringNotesNeeded) {
    let nextMidi = -1;
    let nextPc = -1;

    for (const pc of nonTonicPcs) {
      const timesUsed = usedPcs.get(pc) || 0;
      if (timesUsed >= 2) continue;

      const octave = Math.floor(currentMidi / 12);
      let candidateMidi = pc + octave * 12;

      if (candidateMidi <= currentMidi) {
        candidateMidi += 12;
      }

      if (octave > DING_OCTAVE + 3) continue;

      if (nextMidi === -1 || candidateMidi < nextMidi) {
        nextMidi = candidateMidi;
        nextPc = pc;
      }
    }

    if (nextMidi === -1) {
      if (hasFifth) {
        const timesUsed = usedPcs.get(fifthPc) || 0;
        if (timesUsed < 3) {
          const octave = Math.floor(currentMidi / 12);
          let candidateMidi = fifthPc + octave * 12;
          if (candidateMidi <= currentMidi) {
            candidateMidi += 12;
          }
          if (octave <= DING_OCTAVE + 3) {
            nextMidi = candidateMidi;
            nextPc = fifthPc;
          }
        }
      }
    }

    if (nextMidi === -1) break;

    ringMidiValues.push(nextMidi);
    usedPcs.set(nextPc, (usedPcs.get(nextPc) || 0) + 1);
    currentMidi = nextMidi;
  }

  ringMidiValues.sort((a, b) => a - b);

  for (const midi of ringMidiValues) {
    const pc = midi % 12;
    const octave = Math.floor(midi / 12);
    const noteName = `${pcToName(pc)}${octave}`;
    notes.push(noteName);
  }

  return notes;
}

export function buildHandpanConfigFromFamily(
  template: HandpanScaleFamilyTemplate,
  tonicPc: PitchClass,
  noteCount: number
): HandpanConfig {
  let notes: Note[];

  if (template.orderedRingIntervalsByNoteCount) {
    const ringIntervals = template.orderedRingIntervalsByNoteCount[noteCount];

    if (!ringIntervals) {
      throw new Error(
        `Missing orderedRingIntervalsByNoteCount for family=${template.id} noteCount=${noteCount}`
      );
    }

    if (ringIntervals.length !== noteCount - 1) {
      throw new Error(
        `Invalid ring intervals length for family=${template.id} noteCount=${noteCount}. Expected ${
          noteCount - 1
        } got ${ringIntervals.length}`
      );
    }

    notes = buildNotesFromOrderedRingIntervals(tonicPc, ringIntervals);
  } else if (template.intervalsPcSemitones) {
    notes = buildNotesFromIntervals(
      tonicPc,
      template.intervalsPcSemitones,
      noteCount
    );
  } else {
    throw new Error(
      `Family ${template.id} must have either orderedRingIntervalsByNoteCount or intervalsPcSemitones`
    );
  }

  const ding = notes[0];
  const layout = generateHandpanLayout(notes, ding);

  const configId = `${template.id}-${tonicPc.toLowerCase().replace('#', 's')}-${noteCount}`;
  const displayName = `${tonicPc} ${template.name} (${noteCount})`;

  return {
    id: configId,
    name: displayName,
    family: template.name,
    familyId: template.id,
    tonicPc,
    ding,
    noteCount,
    notes,
    layout,
    scaleName: template.name,
    scaleAliases: template.aliases,
    scaleDescription: template.description,
    scaleMoodTags: [template.modeHint || 'versatile'],
    scaleTypicalKeys: template.supportedKeys,
    makers: template.makers,
  };
}

export const HANDPAN_FAMILIES: HandpanScaleFamilyTemplate[] = [
  {
    id: 'kurd',
    name: 'Kurd',
    description:
      'Natural minor / Aeolian. Most common handpan family. Ring order includes tonic repetition (D4) in 9/10-note layouts.',
    aliases: ['Natural Minor', 'Aeolian', 'Kurd Minor'],
    modeHint: 'minor',
    intervalsPcSemitones: [0, 2, 3, 5, 7, 8, 10],
    orderedRingIntervalsByNoteCount: {
      9: [7, 8, 10, 0, 2, 3, 5, 7],
      10: [7, 8, 10, 0, 2, 3, 5, 7, 10],
      13: [7, 8, 10, 0, 2, 3, 5, 7, 10, 0, 2, 3],
    },
    suggestedNoteCounts: [9, 10, 13],
    supportedKeys: ['D', 'E', 'F#', 'G', 'A', 'C', 'C#'],
    defaultKey: 'D',
    defaultNoteCount: 9,
  },

  {
    id: 'celtic-minor',
    name: 'Celtic Minor',
    description:
      'Hexatonic minor family often branded as Amara. Smooth, meditative. Layout repeats tonic and 5th for 9/10.',
    aliases: ['Amara', 'Celtic', 'Celtic Amara'],
    makers: ['Pantheon Steel', 'Echo Sound Sculpture'],
    modeHint: 'minor',
    intervalsPcSemitones: [0, 2, 3, 5, 7, 10],
    orderedRingIntervalsByNoteCount: {
      9: [7, 10, 0, 2, 3, 5, 7, 10],
      10: [7, 10, 0, 2, 3, 5, 7, 10, 2],
      13: [7, 10, 0, 2, 3, 5, 7, 10, 0, 2, 3, 5],
    },
    suggestedNoteCounts: [9, 10, 13],
    supportedKeys: ['D', 'C#', 'E', 'F#', 'G', 'A'],
    defaultKey: 'D',
    defaultNoteCount: 9,
  },

  {
    id: 'integral',
    name: 'Integral',
    description:
      'PANArt-associated hexatonic minor family. Distinct from Kurd. Layout emphasizes 5th and b7 colors; repeats tonic for 9/10.',
    aliases: ['PANArt Integral', 'Integral Minor'],
    makers: ['PANArt'],
    modeHint: 'minor',
    intervalsPcSemitones: [0, 2, 3, 7, 8, 10],
    orderedRingIntervalsByNoteCount: {
      9: [7, 8, 10, 0, 2, 3, 7, 10],
      10: [7, 8, 10, 0, 2, 3, 7, 10, 2],
      13: [7, 8, 10, 0, 2, 3, 7, 10, 0, 2, 3, 7],
    },
    suggestedNoteCounts: [9, 10, 13],
    supportedKeys: ['D', 'C#', 'E', 'F', 'F#', 'G', 'A'],
    defaultKey: 'D',
    defaultNoteCount: 9,
  },

  {
    id: 'mystic',
    name: 'Mystic',
    description:
      'Hexatonic "mystic" minor color (phrygian-ish). Kept distinct from Celtic/Integral. Layout repeats tonic and b7 for 9/10.',
    aliases: ['Mystic Minor'],
    modeHint: 'minor',
    intervalsPcSemitones: [0, 1, 3, 5, 7, 10],
    orderedRingIntervalsByNoteCount: {
      9: [7, 1, 10, 0, 3, 5, 7, 10],
      10: [7, 1, 10, 0, 3, 5, 7, 10, 1],
      13: [7, 1, 10, 0, 3, 5, 7, 10, 0, 1, 3, 5],
    },
    suggestedNoteCounts: [9, 10, 13],
    supportedKeys: ['D', 'C#', 'E', 'F', 'G', 'A'],
    defaultKey: 'D',
    defaultNoteCount: 9,
  },

  {
    id: 'pygmy',
    name: 'Pygmy',
    description:
      'Minor pentatonic family. Earthy/tribal. 9/10-note layouts use repeats of tonic and 5th; remains distinct from Kurd.',
    aliases: ['Minor Pentatonic', 'Pygmy Pentatonic'],
    modeHint: 'minor',
    intervalsPcSemitones: [0, 3, 5, 7, 10],
    orderedRingIntervalsByNoteCount: {
      9: [7, 10, 0, 3, 5, 7, 10, 0],
      10: [7, 10, 0, 3, 5, 7, 10, 0, 3],
      13: [7, 10, 0, 3, 5, 7, 10, 0, 3, 5, 7, 10],
    },
    suggestedNoteCounts: [9, 10, 13],
    supportedKeys: ['F', 'F#', 'G', 'A', 'D', 'E'],
    defaultKey: 'F',
    defaultNoteCount: 9,
  },

  {
    id: 'la-sirena',
    name: 'La Sirena',
    description:
      'Dreamy Dorian-leaning hexatonic (often credited to Pantheon Steel). Designed as Dorian without the 4th; repeats tonic and 5th.',
    aliases: ['Dorian Hexatonic', 'Mermaid Scale'],
    makers: ['Pantheon Steel'],
    modeHint: 'mixed',
    intervalsPcSemitones: [0, 2, 3, 7, 9, 10],
    orderedRingIntervalsByNoteCount: {
      9: [7, 9, 10, 0, 2, 3, 7, 10],
      10: [7, 9, 10, 0, 2, 3, 7, 10, 9],
      13: [7, 9, 10, 0, 2, 3, 7, 10, 0, 2, 3, 7],
    },
    suggestedNoteCounts: [9, 10, 13],
    supportedKeys: ['E', 'F', 'D', 'C#', 'G'],
    defaultKey: 'E',
    defaultNoteCount: 9,
  },

  {
    id: 'ursa-minor',
    name: 'Ursa Minor',
    description:
      'Minor-leaning hexatonic family used commercially. Layout emphasizes 5th, b6, b7 and repeats tonic.',
    aliases: ['Ursa'],
    makers: ['Pantheon Steel'],
    modeHint: 'minor',
    intervalsPcSemitones: [0, 2, 5, 7, 8, 10],
    orderedRingIntervalsByNoteCount: {
      9: [7, 8, 10, 0, 2, 5, 7, 10],
      10: [7, 8, 10, 0, 2, 5, 7, 10, 5],
      13: [7, 8, 10, 0, 2, 5, 7, 10, 0, 2, 5, 7],
    },
    suggestedNoteCounts: [9, 10, 13],
    supportedKeys: ['D', 'C#', 'E', 'F#', 'G'],
    defaultKey: 'D',
    defaultNoteCount: 9,
  },

  {
    id: 'aegean',
    name: 'Aegean',
    description:
      'Major/lydian-leaning pentatonic family (often credited to Pantheon Steel). Bright/open. Layout repeats tonic and 5th for 9/10.',
    aliases: ['Major Pentatonic', 'Aegean (Pantheon)'],
    makers: ['Pantheon Steel'],
    modeHint: 'major',
    intervalsPcSemitones: [0, 2, 4, 7, 9],
    orderedRingIntervalsByNoteCount: {
      9: [7, 9, 0, 2, 4, 7, 9, 0],
      10: [7, 9, 0, 2, 4, 7, 9, 0, 2],
      13: [7, 9, 0, 2, 4, 7, 9, 0, 2, 4, 7, 9],
    },
    suggestedNoteCounts: [9, 10, 13],
    supportedKeys: ['C', 'D', 'E', 'F#', 'G', 'A'],
    defaultKey: 'D',
    defaultNoteCount: 9,
  },

  {
    id: 'oxalis',
    name: 'Oxalis',
    description:
      'Major-leaning family with maj7 color. Lyrical/resolved. Layout repeats tonic and 5th; adds maj7 as a high color tone.',
    aliases: ['Oxalis Major', 'Major + Maj7'],
    modeHint: 'major',
    intervalsPcSemitones: [0, 2, 4, 7, 9, 11],
    orderedRingIntervalsByNoteCount: {
      9: [7, 9, 11, 0, 2, 4, 7, 11],
      10: [7, 9, 11, 0, 2, 4, 7, 11, 9],
      13: [7, 9, 11, 0, 2, 4, 7, 11, 0, 2, 4, 7],
    },
    suggestedNoteCounts: [9, 10, 13],
    supportedKeys: ['G', 'F', 'D', 'C', 'A', 'E'],
    defaultKey: 'G',
    defaultNoteCount: 9,
  },

  {
    id: 'hijaz',
    name: 'Hijaz',
    description:
      'Phrygian Dominant (exotic / Middle Eastern flavor). Layout emphasizes b2→3 leap; repeats tonic for ring completeness.',
    aliases: ['Phrygian Dominant', 'Hijaz Kar', 'Hijaz Mode'],
    modeHint: 'exotic',
    intervalsPcSemitones: [0, 1, 4, 5, 7, 8, 10],
    orderedRingIntervalsByNoteCount: {
      9: [7, 8, 10, 0, 1, 4, 5, 7],
      10: [7, 8, 10, 0, 1, 4, 5, 7, 1],
      13: [7, 8, 10, 0, 1, 4, 5, 7, 8, 10, 0, 1],
    },
    suggestedNoteCounts: [9, 10, 13],
    supportedKeys: ['C', 'D', 'E', 'F#', 'G', 'A'],
    defaultKey: 'D',
    defaultNoteCount: 9,
  },

  {
    id: 'harmonic-minor',
    name: 'Harmonic Minor',
    description:
      'Natural minor with raised 7th. Often cross-labeled by mode (e.g., "C Harmonic Minor" shares pitch set with "G Hijaz" perspective).',
    aliases: ['Harmonic Minor Scale', 'G Hijaz (alias by mode)'],
    modeHint: 'exotic',
    intervalsPcSemitones: [0, 2, 3, 5, 7, 8, 11],
    orderedRingIntervalsByNoteCount: {
      9: [7, 8, 11, 0, 2, 3, 5, 7],
      10: [7, 8, 11, 0, 2, 3, 5, 7, 8],
      13: [7, 8, 11, 0, 2, 3, 5, 7, 8, 11, 0, 2],
    },
    suggestedNoteCounts: [9, 10, 13],
    supportedKeys: ['C', 'C#', 'D', 'E', 'F', 'F#', 'G', 'A'],
    defaultKey: 'C',
    defaultNoteCount: 9,
  },

  {
    id: 'onoleo',
    name: 'Onoleo',
    description:
      'Modern exotic family used by some makers/apps. Canonical layout is "dreamy" and kept distinct from other families.',
    aliases: ['Modern Exotic', 'Onoleo (App)'],
    modeHint: 'exotic',
    intervalsPcSemitones: [0, 2, 3, 6, 7, 10],
    orderedRingIntervalsByNoteCount: {
      9: [7, 10, 0, 2, 3, 6, 7, 10],
      10: [7, 10, 0, 2, 3, 6, 7, 10, 2],
      13: [7, 10, 0, 2, 3, 6, 7, 10, 0, 2, 3, 6],
    },
    suggestedNoteCounts: [9, 10, 13],
    supportedKeys: ['B', 'C#', 'D', 'E', 'F#'],
    defaultKey: 'D',
    defaultNoteCount: 9,
  },

  {
    id: 'equinox',
    name: 'Equinox',
    description:
      'Mixed mood family used commercially. Implemented as Mixolydian-like pitch set with a handpan-friendly ring order.',
    aliases: ['Mixolydian-ish', 'Equinox (Mixed)'],
    modeHint: 'mixed',
    intervalsPcSemitones: [0, 2, 4, 5, 7, 9, 10],
    orderedRingIntervalsByNoteCount: {
      9: [7, 10, 0, 2, 4, 5, 9, 7],
      10: [7, 10, 0, 2, 4, 5, 9, 7, 10],
      13: [7, 10, 0, 2, 4, 5, 7, 9, 10, 0, 2, 4],
    },
    suggestedNoteCounts: [9, 10, 13],
    supportedKeys: ['G', 'D', 'C', 'E', 'A'],
    defaultKey: 'G',
    defaultNoteCount: 9,
  },

  {
    id: 'magic-voyage',
    name: 'Magic Voyage',
    description:
      'Storytelling "bright with gentle pull" family found in catalogs. Ring order emphasizes 5th and b7 colors (mixolydian-like).',
    aliases: ['Magic Voyage (Mixed)', 'Adventure Scale'],
    modeHint: 'mixed',
    intervalsPcSemitones: [0, 2, 4, 5, 7, 9, 10],
    orderedRingIntervalsByNoteCount: {
      9: [7, 10, 0, 2, 4, 5, 7, 10],
      10: [7, 10, 0, 2, 4, 5, 7, 10, 0],
      13: [7, 10, 0, 2, 4, 5, 7, 9, 10, 0, 2, 4],
    },
    suggestedNoteCounts: [9, 10, 13],
    supportedKeys: ['D', 'E', 'F', 'G', 'A', 'C'],
    defaultKey: 'D',
    defaultNoteCount: 9,
  },

  {
    id: 'ionian',
    name: 'Ionian',
    description: 'Major scale (Ionian). Bright and familiar.',
    aliases: ['Major', 'Ionian Mode'],
    modeHint: 'major',
    intervalsPcSemitones: [0, 2, 4, 5, 7, 9, 11],
    orderedRingIntervalsByNoteCount: {
      9: [7, 9, 11, 0, 2, 4, 5, 7],
      10: [7, 9, 11, 0, 2, 4, 5, 7, 9],
      13: [7, 9, 11, 0, 2, 4, 5, 7, 9, 11, 0, 2],
    },
    suggestedNoteCounts: [9, 10, 13],
    supportedKeys: ['C', 'D', 'E', 'F', 'G', 'A'],
    defaultKey: 'C',
    defaultNoteCount: 9,
  },

  {
    id: 'dorian',
    name: 'Dorian',
    description: 'Dorian mode. Minor with brighter major 6th.',
    aliases: ['Dorian Mode'],
    modeHint: 'mixed',
    intervalsPcSemitones: [0, 2, 3, 5, 7, 9, 10],
    orderedRingIntervalsByNoteCount: {
      9: [7, 9, 10, 0, 2, 3, 5, 7],
      10: [7, 9, 10, 0, 2, 3, 5, 7, 9],
      13: [7, 9, 10, 0, 2, 3, 5, 7, 9, 10, 0, 2],
    },
    suggestedNoteCounts: [9, 10, 13],
    supportedKeys: ['D', 'E', 'F', 'G', 'A', 'C'],
    defaultKey: 'D',
    defaultNoteCount: 9,
  },

  {
    id: 'lydian',
    name: 'Lydian',
    description: 'Lydian mode. Major with raised 4th (dreamy/cinematic).',
    aliases: ['Lydian Mode'],
    modeHint: 'major',
    intervalsPcSemitones: [0, 2, 4, 6, 7, 9, 11],
    orderedRingIntervalsByNoteCount: {
      9: [7, 9, 11, 0, 2, 4, 6, 7],
      10: [7, 9, 11, 0, 2, 4, 6, 7, 9],
      13: [7, 9, 11, 0, 2, 4, 6, 7, 9, 11, 0, 2],
    },
    suggestedNoteCounts: [9, 10, 13],
    supportedKeys: ['C', 'D', 'E', 'F', 'G', 'A'],
    defaultKey: 'F',
    defaultNoteCount: 9,
  },

  {
    id: 'mixolydian',
    name: 'Mixolydian',
    description: 'Mixolydian mode. Major with flat 7th (folk/rock brightness).',
    aliases: ['Mixolydian Mode'],
    modeHint: 'mixed',
    intervalsPcSemitones: [0, 2, 4, 5, 7, 9, 10],
    orderedRingIntervalsByNoteCount: {
      9: [7, 9, 10, 0, 2, 4, 5, 7],
      10: [7, 9, 10, 0, 2, 4, 5, 7, 9],
      13: [7, 9, 10, 0, 2, 4, 5, 7, 9, 10, 0, 2],
    },
    suggestedNoteCounts: [9, 10, 13],
    supportedKeys: ['C', 'D', 'E', 'F', 'G', 'A'],
    defaultKey: 'G',
    defaultNoteCount: 9,
  },

  {
    id: 'aeolian',
    name: 'Aeolian',
    description:
      'Natural minor (Aeolian). Same pitch-class set as Kurd; provided as separate label for UI/search (layout identical to Kurd).',
    aliases: ['Natural Minor', 'Aeolian Mode'],
    modeHint: 'minor',
    intervalsPcSemitones: [0, 2, 3, 5, 7, 8, 10],
    orderedRingIntervalsByNoteCount: {
      9: [7, 8, 10, 0, 2, 3, 5, 7],
      10: [7, 8, 10, 0, 2, 3, 5, 7, 10],
      13: [7, 8, 10, 0, 2, 3, 5, 7, 10, 0, 2, 3],
    },
    suggestedNoteCounts: [9, 10, 13],
    supportedKeys: ['D', 'E', 'F#', 'G', 'A', 'C', 'C#'],
    defaultKey: 'A',
    defaultNoteCount: 9,
  },
];

export function generateAllHandpanConfigs(): HandpanConfig[] {
  const configs: HandpanConfig[] = [];

  for (const family of HANDPAN_FAMILIES) {
    for (const key of family.supportedKeys) {
      for (const noteCount of family.suggestedNoteCounts) {
        const config = buildHandpanConfigFromFamily(family, key, noteCount);
        configs.push(config);
      }
    }
  }

  return configs;
}

export function getHandpanFamilyById(
  id: string
): HandpanScaleFamilyTemplate | undefined {
  return HANDPAN_FAMILIES.find((family) => family.id === id);
}

export function getAllHandpanFamilies(): HandpanScaleFamilyTemplate[] {
  return HANDPAN_FAMILIES;
}
