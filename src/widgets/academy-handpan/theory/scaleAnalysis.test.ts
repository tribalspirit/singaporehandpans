import { describe, it, expect } from 'vitest';
import { isDiatonicScale, getDiatonicTriads } from './diatonicTriads';
import {
  buildHandpanConfigFromFamily,
  getHandpanFamilyById,
} from '../config/handpanFamilies';

/**
 * Diatonic claims must be earned.
 *
 * Roman numerals, "relative major" and circle-of-fifths ordering are statements
 * about a seven-note tonal system. The catalog also ships genuinely pentatonic
 * and hexatonic tunings — Akebono, Pygmy, Aegean, Integral — where those labels
 * describe nothing real: a pentatonic's third note is not the III chord.
 *
 * The triads themselves stay useful and are still offered. What must not happen
 * is presenting a position in a five-note set as a diatonic degree.
 */

function notesFor(familyId: string, key: string, noteCount: number): string[] {
  const family = getHandpanFamilyById(familyId);
  if (!family) throw new Error(`missing family ${familyId}`);
  return buildHandpanConfigFromFamily(
    family,
    key as Parameters<typeof buildHandpanConfigFromFamily>[1],
    noteCount
  ).notes;
}

describe('isDiatonicScale', () => {
  it('accepts a seven-note scale that matches a known mode', () => {
    expect(isDiatonicScale(notesFor('kurd', 'D', 9))).toBe(true);
    expect(isDiatonicScale(notesFor('dorian', 'D', 9))).toBe(true);
    expect(isDiatonicScale(notesFor('mixolydian', 'E', 9))).toBe(true);
  });

  it('rejects pentatonic tunings', () => {
    expect(isDiatonicScale(notesFor('akebono', 'F#', 9))).toBe(false);
    expect(isDiatonicScale(notesFor('pygmy', 'F', 9))).toBe(false);
    expect(isDiatonicScale(notesFor('aegean', 'C', 9))).toBe(false);
  });

  it('rejects hexatonic tunings', () => {
    expect(isDiatonicScale(notesFor('integral', 'E', 9))).toBe(false);
    expect(isDiatonicScale(notesFor('celtic-minor', 'D', 9))).toBe(false);
  });

  it('rejects an empty note list', () => {
    expect(isDiatonicScale([])).toBe(false);
  });
});

describe('relative-major claims', () => {
  it('marks a relative major only when the scale is diatonic', () => {
    const kurd = getDiatonicTriads(
      notesFor('kurd', 'D', 9),
      notesFor('kurd', 'D', 9)
    );
    expect(kurd.some((triad) => triad.isRelativeMajor)).toBe(true);
  });

  /**
   * F Pygmy previously flagged Ab as its relative major. Ab major is a real,
   * playable triad in that tuning and is still offered — but "relative major"
   * is a diatonic relationship, and a five-note scale has no diatonic degrees
   * for it to hold between.
   */
  it('makes no relative-major claim about a pentatonic tuning', () => {
    for (const [family, key] of [
      ['pygmy', 'F'],
      ['akebono', 'F#'],
      ['aegean', 'C'],
    ] as const) {
      const notes = notesFor(family, key, 9);
      const triads = getDiatonicTriads(notes, notes);

      expect(
        triads.some((triad) => triad.isRelativeMajor),
        `${family} ${key}`
      ).toBe(false);
    }
  });

  it('makes no relative-major claim about a hexatonic tuning', () => {
    const notes = notesFor('integral', 'E', 9);
    const triads = getDiatonicTriads(notes, notes);

    expect(triads.some((triad) => triad.isRelativeMajor)).toBe(false);
  });

  it('still offers the playable triads for a pentatonic tuning', () => {
    const notes = notesFor('pygmy', 'F', 9);
    const triads = getDiatonicTriads(notes, notes);

    expect(triads.length).toBeGreaterThan(0);
    expect(triads.map((t) => t.chord.displayName)).toContain('Ab');
  });

  it('still marks the ding as tonic whatever the scale size', () => {
    for (const [family, key] of [
      ['pygmy', 'F'],
      ['kurd', 'D'],
    ] as const) {
      const notes = notesFor(family, key, 9);
      const triads = getDiatonicTriads(notes, notes);

      expect(
        triads.some((triad) => triad.isTonic),
        `${family}`
      ).toBe(true);
    }
  });
});
