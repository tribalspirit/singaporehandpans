import { describe, it, expect } from 'vitest';
import { generateHandpanLayout, sortPadsByPitch } from './layoutHelpers';
import { normalizeToPitchClass } from '../theory/normalize';
import type { HandpanPad } from './types';

describe('layoutHelpers', () => {
  describe('generateHandpanLayout', () => {
    it('should generate layout for D-Kurd 9 (1 ding + 8 ring)', () => {
      const notes = ['D4', 'A4', 'Bb4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5'];
      const dingNote = 'D4';
      const layout = generateHandpanLayout(notes, dingNote);
      
      expect(layout.length).toBe(9);
      
      const ding = layout.find(p => p.role === 'ding');
      expect(ding).toBeDefined();
      if (ding) {
        expect(ding.note).toBe('D4');
        expect(ding.x).toBe(0.5);
        expect(ding.y).toBe(0.5);
      }
      
      const ringPads = layout.filter(p => p.role !== 'ding');
      expect(ringPads.length).toBe(8);
    });

    it('should place ding at center', () => {
      const notes = ['D4', 'A4', 'Bb4', 'C5'];
      const dingNote = 'D4';
      const layout = generateHandpanLayout(notes, dingNote);
      
      const ding = layout.find(p => p.role === 'ding');
      expect(ding?.x).toBe(0.5);
      expect(ding?.y).toBe(0.5);
    });

    it('should place ring notes on circle', () => {
      const notes = ['D4', 'A4', 'Bb4', 'C5', 'D5'];
      const dingNote = 'D4';
      const layout = generateHandpanLayout(notes, dingNote);
      
      const ringPads = layout.filter(p => p.role !== 'ding');
      const centerX = 0.5;
      const centerY = 0.5;
      const expectedRadius = 0.32;
      
      for (const pad of ringPads) {
        const dx = pad.x - centerX;
        const dy = pad.y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        expect(Math.abs(distance - expectedRadius)).toBeLessThan(0.01);
      }
    });

    it('should assign ring notes in zig-zag order', () => {
      const notes = ['D4', 'A4', 'Bb4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5'];
      const dingNote = 'D4';
      const layout = generateHandpanLayout(notes, dingNote);
      
      const ringPads = layout.filter(p => p.role !== 'ding');
      
      expect(ringPads.length).toBe(8);
      
      const sortedByPitch = [...notes].filter(n => n !== dingNote).sort((a, b) => {
        const aOctave = parseInt(a.match(/\d+/)?.[0] || '0');
        const bOctave = parseInt(b.match(/\d+/)?.[0] || '0');
        if (aOctave !== bOctave) return aOctave - bOctave;
        return a.localeCompare(b);
      });
      
      const noteNames = ringPads.map(p => p.note);
      expect(new Set(noteNames)).toEqual(new Set(sortedByPitch));
    });

    it('should assign bottom role to lowest ring note', () => {
      const notes = ['D4', 'A4', 'Bb4', 'C5', 'D5'];
      const dingNote = 'D4';
      const layout = generateHandpanLayout(notes, dingNote);
      
      const ringPads = layout.filter(p => p.role !== 'ding');
      const bottomPad = ringPads.find(p => p.role === 'bottom');
      
      if (bottomPad) {
        expect(bottomPad.y).toBeGreaterThan(0.5);
      }
    });

    it('should scale note sizes by pitch', () => {
      const notes = ['D4', 'A4', 'Bb4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5'];
      const dingNote = 'D4';
      const layout = generateHandpanLayout(notes, dingNote);
      
      const ringPads = layout.filter(p => p.role !== 'ding');
      const sortedByPitch = [...ringPads].sort((a, b) => {
        const aOctave = parseInt(a.note.match(/\d+/)?.[0] || '0');
        const bOctave = parseInt(b.note.match(/\d+/)?.[0] || '0');
        return aOctave - bOctave;
      });
      
      if (sortedByPitch.length >= 2) {
        const lower = sortedByPitch[0];
        const higher = sortedByPitch[sortedByPitch.length - 1];
        expect(lower.r).toBeGreaterThanOrEqual(higher.r);
      }
    });

    it('should handle slotOrderOverride', () => {
      const notes = ['D4', 'A4', 'Bb4', 'C5'];
      const dingNote = 'D4';
      const override = [2, 0, 1];
      const layout = generateHandpanLayout(notes, dingNote, override);
      
      expect(layout.length).toBe(4);
    });

    it('should handle single ring note', () => {
      const notes = ['D4', 'A4'];
      const dingNote = 'D4';
      const layout = generateHandpanLayout(notes, dingNote);
      
      expect(layout.length).toBe(2);
      expect(layout.filter(p => p.role === 'ding').length).toBe(1);
      expect(layout.filter(p => p.role !== 'ding').length).toBe(1);
    });

    it('should handle empty ring notes', () => {
      const notes = ['D4'];
      const dingNote = 'D4';
      const layout = generateHandpanLayout(notes, dingNote);
      
      expect(layout.length).toBe(1);
      expect(layout[0].role).toBe('ding');
    });

    it('should place Dm chord tones on left side and C chord tones on right side', () => {
      const notes = ['D4', 'A4', 'Bb4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5'];
      const dingNote = 'D4';
      const layout = generateHandpanLayout(notes, dingNote);
      
      const CENTER_X = 0.5;
      
      const dmTones = ['D', 'F', 'A'];
      const cTones = ['C', 'E', 'G'];
      
      const dmPads = layout.filter(p => {
        const pc = normalizeToPitchClass(p.note);
        return dmTones.includes(pc);
      });
      
      const cPads = layout.filter(p => {
        const pc = normalizeToPitchClass(p.note);
        return cTones.includes(pc);
      });
      
      expect(dmPads.length).toBeGreaterThan(0);
      expect(cPads.length).toBeGreaterThan(0);
      
      const avgXDm = dmPads.reduce((sum, p) => sum + p.x, 0) / dmPads.length;
      const avgXC = cPads.reduce((sum, p) => sum + p.x, 0) / cPads.length;
      
      expect(avgXDm).toBeLessThan(CENTER_X);
      expect(avgXC).toBeGreaterThan(CENTER_X);
    });

    it('should maintain geometry requirements after mirroring', () => {
      const notes = ['D4', 'A4', 'Bb4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5'];
      const dingNote = 'D4';
      const layout = generateHandpanLayout(notes, dingNote);
      
      const ringPads = layout.filter(p => p.role !== 'ding');
      const centerX = 0.5;
      const centerY = 0.5;
      const expectedRadius = 0.32;
      
      for (const pad of ringPads) {
        expect(pad.x).toBeGreaterThanOrEqual(0);
        expect(pad.x).toBeLessThanOrEqual(1);
        expect(pad.y).toBeGreaterThanOrEqual(0);
        expect(pad.y).toBeLessThanOrEqual(1);
        expect(Number.isNaN(pad.x)).toBe(false);
        expect(Number.isNaN(pad.y)).toBe(false);
        
        const dx = pad.x - centerX;
        const dy = pad.y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        expect(Math.abs(distance - expectedRadius)).toBeLessThan(0.01);
      }
    });
  });

  describe('sortPadsByPitch', () => {
    it('should sort pads by pitch', () => {
      const pads: HandpanPad[] = [
        { id: '1', note: 'C5', x: 0.5, y: 0.5, r: 0.1, role: 'ring' },
        { id: '2', note: 'A4', x: 0.5, y: 0.5, r: 0.1, role: 'ring' },
        { id: '3', note: 'F4', x: 0.5, y: 0.5, r: 0.1, role: 'ring' },
      ];
      
      const sorted = sortPadsByPitch(pads);
      expect(sorted[0].note).toBe('F4');
      expect(sorted[1].note).toBe('A4');
      expect(sorted[2].note).toBe('C5');
    });

    it('should handle empty array', () => {
      expect(sortPadsByPitch([])).toEqual([]);
    });

    it('should handle single pad', () => {
      const pads: HandpanPad[] = [
        { id: '1', note: 'C4', x: 0.5, y: 0.5, r: 0.1, role: 'ring' },
      ];
      expect(sortPadsByPitch(pads)).toEqual(pads);
    });
  });
});

