import type {
  HandpanScaleFamilyTemplate,
  HandpanConfig,
  PitchClass,
  Note,
} from './types';
import { generateHandpanLayout } from './layoutHelpers';

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

const DING_OCTAVE = 3;

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
  const notes = buildNotesFromIntervals(
    tonicPc,
    template.intervalsPcSemitones,
    noteCount
  );
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
      'Most common handpan family. Natural minor / Aeolian (7-tone). Versatile, balanced, beginner-friendly.',
    aliases: ['Natural Minor', 'Aeolian', 'Kurd Minor'],
    modeHint: 'minor',
    intervalsPcSemitones: [0, 2, 3, 5, 7, 8, 10],
    suggestedNoteCounts: [9, 10, 13],
    supportedKeys: ['D', 'E', 'F#', 'G', 'A', 'C', 'C#'],
    defaultKey: 'D',
    defaultNoteCount: 9,
  },

  {
    id: 'celtic-minor',
    name: 'Celtic Minor',
    description:
      'Common handpan hexatonic minor family (often branded as Amara). Smooth, meditative, avoids harsh tension by using a 6-tone minor set.',
    aliases: ['Amara', 'Celtic', 'Celtic Amara'],
    makers: ['Pantheon Steel', 'Echo Sound Sculpture'],
    modeHint: 'minor',
    intervalsPcSemitones: [0, 2, 3, 5, 7, 10],
    suggestedNoteCounts: [9, 10],
    supportedKeys: ['D', 'C#', 'E', 'F#', 'G', 'A'],
    defaultKey: 'D',
    defaultNoteCount: 9,
  },

  {
    id: 'integral',
    name: 'Integral',
    description:
      'Classic PANArt-associated hexatonic minor family. Distinct from Kurd: emphasizes 5th + b6 + b7 colors with a 6-tone set.',
    aliases: ['PANArt Integral', 'Integral Minor'],
    makers: ['PANArt'],
    modeHint: 'minor',
    intervalsPcSemitones: [0, 2, 3, 7, 8, 10],
    suggestedNoteCounts: [9, 10],
    supportedKeys: ['D', 'C#', 'E', 'F', 'F#', 'G', 'A'],
    defaultKey: 'D',
    defaultNoteCount: 9,
  },

  {
    id: 'mystic',
    name: 'Mystic',
    description:
      'Hexatonic minor-flavored family used by multiple makers. Chosen here as a distinct 6-tone set (avoid duplicating Celtic/Integral).',
    aliases: ['Mystic Minor'],
    modeHint: 'minor',
    intervalsPcSemitones: [0, 1, 3, 5, 7, 10],
    suggestedNoteCounts: [9, 10],
    supportedKeys: ['D', 'C#', 'E', 'F', 'G', 'A'],
    defaultKey: 'D',
    defaultNoteCount: 9,
  },

  {
    id: 'pygmy',
    name: 'Pygmy',
    description:
      'Pentatonic minor family (earthy/tribal feel). Must not duplicate Kurd. Canonical set here is minor pentatonic.',
    aliases: ['Minor Pentatonic', 'Pygmy Pentatonic'],
    modeHint: 'minor',
    intervalsPcSemitones: [0, 3, 5, 7, 10],
    suggestedNoteCounts: [9, 10],
    supportedKeys: ['F', 'F#', 'G', 'A', 'D', 'E'],
    defaultKey: 'F',
    defaultNoteCount: 9,
  },

  {
    id: 'la-sirena',
    name: 'La Sirena',
    description:
      'Dreamy Dorian-leaning hexatonic family (often credited to Pantheon Steel). Dorian without the 4th degree.',
    aliases: ['Dorian Hexatonic'],
    makers: ['Pantheon Steel'],
    modeHint: 'mixed',
    intervalsPcSemitones: [0, 2, 3, 7, 9, 10],
    suggestedNoteCounts: [9, 10],
    supportedKeys: ['E', 'F', 'D', 'C#', 'G'],
    defaultKey: 'E',
    defaultNoteCount: 9,
  },

  {
    id: 'ursa-minor',
    name: 'Ursa Minor',
    description:
      'Minor-leaning hexatonic family used commercially (often associated with Halo ecosystem). Kept distinct from Kurd/Integral.',
    aliases: ['Ursa'],
    makers: ['Pantheon Steel'],
    modeHint: 'minor',
    intervalsPcSemitones: [0, 2, 5, 7, 8, 10],
    suggestedNoteCounts: [9, 10],
    supportedKeys: ['D', 'C#', 'E', 'F#', 'G'],
    defaultKey: 'D',
    defaultNoteCount: 9,
  },

  {
    id: 'aegean',
    name: 'Aegean',
    description:
      'Major/lydian-leaning pentatonic family (often credited to Pantheon Steel). Bright, open, cinematic.',
    aliases: ['Major Pentatonic', 'Lydian Pentatonic'],
    makers: ['Pantheon Steel'],
    modeHint: 'major',
    intervalsPcSemitones: [0, 2, 4, 7, 9],
    suggestedNoteCounts: [9, 10],
    supportedKeys: ['C', 'D', 'E', 'F#', 'G', 'A'],
    defaultKey: 'D',
    defaultNoteCount: 9,
  },

  {
    id: 'oxalis',
    name: 'Oxalis',
    description:
      'Major-leaning family with a slightly more "resolved/lyrical" color (includes maj7). Used by modern makers under this or similar naming.',
    aliases: ['Major + Maj7', 'Oxalis Major'],
    modeHint: 'major',
    intervalsPcSemitones: [0, 2, 4, 7, 9, 11],
    suggestedNoteCounts: [9, 10],
    supportedKeys: ['G', 'F', 'D', 'C', 'A', 'E'],
    defaultKey: 'G',
    defaultNoteCount: 9,
  },

  {
    id: 'hijaz',
    name: 'Hijaz',
    description:
      'Phrygian Dominant family (exotic / Middle Eastern flavor). Signature 1–b2–3 jump.',
    aliases: ['Phrygian Dominant', 'Hijaz Kar', 'Hijaz Mode'],
    modeHint: 'exotic',
    intervalsPcSemitones: [0, 1, 4, 5, 7, 8, 10],
    suggestedNoteCounts: [9, 10],
    supportedKeys: ['C', 'D', 'E', 'F#', 'G', 'A'],
    defaultKey: 'D',
    defaultNoteCount: 9,
  },

  {
    id: 'harmonic-minor',
    name: 'Harmonic Minor',
    description:
      'Natural minor with raised 7th. Often cross-labeled with Hijaz perspective depending on tonal center (e.g., "C Harmonic Minor" ~ "G Hijaz").',
    aliases: [
      'Harmonic Minor Scale',
      'C Harmonic Minor',
      'G Hijaz (alias by mode)',
    ],
    modeHint: 'exotic',
    intervalsPcSemitones: [0, 2, 3, 5, 7, 8, 11],
    suggestedNoteCounts: [9, 10],
    supportedKeys: ['C', 'C#', 'D', 'E', 'F', 'F#', 'G', 'A'],
    defaultKey: 'C',
    defaultNoteCount: 9,
  },

  {
    id: 'onoleo',
    name: 'Onoleo',
    description:
      'Modern exotic family used by some makers/apps. Canonical pitch-class set selected to be distinct and "dreamy".',
    aliases: ['Modern Exotic', 'Onoleo (App)'],
    modeHint: 'exotic',
    intervalsPcSemitones: [0, 2, 3, 6, 7, 10],
    suggestedNoteCounts: [9, 10],
    supportedKeys: ['B', 'C#', 'D', 'E', 'F#'],
    defaultKey: 'D',
    defaultNoteCount: 9,
  },

  {
    id: 'equinox',
    name: 'Equinox',
    description:
      'Mixed mood family used commercially. Implemented here as a Mixolydian-like 7-tone set for expressive bright/dark balance.',
    aliases: ['Mixolydian-ish', 'Equinox (Mixed)'],
    modeHint: 'mixed',
    intervalsPcSemitones: [0, 2, 4, 5, 7, 9, 10],
    suggestedNoteCounts: [9, 10],
    supportedKeys: ['G', 'D', 'C', 'E', 'A'],
    defaultKey: 'G',
    defaultNoteCount: 9,
  },

  {
    id: 'magic-voyage',
    name: 'Magic Voyage',
    description:
      'Storytelling "major/minor blend" family found in handpan catalogs. Implemented as a Mixolydian-derived set (bright with gentle pull).',
    aliases: ['Magic Voyage (Mixed)', 'Adventure Scale'],
    modeHint: 'mixed',
    intervalsPcSemitones: [0, 2, 4, 5, 7, 9, 10],
    suggestedNoteCounts: [9, 10],
    supportedKeys: ['D', 'E', 'F', 'G', 'A', 'C'],
    defaultKey: 'D',
    defaultNoteCount: 9,
  },

  {
    id: 'ionian',
    name: 'Ionian',
    description: 'Major scale (Ionian mode). Bright and familiar.',
    aliases: ['Major', 'Ionian Mode'],
    modeHint: 'major',
    intervalsPcSemitones: [0, 2, 4, 5, 7, 9, 11],
    suggestedNoteCounts: [9, 10],
    supportedKeys: ['C', 'D', 'E', 'F', 'G', 'A'],
    defaultKey: 'C',
    defaultNoteCount: 9,
  },

  {
    id: 'dorian',
    name: 'Dorian',
    description: 'Dorian mode. Minor with a brighter major 6th.',
    aliases: ['Dorian Mode'],
    modeHint: 'mixed',
    intervalsPcSemitones: [0, 2, 3, 5, 7, 9, 10],
    suggestedNoteCounts: [9, 10],
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
    suggestedNoteCounts: [9, 10],
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
    suggestedNoteCounts: [9, 10],
    supportedKeys: ['C', 'D', 'E', 'F', 'G', 'A'],
    defaultKey: 'G',
    defaultNoteCount: 9,
  },

  {
    id: 'aeolian',
    name: 'Aeolian',
    description:
      'Natural minor (Aeolian mode). Same pitch-class set as Kurd; kept as a separate "mode label" for UI/search.',
    aliases: ['Natural Minor', 'Aeolian Mode'],
    modeHint: 'minor',
    intervalsPcSemitones: [0, 2, 3, 5, 7, 8, 10],
    suggestedNoteCounts: [9, 10],
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
