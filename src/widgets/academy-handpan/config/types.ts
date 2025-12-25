export type Note = string;

export interface HandpanPad {
  id: string;
  note: Note;
  x: number;
  y: number;
  r: number;
  role?: 'ding' | 'ring' | 'bottom';
}

export interface HandpanConfig {
  id: string;
  name: string;
  family?: string;
  notes: Note[];
  layout: HandpanPad[];
  scaleName: string;
  scaleAliases?: string[];
  scaleDescription: string;
  scaleMoodTags: string[];
  scaleTypicalKeys?: string[];
}

export const NOTE_PATTERN = /^[A-G](?:#|b)?\d*$/;

export function isValidNote(note: string): boolean {
  return NOTE_PATTERN.test(note);
}

export function validateHandpanConfig(config: HandpanConfig): boolean {
  if (!config.id || !config.name) {
    return false;
  }

  if (!Array.isArray(config.notes) || config.notes.length === 0) {
    return false;
  }

  if (!config.notes.every(isValidNote)) {
    return false;
  }

  if (!Array.isArray(config.layout) || config.layout.length === 0) {
    return false;
  }

  for (const pad of config.layout) {
    if (!pad.id || !pad.note) {
      return false;
    }

    if (!isValidNote(pad.note)) {
      return false;
    }

    if (
      typeof pad.x !== 'number' ||
      typeof pad.y !== 'number' ||
      typeof pad.r !== 'number'
    ) {
      return false;
    }

    if (pad.x < 0 || pad.x > 1 || pad.y < 0 || pad.y > 1 || pad.r <= 0 || pad.r > 1) {
      return false;
    }
  }

  return true;
}


