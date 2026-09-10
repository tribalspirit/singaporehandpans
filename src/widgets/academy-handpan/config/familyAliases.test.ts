import { describe, it, expect } from 'vitest';
import {
  HANDPAN_FAMILIES,
  MERGED_FAMILY_IDS,
  EXCLUDED_FAMILY_IDS,
  resolveFamilyId,
  migrateLegacyPresetId,
  getHandpanFamilyById,
} from './handpanFamilies';
import { getHandpanConfig } from './handpans';
import {
  getKeyOptions,
  getNoteCountOptions,
  resolveHandpanConfig,
} from './handpanSelectorModel';

/**
 * Guards for the family merge.
 *
 * Aeolian, Equinox, Mystic and Magic Voyage each duplicated another family's
 * pitch-class set, so the catalog offered choices that sounded identical. They
 * were merged away, and these tests hold that state: no two families may share
 * a pitch-class set again, and nothing that referenced a merged id may break.
 */

const toPitchClass = (semitone: number) => ((semitone % 12) + 12) % 12;

function pitchClassSetKey(intervals: number[] | undefined): string {
  return [...new Set((intervals ?? []).map(toPitchClass))]
    .sort((a, b) => a - b)
    .join(',');
}

describe('no two families share a pitch-class set', () => {
  it('gives every family a distinct set of notes', () => {
    const familiesBySet = new Map<string, string[]>();

    for (const family of HANDPAN_FAMILIES) {
      const key = pitchClassSetKey(family.intervalsPcSemitones);
      familiesBySet.set(key, [...(familiesBySet.get(key) ?? []), family.id]);
    }

    const duplicates = [...familiesBySet.entries()]
      .filter(([, ids]) => ids.length > 1)
      .map(([set, ids]) => `{${set}} shared by ${ids.join(', ')}`);

    expect(duplicates).toEqual([]);
  });
});

describe('merged family ids stay resolvable', () => {
  it('maps every merged id to a family that exists', () => {
    for (const [legacyId, canonicalId] of Object.entries(MERGED_FAMILY_IDS)) {
      expect(resolveFamilyId(legacyId)).toBe(canonicalId);
      expect(getHandpanFamilyById(legacyId)?.id).toBe(canonicalId);
    }
  });

  it('leaves a canonical id untouched', () => {
    expect(resolveFamilyId('kurd')).toBe('kurd');
    expect(resolveFamilyId('unknown-family')).toBe('unknown-family');
  });

  it('does not leave a merged id in the catalog', () => {
    const liveIds = new Set(HANDPAN_FAMILIES.map((family) => family.id));

    for (const legacyId of Object.keys(MERGED_FAMILY_IDS)) {
      expect(liveIds.has(legacyId)).toBe(false);
    }
  });

  /**
   * The canonical family carries the union of the merged families' keys, so
   * every preset id that used to exist still maps to a real preset rather than
   * quietly returning nothing.
   */
  it('resolves every preset id the merged families used to publish', () => {
    const unresolved: string[] = [];

    for (const [legacyId, canonicalId] of Object.entries(MERGED_FAMILY_IDS)) {
      const canonical = HANDPAN_FAMILIES.find((f) => f.id === canonicalId);
      expect(
        canonical,
        `missing canonical family ${canonicalId}`
      ).toBeDefined();
      if (!canonical) continue;

      for (const key of canonical.supportedKeys) {
        for (const noteCount of canonical.suggestedNoteCounts) {
          const legacyPresetId = `${legacyId}-${key
            .toLowerCase()
            .replace('#', 's')}-${noteCount}`;

          if (!getHandpanConfig(legacyPresetId)) {
            unresolved.push(legacyPresetId);
          }
        }
      }
    }

    expect(unresolved).toEqual([]);
  });

  it('rewrites a merged preset id onto its canonical family', () => {
    expect(migrateLegacyPresetId('equinox-e-9')).toBe('integral-e-9');
    expect(migrateLegacyPresetId('aeolian-d-9')).toBe('kurd-d-9');
    expect(migrateLegacyPresetId('magic-voyage-d-9')).toBe('pygmy-d-9');
    expect(migrateLegacyPresetId('kurd-d-9')).toBeNull();
  });

  it('serves selector options for a merged id', () => {
    expect(getKeyOptions('mystic')).toEqual(getKeyOptions('integral'));
    expect(getNoteCountOptions('aeolian')).toEqual(getNoteCountOptions('kurd'));

    const viaLegacy = resolveHandpanConfig({
      familyId: 'equinox',
      key: 'E',
      noteCount: 9,
    });
    expect(viaLegacy?.id).toBe('integral-e-9');
  });
});

describe('merged families keep the union of their keys', () => {
  it('keeps every key the merged families supported', () => {
    const expectedKeys: Record<string, string[]> = {
      // kurd + aeolian (both already offered the same seven keys)
      kurd: ['C', 'C#', 'D', 'E', 'F#', 'G', 'A'],
      // integral + equinox + mystic
      integral: ['C', 'C#', 'D', 'E', 'F', 'F#', 'G', 'A'],
      // pygmy + magic-voyage
      pygmy: ['C', 'D', 'E', 'F', 'F#', 'G', 'A'],
    };

    for (const [familyId, keys] of Object.entries(expectedKeys)) {
      const family = HANDPAN_FAMILIES.find((f) => f.id === familyId);
      expect(family, familyId).toBeDefined();
      expect([...(family?.supportedKeys ?? [])].sort(), familyId).toEqual(
        [...keys].sort()
      );
    }
  });
});

/**
 * Guards for the unsourced-family removal.
 *
 * The widget's rule is that it does not present a tuning it cannot source.
 * These families shipped interval sets no maker publishes, so they were removed
 * rather than left in place with a warning.
 */
describe('unsourced families stay out of the catalog', () => {
  it('publishes no family whose data could not be verified', () => {
    const liveIds = new Set(HANDPAN_FAMILIES.map((family) => family.id));

    for (const excludedId of Object.keys(EXCLUDED_FAMILY_IDS)) {
      expect(liveIds.has(excludedId), `${excludedId} is still shipping`).toBe(
        false
      );
    }
  });

  it('records why each was removed, so it can be restored when sourced', () => {
    for (const [excludedId, reason] of Object.entries(EXCLUDED_FAMILY_IDS)) {
      expect(reason.length, excludedId).toBeGreaterThan(40);
    }
  });

  it('does not resolve an excluded id to some other family', () => {
    // Unlike a merged id, an excluded one has no canonical replacement: the
    // scale is simply not offered, and saying so is better than silently
    // substituting a different scale.
    for (const excludedId of Object.keys(EXCLUDED_FAMILY_IDS)) {
      expect(getHandpanFamilyById(excludedId)).toBeUndefined();
      expect(getHandpanConfig(`${excludedId}-d-9`)).toBeUndefined();
    }
  });
});
