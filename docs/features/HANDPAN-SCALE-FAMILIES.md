# Handpan Scale Families & Transposition (Plan B)

## Overview

The handpan widget now supports **19 scale families** with **transposed variants** across multiple keys and note counts. This implementation fixes octave conventions, corrects the Pygmy scale, and enables users to explore handpans in different keys without manually defining each configuration.

## Key Changes

### 1. Fixed Octave Convention

- **Ding octave**: Changed from octave 4 to octave 3 (industry standard)
- Example: D Kurd ding is now `D3` instead of `D4`
- All ring notes adjusted accordingly (spanning octaves 3-5)

### 2. Fixed Pygmy Scale

- **Before**: Identical to D Kurd (incorrect)
- **After**: True minor pentatonic `[0, 3, 5, 7, 10]`
- Now distinct and musically accurate

### 3. Scale Families (19 Total)

#### Core Minor Families

- **Kurd** (Natural Minor/Aeolian) - Most popular handpan scale
- **Celtic Minor** (Amara) - Hexatonic minor, smooth and meditative
- **Integral** (PANArt) - Hexatonic minor with distinct b6+b7 color
- **Mystic** - Phrygian-ish hexatonic minor
- **Pygmy** - Minor pentatonic (earthy/tribal)

#### Dorian/Dreamy

- **La Sirena** (Pantheon Steel) - Dorian hexatonic
- **Ursa Minor** (Pantheon Steel) - Minor hexatonic variant

#### Major/Lydian

- **Aegean** (Pantheon Steel) - Major pentatonic
- **Oxalis** - Major hexatonic with maj7
- **Ionian** - Classic major scale
- **Lydian** - Major with raised 4th

#### Mixed Modes

- **Dorian** - Minor with major 6th
- **Mixolydian** - Major with flat 7th
- **Equinox** - Mixed mood (Mixolydian-like)
- **Magic Voyage** - Storytelling blend

#### Exotic/Eastern

- **Hijaz** (Phrygian Dominant) - Middle Eastern flavor
- **Harmonic Minor** - Natural minor with raised 7th
- **Onoleo** - Modern exotic/dreamy
- **Aeolian** - Natural minor (alternative label to Kurd)

### 4. Plan B: Transposition Support

Each scale family can now be generated in multiple keys:

#### Example: Kurd Family

- **Keys**: D, E, F#, G, A, C, C#
- **Note counts**: 9, 10, 13
- **Total configs**: 7 keys × 3 note counts = **21 variants**

#### Generated Configs

- Total: **300+ handpan configurations**
- Each has: `familyId`, `tonicPc`, `ding`, `noteCount`
- Backward compatible with existing widget code

### 5. UI Helpers

New functions for grouping configs by family/key/note count:

```typescript
// Group all configs by family → key
groupConfigsByFamilyAndKey();

// Get all configs for a family
getConfigsByFamily('kurd');

// Get configs for specific family + key
getConfigsByFamilyAndKey('kurd', 'D');

// Get available keys for a family
getAvailableKeysForFamily('kurd');
// Returns: ['C', 'C#', 'D', 'E', 'F#', 'G', 'A']

// Get available note counts
getAvailableNoteCountsForFamilyAndKey('kurd', 'D');
// Returns: [9, 10, 13]
```

## Architecture

### Files Added/Modified

#### New Files

- `src/widgets/academy-handpan/config/handpanFamilies.ts` - Family templates + generator
- `src/widgets/academy-handpan/config/uiHelpers.ts` - UI grouping helpers
- `src/widgets/academy-handpan/config/verification.test.ts` - Verification tests
- `src/widgets/academy-handpan/config/uiHelpers.test.ts` - UI helper tests

#### Modified Files

- `src/widgets/academy-handpan/config/types.ts` - Added `HandpanScaleFamilyTemplate`, `PitchClass`
- `src/widgets/academy-handpan/config/handpans.ts` - Now generates from families
- `src/widgets/academy-handpan/config/layoutHelpers.test.ts` - Updated for D3 octaves

### Data Model

#### HandpanScaleFamilyTemplate

```typescript
{
  id: string;                    // 'kurd'
  name: string;                  // 'Kurd'
  description: string;
  aliases?: string[];            // ['Natural Minor', 'Aeolian']
  makers?: string[];             // ['Pantheon Steel']
  modeHint?: 'minor' | 'major' | 'mixed' | 'exotic';
  intervalsPcSemitones: number[]; // [0, 2, 3, 5, 7, 8, 10]
  suggestedNoteCounts: number[]; // [9, 10, 13]
  supportedKeys: PitchClass[];   // ['D', 'E', 'F#', ...]
}
```

#### HandpanConfig (Enhanced)

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
  // ... other fields
}
```

### Generator Algorithm

1. **Input**: Family template, key (e.g., 'D'), note count (e.g., 9)
2. **Process**:
   - Calculate pitch classes from intervals
   - Set ding to `{key}3` (e.g., `D3`)
   - Generate ring notes by cycling through pitch classes across octaves 3-5
   - Sort notes by pitch
   - Create layout using existing `generateHandpanLayout()`
3. **Output**: Complete `HandpanConfig` with correct octaves and layout

## Testing

All 113 tests passing:

- ✓ Octave convention (D3 for D scales)
- ✓ Pygmy distinct from Kurd
- ✓ All 19 families represented
- ✓ Multiple keys per family
- ✓ Multiple note counts per family+key
- ✓ Correct config structure
- ✓ Layout geometry preserved
- ✓ UI grouping helpers work correctly

## Next Steps (Optional)

### Future Enhancement: Plan A

Add ability to reinterpret the same pitch set with different tonic (modal playing):

- E.g., D Kurd notes can be played as F Lydian
- Requires: tonic override in chord/scale analysis
- Not implemented in this phase (as requested)

### UI Enhancement

Consider updating the handpan selector to use the new grouping:

1. First dropdown: Select family (Kurd, Aegean, Hijaz, etc.)
2. Second dropdown: Select key (D, E, F#, etc.)
3. Third dropdown: Select note count (9, 10, 13)

This can be done using the new `uiHelpers` functions.

## Migration Notes

### Backward Compatibility

- Existing imports still work: `getAllHandpanConfigs()`, `getHandpanConfig(id)`
- Widget UI unchanged (still shows all configs in single dropdown)
- Chord/scale analysis continues to work with generated configs

### Breaking Changes

None - all changes are additive or internal refactors.

## References

- Interval calculations based on music theory pitch-class sets
- Scale families researched from commercial handpan catalogs
- Maker associations (Pantheon Steel, PANArt, etc.) documented in templates
