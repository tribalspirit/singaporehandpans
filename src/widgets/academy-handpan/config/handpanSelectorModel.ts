import type { HandpanConfig, PitchClass } from './types';
import { HANDPAN_FAMILIES, getAllHandpanFamilies } from './handpanFamilies';
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

export function getFamilyOptions(): FamilyOption[] {
  return getAllHandpanFamilies().map((family) => ({
    id: family.id,
    name: family.name,
  }));
}

export function getKeyOptions(familyId: string): PitchClass[] {
  const family = HANDPAN_FAMILIES.find((f) => f.id === familyId);
  return family?.supportedKeys || [];
}

export function getNoteCountOptions(familyId: string): number[] {
  const family = HANDPAN_FAMILIES.find((f) => f.id === familyId);
  return family?.suggestedNoteCounts || [];
}

export function getDefaultSelection(familyId: string): {
  key: PitchClass;
  noteCount: number;
} {
  const family = HANDPAN_FAMILIES.find((f) => f.id === familyId);

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

  const key = `${selection.familyId}:${selection.key}:${selection.noteCount}`;
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
