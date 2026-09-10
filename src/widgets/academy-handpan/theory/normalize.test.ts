import { describe, it, expect } from 'vitest';
import {
  parseNote,
  normalizeToPitchClass,
  getPitchClassSet,
  hasPitchClass,
} from './normalize';

describe('normalize', () => {
  describe('parseNote', () => {
    it('should parse note with octave', () => {
      const result = parseNote('C4');
      expect(result.pitchClass).toBe('C');
      expect(result.octave).toBe(4);
    });

    it('should parse note with sharp', () => {
      const result = parseNote('C#4');
      expect(result.pitchClass).toBe('C#');
      expect(result.octave).toBe(4);
    });

    it('should parse note with flat', () => {
      const result = parseNote('Bb4');
      expect(result.pitchClass).toBe('Bb');
      expect(result.octave).toBe(4);
    });

    it('should parse note without octave', () => {
      const result = parseNote('C');
      expect(result.pitchClass).toBe('C');
      expect(result.octave).toBeNull();
    });

    it('should throw for invalid note', () => {
      expect(() => parseNote('invalid')).toThrow();
    });
  });

  describe('normalizeToPitchClass', () => {
    it('should normalize note with octave to pitch class', () => {
      expect(normalizeToPitchClass('C4')).toBe('C');
      expect(normalizeToPitchClass('C#5')).toBe('C#');
      expect(normalizeToPitchClass('Bb3')).toBe('Bb');
    });

    it('should normalize note without octave', () => {
      expect(normalizeToPitchClass('C')).toBe('C');
      expect(normalizeToPitchClass('D#')).toBe('Eb');
      expect(normalizeToPitchClass('A#')).toBe('Bb');
      expect(normalizeToPitchClass('G#')).toBe('Ab');
      expect(normalizeToPitchClass('C#')).toBe('C#');
      expect(normalizeToPitchClass('F#')).toBe('F#');
    });

    /**
     * This previously asserted that C# and Db canonicalise to *different*
     * strings — the opposite of what its name promises, and the defect that
     * made chord subset matching disagree with itself across keys.
     */
    it('should handle enharmonic equivalents', () => {
      expect(normalizeToPitchClass('C#')).toBe(normalizeToPitchClass('Db'));
      expect(normalizeToPitchClass('Gb')).toBe(normalizeToPitchClass('F#'));
    });
  });

  describe('getPitchClassSet', () => {
    it('should create set of unique pitch classes', () => {
      const notes = ['C4', 'C5', 'D4', 'E4', 'C#4'];
      const result = getPitchClassSet(notes);
      expect(result.size).toBe(4);
      expect(result.has('C')).toBe(true);
      expect(result.has('D')).toBe(true);
      expect(result.has('E')).toBe(true);
      expect(result.has('C#')).toBe(true);
    });

    it('should handle empty array', () => {
      const result = getPitchClassSet([]);
      expect(result.size).toBe(0);
    });
  });

  describe('hasPitchClass', () => {
    it('should return true if note has matching pitch class', () => {
      expect(hasPitchClass('C4', 'C')).toBe(true);
      expect(hasPitchClass('C#5', 'C#')).toBe(true);
      expect(hasPitchClass('Bb3', 'Bb')).toBe(true);
    });

    it('should return false if pitch classes do not match', () => {
      expect(hasPitchClass('C4', 'D')).toBe(false);
      expect(hasPitchClass('C#4', 'C')).toBe(false);
    });
  });
});

/**
 * Canonicalisation must be total.
 *
 * `normalizeToPitchClass` mapped A#/D#/G# to flats but left C#/F# as sharps and
 * did nothing at all for Db/Gb/Cb/E#. Two spellings of one pitch therefore
 * canonicalised to two different strings, and every set comparison built on it
 * — chord subset matching above all — silently disagreed with itself.
 *
 * Concretely: Tonal returns Ab7sus4 as Ab/Db/Eb/Gb. A C# Kurd holds those exact
 * pitches spelled C#/D#/F#. The subset check failed and the chord disappeared
 * from that key while remaining available in D.
 */
describe('normalizeToPitchClass is total', () => {
  const ENHARMONIC_PAIRS: Array<[string, string]> = [
    ['C#', 'Db'],
    ['D#', 'Eb'],
    ['F#', 'Gb'],
    ['G#', 'Ab'],
    ['A#', 'Bb'],
    ['E#', 'F'],
    ['B#', 'C'],
    ['Cb', 'B'],
    ['Fb', 'E'],
  ];

  it('maps both spellings of a pitch to the same canonical name', () => {
    for (const [sharp, flat] of ENHARMONIC_PAIRS) {
      expect(normalizeToPitchClass(`${sharp}4`), `${sharp} vs ${flat}`).toBe(
        normalizeToPitchClass(`${flat}4`)
      );
    }
  });

  it('ignores octave', () => {
    expect(normalizeToPitchClass('Gb2')).toBe(normalizeToPitchClass('F#7'));
  });

  it('yields exactly twelve canonical names across the chromatic scale', () => {
    const names = new Set(
      ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map(
        (pc) => normalizeToPitchClass(`${pc}4`)
      )
    );
    expect(names.size).toBe(12);
  });
});
