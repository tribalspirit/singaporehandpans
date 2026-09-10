import type { HandpanConfig } from './types';
import {
  generateAllHandpanConfigs,
  getHandpanFamilyById,
  migrateLegacyPresetId,
} from './handpanFamilies';

export const HANDPAN_CONFIGS: HandpanConfig[] = generateAllHandpanConfigs();

export function getHandpanConfig(id: string): HandpanConfig | undefined {
  const direct = HANDPAN_CONFIGS.find((config) => config.id === id);
  if (direct) {
    return direct;
  }

  // Presets whose family was merged into another keep resolving, so an id
  // held elsewhere does not quietly return nothing.
  const migratedId = migrateLegacyPresetId(id);
  if (!migratedId) {
    return undefined;
  }

  const migrated = HANDPAN_CONFIGS.find((config) => config.id === migratedId);
  if (migrated) {
    return migrated;
  }

  // The canonical family may not offer the same shells: Ionian published 9, 10
  // and 13 notes while Sabye is only documented at 9. Fall back to the family's
  // default shell so an old id still yields the right scale, rather than the
  // migration appearing to work and returning nothing.
  const [familyId, key] = splitPresetId(migratedId);
  const family = familyId ? getHandpanFamilyById(familyId) : undefined;
  if (!family || !key) {
    return undefined;
  }

  const fallbackCount =
    family.defaultNoteCount ?? family.suggestedNoteCounts[0];
  return HANDPAN_CONFIGS.find(
    (config) => config.id === `${familyId}-${key}-${fallbackCount}`
  );
}

/** Split `family-key-count`, allowing hyphens inside the family id. */
function splitPresetId(
  presetId: string
): [familyId: string | null, key: string | null] {
  const match = presetId.match(/^(.*)-([a-g]s?)-(\d+)$/);
  return match ? [match[1], match[2]] : [null, null];
}

export function getAllHandpanConfigs(): HandpanConfig[] {
  return HANDPAN_CONFIGS;
}
