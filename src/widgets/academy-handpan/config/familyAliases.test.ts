import { describe, it, expect } from 'vitest';
import {
  HANDPAN_FAMILIES,
  MERGED_FAMILY_IDS,
  MERGED_FAMILY_HISTORY,
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
   * Every preset id a merged family used to publish must still resolve.
   *
   * This previously iterated the *canonical* family's current keys and note
   * counts, which is the wrong set: it silently skipped any shell the surviving
   * family no longer offers. Ionian published 9, 10 and 13 notes and Sabye is
   * documented only at 9, so `ionian-c-10` and `ionian-d-13` resolved to
   * nothing while this test passed. Iterating the merged family's own published
   * shape is what actually checks the contract.
   */
  it('resolves every preset id the merged families used to publish', () => {
    const unresolved: string[] = [];

    for (const legacyId of Object.keys(MERGED_FAMILY_IDS)) {
      const history = MERGED_FAMILY_HISTORY[legacyId];
      expect(history, `no history recorded for ${legacyId}`).toBeDefined();
      if (!history) continue;

      for (const key of history.keys) {
        for (const noteCount of history.noteCounts) {
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

  it('keeps the scale right when an old shell no longer exists', () => {
    // Sabye is only documented at 9 notes, so a 13-note Ionian id falls back to
    // Sabye's default shell rather than resolving to nothing.
    const migrated = getHandpanConfig('ionian-d-13');

    expect(migrated).toBeDefined();
    expect(migrated?.familyId).toBe('sabye');
    expect(migrated?.tonicPc).toBe('D');
  });

  /**
   * A shell that never existed must not resolve.
   *
   * The fallback for a dropped shell was unconditional, so any syntactically
   * valid merged id resolved — `ionian-d-999` returned Sabye's default. That
   * silently turns a malformed or stale link into a different instrument, which
   * is worse than returning nothing.
   */
  it('rejects a shell count the legacy family never published', () => {
    expect(getHandpanConfig('ionian-d-999')).toBeUndefined();
    expect(getHandpanConfig('equinox-e-42')).toBeUndefined();
    expect(getHandpanConfig('aeolian-d-7')).toBeUndefined();

    // and the counts it did publish still resolve
    expect(getHandpanConfig('ionian-d-13')).toBeDefined();
    expect(getHandpanConfig('aeolian-d-13')).toBeDefined();
  });

  /**
   * Structured selections must migrate the same way string ids do.
   *
   * `resolveHandpanConfig` canonicalised only the family, so a persisted
   * selection of { ionian, D, 13 } resolved to nothing — Sabye offers 9 notes
   * only — while the string id `ionian-d-13` resolved fine. Two sibling APIs
   * disagreeing about the same migration is its own bug.
   */
  it('migrates a structured selection whose shell no longer exists', () => {
    const migrated = resolveHandpanConfig({
      familyId: 'ionian',
      key: 'D',
      noteCount: 13,
    });

    expect(migrated).not.toBeNull();
    expect(migrated?.familyId).toBe('sabye');
    expect(migrated?.tonicPc).toBe('D');
  });

  it('resolves a structured selection whose shell still exists', () => {
    const migrated = resolveHandpanConfig({
      familyId: 'aeolian',
      key: 'D',
      noteCount: 13,
    });

    expect(migrated?.id).toBe('kurd-d-13');
  });

  it('rejects a structured selection with a shell that never existed', () => {
    expect(
      resolveHandpanConfig({ familyId: 'ionian', key: 'D', noteCount: 999 })
    ).toBeNull();
  });

  it('records history for every merged family', () => {
    expect(Object.keys(MERGED_FAMILY_HISTORY).sort()).toEqual(
      Object.keys(MERGED_FAMILY_IDS).sort()
    );
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
