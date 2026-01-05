import { describe, it, expect } from 'vitest';
import {
  groupConfigsByFamilyAndKey,
  getConfigsByFamily,
  getConfigsByFamilyAndKey,
  getAvailableKeysForFamily,
  getAvailableNoteCountsForFamilyAndKey,
} from './uiHelpers';

describe('UI Helpers', () => {
  describe('groupConfigsByFamilyAndKey', () => {
    it('should group configs by family and key', () => {
      const groups = groupConfigsByFamilyAndKey();

      expect(groups.length).toBeGreaterThan(0);

      const kurdGroup = groups.find((g) => g.familyId === 'kurd');
      expect(kurdGroup).toBeDefined();

      if (kurdGroup) {
        expect(kurdGroup.keys.length).toBeGreaterThan(0);

        const dKey = kurdGroup.keys.find((k) => k.key === 'D');
        expect(dKey).toBeDefined();

        if (dKey) {
          expect(dKey.configs.length).toBeGreaterThan(0);
        }
      }
    });

    it('should sort configs by note count within each key', () => {
      const groups = groupConfigsByFamilyAndKey();

      for (const group of groups) {
        for (const keyGroup of group.keys) {
          const noteCounts = keyGroup.configs.map((c) => c.noteCount || 0);
          const sortedNoteCounts = [...noteCounts].sort((a, b) => a - b);
          expect(noteCounts).toEqual(sortedNoteCounts);
        }
      }
    });
  });

  describe('getConfigsByFamily', () => {
    it('should return all configs for a family', () => {
      const kurdConfigs = getConfigsByFamily('kurd');

      expect(kurdConfigs.length).toBeGreaterThan(0);

      for (const config of kurdConfigs) {
        expect(config.familyId).toBe('kurd');
      }
    });

    it('should return empty array for non-existent family', () => {
      const configs = getConfigsByFamily('nonexistent');
      expect(configs).toEqual([]);
    });
  });

  describe('getConfigsByFamilyAndKey', () => {
    it('should return configs for specific family and key', () => {
      const dKurdConfigs = getConfigsByFamilyAndKey('kurd', 'D');

      expect(dKurdConfigs.length).toBeGreaterThan(0);

      for (const config of dKurdConfigs) {
        expect(config.familyId).toBe('kurd');
        expect(config.tonicPc).toBe('D');
      }
    });
  });

  describe('getAvailableKeysForFamily', () => {
    it('should return all available keys for a family', () => {
      const kurdKeys = getAvailableKeysForFamily('kurd');

      expect(kurdKeys.length).toBeGreaterThan(0);
      expect(kurdKeys).toContain('D');
    });

    it('should return sorted keys', () => {
      const kurdKeys = getAvailableKeysForFamily('kurd');
      const sortedKeys = [...kurdKeys].sort();
      expect(kurdKeys).toEqual(sortedKeys);
    });
  });

  describe('getAvailableNoteCountsForFamilyAndKey', () => {
    it('should return available note counts for family and key', () => {
      const noteCounts = getAvailableNoteCountsForFamilyAndKey('kurd', 'D');

      expect(noteCounts.length).toBeGreaterThan(0);

      const sortedNoteCounts = [...noteCounts].sort((a, b) => a - b);
      expect(noteCounts).toEqual(sortedNoteCounts);
    });
  });
});
