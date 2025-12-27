import { describe, it, expect } from 'vitest';
import { findPlayableChords } from './chords';

describe('chords name fix', () => {
  it('should have name and displayName match for Dsus2', () => {
    const availableNotes = ['D4', 'A4', 'Bb4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5'];
    const chords = findPlayableChords(availableNotes);
    
    const dsus2 = chords.find(c => {
      const pcs = new Set(c.pitchClasses);
      return pcs.has('D') && pcs.has('E') && pcs.has('A') && pcs.size === 3 && c.rootPc === 'D';
    });

    if (dsus2) {
      expect(dsus2.name).toBe(dsus2.displayName);
      expect(dsus2.displayName).toBe('Dsus2');
    }
  });

  it('should have name and displayName match for all chords', () => {
    const availableNotes = ['D4', 'A4', 'Bb4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5'];
    const chords = findPlayableChords(availableNotes);
    
    for (const chord of chords) {
      expect(chord.name).toBe(chord.displayName);
    }
  });
});

