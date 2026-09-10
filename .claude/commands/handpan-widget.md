---
name: handpan-widget
description: Academy handpan memorization widget development guide. Covers scale families, selector UI, transposition, and interaction highlighting contracts.
---

# Handpan Widget Development

Academy handpan memorization widget implemented as a React island. Covers scale families, transposition, selector UI, and interaction contracts.

## Architecture

- **Framework**: React island (not global SPA)
- **Location**: `/academy` page
- **Constraint**: Data-driven - new handpan = config change only
- **Audio**: Tone.js synth-first

> **Scale data:** [docs/features/handpan-data-audit.md](../../docs/features/handpan-data-audit.md)
> is the source of truth for interval sets, aliases and their provenance.
> Five families were merged in 2026-09 because they duplicated another's
> pitch-class set (ids still resolve via `MERGED_FAMILY_IDS`), three were
> removed as unsourced (`EXCLUDED_FAMILY_IDS`), and four were added from maker
> listings: Akebono, Aegean, Sabye and Golden Gate.

### Key Files

```
src/widgets/academy-handpan/
├── config/
│   ├── handpanFamilies.ts    # Family templates + generator
│   ├── handpans.ts           # Generated configs
│   ├── types.ts              # Type definitions
│   ├── handpanSelectorModel.ts  # Selector API
│   ├── uiHelpers.ts          # Grouping helpers
│   └── layoutHelpers.ts      # Layout geometry
├── theory/
│   ├── chords.ts             # Chord detection
│   └── scales.ts             # Scale analysis
├── ui/
│   └── Controls.tsx          # Selector UI
└── styles/
    └── Controls.module.scss
```

## Scale Families (14 Total)

### Core Minor

| Family       | Mode             | Description                                                     |
| ------------ | ---------------- | --------------------------------------------------------------- |
| Kurd         | Natural Minor    | Most popular handpan scale. Also sold as Aeolian and Annaziska    |
| Celtic Minor | Hexatonic Minor  | Smooth, meditative. Amara is an alias                             |
| Integral     | Hexatonic Minor  | Minor without the 4th. Also sold as Equinox and Mystic            |
| Pygmy        | Pentatonic       | Root, maj2, min3, 5th, min7 — no 4th. Also sold as Magic Voyage   |

### Dorian/Dreamy

| Family    | Mode            | Description                    |
| --------- | --------------- | ------------------------------ |
| La Sirena | Dorian hexatonic | Dorian minus the 4th          |
| Dorian    | Dorian          | Jibuk is an alias              |

### Major/Bright

| Family      | Mode                | Description                                              |
| ----------- | ------------------- | -------------------------------------------------------- |
| Sabye       | Full diatonic major | Absorbed Ionian. Ashakiran and Asha are aliases           |
| Aegean      | maj3 / #4 / 5 / maj7 | Bright and suspended; fills toward Lydian on big builds  |
| Golden Gate | Aegean + the 2nd    | Eight notes, C only — the sole attested ding              |
| Oxalis      | Major + maj7        | Hexatonic. Measured from the tone-circle root, not the ding |
| Mixolydian  | Major with b7       | 8-note variants drop the 4th                              |

### Mixed/Exotic

| Family         | Mode              | Description                                  |
| -------------- | ----------------- | -------------------------------------------- |
| Akebono        | Japanese pentatonic | Ding-rooted; resolves to the 4th above     |
| Hijaz          | Phrygian Dominant | Middle Eastern                               |
| Harmonic Minor | Minor + nat7      | Raised 7th     |
| Dorian         | Minor + nat6      | Major 6th      |
| Mixolydian     | Major + b7        | Flat 7th       |

## Octave Convention

- **Ding**: Octave 3 (industry standard)
- **Example**: D Kurd ding = `D3` (not D4)
- **Ring notes**: Span octaves 3-5

## Three-Part Selector UI

### Layout

```
Desktop:
┌───────────────┬──────────┬──────────┐
│ Scale Family: │ Key:     │ Pads:    │
│ [Kurd      ▼] │ [D    ▼] │ [9    ▼] │
└───────────────┴──────────┴──────────┘

Mobile: Full-width, stacked vertically
```

### Behavior

- Family change → reset key and pads to defaults
- Single-option dropdowns are disabled
- O(1) config lookup

### Selector Model API

```typescript
// Get all families
getFamilyOptions(): FamilyOption[]

// Get keys for family
getKeyOptions(familyId: string): PitchClass[]

// Get note counts for family
getNoteCountOptions(familyId: string): number[]

// Get defaults
getDefaultSelection(familyId: string): { key, noteCount }

// Resolve config (O(1))
resolveHandpanConfig({ familyId, key, noteCount }): HandpanConfig | null
```

### Default Keys by Family

| Family         | Default Key | Note counts |
| -------------- | ----------- | ----------- |
| Kurd           | D           | 9, 10, 13   |
| Celtic Minor   | D           | 9, 10, 13   |
| Integral       | D           | 9, 10, 13   |
| Pygmy          | F           | 9, 10, 13   |
| La Sirena      | E           | 9, 10, 13   |
| Akebono        | F#          | 9 only      |
| Aegean         | C           | 9, 10       |
| Sabye          | E           | 9 only      |
| Golden Gate    | C           | 8 only      |
| Oxalis         | D           | 9, 10, 13   |
| Hijaz          | D           | 9, 10, 13   |
| Harmonic Minor | C           | 9, 10, 13   |
| Dorian         | D           | 9, 10, 13   |
| Mixolydian     | G           | 9, 10, 13   |

Akebono, Sabye and Golden Gate ship at the counts makers actually publish as
all-top-shell layouts. Larger real builds reach their counts with bottom notes,
which the widget does not model, so extrapolating one would have invented a
layout.

### Removed families

Lydian, Ursa Minor and Onoleo shipped interval sets no maker publishes and were
removed; `EXCLUDED_FAMILY_IDS` records why. Do not re-add them without a
maker-published note list — see
[handpan-data-audit.md](../../docs/features/handpan-data-audit.md).

## Interaction Contract

### Playback State Model

| Field                | Meaning                                          |
| -------------------- | ------------------------------------------------ |
| `activePadNote`      | EXACT note with octave. Single-note interactions |
| `activePitchClasses` | Array of pitch classes. Chord interactions       |
| `isPlaying`          | Transport state                                  |

### Invariant Rules

1. `activePadNote !== null` ⇒ `activePitchClasses === null`
2. `activePitchClasses !== null` ⇒ `activePadNote === null`
3. **Never** highlight by pitch class during single-note interaction
4. **Never** highlight by exact note during chord interaction

### Pad Click Behavior

- Click `D4` → Only `D4` highlighted
- Click `D5` → Only `D5` highlighted (NOT `D4`)
- Pitch class matching is FORBIDDEN for pad clicks

### Scale Note Click Behavior

- Click scale note `A4` → `activePadNote = "A4"`
- If note not on pads, highlight best-mapped pad

### Chord Selection (No Playback)

- Select chord **Dm** → `activePitchClasses = ["D", "F", "A"]`
- All pads matching ANY pitch class highlighted (all octaves)

### Chord Playback

**Simultaneous**: All chord pads highlighted at once
**Arpeggio**: One pitch class at a time, all matching pads highlighted

### Interaction Priority

- **Manual click overrides chord highlight**
- Click pad during chord selection → chord cleared, only clicked pad highlighted

## Test Categories

1. **Pad clicks** - Exact note highlighting
2. **Scale note clicks** - Note-to-pad mapping
3. **Scale playback** - Sequential highlighting
4. **Chord selection** - Pitch-class highlighting
5. **Chord playback** - Simultaneous and arpeggio
6. **Priority rules** - Manual overrides chord
7. **Regression guards** - Forbidden behaviors

### Forbidden Behaviors

- Clicking `D4` highlights `D5`
- Scale playback highlights multiple pads
- Pitch-class logic during `activePadNote` set
- Exact-note logic during `activePitchClasses` set

## Data Model

### HandpanScaleFamilyTemplate

```typescript
{
  id: string;                      // 'kurd'
  name: string;                    // 'Kurd'
  intervalsPcSemitones: number[];  // [0, 2, 3, 5, 7, 8, 10]
  supportedKeys: PitchClass[];     // ['D', 'E', 'F#', ...]
  suggestedNoteCounts: number[];   // [9, 10, 13]
  defaultKey: PitchClass;          // 'D'
  defaultNoteCount: number;        // 9
  modeHint?: 'minor' | 'major' | 'mixed' | 'exotic';
}
```

### HandpanConfig

```typescript
{
  id: string;           // 'kurd-d-9'
  name: string;         // 'D Kurd (9)'
  familyId: string;     // 'kurd'
  tonicPc: string;      // 'D'
  ding: string;         // 'D3'
  noteCount: number;    // 9
  notes: string[];      // ['D3', 'A3', 'Bb3', ...]
  layout: HandpanPad[];
}
```

## Testing

**127+ tests passing**:

- Selector model API
- Scale family generation
- Transposition (D Kurd → E Kurd)
- O(1) config resolution
- Layout geometry
- Ding octave follows the key (D3, but A2 and B2)
- Pygmy and Equinox match published maker note lists
- No two families share a pitch-class set
- All interaction contracts

## Definition of Done

All tests pass for:

- Every handpan type
- Every scale
- Every chord category
- Multiple octave layouts

If even **one** test fails, implementation is **not correct**.

## Related Skills

- `/constitution` - Widget constraints (React island, data-driven)

## Source Documentation

- `docs/features/HANDPAN-SCALE-FAMILIES.md`
- `docs/features/HANDPAN-SELECTOR-UI.md`
- `docs/features/handpan-widget.md`
