import type { HandpanConfig, PitchClass } from './types';
import {
  HANDPAN_FAMILIES,
  getAllHandpanFamilies,
  resolveFamilyId,
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

export function getKeyOptions(familyId: string): PitchClass[] {
  const family = findFamily(familyId);
  return family?.supportedKeys || [];
}

export function getNoteCountOptions(familyId: string): number[] {
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

  const canonicalFamilyId = resolveFamilyId(selection.familyId);
  const key = `${canonicalFamilyId}:${selection.key}:${selection.noteCount}`;
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
