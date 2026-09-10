import type { HandpanConfig } from './types';
import {
  generateAllHandpanConfigs,
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
  return migratedId
    ? HANDPAN_CONFIGS.find((config) => config.id === migratedId)
    : undefined;
}

export function getAllHandpanConfigs(): HandpanConfig[] {
  return HANDPAN_CONFIGS;
}
