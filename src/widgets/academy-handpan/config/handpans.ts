import type { HandpanConfig } from './types';
import {
  generateAllHandpanConfigs,
  legacyFamilyPublished,
  resolveLegacySelection,
} from './handpanFamilies';

export const HANDPAN_CONFIGS: HandpanConfig[] = generateAllHandpanConfigs();

export function getHandpanConfig(id: string): HandpanConfig | undefined {
  const direct = HANDPAN_CONFIGS.find((config) => config.id === id);
  if (direct) {
    return direct;
  }

  const parsed = splitPresetId(id);
  if (!parsed) {
    return undefined;
  }

  // Presets whose family was merged into another keep resolving — but only for
  // a key and shell that family actually published. The canonical family
  // carries the union of the merged families' keys and may have dropped a
  // shell, so migrating unchecked would turn a malformed or stale id into a
  // different instrument rather than returning nothing.
  const [legacyFamilyId, key, noteCount] = parsed;
  if (!legacyFamilyPublished(legacyFamilyId, key, noteCount)) {
    return undefined;
  }

  const migrated = resolveLegacySelection(legacyFamilyId, key, noteCount);
  if (!migrated) {
    return undefined;
  }

  return HANDPAN_CONFIGS.find(
    (config) =>
      config.id === `${migrated.familyId}-${key}-${migrated.noteCount}`
  );
}

/** Split `family-key-count`, allowing hyphens inside the family id. */
function splitPresetId(
  presetId: string
): [familyId: string, key: string, noteCount: number] | null {
  const match = presetId.match(/^(.*)-([a-g]s?)-(\d+)$/);
  return match ? [match[1], match[2], Number(match[3])] : null;
}

export function getAllHandpanConfigs(): HandpanConfig[] {
  return HANDPAN_CONFIGS;
}
