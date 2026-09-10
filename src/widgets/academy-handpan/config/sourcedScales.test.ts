import { describe, it, expect } from 'vitest';
import {
  buildHandpanConfigFromFamily,
  getHandpanFamilyById,
  HANDPAN_FAMILIES,
} from './handpanFamilies';

/**
 * Golden fixtures tying corrected families back to what makers actually publish.
 *
 * Each expectation below is a note list printed on a maker's own scale page,
 * transposed only in octave. If a future edit drifts these interval sets again,
 * these tests name the source it would be contradicting.
 *
 * Sources retrieved 2026-09-10.
 */

function notesFor(familyId: string, key: string, noteCount: number): string[] {
  const family = getHandpanFamilyById(familyId);
  if (!family) throw new Error(`missing family ${familyId}`);
  return buildHandpanConfigFromFamily(
    family,
    key as Parameters<typeof buildHandpanConfigFromFamily>[1],
    noteCount
  ).notes;
}

/** Pitch classes in sounding order, so octave placement is not asserted here. */
function pitchClasses(notes: string[]): string[] {
  return notes.map((note) => note.replace(/\d+$/, ''));
}

describe('sourced scale fixtures', () => {
  describe('Pygmy', () => {
    /** Isthmus Instruments: "A2 Pygmy: A2 / E A B C E G A B" */
    it('matches the Isthmus A Pygmy 9 listing', () => {
      expect(pitchClasses(notesFor('pygmy', 'A', 9))).toEqual([
        'A',
        'E',
        'A',
        'B',
        'C',
        'E',
        'G',
        'A',
        'B',
      ]);
    });

    /** Root, major 2nd, minor 3rd, 5th, minor 7th — and no 4th. */
    it('has a major 2nd and no perfect 4th', () => {
      const classes = new Set(pitchClasses(notesFor('pygmy', 'F', 13)));
      expect(classes).toContain('G'); // major 2nd above F
      expect(classes).not.toContain('Bb'); // perfect 4th above F
    });
  });

  describe('Equinox', () => {
    /** Saraz: "E/ G, B, C, D, E, F#, G, B" (page title "E Equinox Minor") */
    it('matches the Saraz E Equinox 9 listing', () => {
      expect(notesFor('equinox', 'E', 9)).toEqual([
        'E3',
        'G3',
        'B3',
        'C4',
        'D4',
        'E4',
        'F#4',
        'G4',
        'B4',
      ]);
    });

    /** Minor hexatonic: minor 3rd, and the 4th removed. */
    it('has a minor 3rd and no perfect 4th', () => {
      const classes = new Set(pitchClasses(notesFor('equinox', 'E', 13)));
      expect(classes).toContain('G'); // minor 3rd above E
      expect(classes).not.toContain('G#'); // would be a major 3rd
      expect(classes).not.toContain('A'); // perfect 4th above E
    });
  });

  describe('Akebono', () => {
    /** Isthmus: "F#/ B C# D F# G B C# D" */
    it('matches the Isthmus F# Akebono 9 listing', () => {
      expect(notesFor('akebono', 'F#', 9)).toEqual([
        'F#3',
        'B3',
        'C#4',
        'D4',
        'F#4',
        'G4',
        'B4',
        'C#5',
        'D5',
      ]);
    });

    /** HaganeNote: "D/ G A Bb D Eb G A Bb" */
    it('matches the HaganeNote D Akebono listing', () => {
      expect(notesFor('akebono', 'D', 9)).toEqual([
        'D3',
        'G3',
        'A3',
        'Bb3',
        'D4',
        'Eb4',
        'G4',
        'A4',
        'Bb4',
      ]);
    });

    /** HaganeNote: "(F3), Bb3, C4, Db4, F4, Gb4, Bb4, C5, Db5" */
    it('matches the HaganeNote F Akebono listing, flats and all', () => {
      expect(notesFor('akebono', 'F', 9)).toEqual([
        'F3',
        'Bb3',
        'C4',
        'Db4',
        'F4',
        'Gb4',
        'Bb4',
        'C5',
        'Db5',
      ]);
    });

    /** HaganeNote: "E/ A B C E F A B C" */
    it('matches the HaganeNote E Akebono listing', () => {
      expect(pitchClasses(notesFor('akebono', 'E', 9))).toEqual([
        'E',
        'A',
        'B',
        'C',
        'E',
        'F',
        'A',
        'B',
        'C',
      ]);
    });

    /**
     * The ding is the root, as every handpan maker states. The 4th above it is
     * the tonal centre, which is a separate idea and deliberately not encoded
     * as the tonic — doing so would name the instrument something no maker
     * sells.
     */
    it('roots the scale on the ding, not on the 4th above it', () => {
      const notes = notesFor('akebono', 'F#', 9);
      expect(notes[0]).toBe('F#3');

      const classes = new Set(pitchClasses(notes));
      expect(classes).toContain('G'); // flat 2nd above the ding
      expect(classes).toContain('B'); // the 4th, its tonal centre
      expect(classes).not.toContain('A'); // no natural 2nd - not Hirajoshi-from-F#
    });
  });

  describe('Aegean', () => {
    /** Isthmus: "C Aegean: C / E G B C E F# G B" */
    it('matches the Isthmus C Aegean 9 listing', () => {
      expect(notesFor('aegean', 'C', 9)).toEqual([
        'C3',
        'E3',
        'G3',
        'B3',
        'C4',
        'E4',
        'F#4',
        'G4',
        'B4',
      ]);
    });

    /** Milosc i Spokoj: "D3 | F#3, A3, C#4, D4, F#4, G#4, A4, C#5, D5" */
    it('matches the Milosc i Spokoj D Aegean 10 listing', () => {
      expect(notesFor('aegean', 'D', 10)).toEqual([
        'D3',
        'F#3',
        'A3',
        'C#4',
        'D4',
        'F#4',
        'G#4',
        'A4',
        'C#5',
        'D5',
      ]);
    });

    /**
     * The set it previously shipped, {0,2,4,7,9}, was a major pentatonic with
     * no sharp 4th and no major 7th. Guard both notes that define the real one.
     */
    it('has the sharp 4th and major 7th the old data lacked', () => {
      const classes = new Set(pitchClasses(notesFor('aegean', 'C', 9)));
      expect(classes).toContain('F#'); // sharp 4th
      expect(classes).toContain('B'); // major 7th
      expect(classes).not.toContain('D'); // the old set's 2nd
    });
  });

  describe('Sabye', () => {
    /** Saraz: "E/ A, B, C#, D#, E, F#, G#, B" */
    it('matches the Saraz E Sabye listing', () => {
      expect(notesFor('sabye', 'E', 9)).toEqual([
        'E3',
        'A3',
        'B3',
        'C#4',
        'D#4',
        'E4',
        'F#4',
        'G#4',
        'B4',
      ]);
    });

    /** HaganeNote: "D/ G A B C# D E F# A" — and Isthmus, as Ashakiran */
    it('matches the HaganeNote D Sabye listing', () => {
      expect(pitchClasses(notesFor('sabye', 'D', 9))).toEqual([
        'D',
        'G',
        'A',
        'B',
        'C#',
        'D',
        'E',
        'F#',
        'A',
      ]);
    });

    it('is the complete diatonic set', () => {
      const classes = new Set(pitchClasses(notesFor('sabye', 'D', 9)));
      expect(classes.size).toBe(7);
    });
  });

  describe('Golden Gate', () => {
    /** Isthmus: "C3 / E3 G3 B3 C4 D4 F#4 G4" */
    it('matches the Isthmus C Golden Gate 8 listing', () => {
      expect(notesFor('golden-gate', 'C', 8)).toEqual([
        'C3',
        'E3',
        'G3',
        'B3',
        'C4',
        'D4',
        'F#4',
        'G4',
      ]);
    });

    /** Aegean plus the 2nd — the one interval that separates them. */
    it('is Aegean with the 2nd added', () => {
      const goldenGate = new Set(pitchClasses(notesFor('golden-gate', 'C', 8)));
      const aegean = new Set(pitchClasses(notesFor('aegean', 'C', 9)));

      expect(goldenGate).toContain('D');
      expect(aegean).not.toContain('D');
      for (const pitchClass of aegean) {
        expect(goldenGate, `aegean ${pitchClass} missing`).toContain(
          pitchClass
        );
      }
    });
  });
});

/**
 * Every shipped family's interval set must match a maker-published note list.
 *
 * The table below is transcribed from docs/features/handpan-data-audit.md.
 * Checking it mechanically is the point: the first pass of that document listed
 * Ursa Minor's *sourced* set in the row where its *shipped* set belonged, which
 * hid a real mismatch from a human reading the table. A test cannot skim.
 *
 * A family with no entry here fails rather than passing silently, so a new
 * family cannot be added without recording where its notes come from.
 */
const SOURCED_PITCH_CLASS_SETS: Record<string, number[]> = {
  kurd: [0, 2, 3, 5, 7, 8, 10],
  'celtic-minor': [0, 2, 3, 5, 7, 10],
  integral: [0, 2, 3, 7, 8, 10],
  pygmy: [0, 2, 3, 7, 10],
  'la-sirena': [0, 2, 3, 7, 9, 10],
  akebono: [0, 1, 5, 7, 8],
  aegean: [0, 4, 6, 7, 11],
  sabye: [0, 2, 4, 5, 7, 9, 11],
  'golden-gate': [0, 2, 4, 6, 7, 11],
  // Oxalis is measured from the tone-circle root, not the ding — see §2.4.
  oxalis: [0, 2, 4, 7, 9, 11],
  hijaz: [0, 1, 4, 5, 7, 8, 10],
  'harmonic-minor': [0, 2, 3, 5, 7, 8, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
};

function normalizeSet(intervals: number[]): number[] {
  return [...new Set(intervals.map((i) => ((i % 12) + 12) % 12))].sort(
    (a, b) => a - b
  );
}

describe('every shipped family matches its source', () => {
  it('ships no interval set that a maker does not publish', () => {
    const mismatched: string[] = [];

    for (const family of HANDPAN_FAMILIES) {
      const sourced = SOURCED_PITCH_CLASS_SETS[family.id];

      if (!sourced) {
        mismatched.push(`${family.id}: no sourced set recorded`);
        continue;
      }

      const shipped = normalizeSet(family.intervalsPcSemitones ?? []);
      if (shipped.join(',') !== normalizeSet(sourced).join(',')) {
        mismatched.push(
          `${family.id}: ships {${shipped}}, sourced {${normalizeSet(sourced)}}`
        );
      }
    }

    expect(mismatched).toEqual([]);
  });

  it('records a source for every family it ships, and no more', () => {
    const shippedIds = HANDPAN_FAMILIES.map((family) => family.id).sort();
    expect(Object.keys(SOURCED_PITCH_CLASS_SETS).sort()).toEqual(shippedIds);
  });
});
