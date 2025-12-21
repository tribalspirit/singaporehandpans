import type { HandpanConfig } from './types';

export const HANDPAN_CONFIGS: HandpanConfig[] = [
  {
    id: 'd-kurd-9',
    name: 'D Kurd 9',
    family: 'Kurd',
    notes: ['D4', 'A4', 'Bb4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5'],
    layout: [
      { id: 'ding', note: 'D4', x: 0.5, y: 0.5, r: 0.15 },
      { id: 'pad-1', note: 'A4', x: 0.5, y: 0.25, r: 0.08 },
      { id: 'pad-2', note: 'Bb4', x: 0.7, y: 0.35, r: 0.08 },
      { id: 'pad-3', note: 'C5', x: 0.8, y: 0.5, r: 0.08 },
      { id: 'pad-4', note: 'D5', x: 0.7, y: 0.65, r: 0.08 },
      { id: 'pad-5', note: 'E5', x: 0.5, y: 0.75, r: 0.08 },
      { id: 'pad-6', note: 'F5', x: 0.3, y: 0.65, r: 0.08 },
      { id: 'pad-7', note: 'G5', x: 0.2, y: 0.5, r: 0.08 },
      { id: 'pad-8', note: 'A5', x: 0.3, y: 0.35, r: 0.08 },
    ],
  },
  {
    id: 'd-kurd-10',
    name: 'D Kurd 10',
    family: 'Kurd',
    notes: ['D4', 'A4', 'Bb4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'Bb5'],
    layout: [
      { id: 'ding', note: 'D4', x: 0.5, y: 0.5, r: 0.15 },
      { id: 'pad-1', note: 'A4', x: 0.5, y: 0.22, r: 0.075 },
      { id: 'pad-2', note: 'Bb4', x: 0.68, y: 0.3, r: 0.075 },
      { id: 'pad-3', note: 'C5', x: 0.78, y: 0.45, r: 0.075 },
      { id: 'pad-4', note: 'D5', x: 0.78, y: 0.55, r: 0.075 },
      { id: 'pad-5', note: 'E5', x: 0.68, y: 0.7, r: 0.075 },
      { id: 'pad-6', note: 'F5', x: 0.5, y: 0.78, r: 0.075 },
      { id: 'pad-7', note: 'G5', x: 0.32, y: 0.7, r: 0.075 },
      { id: 'pad-8', note: 'A5', x: 0.22, y: 0.55, r: 0.075 },
      { id: 'pad-9', note: 'Bb5', x: 0.22, y: 0.45, r: 0.075 },
    ],
  },
  {
    id: 'd-kurd-13',
    name: 'D Kurd 13',
    family: 'Kurd',
    notes: [
      'D4',
      'A4',
      'Bb4',
      'C5',
      'D5',
      'E5',
      'F5',
      'G5',
      'A5',
      'Bb5',
      'C6',
      'D6',
      'E6',
    ],
    layout: [
      { id: 'ding', note: 'D4', x: 0.5, y: 0.5, r: 0.14 },
      { id: 'pad-1', note: 'A4', x: 0.5, y: 0.2, r: 0.07 },
      { id: 'pad-2', note: 'Bb4', x: 0.65, y: 0.28, r: 0.07 },
      { id: 'pad-3', note: 'C5', x: 0.75, y: 0.4, r: 0.07 },
      { id: 'pad-4', note: 'D5', x: 0.8, y: 0.5, r: 0.07 },
      { id: 'pad-5', note: 'E5', x: 0.75, y: 0.6, r: 0.07 },
      { id: 'pad-6', note: 'F5', x: 0.65, y: 0.72, r: 0.07 },
      { id: 'pad-7', note: 'G5', x: 0.5, y: 0.8, r: 0.07 },
      { id: 'pad-8', note: 'A5', x: 0.35, y: 0.72, r: 0.07 },
      { id: 'pad-9', note: 'Bb5', x: 0.25, y: 0.6, r: 0.07 },
      { id: 'pad-10', note: 'C6', x: 0.2, y: 0.5, r: 0.07 },
      { id: 'pad-11', note: 'D6', x: 0.25, y: 0.4, r: 0.07 },
      { id: 'pad-12', note: 'E6', x: 0.35, y: 0.28, r: 0.07 },
    ],
  },
  {
    id: 'celtic',
    name: 'Celtic',
    family: 'Celtic',
    notes: ['D4', 'E4', 'F#4', 'G4', 'A4', 'B4', 'C#5', 'D5', 'E5'],
    layout: [
      { id: 'ding', note: 'D4', x: 0.5, y: 0.5, r: 0.15 },
      { id: 'pad-1', note: 'E4', x: 0.5, y: 0.25, r: 0.08 },
      { id: 'pad-2', note: 'F#4', x: 0.7, y: 0.35, r: 0.08 },
      { id: 'pad-3', note: 'G4', x: 0.8, y: 0.5, r: 0.08 },
      { id: 'pad-4', note: 'A4', x: 0.7, y: 0.65, r: 0.08 },
      { id: 'pad-5', note: 'B4', x: 0.5, y: 0.75, r: 0.08 },
      { id: 'pad-6', note: 'C#5', x: 0.3, y: 0.65, r: 0.08 },
      { id: 'pad-7', note: 'D5', x: 0.2, y: 0.5, r: 0.08 },
      { id: 'pad-8', note: 'E5', x: 0.3, y: 0.35, r: 0.08 },
    ],
  },
];

export function getHandpanConfig(id: string): HandpanConfig | undefined {
  return HANDPAN_CONFIGS.find((config) => config.id === id);
}

export function getAllHandpanConfigs(): HandpanConfig[] {
  return HANDPAN_CONFIGS;
}

