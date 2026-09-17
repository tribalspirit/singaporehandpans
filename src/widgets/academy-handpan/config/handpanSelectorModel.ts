import type { HandpanConfig, PitchClass } from './types';
import {
  HANDPAN_FAMILIES,
  MERGED_FAMILY_HISTORY,
  getAllHandpanFamilies,
  resolveFamilyId,
  resolveLegacySelection,
} from './handpanFamilies';
import { HANDPAN_CONFIGS } from './handpans';

export interface FamilyOption {
  id: string;
  name: string;
}

export interface HandpanSelection {
  familyId: string;
  key: PitchClass;
  noteCount: number;
}

const CONFIG_INDEX = new Map<string, HandpanConfig>();

function initializeConfigIndex() {
  if (CONFIG_INDEX.size === 0) {
    for (const config of HANDPAN_CONFIGS) {
      if (config.familyId && config.tonicPc && config.noteCount) {
        const key = `${config.familyId}:${config.tonicPc}:${config.noteCount}`;
        CONFIG_INDEX.set(key, config);
      }
    }
  }
}

/** Family lookup that accepts merged-away ids such as `aeolian` or `mystic`. */
function findFamily(familyId: string) {
  const canonicalId = resolveFamilyId(familyId);
  return HANDPAN_FAMILIES.find((family) => family.id === canonicalId);
}

export function getFamilyOptions(): FamilyOption[] {
  return getAllHandpanFamilies().map((family) => ({
    id: family.id,
    name: family.name,
  }));
}

/**
 * Keys this family offers.
 *
 * A merged-away id gets the keys *it* published, not the canonical family's.
 * The survivor carries the union of every merged family's keys, so returning
 * that would offer options `resolveHandpanConfig` then rejects — Equinox never
 * published C#, F or F#, but Integral does. Options and resolution have to
 * agree or the selector can offer a choice that resolves to nothing.
 */
export function getKeyOptions(familyId: string): PitchClass[] {
  const history = MERGED_FAMILY_HISTORY[familyId];
  if (history) {
    return history.keys as PitchClass[];
  }

  const family = findFamily(familyId);
  return family?.supportedKeys || [];
}

/** Shells this family offers; a merged-away id gets the ones it published. */
export function getNoteCountOptions(familyId: string): number[] {
  const history = MERGED_FAMILY_HISTORY[familyId];
  if (history) {
    return [...history.noteCounts];
  }

  const family = findFamily(familyId);
  return family?.suggestedNoteCounts || [];
}

/**
 * The selection a family opens on.
 *
 * A merged-away id gets its *own* former default, not the survivor's.
 * Inheriting the canonical family's silently changed the instrument for anyone
 * restoring a legacy id — `equinox` would open on D rather than its own G,
 * `ionian` on E rather than C — which is the same mismatch the key and shell
 * options were corrected for.
 */
export function getDefaultSelection(familyId: string): {
  key: PitchClass;
  noteCount: number;
} {
  const history = MERGED_FAMILY_HISTORY[familyId];
  if (history) {
    return {
      key: history.defaultKey,
      noteCount: history.defaultNoteCount,
    };
  }

  const family = findFamily(familyId);

  if (!family) {
    return { key: 'D', noteCount: 9 };
  }

  const key =
    family.defaultKey ||
    family.supportedKeys.find((k) => k === 'D') ||
    family.supportedKeys[0];

  const noteCount = family.defaultNoteCount || family.suggestedNoteCounts[0];

  return { key, noteCount };
}

export function resolveHandpanConfig(
  selection: HandpanSelection
): HandpanConfig | null {
  initializeConfigIndex();

  // Migrate family *and* shell. Canonicalising only the family left a
  // selection like { ionian, D, 13 } resolving to nothing, since Sabye offers
  // 9 notes only — the same gap `getHandpanConfig` covers for string ids.
  const migrated = resolveLegacySelection(
    selection.familyId,
    selection.key,
    selection.noteCount
  );
  if (!migrated) {
    return null;
  }

  const key = `${migrated.familyId}:${selection.key}:${migrated.noteCount}`;
  return CONFIG_INDEX.get(key) || null;
}

export function getInitialSelection(): HandpanSelection {
  const firstFamily = HANDPAN_FAMILIES[0];
  const defaults = getDefaultSelection(firstFamily.id);

  return {
    familyId: firstFamily.id,
    key: defaults.key,
    noteCount: defaults.noteCount,
  };
}

export interface FamilySwitchSelection {
  key: PitchClass;
  noteCount: number;
  /**
   * The key the user was on, set only when the new family could not offer it.
   * The UI announces this; silently landing somewhere else is the defect.
   */
  movedFromKey?: PitchClass;
}

/**
 * The selection to land on when switching family, preferring the one the user
 * already had.
 *
 * Resetting to the new family's defaults unconditionally lost the key on every
 * switch, so comparing "the same key across families" — the main reason to
 * switch at all — was impossible. Key is preserved ahead of shell size: a
 * player picks D because their pan is in D, whereas the pad count is a
 * property of the layout they are browsing.
 */
export function getSelectionForFamily(
  familyId: string,
  current: { key: PitchClass; noteCount: number }
): FamilySwitchSelection {
  const defaults = getDefaultSelection(familyId);
  const resolves = (key: PitchClass, noteCount: number) =>
    resolveHandpanConfig({ familyId, key, noteCount }) !== null;

  // Both carried over.
  if (resolves(current.key, current.noteCount)) {
    return { key: current.key, noteCount: current.noteCount };
  }

  // Key carried over, shell falls back to whatever this family opens on.
  if (resolves(current.key, defaults.noteCount)) {
    return { key: current.key, noteCount: defaults.noteCount };
  }

  // Key carried over on some other shell this family publishes.
  for (const noteCount of getNoteCountOptions(familyId)) {
    if (resolves(current.key, noteCount)) {
      return { key: current.key, noteCount };
    }
  }

  // Nothing in this family is in that key; say so rather than moving quietly.
  return {
    key: defaults.key,
    noteCount: defaults.noteCount,
    movedFromKey: current.key,
  };
}

export interface FamilyPreviewOption extends FamilyOption {
  /** Mood words for this family, joined for display. Empty when unknown. */
  mood: string;
  /** The selection that previews this family, for the audio preview button. */
  preview: { key: PitchClass; noteCount: number };
}

/**
 * Family options carrying the mood words the picker shows beside each name.
 *
 * Choosing a scale is a "how does it feel" decision, so the list needs more
 * than a family name to choose from. The words come from the family's own
 * default tuning rather than a second hand-maintained list, so they cannot
 * drift from what the About panel says about the same scale.
 *
 * Built fresh per call, like `getFamilyOptions` above. A module-level cache
 * would hand every caller the same array to mutate, and for a catalogue of
 * this size it saves nothing worth that.
 */
export function getFamilyPreviewOptions(): FamilyPreviewOption[] {
  return getFamilyOptions().map((option) => {
    const preview = getDefaultSelection(option.id);
    const config = resolveHandpanConfig({
      familyId: option.id,
      key: preview.key,
      noteCount: preview.noteCount,
    });

    return {
      ...option,
      mood: (config?.scaleMoodTags ?? []).join(' · '),
      preview,
    };
  });
}

/** What an embedder may ask the widget to open on, before validation. */
export interface HandpanSelectionRequest {
  familyId?: string | null;
  key?: string | null;
  noteCount?: number | string | null;
}

/**
 * Accept a key however it was typed: `d`, `F#`, `bb`, `E♭`.
 *
 * An embed passes this as an HTML attribute, so it arrives as whatever the
 * page author wrote. Anything that does not then match a published key falls
 * back rather than resolving to nothing.
 */
function normalizeKeyRequest(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return '';
  }

  const accidentals = trimmed
    .slice(1)
    .replace(/♯/g, '#')
    .replace(/♭/g, 'b')
    .toLowerCase();

  return trimmed[0].toUpperCase() + accidentals;
}

/**
 * The selection to open on, given what an embedder asked for.
 *
 * Every field is validated against what the family actually publishes, and the
 * whole thing is then checked against the catalog: a request that would resolve
 * to no instrument is discarded in favour of the default rather than rendering
 * an empty widget. Fields are independent, so a good family with a nonsense key
 * keeps the family and takes that family's default key.
 *
 * Merged-away ids are honoured as given — `equinox` opens on its own G, not on
 * Integral's D — for the same reason `getKeyOptions` and `getDefaultSelection`
 * treat them as first-class.
 */
export function resolveInitialSelection(
  request: HandpanSelectionRequest = {}
): HandpanSelection {
  const fallback = getInitialSelection();

  const requestedFamilyId = request.familyId?.trim();
  const familyId =
    requestedFamilyId &&
    (MERGED_FAMILY_HISTORY[requestedFamilyId] || findFamily(requestedFamilyId))
      ? requestedFamilyId
      : fallback.familyId;

  const defaults = getDefaultSelection(familyId);

  const requestedKey = request.key ? normalizeKeyRequest(request.key) : '';
  const key = getKeyOptions(familyId).includes(requestedKey as PitchClass)
    ? (requestedKey as PitchClass)
    : defaults.key;

  const requestedNoteCount = Number(request.noteCount);
  const noteCount = getNoteCountOptions(familyId).includes(requestedNoteCount)
    ? requestedNoteCount
    : defaults.noteCount;

  const selection = { familyId, key, noteCount };

  return resolveHandpanConfig(selection) ? selection : fallback;
}
