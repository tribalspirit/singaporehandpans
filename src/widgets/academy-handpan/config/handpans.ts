import type { HandpanConfig } from './types';

export const HANDPAN_CONFIGS: HandpanConfig[] = [
  {
    id: 'd-kurd-9',
    name: 'D Kurd 9',
    family: 'Kurd',
    notes: ['D4', 'A4', 'Bb4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5'],
    layout: [
      { id: 'ding', note: 'D4', x: 0.5, y: 0.5, r: 0.18, role: 'ding' },
      { id: 'pad-1', note: 'A4', x: 0.5, y: 0.82, r: 0.12, role: 'bottom' },
      { id: 'pad-2', note: 'Bb4', x: 0.28, y: 0.72, r: 0.11, role: 'ring' },
      { id: 'pad-3', note: 'C5', x: 0.18, y: 0.5, r: 0.10, role: 'ring' },
      { id: 'pad-4', note: 'D5', x: 0.28, y: 0.28, r: 0.10, role: 'ring' },
      { id: 'pad-5', note: 'E5', x: 0.5, y: 0.18, r: 0.09, role: 'ring' },
      { id: 'pad-6', note: 'F5', x: 0.72, y: 0.28, r: 0.09, role: 'ring' },
      { id: 'pad-7', note: 'G5', x: 0.82, y: 0.5, r: 0.09, role: 'ring' },
      { id: 'pad-8', note: 'A5', x: 0.72, y: 0.72, r: 0.08, role: 'ring' },
    ],
  },
  {
    id: 'd-kurd-10',
    name: 'D Kurd 10',
    family: 'Kurd',
    notes: ['D4', 'A4', 'Bb4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'Bb5'],
    layout: [
      { id: 'ding', note: 'D4', x: 0.5, y: 0.5, r: 0.18, role: 'ding' },
      { id: 'pad-1', note: 'A4', x: 0.5, y: 0.84, r: 0.12, role: 'bottom' },
      { id: 'pad-2', note: 'Bb4', x: 0.3, y: 0.76, r: 0.11, role: 'ring' },
      { id: 'pad-3', note: 'C5', x: 0.2, y: 0.58, r: 0.10, role: 'ring' },
      { id: 'pad-4', note: 'D5', x: 0.2, y: 0.42, r: 0.10, role: 'ring' },
      { id: 'pad-5', note: 'E5', x: 0.3, y: 0.24, r: 0.09, role: 'ring' },
      { id: 'pad-6', note: 'F5', x: 0.5, y: 0.16, r: 0.09, role: 'ring' },
      { id: 'pad-7', note: 'G5', x: 0.7, y: 0.24, r: 0.09, role: 'ring' },
      { id: 'pad-8', note: 'A5', x: 0.8, y: 0.42, r: 0.08, role: 'ring' },
      { id: 'pad-9', note: 'Bb5', x: 0.8, y: 0.58, r: 0.08, role: 'ring' },
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
      { id: 'ding', note: 'D4', x: 0.5, y: 0.5, r: 0.17, role: 'ding' },
      { id: 'pad-1', note: 'A4', x: 0.5, y: 0.86, r: 0.12, role: 'bottom' },
      { id: 'pad-2', note: 'Bb4', x: 0.33, y: 0.78, r: 0.11, role: 'ring' },
      { id: 'pad-3', note: 'C5', x: 0.23, y: 0.64, r: 0.10, role: 'ring' },
      { id: 'pad-4', note: 'D5', x: 0.18, y: 0.5, r: 0.10, role: 'ring' },
      { id: 'pad-5', note: 'E5', x: 0.23, y: 0.36, r: 0.09, role: 'ring' },
      { id: 'pad-6', note: 'F5', x: 0.33, y: 0.22, r: 0.09, role: 'ring' },
      { id: 'pad-7', note: 'G5', x: 0.5, y: 0.14, r: 0.09, role: 'ring' },
      { id: 'pad-8', note: 'A5', x: 0.67, y: 0.22, r: 0.08, role: 'ring' },
      { id: 'pad-9', note: 'Bb5', x: 0.77, y: 0.36, r: 0.08, role: 'ring' },
      { id: 'pad-10', note: 'C6', x: 0.82, y: 0.5, r: 0.07, role: 'ring' },
      { id: 'pad-11', note: 'D6', x: 0.77, y: 0.64, r: 0.07, role: 'ring' },
      { id: 'pad-12', note: 'E6', x: 0.67, y: 0.78, r: 0.07, role: 'ring' },
    ],
  },
  {
    id: 'celtic',
    name: 'Celtic',
    family: 'Celtic',
    notes: ['D4', 'E4', 'F#4', 'G4', 'A4', 'B4', 'C#5', 'D5', 'E5'],
    layout: [
      { id: 'ding', note: 'D4', x: 0.5, y: 0.5, r: 0.18, role: 'ding' },
      { id: 'pad-1', note: 'E4', x: 0.5, y: 0.82, r: 0.12, role: 'bottom' },
      { id: 'pad-2', note: 'F#4', x: 0.28, y: 0.72, r: 0.11, role: 'ring' },
      { id: 'pad-3', note: 'G4', x: 0.18, y: 0.5, r: 0.11, role: 'ring' },
      { id: 'pad-4', note: 'A4', x: 0.28, y: 0.28, r: 0.10, role: 'ring' },
      { id: 'pad-5', note: 'B4', x: 0.5, y: 0.18, r: 0.10, role: 'ring' },
      { id: 'pad-6', note: 'C#5', x: 0.72, y: 0.28, r: 0.09, role: 'ring' },
      { id: 'pad-7', note: 'D5', x: 0.82, y: 0.5, r: 0.09, role: 'ring' },
      { id: 'pad-8', note: 'E5', x: 0.72, y: 0.72, r: 0.08, role: 'ring' },
    ],
  },
];

export function getHandpanConfig(id: string): HandpanConfig | undefined {
  return HANDPAN_CONFIGS.find((config) => config.id === id);
}

export function getAllHandpanConfigs(): HandpanConfig[] {
  return HANDPAN_CONFIGS;
}

