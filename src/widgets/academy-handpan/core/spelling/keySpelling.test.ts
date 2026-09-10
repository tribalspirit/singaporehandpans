import { describe, it, expect } from 'vitest';
import { spellIntervalFromTonic, pitchClassOf } from './keySpelling';

const NATURAL_MINOR = [0, 2, 3, 5, 7, 8, 10];
const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const HARMONIC_MINOR = [0, 2, 3, 5, 7, 8, 11];
const HIJAZ = [0, 1, 4, 5, 7, 8, 10];

function spellScale(tonic: string, intervals: number[]): string[] {
  return intervals.map((i) => spellIntervalFromTonic(tonic, i));
}

describe('keySpelling', () => {
  describe('spells each scale with one letter per degree', () => {
    it('D natural minor uses Bb, not A#', () => {
      expect(spellScale('D', NATURAL_MINOR)).toEqual([
        'D',
        'E',
        'F',
        'G',
        'A',
        'Bb',
        'C',
      ]);
    });

    /** The original defect: a fixed table spelled these Ab and Eb. */
    it('C# natural minor uses G# and D#, not Ab and Eb', () => {
      expect(spellScale('C#', NATURAL_MINOR)).toEqual([
        'C#',
        'D#',
        'E',
        'F#',
        'G#',
        'A',
        'B',
      ]);
    });

    it('F# natural minor stays in sharps', () => {
      expect(spellScale('F#', NATURAL_MINOR)).toEqual([
        'F#',
        'G#',
        'A',
        'B',
        'C#',
        'D',
        'E',
      ]);
    });

    it('C natural minor stays in flats', () => {
      expect(spellScale('C', NATURAL_MINOR)).toEqual([
        'C',
        'D',
        'Eb',
        'F',
        'G',
        'Ab',
        'Bb',
      ]);
    });

    it('F natural minor stays in flats', () => {
      expect(spellScale('F', NATURAL_MINOR)).toEqual([
        'F',
        'G',
        'Ab',
        'Bb',
        'C',
        'Db',
        'Eb',
      ]);
    });

    it('C major is all naturals', () => {
      expect(spellScale('C', MAJOR)).toEqual([
        'C',
        'D',
        'E',
        'F',
        'G',
        'A',
        'B',
      ]);
    });

    /**
     * A flat-or-sharp preference keyed on the tonic cannot get this right:
     * A minor is a neutral key, but its raised 7th must still be G#.
     */
    it('A harmonic minor raises the 7th to G#, not Ab', () => {
      expect(spellScale('A', HARMONIC_MINOR)).toEqual([
        'A',
        'B',
        'C',
        'D',
        'E',
        'F',
        'G#',
      ]);
    });

    it('D Hijaz spells the augmented 2nd as Eb and F#', () => {
      expect(spellScale('D', HIJAZ)).toEqual([
        'D',
        'Eb',
        'F#',
        'G',
        'A',
        'Bb',
        'C',
      ]);
    });
  });

  describe('pitch identity is preserved regardless of spelling', () => {
    const TONICS = ['C', 'C#', 'D', 'E', 'F', 'F#', 'G', 'A', 'B'];

    it('spelled note always sounds the requested pitch class', () => {
      for (const tonic of TONICS) {
        for (let semitones = 0; semitones < 12; semitones += 1) {
          const spelled = spellIntervalFromTonic(tonic, semitones);
          const expected = (pitchClassOf(tonic) + semitones) % 12;

          expect(pitchClassOf(spelled), `${tonic} +${semitones}`).toBe(
            expected
          );
        }
      }
    });

    it('never emits a triple accidental', () => {
      for (const tonic of TONICS) {
        for (let semitones = 0; semitones < 12; semitones += 1) {
          const spelled = spellIntervalFromTonic(tonic, semitones);
          expect(
            spelled.length,
            `${tonic} +${semitones} => ${spelled}`
          ).toBeLessThanOrEqual(3);
        }
      }
    });

    it('is stable across octave-equivalent intervals', () => {
      expect(spellIntervalFromTonic('C#', 3)).toBe(
        spellIntervalFromTonic('C#', 15)
      );
    });
  });
});
