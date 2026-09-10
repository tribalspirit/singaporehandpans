import { describe, it, expect } from 'vitest';
import { findPlayableChords } from './chords';

/**
 * Regression guard for the extended-chord templates.
 *
 * `getIntervalsFromRoot()` returns intervals sorted ascending, but six
 * templates were authored with the 9th written last (`add9 [0,4,7,2]`), and
 * `arraysEqual` compares positionally. `[0,2,4,7] !== [0,4,7,2]`, so those six
 * chord types could never be produced regardless of the tuning selected.
 *
 * Each case below supplies a pitch collection that literally contains the
 * chord's required pitch classes, so a correct implementation must find it.
 */

function namesFor(notes: string[]): string[] {
  return findPlayableChords(notes).map((chord) => chord.displayName);
}

describe('extended chord templates are reachable', () => {
  it('finds Cadd9 in a collection containing C E G D', () => {
    expect(namesFor(['C4', 'D4', 'E4', 'G4'])).toContain('Cadd9');
  });

  it('finds C9 in a collection containing C E G Bb D', () => {
    expect(namesFor(['C4', 'D4', 'E4', 'G4', 'Bb4'])).toContain('C9');
  });

  it('finds Cmaj9 in a collection containing C E G B D', () => {
    expect(namesFor(['C4', 'D4', 'E4', 'G4', 'B4'])).toContain('Cmaj9');
  });

  it('finds Cm9 in a collection containing C Eb G Bb D', () => {
    expect(namesFor(['C4', 'D4', 'Eb4', 'G4', 'Bb4'])).toContain('Cm9');
  });

  it('finds C9sus4 in a collection containing C F G Bb D', () => {
    expect(namesFor(['C4', 'D4', 'F4', 'G4', 'Bb4'])).toContain('C9sus4');
  });

  it('finds C6add9 in a collection containing C E G A D', () => {
    expect(namesFor(['C4', 'D4', 'E4', 'G4', 'A4'])).toContain('C6add9');
  });

  /**
   * Plain triads are intentionally NOT this function's job — the UI renders
   * them from `getDiatonicTriads` in a separate section. Guard that split so a
   * later refactor does not quietly duplicate triads into both lists.
   */
  it('leaves plain triads to the diatonic-triad path', () => {
    expect(namesFor(['C4', 'E4', 'G4'])).toEqual([]);
  });
});
