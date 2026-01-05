import { describe, it, expect } from 'vitest';
import {
  getFamilyOptions,
  getKeyOptions,
  getNoteCountOptions,
  getDefaultSelection,
  resolveHandpanConfig,
  getInitialSelection,
} from './handpanSelectorModel';

describe('handpanSelectorModel', () => {
  describe('getFamilyOptions', () => {
    it('should return all family options', () => {
      const options = getFamilyOptions();

      expect(options.length).toBeGreaterThan(0);
      expect(options[0]).toHaveProperty('id');
      expect(options[0]).toHaveProperty('name');

      const kurd = options.find((opt) => opt.id === 'kurd');
      expect(kurd).toBeDefined();
      expect(kurd?.name).toBe('Kurd');
    });
  });

  describe('getKeyOptions', () => {
    it('should return keys for a family', () => {
      const keys = getKeyOptions('kurd');

      expect(keys.length).toBeGreaterThan(0);
      expect(keys).toContain('D');
    });

    it('should return empty array for non-existent family', () => {
      const keys = getKeyOptions('nonexistent');
      expect(keys).toEqual([]);
    });
  });

  describe('getNoteCountOptions', () => {
    it('should return note counts for a family', () => {
      const counts = getNoteCountOptions('kurd');

      expect(counts.length).toBeGreaterThan(0);
      expect(counts).toContain(9);
    });

    it('should return empty array for non-existent family', () => {
      const counts = getNoteCountOptions('nonexistent');
      expect(counts).toEqual([]);
    });
  });

  describe('getDefaultSelection', () => {
    it('should return default key and note count for kurd', () => {
      const defaults = getDefaultSelection('kurd');

      expect(defaults.key).toBe('D');
      expect(defaults.noteCount).toBe(9);
    });

    it('should return defaults for pygmy', () => {
      const defaults = getDefaultSelection('pygmy');

      expect(defaults.key).toBe('F');
      expect(defaults.noteCount).toBe(9);
    });

    it('should fallback gracefully for non-existent family', () => {
      const defaults = getDefaultSelection('nonexistent');

      expect(defaults.key).toBe('D');
      expect(defaults.noteCount).toBe(9);
    });
  });

  describe('resolveHandpanConfig', () => {
    it('should resolve config for D Kurd 9', () => {
      const config = resolveHandpanConfig({
        familyId: 'kurd',
        key: 'D',
        noteCount: 9,
      });

      expect(config).toBeDefined();
      expect(config?.familyId).toBe('kurd');
      expect(config?.tonicPc).toBe('D');
      expect(config?.noteCount).toBe(9);
      expect(config?.ding).toBe('D3');
    });

    it('should resolve config for E Kurd 10', () => {
      const config = resolveHandpanConfig({
        familyId: 'kurd',
        key: 'E',
        noteCount: 10,
      });

      expect(config).toBeDefined();
      expect(config?.familyId).toBe('kurd');
      expect(config?.tonicPc).toBe('E');
      expect(config?.noteCount).toBe(10);
      expect(config?.ding).toBe('E3');
    });

    it('should return null for non-existent config', () => {
      const config = resolveHandpanConfig({
        familyId: 'nonexistent',
        key: 'D',
        noteCount: 9,
      });

      expect(config).toBeNull();
    });
  });

  describe('getInitialSelection', () => {
    it('should return initial selection', () => {
      const selection = getInitialSelection();

      expect(selection.familyId).toBeDefined();
      expect(selection.key).toBeDefined();
      expect(selection.noteCount).toBeDefined();

      const config = resolveHandpanConfig(selection);
      expect(config).toBeDefined();
    });
  });

  describe('Plan B: transposition verification', () => {
    it('should resolve different keys of the same family', () => {
      const dKurd = resolveHandpanConfig({
        familyId: 'kurd',
        key: 'D',
        noteCount: 9,
      });
      const eKurd = resolveHandpanConfig({
        familyId: 'kurd',
        key: 'E',
        noteCount: 9,
      });

      expect(dKurd).toBeDefined();
      expect(eKurd).toBeDefined();
      expect(dKurd?.ding).toBe('D3');
      expect(eKurd?.ding).toBe('E3');
      expect(dKurd?.notes).not.toEqual(eKurd?.notes);
    });

    it('should resolve different note counts of the same family+key', () => {
      const kurd9 = resolveHandpanConfig({
        familyId: 'kurd',
        key: 'D',
        noteCount: 9,
      });
      const kurd10 = resolveHandpanConfig({
        familyId: 'kurd',
        key: 'D',
        noteCount: 10,
      });

      expect(kurd9).toBeDefined();
      expect(kurd10).toBeDefined();
      expect(kurd9?.notes.length).toBe(9);
      expect(kurd10?.notes.length).toBe(10);
    });
  });
});
