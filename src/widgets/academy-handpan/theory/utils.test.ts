import { describe, it, expect } from 'vitest';
import { assignOctavesToPitchClasses, sortNotesByPitch, deduplicateNotes } from './utils';

describe('utils', () => {
  describe('assignOctavesToPitchClasses', () => {
    it('should assign octaves from available notes', () => {
      const pitchClasses = ['C', 'E', 'G'];
      const availableNotes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4'];
      const result = assignOctavesToPitchClasses(pitchClasses, availableNotes);
      expect(result).toEqual(['C4', 'E4', 'G4']);
    });

    it('should use lowest available octave', () => {
      const pitchClasses = ['C'];
      const availableNotes = ['C3', 'C4', 'C5'];
      const result = assignOctavesToPitchClasses(pitchClasses, availableNotes);
      expect(result).toEqual(['C3']);
    });

    it('should skip missing pitch classes', () => {
      const pitchClasses = ['C', 'X', 'E'];
      const availableNotes = ['C4', 'E4'];
      const result = assignOctavesToPitchClasses(pitchClasses, availableNotes);
      expect(result).toEqual(['C4', 'E4']);
    });

    it('should handle empty pitch classes', () => {
      expect(assignOctavesToPitchClasses([], ['C4'])).toEqual([]);
    });

    it('should handle empty available notes', () => {
      expect(assignOctavesToPitchClasses(['C'], [])).toEqual([]);
    });
  });

  describe('sortNotesByPitch', () => {
    it('should sort notes by pitch ascending', () => {
      const notes = ['C5', 'A4', 'F4', 'D4'];
      const sorted = sortNotesByPitch(notes);
      expect(sorted).toEqual(['D4', 'F4', 'A4', 'C5']);
    });

    it('should handle notes with sharps and flats', () => {
      const notes = ['C#4', 'Bb4', 'A4'];
      const sorted = sortNotesByPitch(notes);
      expect(sorted[0]).toBe('C#4');
      expect(sorted[sorted.length - 1]).toBe('Bb4');
    });

    it('should handle empty array', () => {
      expect(sortNotesByPitch([])).toEqual([]);
    });

    it('should handle single note', () => {
      expect(sortNotesByPitch(['C4'])).toEqual(['C4']);
    });
  });

  describe('deduplicateNotes', () => {
    it('should remove duplicate notes', () => {
      const notes = ['C4', 'D4', 'C4', 'E4', 'D4'];
      const deduplicated = deduplicateNotes(notes);
      expect(deduplicated).toEqual(['C4', 'D4', 'E4']);
    });

    it('should preserve first occurrence', () => {
      const notes = ['C4', 'C4', 'C4'];
      const deduplicated = deduplicateNotes(notes);
      expect(deduplicated).toEqual(['C4']);
    });

    it('should handle empty array', () => {
      expect(deduplicateNotes([])).toEqual([]);
    });

    it('should handle array with no duplicates', () => {
      const notes = ['C4', 'D4', 'E4'];
      expect(deduplicateNotes(notes)).toEqual(notes);
    });
  });
});

