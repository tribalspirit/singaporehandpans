import type { HandpanConfig, PitchClass } from './types';
import { HANDPAN_CONFIGS } from './handpans';

export interface HandpanFamilyGroup {
  familyId: string;
  familyName: string;
  keys: HandpanKeyGroup[];
}

export interface HandpanKeyGroup {
  key: PitchClass;
  configs: HandpanConfig[];
}

export function groupConfigsByFamilyAndKey(): HandpanFamilyGroup[] {
  const familyMap = new Map<string, Map<string, HandpanConfig[]>>();

  for (const config of HANDPAN_CONFIGS) {
    const familyId = config.familyId || 'unknown';
    const key = config.tonicPc || 'unknown';

    if (!familyMap.has(familyId)) {
      familyMap.set(familyId, new Map());
    }

    const keyMap = familyMap.get(familyId)!;
    if (!keyMap.has(key)) {
      keyMap.set(key, []);
    }

    keyMap.get(key)!.push(config);
  }

  const groups: HandpanFamilyGroup[] = [];

  for (const [familyId, keyMap] of familyMap.entries()) {
    const firstConfig = Array.from(keyMap.values())[0][0];
    const familyName = firstConfig?.family || familyId;

    const keys: HandpanKeyGroup[] = [];
    for (const [key, configs] of keyMap.entries()) {
      configs.sort((a, b) => (a.noteCount || 0) - (b.noteCount || 0));
      keys.push({ key: key as PitchClass, configs });
    }

    keys.sort((a, b) => a.key.localeCompare(b.key));

    groups.push({
      familyId,
      familyName,
      keys,
    });
  }

  groups.sort((a, b) => a.familyName.localeCompare(b.familyName));

  return groups;
}

export function getConfigsByFamily(familyId: string): HandpanConfig[] {
  return HANDPAN_CONFIGS.filter((config) => config.familyId === familyId);
}

export function getConfigsByFamilyAndKey(
  familyId: string,
  key: PitchClass
): HandpanConfig[] {
  return HANDPAN_CONFIGS.filter(
    (config) => config.familyId === familyId && config.tonicPc === key
  );
}

export function getAvailableKeysForFamily(familyId: string): PitchClass[] {
  const configs = getConfigsByFamily(familyId);
  const keys = new Set(
    configs.map((c) => c.tonicPc).filter((k): k is PitchClass => !!k)
  );
  return Array.from(keys).sort();
}

export function getAvailableNoteCountsForFamilyAndKey(
  familyId: string,
  key: PitchClass
): number[] {
  const configs = getConfigsByFamilyAndKey(familyId, key);
  const noteCounts = configs
    .map((c) => c.noteCount)
    .filter((n): n is number => !!n);
  return Array.from(new Set(noteCounts)).sort((a, b) => a - b);
}
