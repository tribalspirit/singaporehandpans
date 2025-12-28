import { describe, it, expect } from 'vitest';
import { normalizeToPitchClass } from './normalize';
import type { PlayableChord } from './chords';

describe('chords highlight', () => {
  describe('pitch-class-based highlighting', () => {
    it('should highlight all notes with matching pitch classes', () => {
      const handpanNotes = ['D4', 'A4', 'Bb4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5'];
      const chord: PlayableChord = {
        name: 'Dm',
        displayName: 'Dm',
        notes: ['D4', 'F5', 'A4'],
        pitchClasses: ['D', 'F', 'A'],
        category: 'basic',
      };

      const highlightPitchClasses = new Set(chord.pitchClasses);
      const highlightedNotes = handpanNotes.filter((note) => {
        const pc = normalizeToPitchClass(note);
        return highlightPitchClasses.has(pc);
      });

      expect(highlightedNotes).toContain('D4');
      expect(highlightedNotes).toContain('D5');
      expect(highlightedNotes).toContain('F5');
      expect(highlightedNotes).toContain('A4');
      expect(highlightedNotes).toContain('A5');
      expect(highlightedNotes.length).toBeGreaterThan(chord.notes.length);
    });

    it('should highlight all octave duplicates for C chord', () => {
      const handpanNotes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'E5', 'G5'];
      const chord: PlayableChord = {
        name: 'C',
        displayName: 'C',
        notes: ['C4', 'E4', 'G4'],
        pitchClasses: ['C', 'E', 'G'],
        category: 'basic',
      };

      const highlightPitchClasses = new Set(chord.pitchClasses);
      const highlightedNotes = handpanNotes.filter((note) => {
        const pc = normalizeToPitchClass(note);
        return highlightPitchClasses.has(pc);
      });

      expect(highlightedNotes).toContain('C4');
      expect(highlightedNotes).toContain('C5');
      expect(highlightedNotes).toContain('E4');
      expect(highlightedNotes).toContain('E5');
      expect(highlightedNotes).toContain('G4');
      expect(highlightedNotes).toContain('G5');
    });
  });
});

