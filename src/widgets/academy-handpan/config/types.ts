export type Note = string;

export type PitchClass =
  | 'C'
  | 'C#'
  | 'Db'
  | 'D'
  | 'D#'
  | 'Eb'
  | 'E'
  | 'F'
  | 'F#'
  | 'Gb'
  | 'G'
  | 'G#'
  | 'Ab'
  | 'A'
  | 'A#'
  | 'Bb'
  | 'B';

export interface HandpanPad {
  id: string;
  note: Note;
  x: number;
  y: number;
  r: number;
  role?: 'ding' | 'ring' | 'bottom';
}

export interface HandpanScaleFamilyTemplate {
  id: string;
  name: string;
  description: string;
  aliases?: string[];
  makers?: string[];
  /**
   * Internal classification, used to group and reason about families. It is not
   * display copy — it used to be rendered straight into the UI's tag row, which
   * is why a player was shown a single chip reading "minor".
   */
  modeHint?: 'minor' | 'major' | 'mixed' | 'exotic';
  /**
   * Three or four plain words for how the family feels to play, written for
   * someone choosing a scale by ear rather than by theory. Optional so a family
   * added without them still renders; `buildHandpanConfigFromFamily` falls back
   * to the mode hint.
   */
  moodTags?: string[];
  /**
   * The family's declared pitch-class set, as semitones above the tonic.
   *
   * This is documentation-and-validation only: note generation is driven
   * entirely by `orderedRingIntervalsByNoteCount`. `handpanFamilies.test.ts`
   * asserts the two agree, so a ring order can never drift from the pitch-class
   * set the family claims to be.
   */
  intervalsPcSemitones?: number[];
  /** Ring note order (excluding the ding), as semitones above the tonic. */
  orderedRingIntervalsByNoteCount?: Record<number, number[]>;
  /**
   * Semitones from the ding to where the scale actually resolves, when a maker
   * documents that it is not the ding itself. Sabye is named by its ding but
   * HaganeNote states the root is the 4th above, which is why makers call it
   * Lydian.
   *
   * Used only to decide whether diatonic labels are earned — a scale whose
   * tonal centre is not the ding cannot be given Roman numerals rooted on the
   * ding. It deliberately does not affect naming or note generation: makers
   * name these instruments by the ding and so does the catalog.
   */
  tonalCentreOffsetSemitones?: number;
  suggestedNoteCounts: number[];
  supportedKeys: PitchClass[];
  defaultKey?: PitchClass;
  defaultNoteCount?: number;
}

export interface HandpanConfig {
  id: string;
  name: string;
  family?: string;
  familyId?: string;
  tonicPc?: string;
  ding?: Note;
  noteCount?: number;
  notes: Note[];
  layout: HandpanPad[];
  scaleName: string;
  scaleAliases?: string[];
  scaleDescription: string;
  scaleMoodTags: string[];
  scaleTypicalKeys?: string[];
  makers?: string[];
  /** See `HandpanScaleFamilyTemplate.tonalCentreOffsetSemitones`. */
  tonalCentreOffsetSemitones?: number;
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

    if (
      pad.x < 0 ||
      pad.x > 1 ||
      pad.y < 0 ||
      pad.y > 1 ||
      pad.r <= 0 ||
      pad.r > 1
    ) {
      return false;
    }
  }

  return true;
}
