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

## Scale Families (19 Total)

### Core Minor

| Family       | Mode             | Description                |
| ------------ | ---------------- | -------------------------- |
| Kurd         | Natural Minor    | Most popular handpan scale |
| Celtic Minor | Hexatonic Minor  | Smooth, meditative         |
| Integral     | Hexatonic Minor  | b6+b7 color                |
| Mystic       | Phrygian-ish     | Hexatonic minor            |
| Pygmy        | Minor Pentatonic | Earthy/tribal              |

### Dorian/Dreamy

| Family     | Maker          | Description      |
| ---------- | -------------- | ---------------- |
| La Sirena  | Pantheon Steel | Dorian hexatonic |
| Ursa Minor | Pantheon Steel | Minor hexatonic  |

### Major/Lydian

| Family | Mode             | Description    |
| ------ | ---------------- | -------------- |
| Aegean | Major Pentatonic | Pantheon Steel |
| Oxalis | Major + maj7     | Hexatonic      |
| Ionian | Classic Major    | Full scale     |
| Lydian | Major + #4       | Raised 4th     |

### Mixed/Exotic

| Family         | Mode              | Description    |
| -------------- | ----------------- | -------------- |
| Hijaz          | Phrygian Dominant | Middle Eastern |
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

| Family         | Default Key |
| -------------- | ----------- |
| Kurd           | D           |
| Celtic Minor   | D           |
| Pygmy          | F           |
| La Sirena      | E           |
| Aegean         | D           |
| Hijaz          | D           |
| Harmonic Minor | C           |
| Ionian         | C           |
| Dorian         | D           |
| Lydian         | F           |
| Mixolydian     | G           |
| Aeolian        | A           |

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
- Octave convention (D3 ding)
- Pygmy distinct from Kurd
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
