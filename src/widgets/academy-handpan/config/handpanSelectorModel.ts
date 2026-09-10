import type { HandpanConfig, PitchClass } from './types';
import {
  HANDPAN_FAMILIES,
  MERGED_FAMILY_HISTORY,
  getAllHandpanFamilies,
  resolveFamilyId,
  resolveLegacySelection,
} from './handpanFamilies';
import { HANDPAN_CONFIGS } from './handpans';

export interface FamilyOption {
  id: string;
  name: string;
}

export interface HandpanSelection {
  familyId: string;
  key: PitchClass;
  noteCount: number;
}

const CONFIG_INDEX = new Map<string, HandpanConfig>();

function initializeConfigIndex() {
  if (CONFIG_INDEX.size === 0) {
    for (const config of HANDPAN_CONFIGS) {
      if (config.familyId && config.tonicPc && config.noteCount) {
        const key = `${config.familyId}:${config.tonicPc}:${config.noteCount}`;
        CONFIG_INDEX.set(key, config);
      }
    }
  }
}

/** Family lookup that accepts merged-away ids such as `aeolian` or `mystic`. */
function findFamily(familyId: string) {
  const canonicalId = resolveFamilyId(familyId);
  return HANDPAN_FAMILIES.find((family) => family.id === canonicalId);
}

export function getFamilyOptions(): FamilyOption[] {
  return getAllHandpanFamilies().map((family) => ({
    id: family.id,
    name: family.name,
  }));
}

/**
 * Keys this family offers.
 *
 * A merged-away id gets the keys *it* published, not the canonical family's.
 * The survivor carries the union of every merged family's keys, so returning
 * that would offer options `resolveHandpanConfig` then rejects — Equinox never
 * published C#, F or F#, but Integral does. Options and resolution have to
 * agree or the selector can offer a choice that resolves to nothing.
 */
export function getKeyOptions(familyId: string): PitchClass[] {
  const history = MERGED_FAMILY_HISTORY[familyId];
  if (history) {
    return history.keys as PitchClass[];
  }

  const family = findFamily(familyId);
  return family?.supportedKeys || [];
}

/** Shells this family offers; a merged-away id gets the ones it published. */
export function getNoteCountOptions(familyId: string): number[] {
  const history = MERGED_FAMILY_HISTORY[familyId];
  if (history) {
    return [...history.noteCounts];
  }

  const family = findFamily(familyId);
  return family?.suggestedNoteCounts || [];
}

export function getDefaultSelection(familyId: string): {
  key: PitchClass;
  noteCount: number;
} {
  const family = findFamily(familyId);

  if (!family) {
    return { key: 'D', noteCount: 9 };
  }

  const key =
    family.defaultKey ||
    family.supportedKeys.find((k) => k === 'D') ||
    family.supportedKeys[0];

  const noteCount = family.defaultNoteCount || family.suggestedNoteCounts[0];

  return { key, noteCount };
}

export function resolveHandpanConfig(
  selection: HandpanSelection
): HandpanConfig | null {
  initializeConfigIndex();

  // Migrate family *and* shell. Canonicalising only the family left a
  // selection like { ionian, D, 13 } resolving to nothing, since Sabye offers
  // 9 notes only — the same gap `getHandpanConfig` covers for string ids.
  const migrated = resolveLegacySelection(
    selection.familyId,
    selection.key,
    selection.noteCount
  );
  if (!migrated) {
    return null;
  }

  const key = `${migrated.familyId}:${selection.key}:${migrated.noteCount}`;
  return CONFIG_INDEX.get(key) || null;
}

export function getInitialSelection(): HandpanSelection {
  const firstFamily = HANDPAN_FAMILIES[0];
  const defaults = getDefaultSelection(firstFamily.id);

  return {
    familyId: firstFamily.id,
    key: defaults.key,
    noteCount: defaults.noteCount,
  };
}
