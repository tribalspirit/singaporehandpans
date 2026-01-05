import { describe, it, expect } from 'vitest';
import {
  buildHandpanConfigFromFamily,
  getHandpanFamilyById,
} from './handpanFamilies';

describe('handpanFamilies', () => {
  describe('D Kurd 9 regression test', () => {
    it('should generate D Kurd 9 with exact note list including D4', () => {
      const kurdFamily = getHandpanFamilyById('kurd');
      expect(kurdFamily).toBeDefined();

      if (!kurdFamily) return;

      const config = buildHandpanConfigFromFamily(kurdFamily, 'D', 9);

      expect(config.notes).toEqual([
        'D3',
        'A3',
        'Bb3',
        'C4',
        'D4',
        'E4',
        'F4',
        'G4',
        'A4',
      ]);
    });

    it('should generate D Kurd 10 with C4 and C5', () => {
      const kurdFamily = getHandpanFamilyById('kurd');
      expect(kurdFamily).toBeDefined();

      if (!kurdFamily) return;

      const config = buildHandpanConfigFromFamily(kurdFamily, 'D', 10);

      expect(config.notes).toContain('C4');
      expect(config.notes).toContain('C5');
      expect(config.notes).toHaveLength(10);
    });

    it('should generate D Kurd 9 with all scale degrees present', () => {
      const kurdFamily = getHandpanFamilyById('kurd');
      expect(kurdFamily).toBeDefined();

      if (!kurdFamily) return;

      const config = buildHandpanConfigFromFamily(kurdFamily, 'D', 9);

      const pitchClasses = config.notes.map((note) => note.replace(/\d+$/, ''));

      expect(pitchClasses).toContain('D');
      expect(pitchClasses).toContain('E');
      expect(pitchClasses).toContain('F');
      expect(pitchClasses).toContain('G');
      expect(pitchClasses).toContain('A');
      expect(pitchClasses).toContain('Bb');
      expect(pitchClasses).toContain('C');
    });
  });

  describe('orderedRingIntervalsByNoteCount validation', () => {
    it('should reject missing ring intervals for requested note count', () => {
      const kurdFamily = getHandpanFamilyById('kurd');
      expect(kurdFamily).toBeDefined();

      if (!kurdFamily) return;

      expect(() => {
        buildHandpanConfigFromFamily(kurdFamily, 'D', 99);
      }).toThrow('Missing orderedRingIntervalsByNoteCount');
    });

    it('should reject invalid ring intervals length', () => {
      const invalidFamily = {
        id: 'test',
        name: 'Test',
        description: 'Test family',
        modeHint: 'minor' as const,
        orderedRingIntervalsByNoteCount: {
          9: [7, 8, 10],
        },
        suggestedNoteCounts: [9],
        supportedKeys: ['D' as const],
        defaultKey: 'D' as const,
        defaultNoteCount: 9,
      };

      expect(() => {
        buildHandpanConfigFromFamily(invalidFamily, 'D', 9);
      }).toThrow('Invalid ring intervals length');
    });
  });

  describe('transposition', () => {
    it('should correctly transpose Kurd to different keys', () => {
      const kurdFamily = getHandpanFamilyById('kurd');
      expect(kurdFamily).toBeDefined();

      if (!kurdFamily) return;

      const configE = buildHandpanConfigFromFamily(kurdFamily, 'E', 9);
      expect(configE.notes[0]).toBe('E3');
      expect(configE.notes).toHaveLength(9);

      const configA = buildHandpanConfigFromFamily(kurdFamily, 'A', 9);
      expect(configA.notes[0]).toBe('A3');
      expect(configA.notes).toHaveLength(9);
    });
  });

  describe('note ordering', () => {
    it('should generate ascending notes (each note higher than previous)', () => {
      const kurdFamily = getHandpanFamilyById('kurd');
      expect(kurdFamily).toBeDefined();

      if (!kurdFamily) return;

      const config = buildHandpanConfigFromFamily(kurdFamily, 'D', 9);

      const midiValues = config.notes.map((note) => {
        const match = note.match(/^([A-G](?:#|b)?)(\d+)$/);
        if (!match) throw new Error(`Invalid note: ${note}`);

        const [, pc, octaveStr] = match;
        const octave = parseInt(octaveStr, 10);

        const semitones: Record<string, number> = {
          C: 0,
          'C#': 1,
          Db: 1,
          D: 2,
          'D#': 3,
          Eb: 3,
          E: 4,
          F: 5,
          'F#': 6,
          Gb: 6,
          G: 7,
          'G#': 8,
          Ab: 8,
          A: 9,
          'A#': 10,
          Bb: 10,
          B: 11,
        };

        return semitones[pc] + octave * 12;
      });

      for (let i = 1; i < midiValues.length; i++) {
        expect(midiValues[i]).toBeGreaterThan(midiValues[i - 1]);
      }
    });
  });
});
