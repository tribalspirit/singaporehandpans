import type {
  HandpanScaleFamilyTemplate,
  HandpanConfig,
  PitchClass,
  Note,
} from './types';
import { generateHandpanLayout } from './layoutHelpers';
import { note } from '@tonaljs/core';
import { spellIntervalFromTonic } from '../core/spelling/keySpelling';

/**
 * Octave of the ding for a given tonic pitch class.
 *
 * This was a flat `DING_OCTAVE = 3`, which put every instrument in one octave
 * regardless of key. Real instruments do not work that way: across Saraz,
 * Isthmus, Shaktipan and Pures Music listings, every A-ding and B-ding handpan
 * is A2 or B2 — eleven independent citations, none for A3 or B3 as a standard
 * ding — while C through G ding at octave 3 (C3, C#3, D3, E3, F#3, G3 all
 * attested).
 *
 * The result is a continuous G#2-G3 band rather than a jump back down at A.
 *
 * Makers also build deliberate "low" variants (F2 Low Pygmy, Low G2 Oxalista)
 * that drop F/F#/G to octave 2. Those are separate instruments rather than a
 * different reading of these keys, so they belong in the catalog as their own
 * presets rather than as a rule here. Sources retrieved 2026-09-10.
 */
const DING_OCTAVE_BY_PITCH_CLASS: Record<string, number> = {
  C: 3,
  'C#': 3,
  Db: 3,
  D: 3,
  'D#': 3,
  Eb: 3,
  E: 3,
  F: 3,
  'F#': 3,
  Gb: 3,
  G: 3,
  'G#': 2,
  Ab: 2,
  A: 2,
  'A#': 2,
  Bb: 2,
  B: 2,
};

function dingOctaveFor(tonicPc: PitchClass): number {
  return DING_OCTAVE_BY_PITCH_CLASS[tonicPc] ?? 3;
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
  const dingOctave = dingOctaveFor(tonicPc);
  const ding = `${tonicPc}${dingOctave}` as Note;
  const notes: Note[] = [ding];

  let prev = ding;
  for (const semis of ringIntervals) {
    // Spell by scale degree so the letter follows the selected key, rather
    // than a fixed sharp/flat table that renders C# minor with Ab and Eb.
    const nextPc = spellIntervalFromTonic(tonicPc, semis);
    let candidate = `${nextPc}${dingOctave}` as Note;

    while (noteToMidi(candidate) <= noteToMidi(prev)) {
      candidate = bumpOctave(candidate);
    }

    notes.push(candidate);
    prev = candidate;
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
  } else {
    throw new Error(
      `Family ${template.id} must define orderedRingIntervalsByNoteCount`
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
      'Natural minor. The most common handpan family, also sold as Aeolian, Annaziska or simply Natural Minor — Saraz describes all of these as the same scale. Ring order repeats the tonic in 9/10-note layouts.',
    aliases: ['Aeolian', 'Annaziska', 'Natural Minor', 'Kurd Minor'],
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
    /**
     * Integral, Equinox and Mystic are one scale.
     *
     * All three reduce to {0,2,3,7,8,10} — natural minor without the 4th — and
     * differ only in which tone field sits lowest. Isthmus says so directly:
     * "Mystic is a hexatonic minor scale, similar to the Integral, but its last
     * note is different." They were three catalog entries that sounded
     * identical, so they are merged here under the most widely documented name.
     *
     * The ring order is taken from Saraz's E Equinox listing
     * ("E/ G, B, C, D, E, F#, G, B"), because that is this scale's published
     * 9-note form and maps exactly onto the widget's 9-note shell. Saraz's
     * Integral listings are 8-note instruments, a shell the widget does not
     * offer, so following them would have meant inventing the ninth note.
     * Sources retrieved 2026-09-10; see docs/features/handpan-data-audit.md.
     */
    description:
      'Hexatonic minor: natural minor without the 4th. Reflective and open. Also sold as Equinox and as Mystic — the same six notes, laid out with a different field lowest.',
    aliases: ['Equinox', 'Mystic', 'PANArt Integral', 'Integral Minor'],
    modeHint: 'minor',
    intervalsPcSemitones: [0, 2, 3, 7, 8, 10],
    orderedRingIntervalsByNoteCount: {
      9: [3, 7, 8, 10, 0, 2, 3, 7],
      10: [3, 7, 8, 10, 0, 2, 3, 7, 8],
      13: [3, 7, 8, 10, 0, 2, 3, 7, 8, 10, 0, 2],
    },
    suggestedNoteCounts: [9, 10, 13],
    supportedKeys: ['C', 'C#', 'D', 'E', 'F', 'F#', 'G', 'A'],
    defaultKey: 'D',
    defaultNoteCount: 9,
  },

  {
    id: 'pygmy',
    name: 'Pygmy',
    /**
     * Corrected 2026-09-10 from maker sources. This family previously shipped
     * the minor pentatonic [0,3,5,7,10], which has a perfect 4th where Pygmy
     * has a major 2nd and no major 2nd at all — a different pitch-class set,
     * not a rotation.
     *
     * Saraz: "F2/ F, G, Ab, C, Eb, F, G, C"
     * Isthmus: "A2 Pygmy: A2 / E A B C E G A B"
     * Corroborated by Shaktipan and HaganeNote across four makers.
     * The 9-note ring order below reproduces the Isthmus A2 listing exactly.
     */
    description:
      'Earthy, tribal pentatonic: root, major 2nd, minor 3rd, 5th and minor 7th. Distinct from the minor pentatonic — it has no 4th. Also sold as Magic Voyage, which HaganeNote itself calls "very similar to the Low Pygmy scale".',
    aliases: ['Magic Voyage', 'Low Pygmy', 'Pygmy Pentatonic'],
    modeHint: 'minor',
    intervalsPcSemitones: [0, 2, 3, 7, 10],
    orderedRingIntervalsByNoteCount: {
      9: [7, 0, 2, 3, 7, 10, 0, 2],
      10: [7, 0, 2, 3, 7, 10, 0, 2, 3],
      13: [7, 0, 2, 3, 7, 10, 0, 2, 3, 7, 10, 0],
    },
    suggestedNoteCounts: [9, 10, 13],
    supportedKeys: ['C', 'D', 'E', 'F', 'F#', 'G', 'A'],
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
    id: 'akebono',
    name: 'Akebono',
    /**
     * Japanese pentatonic, rooted on the ding.
     *
     * Handpan makers name this instrument by its ding and state that the ding
     * is the root — Isthmus and MAG both write "The 'ding' is the root note of
     * the scale, followed by the fourth and fifth degrees." Eighteen listings
     * across Saraz, Isthmus, HaganeNote, Vibe and Chirp are unanimous on
     * {0,1,5,7,8} measured from the ding.
     *
     * The perfect 4th above the ding is where the scale resolves, which is why
     * Isthmus says "F# Akebono plays flawlessly in B Minor" and Saraz files it
     * under "B Minor / F# Akebono". That is a tonal centre, not the name: the
     * catalog follows the makers so an owner finds the instrument they bought.
     * Note that piano scale dictionaries root Akebono differently — tongue-drum
     * maker Guda publishes these same notes a 4th up, as "key of A" where
     * HaganeNote says "E Akebono".
     *
     * Ring order reproduces Isthmus "F#/ B C# D F# G B C# D" exactly.
     *
     * 9 notes only. Makers do build 10- and 11-note Akebonos, but they reach
     * those counts with bottom notes, which this widget cannot yet represent —
     * no all-top-shell 10-note Akebono appears in any listing found.
     * Sources retrieved 2026-09-10; see docs/features/handpan-data-audit.md.
     */
    description:
      'Japanese pentatonic — root, flat 2nd, 4th, 5th and flat 6th. Spare and contemplative. Also known as In, Miyako-bushi or Sakura. The 4th above the ding acts as its tonal centre, so an F# Akebono sits comfortably in B minor.',
    aliases: ['In', 'Miyako-bushi', 'Sakura', 'Hon-kumoi-joshi'],
    modeHint: 'exotic',
    intervalsPcSemitones: [0, 1, 5, 7, 8],
    orderedRingIntervalsByNoteCount: {
      9: [5, 7, 8, 0, 1, 5, 7, 8],
    },
    suggestedNoteCounts: [9],
    supportedKeys: ['C#', 'D', 'E', 'F', 'F#', 'G'],
    defaultKey: 'F#',
    defaultNoteCount: 9,
  },

  {
    id: 'aegean',
    name: 'Aegean',
    /**
     * Restored 2026-09-10 with corrected data.
     *
     * This family previously shipped {0,2,4,7,9} — a major pentatonic that no
     * maker publishes — and was removed for that reason. Two sources give
     * {0,4,6,7,11}: root, major 3rd, sharp 4th, 5th, major 7th.
     *
     * Isthmus: "C Aegean: C / E G B C E F# G B"
     * Milosc i Spokoj: "D Aegean 10 - D3 | F#3, A3, C#4, D4, F#4, G#4, A4,
     * C#5, D5"
     *
     * Both ring orders below reproduce those listings exactly. Note this is a
     * five-note set at 9 and 10 notes, not full Lydian — larger builds add the
     * 2nd and 6th, but they do so with bottom notes this widget cannot model.
     */
    description:
      'Bright and suspended: root, major 3rd, sharp 4th, 5th and major 7th. The raised 4th gives it a floating, unresolved quality. Larger builds fill it out toward Lydian.',
    aliases: ['Athena'],
    modeHint: 'major',
    intervalsPcSemitones: [0, 4, 6, 7, 11],
    orderedRingIntervalsByNoteCount: {
      9: [4, 7, 11, 0, 4, 6, 7, 11],
      10: [4, 7, 11, 0, 4, 6, 7, 11, 0],
    },
    suggestedNoteCounts: [9, 10],
    supportedKeys: ['A', 'C', 'D'],
    defaultKey: 'C',
    defaultNoteCount: 9,
  },

  {
    id: 'sabye',
    name: 'Sabye',
    /**
     * Diatonic seven-note family. Saraz and HaganeNote publish note lists that
     * derive to the identical ring order, which is strong corroboration:
     *
     * Saraz:      "E/ A, B, C#, D#, E, F#, G#, B"
     * HaganeNote: "D/ G A B C# D E F# A"
     *
     * Isthmus publishes the same note list under the name Ashakiran
     * ("D / G A B C# D E F# A"), character for character, so Ashakiran and Asha
     * are recorded as aliases rather than a separate family.
     *
     * HaganeNote explains why it reads as Lydian rather than Ionian: "The Sabye
     * handpan scale is a diatonic version of a Lydian modal scale. The root
     * note is the second lower note of the scale, while the ding is its perfect
     * fifth." As with Akebono, that is a tonal centre rather than the name.
     */
    description:
      'The complete major scale, warm and familiar. On handpans this seven-note set is sold as Sabye — or as Ashakiran or Asha — rather than as Ionian: makers who list a "Major" pan publish six-note subsets instead. Named by its ding, though it resolves to the 4th above, which is why makers describe it as Lydian.',
    aliases: ['Ionian', 'Major', 'Ashakiran', 'Asha'],
    modeHint: 'major',
    intervalsPcSemitones: [0, 2, 4, 5, 7, 9, 11],
    orderedRingIntervalsByNoteCount: {
      9: [5, 7, 9, 11, 0, 2, 4, 7],
    },
    suggestedNoteCounts: [9],
    supportedKeys: ['C', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'A'],
    defaultKey: 'E',
    defaultNoteCount: 9,
  },

  {
    id: 'golden-gate',
    name: 'Golden Gate',
    /**
     * Isthmus: "C3 / E3 G3 B3 C4 D4 F#4 G4" — eight notes, the only listing
     * found, and the only key found. The ring order reproduces it exactly.
     *
     * Shipped in C alone because C is the only ding attested. Transposing the
     * set to other keys is musically well defined, so more keys can be added
     * whenever that is wanted; leaving it at C keeps the catalog to what is
     * actually documented.
     */
    description:
      'Eight-note major with a raised 4th — Aegean plus the 2nd. Open and cinematic, with the sharp 4th lending an unresolved lift.',
    aliases: [],
    modeHint: 'major',
    intervalsPcSemitones: [0, 2, 4, 6, 7, 11],
    orderedRingIntervalsByNoteCount: {
      8: [4, 7, 11, 0, 2, 6, 7],
    },
    suggestedNoteCounts: [8],
    supportedKeys: ['C'],
    defaultKey: 'C',
    defaultNoteCount: 8,
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
];

/**
 * Families removed from the catalog because their data could not be verified.
 *
 * The widget's rule is that it does not present a tuning it cannot source. Each
 * of these shipped an interval set that no maker publishes, and none is a
 * reference-note rotation of a real scale the way Oxalis turned out to be — the
 * step patterns simply do not match, so they were invented rather than
 * mismeasured.
 *
 * The verified sets are recorded in docs/features/handpan-data-audit.md. Any of
 * these can return once its data is sourced, which is what the reason strings
 * below are for. Sources retrieved 2026-09-10.
 */
export const EXCLUDED_FAMILY_IDS: Record<string, string> = {
  lydian:
    'No maker ships a scale under this name. Absent from Saraz (58 scales), Isthmus (55), HaganeNote and Shaktipan. The Lydian collection reaches handpans as Aegean, Golden Gate and Sabye instead.',
  'ursa-minor':
    'Shipped {0,2,5,7,8,10}; sources give {0,2,3,5,7,8}, a minor hexatonic with no 7th at all. Only reported confidence — the Pantheon Steel maker page refused a TLS handshake, so the set rests on search snippets.',
  onoleo:
    'Shipped {0,2,3,6,7,10}; sources give {0,4,5,7,8}, and even those conflict — one blog gives Celtic Minor instead. No Saraz, Isthmus or HaganeNote page exists.',
};

/**
 * Families that were merged into another because they are the same scale.
 *
 * Kurd/Aeolian/Annaziska and Integral/Equinox/Mystic each reduce to a single
 * pitch-class set, Magic Voyage is Pygmy, and Ionian is the same seven notes as
 * Sabye. Keeping them as separate catalog entries meant offering choices that
 * sounded identical.
 *
 * Sabye wins that last one rather than Ionian because it is the name handpan
 * makers publish the complete diatonic set under — Saraz's own "C Major"
 * listings are six-note subsets, not this set — and because two makers derive
 * an identical ring order for Sabye while the Ionian ring order was never
 * sourced.
 *
 * The old ids stay resolvable so nothing that already references one silently
 * returns nothing. Each canonical family carries the union of the merged
 * families' supported keys, so every legacy preset id maps to a real preset —
 * asserted in `familyAliases.test.ts`.
 */
export const MERGED_FAMILY_IDS: Record<string, string> = {
  aeolian: 'kurd',
  equinox: 'integral',
  mystic: 'integral',
  'magic-voyage': 'pygmy',
  ionian: 'sabye',
};

/**
 * What each merged-away family used to publish.
 *
 * Recorded because the canonical family does not always offer the same shells.
 * Ionian published 9, 10 and 13 notes; Sabye is only documented at 9, so
 * `ionian-c-13` has no exact counterpart. Rewriting the id alone therefore
 * resolved to nothing — the migration looked like it worked and silently did
 * not.
 *
 * Keeping the old shape here lets `getHandpanConfig` fall back to the canonical
 * family's default shell for a count that no longer exists, so an old id still
 * yields the right scale rather than nothing, and lets the compatibility test
 * assert against what actually used to exist rather than against the surviving
 * family's current options — which is what let the gap through in the first
 * place.
 */
export const MERGED_FAMILY_HISTORY: Record<
  string,
  { keys: readonly string[]; noteCounts: readonly number[] }
> = {
  aeolian: {
    keys: ['D', 'E', 'F#', 'G', 'A', 'C', 'C#'],
    noteCounts: [9, 10, 13],
  },
  equinox: { keys: ['G', 'D', 'C', 'E', 'A'], noteCounts: [9, 10, 13] },
  mystic: { keys: ['D', 'C#', 'E', 'F', 'G', 'A'], noteCounts: [9, 10, 13] },
  'magic-voyage': {
    keys: ['D', 'E', 'F', 'G', 'A', 'C'],
    noteCounts: [9, 10, 13],
  },
  ionian: { keys: ['C', 'D', 'E', 'F', 'G', 'A'], noteCounts: [9, 10, 13] },
};

/** Canonical id for a family id that may be a merged-away name. */
export function resolveFamilyId(familyId: string): string {
  return MERGED_FAMILY_IDS[familyId] ?? familyId;
}

/** `F#` -> `fs`, matching how a preset id spells a key. */
export function keyToPresetIdSegment(key: string): string {
  return key.toLowerCase().replace('#', 's');
}

/**
 * Did this merged-away family actually publish this key and shell?
 *
 * Guards migration on both axes. The canonical family carries the *union* of
 * the merged families' keys, so migrating without this check let a key the
 * legacy family never had resolve anyway: Equinox published G, D, C, E and A,
 * but `equinox-fs-9` found `integral-fs-9` because Integral's union includes
 * F#. Turning a malformed or stale reference into a different instrument is
 * worse than returning nothing.
 */
export function legacyFamilyPublished(
  legacyFamilyId: string,
  key: string,
  noteCount: number
): boolean {
  const history = MERGED_FAMILY_HISTORY[legacyFamilyId];
  if (!history) {
    return false;
  }

  const keyMatches = history.keys.some(
    (published) => keyToPresetIdSegment(published) === keyToPresetIdSegment(key)
  );

  return keyMatches && history.noteCounts.includes(noteCount);
}

/**
 * Migrate a structured selection whose family was merged away.
 *
 * The sibling to `migrateLegacyPresetId`, for callers holding
 * `{ familyId, key, noteCount }` rather than a string id. Both paths must
 * migrate the same way: canonicalising only the family left
 * `{ ionian, D, 13 }` resolving to nothing, because Sabye offers 9 notes only.
 *
 * Returns the count to look up — the requested one where the canonical family
 * still offers it, otherwise that family's default — or null when the shell was
 * never published by the legacy family, so a nonsense count cannot resolve to a
 * real instrument.
 */
export function resolveLegacySelection(
  familyId: string,
  key: string,
  noteCount: number
): { familyId: string; noteCount: number } | null {
  const canonicalId = resolveFamilyId(familyId);
  const family = HANDPAN_FAMILIES.find((entry) => entry.id === canonicalId);
  if (!family) {
    return null;
  }

  // A family that was never merged resolves on its own terms.
  if (canonicalId === familyId) {
    return family.suggestedNoteCounts.includes(noteCount)
      ? { familyId: canonicalId, noteCount }
      : null;
  }

  // A merged family may only resolve a key and shell it actually published —
  // the canonical family's key union is wider than any one of them.
  if (!legacyFamilyPublished(familyId, key, noteCount)) {
    return null;
  }

  return {
    familyId: canonicalId,
    noteCount: family.suggestedNoteCounts.includes(noteCount)
      ? noteCount
      : (family.defaultNoteCount ?? family.suggestedNoteCounts[0]),
  };
}

/**
 * Rewrite a preset id whose family was merged away, e.g.
 * `equinox-e-9` -> `integral-e-9`. Returns null if nothing was rewritten.
 */
export function migrateLegacyPresetId(presetId: string): string | null {
  for (const [legacyId, canonicalId] of Object.entries(MERGED_FAMILY_IDS)) {
    const prefix = `${legacyId}-`;
    if (presetId.startsWith(prefix)) {
      return `${canonicalId}-${presetId.slice(prefix.length)}`;
    }
  }
  return null;
}

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
  const canonicalId = resolveFamilyId(id);
  return HANDPAN_FAMILIES.find((family) => family.id === canonicalId);
}

export function getAllHandpanFamilies(): HandpanScaleFamilyTemplate[] {
  return HANDPAN_FAMILIES;
}
