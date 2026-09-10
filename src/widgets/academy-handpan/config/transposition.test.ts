import { describe, it, expect } from 'vitest';
import { note as parseNote } from '@tonaljs/core';
import {
  HANDPAN_FAMILIES,
  buildHandpanConfigFromFamily,
} from './handpanFamilies';
import { findPlayableChords } from '../theory/chords';
import type { PitchClass } from './types';

/**
 * Property tests over every family in every key it supports.
 *
 * Transposing an instrument changes its pitch, and nothing else. Interval
 * structure, note count, ordering and which chords are playable are all
 * properties of the tuning, not of the key it happens to be in — so they must
 * be invariant across every supported key.
 *
 * These are written as properties rather than examples because the failures
 * they guard against are the ones example tests miss: a spelling change that
 * silently alters a pitch, an octave bump that reorders notes, a chord that
 * appears in D but not in F#.
 */

function midiOf(noteName: string): number {
  const midi = parseNote(noteName).midi;
  if (midi === null || midi === undefined) {
    throw new Error(`cannot read midi for ${noteName}`);
  }
  return midi;
}

/** Semitone gaps between consecutive notes — the tuning's shape. */
function intervalShape(notes: string[]): number[] {
  const midis = notes.map(midiOf);
  return midis.slice(1).map((midi, index) => midi - midis[index]);
}

function eachFamilyKeyAndCount(
  visit: (
    familyId: string,
    key: PitchClass,
    noteCount: number,
    notes: string[]
  ) => void
): void {
  for (const family of HANDPAN_FAMILIES) {
    for (const key of family.supportedKeys) {
      for (const noteCount of family.suggestedNoteCounts) {
        const config = buildHandpanConfigFromFamily(family, key, noteCount);
        visit(family.id, key, noteCount, config.notes);
      }
    }
  }
}

describe('transposition invariants', () => {
  it('keeps the interval shape identical in every key', () => {
    const mismatches: string[] = [];

    for (const family of HANDPAN_FAMILIES) {
      for (const noteCount of family.suggestedNoteCounts) {
        const shapes = family.supportedKeys.map((key) => ({
          key,
          shape: intervalShape(
            buildHandpanConfigFromFamily(family, key, noteCount).notes
          ).join(','),
        }));

        const reference = shapes[0];
        for (const candidate of shapes.slice(1)) {
          if (candidate.shape !== reference.shape) {
            mismatches.push(
              `${family.id}/${noteCount}: ${candidate.key} [${candidate.shape}] != ${reference.key} [${reference.shape}]`
            );
          }
        }
      }
    }

    expect(mismatches).toEqual([]);
  });

  it('produces the requested number of notes', () => {
    const wrong: string[] = [];

    eachFamilyKeyAndCount((familyId, key, noteCount, notes) => {
      if (notes.length !== noteCount) {
        wrong.push(`${familyId}/${key}/${noteCount}: got ${notes.length}`);
      }
    });

    expect(wrong).toEqual([]);
  });

  it('orders every tuning strictly upward, with the ding lowest', () => {
    const unordered: string[] = [];

    eachFamilyKeyAndCount((familyId, key, noteCount, notes) => {
      const midis = notes.map(midiOf);
      for (let index = 1; index < midis.length; index += 1) {
        if (midis[index] <= midis[index - 1]) {
          unordered.push(
            `${familyId}/${key}/${noteCount}: ${notes[index - 1]} -> ${notes[index]}`
          );
          break;
        }
      }
    });

    expect(unordered).toEqual([]);
  });

  it('spells every note so it sounds the pitch it names', () => {
    // Guards the key-aware speller: a wrong letter would still parse, but the
    // pitch it names would drift from the interval the tuning asked for.
    const drifted: string[] = [];

    for (const family of HANDPAN_FAMILIES) {
      for (const key of family.supportedKeys) {
        for (const noteCount of family.suggestedNoteCounts) {
          const notes = buildHandpanConfigFromFamily(
            family,
            key,
            noteCount
          ).notes;
          const dingMidi = midiOf(notes[0]);
          const ring =
            family.orderedRingIntervalsByNoteCount?.[noteCount] ?? [];

          ring.forEach((interval, index) => {
            const actual = (midiOf(notes[index + 1]) - dingMidi) % 12;
            const expected = ((interval % 12) + 12) % 12;
            if (actual !== expected) {
              drifted.push(
                `${family.id}/${key}/${noteCount} note ${index + 1}: ${notes[index + 1]} is +${actual}, expected +${expected}`
              );
            }
          });
        }
      }
    }

    expect(drifted).toEqual([]);
  });

  it('offers the same chord shapes in every key', () => {
    // Chord availability follows from interval structure, so a chord playable
    // in one key must be playable in all of them. Compared as intervals above
    // the ding rather than by name, since names are key-dependent.
    const mismatches: string[] = [];

    for (const family of HANDPAN_FAMILIES) {
      const noteCount = family.suggestedNoteCounts[0];

      const shapesByKey = family.supportedKeys.map((key) => {
        const notes = buildHandpanConfigFromFamily(
          family,
          key,
          noteCount
        ).notes;
        const dingPitchClass = midiOf(notes[0]) % 12;

        const shapes = findPlayableChords(notes).map((chord) =>
          chord.pitchClasses
            .map(
              (pitchClass) =>
                (midiOf(`${pitchClass}4`) - dingPitchClass + 12) % 12
            )
            .sort((a, b) => a - b)
            .join(',')
        );

        return { key, shapes: [...new Set(shapes)].sort().join(' | ') };
      });

      const reference = shapesByKey[0];
      for (const candidate of shapesByKey.slice(1)) {
        if (candidate.shapes !== reference.shapes) {
          mismatches.push(
            `${family.id}: ${candidate.key} differs from ${reference.key}`
          );
        }
      }
    }

    expect(mismatches).toEqual([]);
  });

  it('never mutates the source family data', () => {
    const before = JSON.stringify(HANDPAN_FAMILIES);
    eachFamilyKeyAndCount(() => {});
    expect(JSON.stringify(HANDPAN_FAMILIES)).toBe(before);
  });
});
