import { describe, it, expect } from 'vitest';
import { parseNote, normalizeToPitchClass, getPitchClassSet, hasPitchClass } from './normalize';

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
      expect(normalizeToPitchClass('D#')).toBe('D#');
    });

    it('should handle enharmonic equivalents', () => {
      expect(normalizeToPitchClass('C#')).toBe('C#');
      expect(normalizeToPitchClass('Db')).toBe('Db');
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

