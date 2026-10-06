import { describe, it, expect } from 'vitest';
import { note as parseTonalNote } from '@tonaljs/core';
import {
  buildHandpanConfigFromFamily,
  getHandpanFamilyById,
  HANDPAN_FAMILIES,
} from './handpanFamilies';

function noteToMidiForTest(noteName: string): number {
  const midi = parseTonalNote(noteName).midi;
  if (midi === null || midi === undefined) {
    throw new Error(`cannot read midi for ${noteName}`);
  }
  return midi;
}

describe('handpanFamilies', () => {
  describe('D Kurd 9 regression test', () => {
    it('should generate D Kurd 9 with exact note list including D4', () => {
      const kurdFamily = getHandpanFamilyById('kurd');
      expect(kurdFamily).toBeDefined();

      if (!kurdFamily) return;

      const config = buildHandpanConfigFromFamily(kurdFamily, 'D', 9);

      expect(config.notes).toEqual([
        'D3',
        'A3',
        'Bb3',
        'C4',
        'D4',
        'E4',
        'F4',
        'G4',
        'A4',
      ]);
    });

    it('should generate D Kurd 10 with C4 and C5', () => {
      const kurdFamily = getHandpanFamilyById('kurd');
      expect(kurdFamily).toBeDefined();

      if (!kurdFamily) return;

      const config = buildHandpanConfigFromFamily(kurdFamily, 'D', 10);

      expect(config.notes).toContain('C4');
      expect(config.notes).toContain('C5');
      expect(config.notes).toHaveLength(10);
    });

    it('should generate D Kurd 9 with all scale degrees present', () => {
      const kurdFamily = getHandpanFamilyById('kurd');
      expect(kurdFamily).toBeDefined();

      if (!kurdFamily) return;

      const config = buildHandpanConfigFromFamily(kurdFamily, 'D', 9);

      const pitchClasses = config.notes.map((note) => note.replace(/\d+$/, ''));

      expect(pitchClasses).toContain('D');
      expect(pitchClasses).toContain('E');
      expect(pitchClasses).toContain('F');
      expect(pitchClasses).toContain('G');
      expect(pitchClasses).toContain('A');
      expect(pitchClasses).toContain('Bb');
      expect(pitchClasses).toContain('C');
    });
  });

  describe('orderedRingIntervalsByNoteCount validation', () => {
    it('should reject missing ring intervals for requested note count', () => {
      const kurdFamily = getHandpanFamilyById('kurd');
      expect(kurdFamily).toBeDefined();

      if (!kurdFamily) return;

      expect(() => {
        buildHandpanConfigFromFamily(kurdFamily, 'D', 99);
      }).toThrow('Missing orderedRingIntervalsByNoteCount');
    });

    it('should reject invalid ring intervals length', () => {
      const invalidFamily = {
        id: 'test',
        name: 'Test',
        description: 'Test family',
        modeHint: 'minor' as const,
        orderedRingIntervalsByNoteCount: {
          9: [7, 8, 10],
        },
        suggestedNoteCounts: [9],
        supportedKeys: ['D' as const],
        defaultKey: 'D' as const,
        defaultNoteCount: 9,
      };

      expect(() => {
        buildHandpanConfigFromFamily(invalidFamily, 'D', 9);
      }).toThrow('Invalid ring intervals length');
    });
  });

  describe('transposition', () => {
    it('should correctly transpose Kurd to different keys', () => {
      const kurdFamily = getHandpanFamilyById('kurd');
      expect(kurdFamily).toBeDefined();

      if (!kurdFamily) return;

      const configE = buildHandpanConfigFromFamily(kurdFamily, 'E', 9);
      expect(configE.notes[0]).toBe('E3');
      expect(configE.notes).toHaveLength(9);

      /**
       * A dings at octave 2, not 3.
       *
       * This assertion previously expected A3, which encoded the old flat
       * `DING_OCTAVE = 3`. No maker sells an A3-ding handpan: every A-ding
       * listing found across Saraz, Isthmus, Shaktipan and Pures Music is A2.
       */
      const configA = buildHandpanConfigFromFamily(kurdFamily, 'A', 9);
      expect(configA.notes[0]).toBe('A2');
      expect(configA.notes).toHaveLength(9);
    });

    it('keeps the ding inside the range makers actually build', () => {
      // Observed across maker listings: F2 at the low end, G3 at the high end.
      const LOWEST_DING_MIDI = 41; // F2
      const HIGHEST_DING_MIDI = 55; // G3

      for (const family of HANDPAN_FAMILIES) {
        for (const key of family.supportedKeys) {
          const config = buildHandpanConfigFromFamily(
            family,
            key,
            family.suggestedNoteCounts[0]
          );
          const midi = noteToMidiForTest(config.notes[0]);

          expect(
            midi,
            `${family.id} ${key} ding ${config.notes[0]}`
          ).toBeGreaterThanOrEqual(LOWEST_DING_MIDI);
          expect(
            midi,
            `${family.id} ${key} ding ${config.notes[0]}`
          ).toBeLessThanOrEqual(HIGHEST_DING_MIDI);
        }
      }
    });
  });

  describe('note ordering', () => {
    it('should generate ascending notes (each note higher than previous)', () => {
      const kurdFamily = getHandpanFamilyById('kurd');
      expect(kurdFamily).toBeDefined();

      if (!kurdFamily) return;

      const config = buildHandpanConfigFromFamily(kurdFamily, 'D', 9);

      const midiValues = config.notes.map((note) => {
        const match = note.match(/^([A-G](?:#|b)?)(\d+)$/);
        if (!match) throw new Error(`Invalid note: ${note}`);

        const [, pc, octaveStr] = match;
        const octave = parseInt(octaveStr, 10);

        const semitones: Record<string, number> = {
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

        return semitones[pc] + octave * 12;
      });

      for (let i = 1; i < midiValues.length; i++) {
        expect(midiValues[i]).toBeGreaterThan(midiValues[i - 1]);
      }
    });
  });
});

/**
 * Consistency guard between a family's two interval representations.
 *
 * `orderedRingIntervalsByNoteCount` drives note generation; `intervalsPcSemitones`
 * declares the pitch-class set the family claims to be. Nothing previously kept
 * them in agreement — the pitch-class field was only read by a fallback
 * generator that no family ever reached, so it could drift silently.
 *
 * Smaller shells legitimately omit notes (Magic Voyage's 9- and 10-note rings
 * drop the 6th and are hexatonic in practice), so a reduced variant is allowed.
 * What is never allowed is a ring sounding a pitch class the family does not
 * declare, or a declared pitch class that no variant ever uses.
 */
describe('family interval representations agree', () => {
  const toPitchClass = (semitone: number) => ((semitone % 12) + 12) % 12;

  for (const family of HANDPAN_FAMILIES) {
    const declared = family.intervalsPcSemitones;
    if (!declared) continue;

    const declaredSet = new Set(declared.map(toPitchClass));

    it(`${family.id}: no variant sounds an undeclared pitch class`, () => {
      for (const noteCount of family.suggestedNoteCounts) {
        const ring = family.orderedRingIntervalsByNoteCount?.[noteCount];
        expect(ring, `${family.id} noteCount=${noteCount}`).toBeDefined();

        for (const interval of ring ?? []) {
          expect(
            declaredSet.has(toPitchClass(interval)),
            `${family.id} noteCount=${noteCount} sounds undeclared pitch class ${toPitchClass(interval)}`
          ).toBe(true);
        }
      }
    });

    it(`${family.id}: its largest variant spans the full declared set`, () => {
      const largest = Math.max(...family.suggestedNoteCounts);
      const ring = family.orderedRingIntervalsByNoteCount?.[largest] ?? [];
      const spanned = new Set([0, ...ring.map(toPitchClass)]);

      expect(
        [...spanned].sort((a, b) => a - b),
        `${family.id} noteCount=${largest}`
      ).toEqual([...declaredSet].sort((a, b) => a - b));
    });
  }
});

/**
 * Guards on the copy a player actually reads.
 *
 * The mood tag row used to render `[modeHint]`, so every scale in the catalog
 * showed exactly one chip reading "minor" or "exotic" — an internal enum leaking
 * into the UI as what looked like a broken filter. These assertions stop that
 * regressing, and stop the descriptions sliding back into data-structure talk
 * ("ring order", "layout repeats") that describes the config rather than the
 * instrument.
 */
describe('player-facing scale copy', () => {
  const MODE_HINTS = ['minor', 'major', 'mixed', 'exotic', 'versatile'];
  const IMPLEMENTATION_PHRASES = [
    'ring order',
    'layout repeats',
    'note-count',
    'noteCount',
  ];

  for (const family of HANDPAN_FAMILIES) {
    it(`${family.id}: declares three or four mood words`, () => {
      expect(family.moodTags, `${family.id} has no moodTags`).toBeDefined();
      expect(family.moodTags?.length).toBeGreaterThanOrEqual(3);
      expect(family.moodTags?.length).toBeLessThanOrEqual(4);
    });

    it(`${family.id}: mood words are not the derived mode hint`, () => {
      const tags = family.moodTags ?? [];

      expect(
        tags,
        `${family.id} still carries the derived mode-hint tag row`
      ).not.toEqual([family.modeHint]);

      // "Exotic" is a fair word for Hijaz even though it doubles as a mode
      // hint, so the guard is that the row cannot read as an enum dump — at
      // least one word has to be something a player would say.
      expect(
        tags.some((tag) => !MODE_HINTS.includes(tag.toLowerCase())),
        `${family.id} mood words are all mode-hint vocabulary`
      ).toBe(true);

      for (const tag of tags) {
        // Sentence case, because these render as chips rather than prose.
        expect(tag[0]).toBe(tag[0].toUpperCase());
      }
    });

    it(`${family.id}: description is written about the instrument`, () => {
      const lowered = family.description.toLowerCase();
      for (const phrase of IMPLEMENTATION_PHRASES) {
        expect(
          lowered.includes(phrase.toLowerCase()),
          `${family.id} description mentions implementation detail "${phrase}"`
        ).toBe(false);
      }
    });
  }

  it('surfaces the family mood words on the built config', () => {
    const kurd = getHandpanFamilyById('kurd');
    expect(kurd?.moodTags).toBeDefined();

    if (!kurd) return;

    const config = buildHandpanConfigFromFamily(kurd, 'D', 9);
    expect(config.scaleMoodTags).toEqual(kurd.moodTags);
  });

  it('never hands out the family template array itself', () => {
    const kurd = getHandpanFamilyById('kurd');
    expect(kurd).toBeDefined();

    if (!kurd) return;

    const config = buildHandpanConfigFromFamily(kurd, 'D', 9);
    expect(config.scaleMoodTags).not.toBe(kurd.moodTags);
  });

  it('falls back to the mode hint when a family declares no mood words', () => {
    const familyWithoutMoodTags = {
      id: 'test-no-moods',
      name: 'Test',
      description: 'Test family',
      modeHint: 'minor' as const,
      orderedRingIntervalsByNoteCount: {
        9: [7, 8, 10, 0, 2, 3, 5, 7],
      },
      suggestedNoteCounts: [9],
      supportedKeys: ['D' as const],
      defaultKey: 'D' as const,
      defaultNoteCount: 9,
    };

    const config = buildHandpanConfigFromFamily(familyWithoutMoodTags, 'D', 9);
    expect(config.scaleMoodTags).toEqual(['minor']);
  });
});
