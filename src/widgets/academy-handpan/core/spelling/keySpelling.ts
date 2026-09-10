/**
 * Key-aware pitch spelling.
 *
 * Pitch *identity* is an integer; pitch *spelling* is a display decision. The
 * catalog previously spelled notes through a single fixed table
 * (`C, C#, D, Eb, E, F, F#, G, Ab, A, Bb, B`) that ignored the selected key, so
 * C# Kurd rendered as `[A, Ab, B, C#, E, Eb, F#]` — the right pitches spelled
 * with the wrong letters (`Ab`/`Eb` where C# minor requires `G#`/`D#`).
 *
 * A simple sharp-or-flat preference per key is not enough either: harmonic
 * minor in A needs a raised 7th spelled `G#`, while mixolydian in C needs a
 * lowered 7th spelled `Bb`. Both are "neutral" keys.
 *
 * So spell by scale degree instead. Each interval above the tonic maps to a
 * letter step; the letter fixes the note name, and the accidental is whatever
 * makes that letter sound the required pitch. This produces conventional
 * spelling for modal, harmonic-minor and Hijaz-style tunings alike.
 */

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;

/** Pitch class of each natural letter, indexed as LETTERS. */
const NATURAL_PITCH_CLASSES = [0, 2, 4, 5, 7, 9, 11];

/**
 * Letter steps above the tonic for each semitone interval.
 *
 * Minor/lowered degrees take the same letter as their major counterpart
 * (semitone 3 is a third, spelled with a flat), which is what makes
 * `b3`/`b6`/`b7` come out right. The tritone is treated as an augmented
 * fourth, the usual reading for the Hijaz-family tunings in this catalog.
 */
const SEMITONE_TO_LETTER_STEP = [0, 1, 1, 2, 2, 3, 3, 4, 5, 5, 6, 6];

/**
 * Pitch class of a spelled note name, computed from its letter and accidentals
 * rather than looked up, so legitimate-but-uncommon spellings resolve too.
 * `E#` is the major third of C#, and `Cb` the minor second of Bb; both are
 * correct names this module can emit.
 */
export function pitchClassOf(pitchClassName: string): number {
  const letterIndex = LETTERS.indexOf(
    pitchClassName[0] as (typeof LETTERS)[number]
  );
  if (letterIndex === -1) {
    throw new Error(`Unknown pitch class: ${pitchClassName}`);
  }

  let alteration = 0;
  for (const character of pitchClassName.slice(1)) {
    if (character === '#') alteration += 1;
    else if (character === 'b') alteration -= 1;
    else throw new Error(`Unknown pitch class: ${pitchClassName}`);
  }

  return (((NATURAL_PITCH_CLASSES[letterIndex] + alteration) % 12) + 12) % 12;
}

function accidentalFor(alteration: number): string {
  if (alteration > 0) return '#'.repeat(alteration);
  if (alteration < 0) return 'b'.repeat(-alteration);
  return '';
}

/**
 * Spell the note `semitones` above `tonicPitchClass`, as a pitch class name.
 *
 * Falls back to the tonic's own accidental preference if the degree-derived
 * letter would need a triple accidental, which no tuning in the catalog
 * requires but which must not produce nonsense if one ever does.
 */
export function spellIntervalFromTonic(
  tonicPitchClass: string,
  semitones: number
): string {
  const tonicLetterIndex = LETTERS.indexOf(
    tonicPitchClass[0] as (typeof LETTERS)[number]
  );
  if (tonicLetterIndex === -1) {
    throw new Error(`Unknown tonic pitch class: ${tonicPitchClass}`);
  }

  const interval = ((semitones % 12) + 12) % 12;
  const targetPitchClass = (pitchClassOf(tonicPitchClass) + interval) % 12;

  const letterIndex =
    (tonicLetterIndex + SEMITONE_TO_LETTER_STEP[interval]) % LETTERS.length;
  const letter = LETTERS[letterIndex];

  const difference =
    (((targetPitchClass - NATURAL_PITCH_CLASSES[letterIndex]) % 12) + 12) % 12;
  const alteration = difference > 6 ? difference - 12 : difference;

  if (Math.abs(alteration) > 2) {
    return tonicPitchClass.includes('b')
      ? ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'][
          targetPitchClass
        ]
      : ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][
          targetPitchClass
        ];
  }

  return `${letter}${accidentalFor(alteration)}`;
}
