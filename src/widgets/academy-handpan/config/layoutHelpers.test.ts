import { describe, it, expect } from 'vitest';
import { generateHandpanLayout, sortPadsByPitch } from './layoutHelpers';
import { normalizeToPitchClass } from '../theory/normalize';
import type { HandpanPad } from './types';

describe('layoutHelpers', () => {
  describe('generateHandpanLayout', () => {
    it('should generate layout for D-Kurd 9 (1 ding + 8 ring)', () => {
      const notes = ['D3', 'A3', 'Bb3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4'];
      const dingNote = 'D3';
      const layout = generateHandpanLayout(notes, dingNote);

      expect(layout.length).toBe(9);

      const ding = layout.find((p) => p.role === 'ding');
      expect(ding).toBeDefined();
      if (ding) {
        expect(ding.note).toBe('D3');
        expect(ding.x).toBe(0.5);
        expect(ding.y).toBe(0.5);
      }

      const ringPads = layout.filter((p) => p.role !== 'ding');
      expect(ringPads.length).toBe(8);
    });

    it('should place ding at center', () => {
      const notes = ['D3', 'A3', 'Bb3', 'C4'];
      const dingNote = 'D3';
      const layout = generateHandpanLayout(notes, dingNote);

      const ding = layout.find((p) => p.role === 'ding');
      expect(ding?.x).toBe(0.5);
      expect(ding?.y).toBe(0.5);
    });

    it('should place ring notes on circle', () => {
      const notes = ['D3', 'A3', 'Bb3', 'C4', 'D4'];
      const dingNote = 'D3';
      const layout = generateHandpanLayout(notes, dingNote);

      const ringPads = layout.filter((p) => p.role !== 'ding');
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
      const notes = ['D3', 'A3', 'Bb3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4'];
      const dingNote = 'D3';
      const layout = generateHandpanLayout(notes, dingNote);

      const ringPads = layout.filter((p) => p.role !== 'ding');

      expect(ringPads.length).toBe(8);

      const sortedByPitch = [...notes]
        .filter((n) => n !== dingNote)
        .sort((a, b) => {
          const aOctave = parseInt(a.match(/\d+/)?.[0] || '0');
          const bOctave = parseInt(b.match(/\d+/)?.[0] || '0');
          if (aOctave !== bOctave) return aOctave - bOctave;
          return a.localeCompare(b);
        });

      const noteNames = ringPads.map((p) => p.note);
      expect(new Set(noteNames)).toEqual(new Set(sortedByPitch));
    });

    it('should assign bottom role to lowest ring note', () => {
      const notes = ['D3', 'A3', 'Bb3', 'C4', 'D4'];
      const dingNote = 'D3';
      const layout = generateHandpanLayout(notes, dingNote);

      const ringPads = layout.filter((p) => p.role !== 'ding');
      const bottomPad = ringPads.find((p) => p.role === 'bottom');

      if (bottomPad) {
        expect(bottomPad.y).toBeGreaterThan(0.5);
      }
    });

    it('should scale note sizes by pitch', () => {
      const notes = ['D3', 'A3', 'Bb3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4'];
      const dingNote = 'D3';
      const layout = generateHandpanLayout(notes, dingNote);

      const ringPads = layout.filter((p) => p.role !== 'ding');
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

    /*
     * The pad sizes are percentages of the pan, so the CSS can only preserve
     * the "ding reads as the largest pad" rule if the geometry hands it a ding
     * that is already the largest. Guard that here rather than in a viewport
     * test: if this ever inverts, no amount of clamping in the stylesheet can
     * put it back.
     */
    it('gives the ding a larger radius than every ring pad, across scales', () => {
      const scales: ReadonlyArray<{ notes: string[]; ding: string }> = [
        {
          notes: ['D3', 'A3', 'Bb3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4'],
          ding: 'D3',
        },
        {
          notes: ['C3', 'G3', 'Ab3', 'Bb3', 'C4', 'Eb4', 'F4', 'G4'],
          ding: 'C3',
        },
        {
          notes: [
            'F3',
            'C4',
            'Db4',
            'Eb4',
            'F4',
            'G4',
            'Ab4',
            'Bb4',
            'C5',
            'Db5',
            'Eb5',
            'F5',
          ],
          ding: 'F3',
        },
        { notes: ['E4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5'], ding: 'E4' },
      ];

      for (const { notes, ding } of scales) {
        const layout = generateHandpanLayout(notes, ding);
        const dingPad = layout.find((p) => p.role === 'ding');
        const ringPads = layout.filter((p) => p.role !== 'ding');

        expect(dingPad).toBeDefined();
        for (const pad of ringPads) {
          expect(dingPad!.r).toBeGreaterThan(pad.r);
        }
      }
    });

    it('keeps every ring pad inside the pan rim', () => {
      const notes = [
        'F3',
        'C4',
        'Db4',
        'Eb4',
        'F4',
        'G4',
        'Ab4',
        'Bb4',
        'C5',
        'Db5',
        'Eb5',
        'F5',
      ];
      const layout = generateHandpanLayout(notes, 'F3');
      const PAN_RADIUS = 0.5;

      for (const pad of layout) {
        const distanceFromCenter = Math.hypot(pad.x - 0.5, pad.y - 0.5);
        // `r` is a diameter fraction of the pan, so half of it is the overhang.
        expect(distanceFromCenter + pad.r / 2).toBeLessThan(PAN_RADIUS);
      }
    });

    it('should handle slotOrderOverride', () => {
      const notes = ['D3', 'A3', 'Bb3', 'C4'];
      const dingNote = 'D3';
      const override = [2, 0, 1];
      const layout = generateHandpanLayout(notes, dingNote, override);

      expect(layout.length).toBe(4);
    });

    it('should handle single ring note', () => {
      const notes = ['D3', 'A3'];
      const dingNote = 'D3';
      const layout = generateHandpanLayout(notes, dingNote);

      expect(layout.length).toBe(2);
      expect(layout.filter((p) => p.role === 'ding').length).toBe(1);
      expect(layout.filter((p) => p.role !== 'ding').length).toBe(1);
    });

    it('should handle empty ring notes', () => {
      const notes = ['D3'];
      const dingNote = 'D3';
      const layout = generateHandpanLayout(notes, dingNote);

      expect(layout.length).toBe(1);
      expect(layout[0].role).toBe('ding');
    });

    it('should place Dm chord tones on left side and C chord tones on right side', () => {
      const notes = ['D3', 'A3', 'Bb3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4'];
      const dingNote = 'D3';
      const layout = generateHandpanLayout(notes, dingNote);

      const CENTER_X = 0.5;

      const dmTones = ['D', 'F', 'A'];
      const cTones = ['C', 'E', 'G'];

      const dmPads = layout.filter((p) => {
        const pc = normalizeToPitchClass(p.note);
        return dmTones.includes(pc);
      });

      const cPads = layout.filter((p) => {
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
      const notes = ['D3', 'A3', 'Bb3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4'];
      const dingNote = 'D3';
      const layout = generateHandpanLayout(notes, dingNote);

      const ringPads = layout.filter((p) => p.role !== 'ding');
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
        { id: '1', note: 'C4', x: 0.5, y: 0.5, r: 0.1, role: 'ring' },
        { id: '2', note: 'A3', x: 0.5, y: 0.5, r: 0.1, role: 'ring' },
        { id: '3', note: 'F3', x: 0.5, y: 0.5, r: 0.1, role: 'ring' },
      ];

      const sorted = sortPadsByPitch(pads);
      expect(sorted[0].note).toBe('F3');
      expect(sorted[1].note).toBe('A3');
      expect(sorted[2].note).toBe('C4');
    });

    it('should handle empty array', () => {
      expect(sortPadsByPitch([])).toEqual([]);
    });

    it('should handle single pad', () => {
      const pads: HandpanPad[] = [
        { id: '1', note: 'C3', x: 0.5, y: 0.5, r: 0.1, role: 'ring' },
      ];
      expect(sortPadsByPitch(pads)).toEqual(pads);
    });
  });
});
