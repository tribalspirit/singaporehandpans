/**
 * What an embedder may set on the widget, and how a bad value is handled.
 *
 * Props are *initial* state, not controlled state: the widget owns its
 * selection once a visitor starts changing it, and nothing here re-opens a
 * choice they have made. They exist so a host page can decide what the widget
 * opens on and which parts it opens with.
 *
 * Everything arrives from outside this codebase — a custom element passes HTML
 * attributes straight through as strings — so every field is validated against
 * what the widget can actually render, and a value it cannot use falls back
 * silently rather than throwing or rendering an empty instrument.
 */
import type { NotationMode } from '../core/notation/padLabel';
import type { PlaybackMode } from './types';
import {
  resolveInitialSelection,
  type HandpanSelection,
} from '../config/handpanSelectorModel';

/** The widget's top-level views, in the order they are presented. */
export const WIDGET_VIEW_IDS = ['listen', 'chords', 'about'] as const;
export type WidgetViewId = (typeof WIDGET_VIEW_IDS)[number];

export const MIN_ARPEGGIO_BPM = 60;
export const MAX_ARPEGGIO_BPM = 200;
export const DEFAULT_ARPEGGIO_BPM = 120;

export interface HandpanWidgetProps {
  /** Scale family to open on, e.g. `kurd`. Merged-away ids are accepted. */
  familyId?: string | null;
  /** Key to open on, e.g. `D` or `f#`. Must be one the family publishes. */
  scaleKey?: string | null;
  /** Pad count to open on, e.g. `9`. Must be one the family publishes. */
  noteCount?: number | string | null;
  /** Whether pads are labelled by pitch or by playing-sequence position. */
  notation?: string | null;
  /** Which view opens first: `listen`, `chords` or `about`. */
  view?: string | null;
  /** Whether a chord sounds rolled (`arpeggio`) or struck (`simultaneous`). */
  playbackMode?: string | null;
  /** Tempo of rolled playback, in beats per minute. */
  arpeggioBpm?: number | string | null;
}

/** Props after validation — every field present and known to be renderable. */
export interface ResolvedWidgetProps {
  selection: HandpanSelection;
  notation: NotationMode;
  view: WidgetViewId;
  playbackMode: PlaybackMode;
  arpeggioBpm: number;
}

/**
 * Whether a value carries no answer at all.
 *
 * An attribute the host page left off arrives as `null`, and one written as
 * `attr=""` arrives as an empty string. Both mean "unset", and neither may be
 * coerced into a number or matched against a catalog entry.
 */
function isBlank(raw: unknown): boolean {
  return (
    raw === null ||
    raw === undefined ||
    (typeof raw === 'string' && raw.trim() === '')
  );
}

function resolveNotation(raw: HandpanWidgetProps['notation']): NotationMode {
  return raw === 'number' ? 'number' : 'note';
}

function resolveView(raw: HandpanWidgetProps['view']): WidgetViewId {
  const candidate = raw?.trim().toLowerCase();
  return WIDGET_VIEW_IDS.find((id) => id === candidate) ?? 'listen';
}

function resolvePlaybackMode(
  raw: HandpanWidgetProps['playbackMode']
): PlaybackMode {
  return raw === 'simultaneous' ? 'simultaneous' : 'arpeggio';
}

/**
 * Clamped rather than rejected, because the bounds are the tempo slider's own:
 * a value outside them would render a control the visitor cannot return to.
 *
 * Absent is not zero, though. An unset attribute reaches a custom element as
 * `null`, and `bpm=""` is a thing an author writes; `Number` turns both into 0,
 * which clamps to the slowest tempo on the slider — so "I did not set this"
 * would have meant 60 BPM instead of the default.
 */
function resolveArpeggioBpm(raw: HandpanWidgetProps['arpeggioBpm']): number {
  if (isBlank(raw)) {
    return DEFAULT_ARPEGGIO_BPM;
  }

  const requested = Number(raw);
  if (!Number.isFinite(requested)) {
    return DEFAULT_ARPEGGIO_BPM;
  }
  return Math.min(
    MAX_ARPEGGIO_BPM,
    Math.max(MIN_ARPEGGIO_BPM, Math.round(requested))
  );
}

export function resolveWidgetProps(
  props: HandpanWidgetProps = {}
): ResolvedWidgetProps {
  return {
    selection: resolveInitialSelection({
      familyId: props.familyId,
      key: props.scaleKey,
      noteCount: props.noteCount,
    }),
    notation: resolveNotation(props.notation),
    view: resolveView(props.view),
    playbackMode: resolvePlaybackMode(props.playbackMode),
    arpeggioBpm: resolveArpeggioBpm(props.arpeggioBpm),
  };
}
