import { describe, it, expect } from 'vitest';
import { HANDPAN_CONFIGS } from '../../config/handpans';
import legacyPresets from './__fixtures__/legacy-presets.json';

/**
 * Golden contract for the preset catalog.
 *
 * Preset ids (`kurd-cs-9`) are user-facing: they may be deep-linked and are
 * persisted in selection state. This fixture freezes every id, its ding, its
 * ordered note list and its pad roles as they stood at the start of the
 * handpan-core-split refactor (HEAD 8db2946).
 *
 * The refactor moves this data into `core/` behind a compat shim. Nothing about
 * the observable catalog may change while that move happens, so this suite must
 * stay green throughout.
 *
 * Deliberate data corrections (e.g. fixing the Pygmy/Equinox/Oxalis interval
 * sets, or per-preset ding octaves) are expected to change this fixture — but
 * only in a commit that updates it explicitly, so the diff shows exactly which
 * pitches changed and why.
 */

interface LegacyPreset {
  id: string;
  familyId?: string;
  tonicPc?: string;
  noteCount?: number;
  ding?: string;
  notes: string[];
  padRoles: string[];
}

const fixture = legacyPresets as LegacyPreset[];

function currentSnapshot(): LegacyPreset[] {
  return HANDPAN_CONFIGS.map((config) => ({
    id: config.id,
    familyId: config.familyId,
    tonicPc: config.tonicPc,
    noteCount: config.noteCount,
    ding: config.ding,
    notes: config.notes,
    padRoles: config.layout.map(
      (pad) => `${pad.id}:${pad.note}:${pad.role ?? 'ring'}`
    ),
  })).sort((a, b) => a.id.localeCompare(b.id));
}

describe('preset catalog golden contract', () => {
  it('generates exactly the frozen set of preset ids', () => {
    const currentIds = currentSnapshot().map((p) => p.id);
    const fixtureIds = fixture.map((p) => p.id);

    expect(currentIds).toEqual(fixtureIds);
  });

  it('preserves ding, ordered notes and pad roles for every preset', () => {
    expect(currentSnapshot()).toEqual(fixture);
  });

  it('keeps the documented id format familyId-key-noteCount', () => {
    for (const preset of currentSnapshot()) {
      const expectedId = `${preset.familyId}-${preset.tonicPc
        ?.toLowerCase()
        .replace('#', 's')}-${preset.noteCount}`;

      expect(preset.id).toBe(expectedId);
    }
  });

  it('covers every family in the catalog', () => {
    const families = new Set(currentSnapshot().map((p) => p.familyId));

    // 11: four families merged into the one whose pitch-class set they
    // duplicated, and four removed because their data could not be sourced.
    expect(families.size).toBe(11);
  });
});
