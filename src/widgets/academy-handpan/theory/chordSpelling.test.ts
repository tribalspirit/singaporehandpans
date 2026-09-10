import { describe, it, expect } from 'vitest';
import { findPlayableChords } from './chords';
import { getDiatonicTriads } from './diatonicTriads';
import {
  buildHandpanConfigFromFamily,
  getHandpanFamilyById,
} from '../config/handpanFamilies';

/**
 * Chord names must be spelled in the same key as the pads.
 *
 * Pad labels are spelled by scale degree, so a C# tuning shows G# and D#. Chord
 * names were built from the comparison canonical form instead, which is a fixed
 * twelve-name table, so the same instrument showed "G#3" on a pad and "Abm7" in
 * the chord list. Both name the same pitch; seeing both at once in a tool whose
 * purpose is learning note names is worse than either alone.
 *
 * Canonical names remain correct for *comparison* — this is only about display.
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

function chordNames(notes: string[]): string[] {
  return findPlayableChords(notes).map((chord) => chord.displayName);
}

describe('chord names follow the key', () => {
  it('uses sharps in a sharp key', () => {
    const names = chordNames(notesFor('kurd', 'C#', 9));

    expect(names).toContain('G#m7');
    expect(names).toContain('G#7sus4');
    expect(names).toContain('D#ø7');

    expect(names.some((name) => name.startsWith('Ab'))).toBe(false);
    expect(names.some((name) => name.startsWith('Eb'))).toBe(false);
  });

  it('uses flats in a flat key', () => {
    const names = chordNames(notesFor('kurd', 'F', 9));

    expect(names.some((name) => name.startsWith('Bb'))).toBe(true);
    expect(names.some((name) => name.startsWith('A#'))).toBe(false);
  });

  it('spells chord roots the same way the pads are spelled', () => {
    for (const [family, key] of [
      ['kurd', 'C#'],
      ['kurd', 'F#'],
      ['akebono', 'F'],
      ['pygmy', 'F'],
    ] as const) {
      const notes = notesFor(family, key, 9);
      const padAccidentals = new Set(
        notes
          .map((note) => note.replace(/\d+$/, ''))
          .filter((pitchClass) => pitchClass.length > 1)
          .map((pitchClass) => pitchClass[1])
      );

      // A tuning spelled entirely with sharps must not name a chord with a
      // flat root, and vice versa.
      for (const name of chordNames(notes)) {
        const accidental = name[1];
        if (accidental !== '#' && accidental !== 'b') continue;

        expect(
          padAccidentals.has(accidental),
          `${family} ${key}: chord "${name}" uses ${accidental} but pads use ${[...padAccidentals].join('/') || 'none'}`
        ).toBe(true);
      }
    }
  });

  it('spells triad names in the key too', () => {
    // Triads are built on a separate path from the added-note chords, so they
    // need the same treatment or one list contradicts the other on screen.
    const notes = notesFor('kurd', 'C#', 9);
    const triadNames = getDiatonicTriads(notes, notes).map(
      (triad) => triad.chord.displayName
    );

    expect(triadNames).toContain('G#m');
    expect(triadNames).toContain('D#°');
    expect(triadNames.some((name) => name.startsWith('Ab'))).toBe(false);
    expect(triadNames.some((name) => name.startsWith('Eb'))).toBe(false);
  });

  it('does not change how many chords are found', () => {
    // Spelling is display only: it must not affect which chords exist.
    expect(chordNames(notesFor('kurd', 'C#', 9))).toHaveLength(
      chordNames(notesFor('kurd', 'D', 9)).length
    );
  });
});
