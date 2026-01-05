import type { HandpanConfig } from './types';
import { generateAllHandpanConfigs } from './handpanFamilies';

export const HANDPAN_CONFIGS: HandpanConfig[] = generateAllHandpanConfigs();

export function getHandpanConfig(id: string): HandpanConfig | undefined {
  return HANDPAN_CONFIGS.find((config) => config.id === id);
}

export function getAllHandpanConfigs(): HandpanConfig[] {
  return HANDPAN_CONFIGS;
}
