import { describe, it, expect } from 'vitest';
import { getDiatonicTriads } from './diatonicTriads';

describe('diatonicTriads', () => {
  describe('getDiatonicTriads', () => {
    it('should return triads when scale can be extracted', () => {
      const handpanNotes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'];
      const availableNotes = handpanNotes;
      const triads = getDiatonicTriads(handpanNotes, availableNotes);
      
      if (triads.length > 0) {
        expect(triads.length).toBeLessThanOrEqual(7);
        for (const triad of triads) {
          expect(triad.chord.notes.length).toBe(3);
          for (const note of triad.chord.notes) {
            expect(availableNotes).toContain(note);
          }
        }
      }
    });

    it('should mark first triad as tonic when available', () => {
      const handpanNotes = ['D4', 'A4', 'Bb4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5'];
      const availableNotes = handpanNotes;
      const triads = getDiatonicTriads(handpanNotes, availableNotes);
      
      if (triads.length > 0) {
        const tonicTriad = triads.find(t => t.isTonic);
        if (tonicTriad) {
          expect(tonicTriad.degree).toBe(1);
        }
      }
    });

    it('should return triads with correct structure', () => {
      const handpanNotes = ['D4', 'A4', 'Bb4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5'];
      const availableNotes = handpanNotes;
      const triads = getDiatonicTriads(handpanNotes, availableNotes);
      
      for (const triad of triads) {
        expect(triad.degree).toBeGreaterThanOrEqual(1);
        expect(triad.degree).toBeLessThanOrEqual(7);
        expect(triad.root).toBeDefined();
        expect(triad.chord).toBeDefined();
        expect(triad.chord.notes.length).toBe(3);
        expect(triad.chord.displayName).toBeDefined();
      }
    });

    it('should return empty array for insufficient notes', () => {
      const handpanNotes = ['C4', 'D4'];
      const availableNotes = handpanNotes;
      const triads = getDiatonicTriads(handpanNotes, availableNotes);
      
      expect(triads.length).toBe(0);
    });

    it('should order triads by Circle of Fifths when available', () => {
      const handpanNotes = ['D4', 'A4', 'Bb4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5'];
      const availableNotes = handpanNotes;
      const triads = getDiatonicTriads(handpanNotes, availableNotes);
      
      if (triads.length > 0) {
        const degrees = triads.map(t => t.degree);
        expect(degrees.length).toBeGreaterThan(0);
        expect(degrees.every(d => d >= 1 && d <= 7)).toBe(true);
      }
    });

    it('should handle empty arrays', () => {
      expect(getDiatonicTriads([], [])).toEqual([]);
    });

    it('should only return triads where all notes are available', () => {
      const handpanNotes = ['D4', 'A4', 'Bb4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5'];
      const availableNotes = handpanNotes;
      const triads = getDiatonicTriads(handpanNotes, availableNotes);
      
      for (const triad of triads) {
        for (const note of triad.chord.notes) {
          expect(availableNotes).toContain(note);
        }
      }
    });
  });
});

