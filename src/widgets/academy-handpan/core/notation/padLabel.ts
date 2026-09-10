import type { HandpanPad } from '../../config/types';

/**
 * How a tone field is labelled on screen.
 *
 * `note` shows conventional pitch spelling with octave (`A3`). `number` shows
 * the field's position in the instrument's playing sequence, the convention
 * handpan players use when learning a pattern by position rather than pitch.
 *
 * The numeric label is a *sequence index*, not a scale degree. The two coincide
 * only by accident, and conflating them would misteach the scale, so a future
 * scale-degree mode belongs alongside this one rather than folded into it.
 */
export type NotationMode = 'note' | 'number';

export type PadShell = 'top' | 'bottom';

export interface PadIdentity {
  /** 1-based position in the instrument's playing sequence. Ding is 1. */
  sequenceIndex: number;
  shell: PadShell;
  role: 'ding' | 'tone field';
}

/**
 * Build the sequence index for every pad, keyed by pad id.
 *
 * `notes` is ordered ding-first then ascending, which is the order a player
 * moves through the instrument, so position in that list is the sequence index.
 * Deriving it from the note list rather than from render order keeps the label
 * stable regardless of how the layout happens to be drawn.
 */
export function buildPadIdentities(
  layout: HandpanPad[],
  notes: string[]
): Map<string, PadIdentity> {
  const sequenceByNote = new Map<string, number>();
  notes.forEach((note, index) => {
    if (!sequenceByNote.has(note)) {
      sequenceByNote.set(note, index + 1);
    }
  });

  const identities = new Map<string, PadIdentity>();
  for (const pad of layout) {
    identities.set(pad.id, {
      sequenceIndex: sequenceByNote.get(pad.note) ?? 0,
      shell: pad.role === 'bottom' ? 'bottom' : 'top',
      role: pad.role === 'ding' ? 'ding' : 'tone field',
    });
  }

  return identities;
}

/** The visible label, which shows one notation at a time. */
export function padVisibleLabel(
  pad: HandpanPad,
  identity: PadIdentity | undefined,
  mode: NotationMode
): string {
  if (mode === 'number' && identity && identity.sequenceIndex > 0) {
    return String(identity.sequenceIndex);
  }
  return pad.note;
}

/**
 * The accessible name, which always carries pitch, sequence number, shell and
 * role — regardless of which notation is displayed. A screen-reader user must
 * not lose the pitch just because the sighted view is showing numbers.
 */
export function padAccessibleName(
  pad: HandpanPad,
  identity: PadIdentity | undefined
): string {
  const parts: string[] = [];

  if (identity && identity.sequenceIndex > 0) {
    parts.push(`Pad ${identity.sequenceIndex}`);
  }
  parts.push(pad.note);
  if (identity) {
    parts.push(`${identity.shell} shell`);
    parts.push(identity.role);
  }

  return parts.join(', ');
}
