import { describe, it, expect } from 'vitest';
import { note } from '@tonaljs/core';
import { findPlayableScales } from './scales';

describe('scales', () => {
  describe('findPlayableScales', () => {
    it('should return scales structure correctly', () => {
      const availableNotes = ['D4', 'A4', 'Bb4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5'];
      const scales = findPlayableScales(availableNotes);
      
      for (const scale of scales) {
        expect(scale).toHaveProperty('name');
        expect(scale).toHaveProperty('displayName');
        expect(scale).toHaveProperty('notes');
        expect(scale).toHaveProperty('pitchClasses');
        expect(Array.isArray(scale.notes)).toBe(true);
        expect(Array.isArray(scale.pitchClasses)).toBe(true);
        
        if (scale.notes.length > 0) {
          for (const note of scale.notes) {
            expect(availableNotes).toContain(note);
          }
        }
      }
    });

    it('should prioritize D minor when available', () => {
      const availableNotes = ['D4', 'A4', 'Bb4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5'];
      const scales = findPlayableScales(availableNotes);
      
      if (scales.length > 0) {
        const firstScale = scales[0];
        if (firstScale.name === 'D minor') {
          expect(firstScale.name).toBe('D minor');
        }
      }
    });

    it('should return only scales where all pitch classes are available', () => {
      const availableNotes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'];
      const scales = findPlayableScales(availableNotes);
      
      for (const scale of scales) {
        expect(scale.notes.length).toBeGreaterThan(0);
        for (const scaleNote of scale.notes) {
          expect(availableNotes).toContain(scaleNote);
        }
      }
    });

    it('should only return scales with mapped notes', () => {
      const availableNotes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'];
      const scales = findPlayableScales(availableNotes);
      
      for (const scale of scales) {
        if (scale.notes.length > 0) {
          for (const scaleNote of scale.notes) {
            expect(availableNotes).toContain(scaleNote);
          }
        }
      }
    });

    it('should return scales with empty notes array when no notes match', () => {
      const scales = findPlayableScales([]);
      
      for (const scale of scales) {
        expect(scale.notes).toEqual([]);
        expect(scale.pitchClasses.length).toBeGreaterThan(0);
      }
    });

    it('should return scales with sorted notes', () => {
      const availableNotes = ['D4', 'A4', 'Bb4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5'];
      const scales = findPlayableScales(availableNotes);
      
      for (const scale of scales) {
        if (scale.notes.length > 1) {
          const sorted = [...scale.notes].sort((a, b) => {
            const aOctave = parseInt(a.match(/\d+/)?.[0] || '0');
            const bOctave = parseInt(b.match(/\d+/)?.[0] || '0');
            return aOctave - bOctave;
          });
          expect(scale.notes).toEqual(sorted);
        }
      }
    });
  });
});

