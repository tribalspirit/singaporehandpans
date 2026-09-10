import { describe, it, expect } from 'vitest';
import {
  buildPadIdentities,
  padVisibleLabel,
  padAccessibleName,
} from './padLabel';
import {
  buildHandpanConfigFromFamily,
  getHandpanFamilyById,
} from '../../config/handpanFamilies';

function dKurd9() {
  const family = getHandpanFamilyById('kurd');
  if (!family) throw new Error('kurd family missing');
  return buildHandpanConfigFromFamily(family, 'D', 9);
}

describe('pad labelling', () => {
  it('numbers the ding 1 and the ring upward from 2', () => {
    const config = dKurd9();
    const identities = buildPadIdentities(config.layout, config.notes);

    const dingPad = config.layout.find((pad) => pad.role === 'ding');
    expect(dingPad).toBeDefined();
    expect(identities.get(dingPad!.id)?.sequenceIndex).toBe(1);

    const indices = config.layout
      .map((pad) => identities.get(pad.id)?.sequenceIndex)
      .sort((a, b) => (a ?? 0) - (b ?? 0));
    expect(indices).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('assigns each pad a distinct sequence index', () => {
    const config = dKurd9();
    const identities = buildPadIdentities(config.layout, config.notes);
    const seen = new Set(
      config.layout.map((pad) => identities.get(pad.id)?.sequenceIndex)
    );

    expect(seen.size).toBe(config.layout.length);
  });

  it('shows pitch in note mode and the sequence number in number mode', () => {
    const config = dKurd9();
    const identities = buildPadIdentities(config.layout, config.notes);
    const pad = config.layout[0];
    const identity = identities.get(pad.id);

    expect(padVisibleLabel(pad, identity, 'note')).toBe(pad.note);
    expect(padVisibleLabel(pad, identity, 'number')).toBe(
      String(identity?.sequenceIndex)
    );
  });

  /**
   * The accessible name must not depend on the visual notation: switching the
   * sighted view to numbers must not strip pitch from assistive technology.
   */
  it('keeps pitch, number, shell and role in the accessible name', () => {
    const config = dKurd9();
    const identities = buildPadIdentities(config.layout, config.notes);
    const pad = config.layout.find((p) => p.role === 'ding')!;

    const name = padAccessibleName(pad, identities.get(pad.id));

    expect(name).toContain(pad.note);
    expect(name).toContain('Pad 1');
    expect(name).toContain('top shell');
    expect(name).toContain('ding');
  });

  it('gives the same accessible name whichever notation is displayed', () => {
    const config = dKurd9();
    const identities = buildPadIdentities(config.layout, config.notes);

    for (const pad of config.layout) {
      const identity = identities.get(pad.id);
      // The accessible name takes no notation argument at all, which is the
      // structural guarantee that it cannot drift between modes.
      expect(padAccessibleName(pad, identity)).toContain(pad.note);
    }
  });
});
