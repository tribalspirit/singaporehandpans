// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import * as Chord from '@tonaljs/chord';
import { getDiatonicTriads } from '../theory/diatonicTriads';

/**
 * Degree labels must agree with the triads they sit on.
 *
 * The tiles carry their own degree so the colour-only legend could be removed.
 * That only helps if the labels are right: case is the whole signal — lowercase
 * for minor, uppercase for major, with the symbol for diminished. Deriving the
 * quality from `chord.name` (a synthetic "E-triad-2") silently produced
 * "Unknown" and printed every degree uppercase.
 *
 * These assert on the same source the component reads, `displayName`.
 */

const D_KURD_9 = ['D3', 'A3', 'Bb3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4'];

function qualityOf(displayName: string) {
  return Chord.get(displayName).quality;
}

describe('diatonic triad degree labels', () => {
  it('resolves a real quality for every triad in D Kurd', () => {
    const triads = getDiatonicTriads(D_KURD_9, D_KURD_9, {
      dingIsTonalCentre: true,
    });

    expect(triads.length).toBeGreaterThan(0);
    for (const { chord } of triads) {
      expect(
        qualityOf(chord.displayName),
        `${chord.displayName} (name "${chord.name}") has no parseable quality`
      ).not.toBe('Unknown');
    }
  });

  it('identifies the minor and diminished degrees D Kurd actually has', () => {
    const byDegree = new Map(
      getDiatonicTriads(D_KURD_9, D_KURD_9, { dingIsTonalCentre: true }).map(
        (t) => [t.degree, t.chord.displayName]
      )
    );

    // Natural minor: i ii° III iv v VI VII.
    expect(qualityOf(byDegree.get(2)!)).toBe('Diminished');
    expect(qualityOf(byDegree.get(4)!)).toBe('Minor');
    expect(qualityOf(byDegree.get(5)!)).toBe('Minor');
    expect(qualityOf(byDegree.get(6)!)).toBe('Major');
    expect(qualityOf(byDegree.get(7)!)).toBe('Major');
  });

  /** The synthetic id is exactly what must not be parsed. */
  it('cannot derive quality from the internal chord name', () => {
    const [first] = getDiatonicTriads(D_KURD_9, D_KURD_9, {
      dingIsTonalCentre: true,
    });

    expect(first.chord.name).toMatch(/-triad-\d/);
    expect(Chord.get(first.chord.name).quality).toBe('Unknown');
  });
});
