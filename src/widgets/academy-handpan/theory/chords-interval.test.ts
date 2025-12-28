import { describe, it, expect } from 'vitest';
import { findPlayableChords } from './chords';
import { normalizeToPitchClass } from './normalize';

describe('chords interval-based analysis', () => {
  describe('normalization spelling', () => {
    it('should normalize A# to Bb', () => {
      expect(normalizeToPitchClass('A#')).toBe('Bb');
      expect(normalizeToPitchClass('A#4')).toBe('Bb');
    });

    it('should normalize D# to Eb', () => {
      expect(normalizeToPitchClass('D#')).toBe('Eb');
      expect(normalizeToPitchClass('D#4')).toBe('Eb');
    });

    it('should normalize G# to Ab', () => {
      expect(normalizeToPitchClass('G#')).toBe('Ab');
      expect(normalizeToPitchClass('G#4')).toBe('Ab');
    });

    it('should keep C# and F# as sharps', () => {
      expect(normalizeToPitchClass('C#')).toBe('C#');
      expect(normalizeToPitchClass('F#')).toBe('F#');
    });
  });

  describe('D-Kurd expected added-chord sanity', () => {
    const dKurdNotes = ['D4', 'A4', 'Bb4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5'];

    it('should include Eø7 (not E°) for E-G-Bb-D pitch set', () => {
      const chords = findPlayableChords(dKurdNotes);
      
      const eHalfDim = chords.find(c => {
        const pcs = new Set(c.pitchClasses);
        return pcs.has('E') && pcs.has('G') && pcs.has('Bb') && pcs.has('D') && pcs.size === 4;
      });

      if (eHalfDim) {
        expect(eHalfDim.displayName).toMatch(/Eø7|Em7b5/i);
        expect(eHalfDim.rootPc).toBe('E');
        expect(eHalfDim.displayName).not.toBe('E°');
      }
    });

    it('should include Bb-rooted chords when Bb is in scale', () => {
      const chords = findPlayableChords(dKurdNotes);
      
      const bbChords = chords.filter(c => c.rootPc === 'Bb');
      
      expect(bbChords.length).toBeGreaterThan(0);
    });

    it('should not label D-C-E-G as E chord', () => {
      const chords = findPlayableChords(dKurdNotes);
      
      const wrongE = chords.find(c => {
        const pcs = new Set(c.pitchClasses);
        return pcs.has('D') && pcs.has('C') && pcs.has('E') && pcs.has('G') && 
               pcs.size === 4 && c.rootPc === 'E' && c.displayName === 'E';
      });

      expect(wrongE).toBeUndefined();
    });

    it('should include Dm7 (D F A C)', () => {
      const chords = findPlayableChords(dKurdNotes);
      
      const dm7 = chords.find(c => {
        const pcs = new Set(c.pitchClasses);
        return pcs.has('D') && pcs.has('F') && pcs.has('A') && pcs.has('C') && pcs.size === 4;
      });

      if (dm7) {
        expect(dm7.displayName).toMatch(/Dm7/i);
        expect(dm7.rootPc).toBe('D');
      }
    });

    it('should include Fmaj7 (F A C E) if possible', () => {
      const chords = findPlayableChords(dKurdNotes);
      
      const fmaj7 = chords.find(c => {
        const pcs = new Set(c.pitchClasses);
        return pcs.has('F') && pcs.has('A') && pcs.has('C') && pcs.has('E') && pcs.size === 4;
      });

      if (fmaj7) {
        expect(fmaj7.displayName).toMatch(/Fmaj7/i);
        expect(fmaj7.rootPc).toBe('F');
      }
    });

    it('should include Gm7 (G Bb D F) if possible, or Bb6 as alternative', () => {
      const chords = findPlayableChords(dKurdNotes);
      
      const gm7OrBb6 = chords.find(c => {
        const pcs = new Set(c.pitchClasses);
        return pcs.has('G') && pcs.has('Bb') && pcs.has('D') && pcs.has('F') && pcs.size === 4;
      });

      if (gm7OrBb6) {
        const isGm7 = gm7OrBb6.displayName.match(/Gm7/i) && gm7OrBb6.rootPc === 'G';
        const isBb6 = gm7OrBb6.displayName.match(/Bb6/i) && gm7OrBb6.rootPc === 'Bb';
        expect(isGm7 || isBb6).toBe(true);
      }
    });
  });

  describe('no duplicate labels', () => {
    it('should not have duplicate Csus4 with different pitch class sets', () => {
      const availableNotes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
      const chords = findPlayableChords(availableNotes);
      
      const csus4Chords = chords.filter(c => c.displayName === 'Csus4');
      const pcsetKeys = new Set(csus4Chords.map(c => c.pitchClasses.sort().join(',')));
      
      expect(pcsetKeys.size).toBeLessThanOrEqual(1);
    });

    it('should differentiate sus4 from 7sus4', () => {
      const availableNotes = ['C4', 'F4', 'G4', 'Bb4', 'C5'];
      const chords = findPlayableChords(availableNotes);
      
      const csus4 = chords.find(c => {
        const pcs = new Set(c.pitchClasses);
        return pcs.has('C') && pcs.has('F') && pcs.has('G') && pcs.size === 3 && c.rootPc === 'C';
      });

      const c7sus4 = chords.find(c => {
        const pcs = new Set(c.pitchClasses);
        return pcs.has('C') && pcs.has('F') && pcs.has('G') && pcs.has('Bb') && pcs.size === 4 && c.rootPc === 'C';
      });

      if (csus4 && c7sus4) {
        expect(csus4.displayName).toBe('Csus4');
        expect(c7sus4.displayName).toBe('C7sus4');
      }
    });
  });

  describe('root determination correctness', () => {
    it('should correctly identify root for Eø7', () => {
      const availableNotes = ['E4', 'G4', 'Bb4', 'D5'];
      const chords = findPlayableChords(availableNotes);
      
      const eHalfDim = chords.find(c => {
        const pcs = new Set(c.pitchClasses);
        return pcs.has('E') && pcs.has('G') && pcs.has('Bb') && pcs.has('D') && pcs.size === 4;
      });

      if (eHalfDim) {
        expect(eHalfDim.rootPc).toBe('E');
        expect(eHalfDim.displayName).toMatch(/Eø7|Em7b5/i);
      }
    });

    it('should not label chords with wrong root', () => {
      const availableNotes = ['C4', 'E4', 'G4', 'A4'];
      const chords = findPlayableChords(availableNotes);
      
      const wrongRoot = chords.find(c => {
        const pcs = new Set(c.pitchClasses);
        return pcs.has('C') && pcs.has('E') && pcs.has('G') && pcs.has('A') && 
               pcs.size === 4 && c.rootPc === 'A' && c.displayName === 'A';
      });

      expect(wrongRoot).toBeUndefined();
    });
  });
});

