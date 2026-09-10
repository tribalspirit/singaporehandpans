import { describe, it, expect } from 'vitest';
import {
  buildHandpanConfigFromFamily,
  getHandpanFamilyById,
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
});
