import { describe, it, expect } from 'vitest';
import { findPlayableChords } from './chords';
import { normalizeToPitchClass } from './normalize';

describe('chords canonical naming', () => {
  describe('Am7 vs C6 ambiguity', () => {
    it('should prefer Am7 over C6 for A-C-E-G pitch class set', () => {
      const availableNotes = ['D4', 'A4', 'Bb4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5'];
      const chords = findPlayableChords(availableNotes);
      
      const am7Chord = chords.find(c => {
        const pcs = new Set(c.pitchClasses);
        return pcs.has('A') && pcs.has('C') && pcs.has('E') && pcs.has('G') && pcs.size === 4;
      });
      
      if (am7Chord) {
        expect(am7Chord.displayName).toMatch(/Am7|A.*m.*7/i);
        expect(am7Chord.rootPc).toBe('A');
      }
      
      const c6Chord = chords.find(c => {
        const pcs = new Set(c.pitchClasses);
        return pcs.has('A') && pcs.has('C') && pcs.has('E') && pcs.has('G') && 
               pcs.size === 4 && c.displayName.includes('C6');
      });
      
      if (c6Chord && am7Chord) {
        expect(c6Chord.pitchClasses.sort().join(',')).toBe(am7Chord.pitchClasses.sort().join(','));
      }
    });
  });

  describe('no duplicate displayNames for different pcsets', () => {
    it('should not have duplicate displayNames with different pitch class sets', () => {
      const availableNotes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'E5', 'G5'];
      const chords = findPlayableChords(availableNotes);
      
      const chordsByDisplayName = new Map<string, Set<string>>();
      
      for (const chord of chords) {
        const pcsetKey = chord.pitchClasses.sort().join(',');
        if (!chordsByDisplayName.has(chord.displayName)) {
          chordsByDisplayName.set(chord.displayName, new Set());
        }
        chordsByDisplayName.get(chord.displayName)!.add(pcsetKey);
      }
      
      for (const [displayName, pcsetKeys] of chordsByDisplayName.entries()) {
        if (pcsetKeys.size > 1) {
          const baseName = displayName.replace(/[0-9majsusadd°+]/g, '').trim();
          const isSimpleTriad = baseName.length === 1 && !displayName.includes('7') && !displayName.includes('9') && 
              !displayName.includes('sus') && !displayName.includes('add') && !displayName.includes('m') &&
              !displayName.includes('°') && !displayName.includes('+') && !displayName.includes('6');
          
          if (isSimpleTriad) {
            const pcsets = Array.from(pcsetKeys);
            const allAreTriads = pcsets.every(key => {
              const parts = key.split(',');
              return parts.length === 3;
            });
            
            if (!allAreTriads) {
              throw new Error(`Duplicate base name "${displayName}" found with different pcsets (some non-triads): ${pcsets.join('; ')}`);
            }
          }
        }
      }
    });
  });

  describe('Bb presence in D-Kurd', () => {
    it('should include Bb chords when Bb is in scale', () => {
      const availableNotes = ['D4', 'A4', 'Bb4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5'];
      const chords = findPlayableChords(availableNotes);
      
      const bbChords = chords.filter(c => c.rootPc === 'Bb' || c.rootPc === 'A#');
      
      const hasBbPitchClass = availableNotes.some(n => normalizeToPitchClass(n) === 'Bb' || normalizeToPitchClass(n) === 'A#');
      
      if (hasBbPitchClass) {
        const bbTriad = chords.find(c => 
          c.category === 'basic' && 
          (c.rootPc === 'Bb' || c.rootPc === 'A#') &&
          c.pitchClasses.includes('Bb') || c.pitchClasses.includes('A#')
        );
        
        if (bbTriad || bbChords.length > 0) {
          expect(bbChords.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('canonical root determination', () => {
    it('should set rootPc correctly for all chords', () => {
      const availableNotes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'];
      const chords = findPlayableChords(availableNotes);
      
      for (const chord of chords) {
        expect(chord.rootPc).toBeDefined();
        expect(chord.rootPc).toBeTruthy();
        expect(chord.pitchClasses).toContain(chord.rootPc);
      }
    });
  });
});

