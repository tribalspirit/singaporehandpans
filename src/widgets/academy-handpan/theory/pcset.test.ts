import { describe, it, expect } from 'vitest';
import { toPcSet, isSubset, isSuperset, stableSort, deduplicateBy } from './pcset';

describe('pcset', () => {
  describe('toPcSet', () => {
    it('should convert notes to pitch class set chroma', () => {
      const notes = ['C4', 'E4', 'G4'];
      const chroma = toPcSet(notes);
      expect(typeof chroma).toBe('string');
      expect(chroma.length).toBeGreaterThan(0);
    });

    it('should handle empty array', () => {
      const chroma = toPcSet([]);
      expect(chroma).toBe('000000000000');
    });

    it('should handle single note', () => {
      const chroma = toPcSet(['C4']);
      expect(typeof chroma).toBe('string');
    });
  });

  describe('isSubset', () => {
    it('should check if candidate is subset of available', () => {
      const candidate = ['C4', 'E4', 'G4'];
      const available = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'E5', 'G5'];
      const result = isSubset(candidate, available);
      expect(typeof result).toBe('boolean');
    });

    it('should return false if candidate is not subset', () => {
      const candidate = ['C4', 'E4', 'G#4'];
      const available = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'];
      const result = isSubset(candidate, available);
      expect(result).toBe(false);
    });

    it('should return true for empty candidate', () => {
      const result = isSubset([], ['C4', 'D4']);
      expect(result).toBe(true);
    });

    it('should return false if available is empty but candidate is not', () => {
      const result = isSubset(['C4'], []);
      expect(result).toBe(false);
    });
  });

  describe('isSuperset', () => {
    it('should check if available is superset of candidate', () => {
      const available = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'E5', 'G5'];
      const candidate = ['C4', 'E4', 'G4'];
      const result = isSuperset(available, candidate);
      expect(typeof result).toBe('boolean');
    });

    it('should return false if available is not superset', () => {
      const available = ['C4', 'D4', 'E4'];
      const candidate = ['C4', 'E4', 'G4'];
      const result = isSuperset(available, candidate);
      expect(result).toBe(false);
    });
  });

  describe('stableSort', () => {
    it('should sort items by key function', () => {
      const items = [{ name: 'C' }, { name: 'A' }, { name: 'B' }];
      const sorted = stableSort(items, (item) => item.name);
      expect(sorted[0].name).toBe('A');
      expect(sorted[1].name).toBe('B');
      expect(sorted[2].name).toBe('C');
    });

    it('should maintain stable sort order', () => {
      const items = [{ name: 'C', id: 1 }, { name: 'C', id: 2 }, { name: 'A', id: 3 }];
      const sorted = stableSort(items, (item) => item.name);
      expect(sorted[0].name).toBe('A');
      expect(sorted[1].id).toBe(1);
      expect(sorted[2].id).toBe(2);
    });

    it('should handle empty array', () => {
      expect(stableSort([], () => '')).toEqual([]);
    });
  });

  describe('deduplicateBy', () => {
    it('should remove duplicates by key function', () => {
      const items = [
        { id: 1, name: 'C' },
        { id: 2, name: 'C' },
        { id: 3, name: 'D' },
      ];
      const deduplicated = deduplicateBy(items, (item) => item.name);
      expect(deduplicated.length).toBe(2);
      expect(deduplicated[0].id).toBe(1);
      expect(deduplicated[1].id).toBe(3);
    });

    it('should handle empty array', () => {
      expect(deduplicateBy([], () => '')).toEqual([]);
    });

    it('should preserve first occurrence', () => {
      const items = [
        { id: 1, key: 'A' },
        { id: 2, key: 'A' },
        { id: 3, key: 'A' },
      ];
      const deduplicated = deduplicateBy(items, (item) => item.key);
      expect(deduplicated.length).toBe(1);
      expect(deduplicated[0].id).toBe(1);
    });
  });
});

