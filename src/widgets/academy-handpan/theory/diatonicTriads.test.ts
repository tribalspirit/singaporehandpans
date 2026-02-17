import { describe, it, expect } from 'vitest';
import { getDiatonicTriads } from './diatonicTriads';
import { normalizeToPitchClass } from './normalize';
import { note } from '@tonaljs/core';

/** Valid triad interval templates */
const VALID_TEMPLATES = [
  [0, 3, 7], // minor
  [0, 4, 7], // major
  [0, 3, 6], // diminished
  [0, 4, 8], // augmented
];

/** Compute intervals from root to other pitch classes */
function getTriadIntervals(pitchClasses: string[]): number[] {
  const rootMidi = note(`${pitchClasses[0]}4`).midi!;
  return pitchClasses.map((pc) => {
    const midi = note(`${pc}4`).midi!;
    return (((midi - rootMidi) % 12) + 12) % 12;
  });
}

/**
 * Helper: get triads for a handpan given notes array.
 * Returns display names sorted alphabetically for stable comparison.
 */
function getTriadNames(handpanNotes: string[]): string[] {
  const triads = getDiatonicTriads(handpanNotes, handpanNotes);
  return triads.map((t) => t.chord.displayName).sort();
}

describe('diatonicTriads', () => {
  // ─── Structural / edge-case tests ─────────────────────────────────────

  describe('edge cases', () => {
    it('should return empty array for empty input', () => {
      expect(getDiatonicTriads([], [])).toEqual([]);
    });

    it('should return empty array for fewer than 5 unique pitch classes', () => {
      expect(getDiatonicTriads(['C4', 'D4'], ['C4', 'D4'])).toEqual([]);
      expect(
        getDiatonicTriads(['C4', 'D4', 'E4', 'F4'], ['C4', 'D4', 'E4', 'F4'])
      ).toEqual([]);
    });

    it('should handle duplicate notes across octaves', () => {
      const notes = ['D3', 'A3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'C5'];
      const triads = getDiatonicTriads(notes, notes);
      expect(triads.length).toBeGreaterThan(0);
    });
  });

  // ─── Invariant tests (apply to all triads) ────────────────────────────

  describe('triad invariants', () => {
    const testCases = [
      {
        name: 'Kurd D',
        notes: ['D3', 'A3', 'Bb3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4'],
      },
      {
        name: 'Celtic Minor D',
        notes: ['D3', 'A3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'C5'],
      },
      {
        name: 'Pygmy F',
        notes: ['F3', 'C4', 'Eb4', 'F4', 'Ab4', 'Bb4', 'C5', 'Eb5', 'F5'],
      },
      {
        name: 'Aegean D',
        notes: ['D3', 'A3', 'B3', 'D4', 'E4', 'F#4', 'A4', 'B4', 'D5'],
      },
    ];

    for (const tc of testCases) {
      it(`${tc.name}: all pitch classes must be in the scale`, () => {
        const scalePcs = new Set(tc.notes.map(normalizeToPitchClass));
        const triads = getDiatonicTriads(tc.notes, tc.notes);
        for (const triad of triads) {
          for (const pc of triad.chord.pitchClasses) {
            expect(scalePcs.has(pc)).toBe(true);
          }
        }
      });

      it(`${tc.name}: all triads must match a valid interval template`, () => {
        const triads = getDiatonicTriads(tc.notes, tc.notes);
        for (const triad of triads) {
          const intervals = getTriadIntervals(triad.chord.pitchClasses);
          const matchesTemplate = VALID_TEMPLATES.some(
            (t) =>
              t[0] === intervals[0] &&
              t[1] === intervals[1] &&
              t[2] === intervals[2]
          );
          expect(matchesTemplate).toBe(true);
        }
      });

      it(`${tc.name}: all concrete notes must be from available notes`, () => {
        const triads = getDiatonicTriads(tc.notes, tc.notes);
        for (const triad of triads) {
          for (const n of triad.chord.notes) {
            expect(tc.notes).toContain(n);
          }
        }
      });
    }
  });

  // ─── Per-family exact assertions ──────────────────────────────────────

  describe('Kurd D (7-note, natural minor)', () => {
    const notes = ['D3', 'A3', 'Bb3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4'];

    it('should produce 7 triads', () => {
      const triads = getDiatonicTriads(notes, notes);
      expect(triads.length).toBe(7);
    });

    it('should produce correct triads', () => {
      expect(getTriadNames(notes)).toEqual(
        ['Am', 'Bb', 'C', 'Dm', 'E°', 'F', 'Gm'].sort()
      );
    });

    it('should mark Dm as tonic', () => {
      const triads = getDiatonicTriads(notes, notes);
      const tonic = triads.find((t) => t.isTonic);
      expect(tonic?.chord.displayName).toBe('Dm');
    });

    it('should mark F as relative major', () => {
      const triads = getDiatonicTriads(notes, notes);
      const relMaj = triads.find((t) => t.isRelativeMajor);
      expect(relMaj?.chord.displayName).toBe('F');
    });
  });

  describe('Aeolian A (7-note, natural minor)', () => {
    const notes = ['A3', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5'];

    it('should produce 7 triads', () => {
      expect(getDiatonicTriads(notes, notes).length).toBe(7);
    });

    it('should produce correct triads', () => {
      expect(getTriadNames(notes)).toEqual(
        ['Am', 'B°', 'C', 'Dm', 'Em', 'F', 'G'].sort()
      );
    });

    it('should mark Am as tonic and C as relative major', () => {
      const triads = getDiatonicTriads(notes, notes);
      expect(triads.find((t) => t.isTonic)?.chord.displayName).toBe('Am');
      expect(triads.find((t) => t.isRelativeMajor)?.chord.displayName).toBe(
        'C'
      );
    });
  });

  describe('Celtic Minor D (6-note, hexatonic)', () => {
    const notes = ['D3', 'A3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'C5'];

    it('should produce 4 triads (not 7)', () => {
      expect(getDiatonicTriads(notes, notes).length).toBe(4);
    });

    it('should produce Dm, F, Am, C', () => {
      expect(getTriadNames(notes)).toEqual(['Am', 'C', 'Dm', 'F'].sort());
    });

    it('should mark Dm as tonic and F as relative major', () => {
      const triads = getDiatonicTriads(notes, notes);
      expect(triads.find((t) => t.isTonic)?.chord.displayName).toBe('Dm');
      expect(triads.find((t) => t.isRelativeMajor)?.chord.displayName).toBe(
        'F'
      );
    });
  });

  describe('Integral D (6-note)', () => {
    const notes = ['D3', 'A3', 'Bb3', 'C4', 'D4', 'E4', 'F4', 'A4', 'C5'];

    it('should produce 4 triads', () => {
      expect(getDiatonicTriads(notes, notes).length).toBe(4);
    });

    it('should produce Dm, F, Am, Bb', () => {
      expect(getTriadNames(notes)).toEqual(['Am', 'Bb', 'Dm', 'F'].sort());
    });
  });

  describe('Mystic D (6-note)', () => {
    const notes = ['D3', 'A3', 'Eb4', 'C4', 'D4', 'F4', 'G4', 'A4', 'C5'];

    it('should produce 4 triads', () => {
      expect(getDiatonicTriads(notes, notes).length).toBe(4);
    });

    it('should produce Dm, F, A°, Cm', () => {
      expect(getTriadNames(notes)).toEqual(['A°', 'Cm', 'Dm', 'F'].sort());
    });
  });

  describe('Pygmy F (5-note, pentatonic)', () => {
    const notes = ['F3', 'C4', 'Eb4', 'F4', 'Ab4', 'Bb4', 'C5', 'Eb5', 'F5'];

    it('should produce only 2 triads', () => {
      expect(getDiatonicTriads(notes, notes).length).toBe(2);
    });

    it('should produce Fm, Ab', () => {
      expect(getTriadNames(notes)).toEqual(['Ab', 'Fm'].sort());
    });

    it('should mark Fm as tonic and Ab as relative major', () => {
      const triads = getDiatonicTriads(notes, notes);
      expect(triads.find((t) => t.isTonic)?.chord.displayName).toBe('Fm');
      expect(triads.find((t) => t.isRelativeMajor)?.chord.displayName).toBe(
        'Ab'
      );
    });
  });

  describe('La Sirena E (6-note)', () => {
    const notes = ['E3', 'B3', 'C#4', 'D4', 'E4', 'F#4', 'G4', 'B4', 'D5'];

    it('should produce 4 triads', () => {
      expect(getDiatonicTriads(notes, notes).length).toBe(4);
    });

    it('should produce Em, G, Bm, C#°', () => {
      expect(getTriadNames(notes)).toEqual(['Bm', 'C#°', 'Em', 'G'].sort());
    });

    it('should mark Em as tonic and G as relative major', () => {
      const triads = getDiatonicTriads(notes, notes);
      expect(triads.find((t) => t.isTonic)?.chord.displayName).toBe('Em');
      expect(triads.find((t) => t.isRelativeMajor)?.chord.displayName).toBe(
        'G'
      );
    });
  });

  describe('Ursa Minor D (6-note, no tonic triad)', () => {
    const notes = ['D3', 'A3', 'Bb3', 'C4', 'D4', 'E4', 'G4', 'A4', 'C5'];

    it('should produce 4 triads', () => {
      expect(getDiatonicTriads(notes, notes).length).toBe(4);
    });

    it('should produce E°, Gm, Am, C', () => {
      expect(getTriadNames(notes)).toEqual(['Am', 'C', 'E°', 'Gm'].sort());
    });

    it('should have no tonic triad (D has no m3 or M3 in scale)', () => {
      const triads = getDiatonicTriads(notes, notes);
      const tonic = triads.find((t) => t.isTonic);
      expect(tonic).toBeUndefined();
    });
  });

  describe('Aegean D (5-note, major pentatonic)', () => {
    const notes = ['D3', 'A3', 'B3', 'D4', 'E4', 'F#4', 'A4', 'B4', 'D5'];

    it('should produce only 2 triads', () => {
      expect(getDiatonicTriads(notes, notes).length).toBe(2);
    });

    it('should produce D, Bm', () => {
      expect(getTriadNames(notes)).toEqual(['Bm', 'D'].sort());
    });

    it('should mark D as tonic', () => {
      const triads = getDiatonicTriads(notes, notes);
      expect(triads.find((t) => t.isTonic)?.chord.displayName).toBe('D');
    });
  });

  describe('Oxalis G (6-note)', () => {
    const notes = ['G3', 'D4', 'E4', 'F#4', 'G4', 'A4', 'B4', 'D5', 'F#5'];

    it('should produce 4 triads', () => {
      expect(getDiatonicTriads(notes, notes).length).toBe(4);
    });

    it('should produce G, Bm, D, Em', () => {
      expect(getTriadNames(notes)).toEqual(['Bm', 'D', 'Em', 'G'].sort());
    });
  });

  describe('Onoleo D (6-note, augmented triads)', () => {
    const notes = ['D3', 'A3', 'C4', 'D4', 'E4', 'F4', 'Ab4', 'A4', 'C5'];

    it('should produce 6 triads', () => {
      expect(getDiatonicTriads(notes, notes).length).toBe(6);
    });

    it('should produce Dm, E+, Fm, Ab+, Am, C+', () => {
      expect(getTriadNames(notes)).toEqual(
        ['Ab+', 'Am', 'C+', 'Dm', 'E+', 'Fm'].sort()
      );
    });

    it('should contain augmented triads (E+, Ab+, C+)', () => {
      const triads = getDiatonicTriads(notes, notes);
      const augmented = triads.filter((t) => t.chord.displayName.endsWith('+'));
      expect(augmented.length).toBe(3);
    });
  });

  describe('Hijaz D (7-note, phrygian dominant)', () => {
    const notes = ['D3', 'A3', 'Bb3', 'C4', 'D4', 'Eb4', 'F#4', 'G4', 'A4'];

    it('should produce 7 triads', () => {
      expect(getDiatonicTriads(notes, notes).length).toBe(7);
    });

    it('should produce correct triads', () => {
      expect(getTriadNames(notes)).toEqual(
        ['A°', 'Bb+', 'Cm', 'D', 'Eb', 'F#°', 'Gm'].sort()
      );
    });

    it('should mark D as tonic', () => {
      const triads = getDiatonicTriads(notes, notes);
      expect(triads.find((t) => t.isTonic)?.chord.displayName).toBe('D');
    });
  });

  describe('Harmonic Minor C (7-note)', () => {
    const notes = ['C3', 'G3', 'Ab3', 'B3', 'C4', 'D4', 'Eb4', 'F4', 'G4'];

    it('should produce 7 triads', () => {
      expect(getDiatonicTriads(notes, notes).length).toBe(7);
    });

    it('should produce correct triads', () => {
      expect(getTriadNames(notes)).toEqual(
        ['Ab', 'B°', 'Cm', 'D°', 'Eb+', 'Fm', 'G'].sort()
      );
    });

    it('should contain Eb+ (augmented III)', () => {
      const triads = getDiatonicTriads(notes, notes);
      expect(triads.some((t) => t.chord.displayName === 'Eb+')).toBe(true);
    });
  });

  describe('Equinox G (7-note, mixolydian)', () => {
    const notes = ['G3', 'D4', 'F4', 'G4', 'A4', 'B4', 'C5', 'E5', 'D5'];

    it('should produce 7 triads', () => {
      expect(getDiatonicTriads(notes, notes).length).toBe(7);
    });

    it('should produce correct triads', () => {
      expect(getTriadNames(notes)).toEqual(
        ['Am', 'B°', 'C', 'Dm', 'Em', 'F', 'G'].sort()
      );
    });
  });

  describe('Magic Voyage D (6 PCs in 9-note layout)', () => {
    const notes = ['D3', 'A3', 'C4', 'D4', 'E4', 'F#4', 'G4', 'A4', 'C5'];

    it('should produce 4 triads (only 6 unique PCs in 9-note)', () => {
      expect(getDiatonicTriads(notes, notes).length).toBe(4);
    });

    it('should produce D, F#°, Am, C', () => {
      expect(getTriadNames(notes)).toEqual(['Am', 'C', 'D', 'F#°'].sort());
    });
  });

  describe('Ionian C (7-note, major)', () => {
    const notes = ['C3', 'G3', 'A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4'];

    it('should produce 7 triads', () => {
      expect(getDiatonicTriads(notes, notes).length).toBe(7);
    });

    it('should produce C, Dm, Em, F, G, Am, B°', () => {
      expect(getTriadNames(notes)).toEqual(
        ['Am', 'B°', 'C', 'Dm', 'Em', 'F', 'G'].sort()
      );
    });

    it('should mark C as tonic with no relative major (already major)', () => {
      const triads = getDiatonicTriads(notes, notes);
      expect(triads.find((t) => t.isTonic)?.chord.displayName).toBe('C');
      expect(triads.find((t) => t.isRelativeMajor)).toBeUndefined();
    });
  });

  describe('Dorian D (7-note)', () => {
    const notes = ['D3', 'A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4'];

    it('should produce 7 triads', () => {
      expect(getDiatonicTriads(notes, notes).length).toBe(7);
    });

    it('should produce Dm, Em, F, G, Am, B°, C', () => {
      expect(getTriadNames(notes)).toEqual(
        ['Am', 'B°', 'C', 'Dm', 'Em', 'F', 'G'].sort()
      );
    });

    it('should mark Dm as tonic and F as relative major', () => {
      const triads = getDiatonicTriads(notes, notes);
      expect(triads.find((t) => t.isTonic)?.chord.displayName).toBe('Dm');
      expect(triads.find((t) => t.isRelativeMajor)?.chord.displayName).toBe(
        'F'
      );
    });
  });

  describe('Lydian F (7-note)', () => {
    const notes = ['F3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];

    it('should produce 7 triads', () => {
      expect(getDiatonicTriads(notes, notes).length).toBe(7);
    });

    it('should produce F, G, Am, B°, C, Dm, Em', () => {
      expect(getTriadNames(notes)).toEqual(
        ['Am', 'B°', 'C', 'Dm', 'Em', 'F', 'G'].sort()
      );
    });
  });

  describe('Mixolydian G (7-note)', () => {
    const notes = ['G3', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5'];

    it('should produce 7 triads', () => {
      expect(getDiatonicTriads(notes, notes).length).toBe(7);
    });

    it('should produce G, Am, B°, C, Dm, Em, F', () => {
      expect(getTriadNames(notes)).toEqual(
        ['Am', 'B°', 'C', 'Dm', 'Em', 'F', 'G'].sort()
      );
    });
  });

  // ─── Circle of Fifths ordering ────────────────────────────────────────

  describe('circle of fifths ordering', () => {
    it('minor key: orders ii° → v → i → iv → VII → III → VI', () => {
      const notes = ['D3', 'A3', 'Bb3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4'];
      const triads = getDiatonicTriads(notes, notes);
      const degrees = triads.map((t) => t.degree);
      expect(degrees).toEqual([2, 5, 1, 4, 7, 3, 6]);
    });

    it('major key: orders vii° → iii → vi → ii → V → I → IV', () => {
      const notes = ['C3', 'G3', 'A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4'];
      const triads = getDiatonicTriads(notes, notes);
      const degrees = triads.map((t) => t.degree);
      expect(degrees).toEqual([7, 3, 6, 2, 5, 1, 4]);
    });
  });
});
