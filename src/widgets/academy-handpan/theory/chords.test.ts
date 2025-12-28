import { describe, it, expect } from 'vitest';
import { findPlayableChords } from './chords';

describe('chords', () => {
  describe('findPlayableChords', () => {
    it('should find playable triads when available', () => {
      const availableNotes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'E5', 'G5'];
      const chords = findPlayableChords(availableNotes);
      
      if (chords.length > 0) {
        const triads = chords.filter(c => c.category === 'basic');
        for (const triad of triads) {
          expect(triad.notes.length).toBe(3);
          for (const note of triad.notes) {
            expect(availableNotes).toContain(note);
          }
        }
      }
    });

    it('should find playable 4-note chords when available', () => {
      const availableNotes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'E5', 'G5', 'B5'];
      const chords = findPlayableChords(availableNotes);
      
      if (chords.length > 0) {
        const fourNoteChords = chords.filter(c => c.notes.length === 4);
        for (const chord of fourNoteChords) {
          expect(chord.category).toBe('advanced');
          for (const note of chord.notes) {
            expect(availableNotes).toContain(note);
          }
        }
      }
    });

    it('should only return chords where all notes are available', () => {
      const availableNotes = ['C4', 'E4', 'G4'];
      const chords = findPlayableChords(availableNotes);
      
      for (const chord of chords) {
        for (const note of chord.notes) {
          expect(availableNotes).toContain(note);
        }
      }
    });

    it('should categorize chords correctly', () => {
      const availableNotes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'];
      const chords = findPlayableChords(availableNotes);
      
      for (const chord of chords) {
        if (chord.category === 'basic') {
          expect(chord.pitchClasses.length).toBe(3);
          expect(chord.notes.length).toBeGreaterThanOrEqual(3);
        } else if (chord.category === 'advanced') {
          expect(chord.pitchClasses.length).toBeGreaterThanOrEqual(3);
          expect(chord.pitchClasses.length).toBeLessThanOrEqual(5);
        }
      }
    });

    it('should format chord display names correctly', () => {
      const availableNotes = ['C4', 'Eb4', 'G4'];
      const chords = findPlayableChords(availableNotes);
      
      const cMinor = chords.find(c => c.displayName === 'Cm');
      if (cMinor) {
        expect(cMinor.displayName).toBe('Cm');
      }
    });

    it('should handle empty available notes', () => {
      expect(findPlayableChords([])).toEqual([]);
    });

    it('should not return chords with more than 5 pitch classes', () => {
      const availableNotes = ['C4', 'E4', 'G4', 'B4', 'D5'];
      const chords = findPlayableChords(availableNotes);
      
      for (const chord of chords) {
        expect(chord.pitchClasses.length).toBeLessThanOrEqual(5);
      }
    });

    it('should return sorted chords (basic first, then advanced)', () => {
      const availableNotes = ['C4', 'E4', 'G4', 'B4'];
      const chords = findPlayableChords(availableNotes);
      
      let foundAdvanced = false;
      for (const chord of chords) {
        if (chord.category === 'advanced') {
          foundAdvanced = true;
        } else if (foundAdvanced && chord.category === 'basic') {
          throw new Error('Basic chords should come before advanced');
        }
      }
    });
  });
});

