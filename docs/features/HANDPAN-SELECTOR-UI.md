# Handpan Selector UI (Three-Part Selection)

## Overview

The handpan widget now features a **mobile-friendly three-part selector** that replaces the previous single dropdown. Users can now independently select:

1. **Scale Family** (Kurd, Celtic Minor, Aegean, etc.)
2. **Key** (D, E, F#, G, etc.)
3. **Pads** (9, 10, 13)

This provides a much cleaner UX and makes it easy to explore transposed variants (Plan B).

## User Experience

### Desktop Layout

```
┌─────────────────┬─────────────────┬─────────────────┐
│ Scale Family:   │ Key:            │ Pads:           │
│ [Kurd        ▼] │ [D           ▼] │ [9           ▼] │
└─────────────────┴─────────────────┴─────────────────┘
```

### Mobile Layout

```
┌─────────────────────────┐
│ Scale Family:           │
│ [Kurd                ▼] │
├─────────────────────────┤
│ Key:                    │
│ [D                   ▼] │
├─────────────────────────┤
│ Pads:                   │
│ [9                   ▼] │
└─────────────────────────┘
```

## Features

### Smart Defaults

- Each family has a `defaultKey` (e.g., D for Kurd, F for Pygmy)
- Each family has a `defaultNoteCount` (typically 9)
- When family changes, key and pads reset to defaults

### Conditional Visibility

- **Key dropdown**: Disabled if family supports only 1 key
- **Pads dropdown**: Disabled if family supports only 1 note count
- This prevents unnecessary UI clutter

### Mobile-Friendly

- Full-width controls on mobile
- Adequate touch target size (min 48px height)
- Clear labels and spacing
- No horizontal overflow

### Performance

- O(1) config lookup via pre-indexed map
- Instant resolution: `${familyId}:${key}:${noteCount}`
- No UI lag when switching selections

## Implementation Details

### Data Structure

#### HandpanScaleFamilyTemplate (Enhanced)

```typescript
{
  id: 'kurd',
  name: 'Kurd',
  intervalsPcSemitones: [0, 2, 3, 5, 7, 8, 10],
  supportedKeys: ['D', 'E', 'F#', 'G', 'A', 'C', 'C#'],
  suggestedNoteCounts: [9, 10, 13],
  defaultKey: 'D',          // NEW
  defaultNoteCount: 9,      // NEW
  // ... other fields
}
```

### Selector Model API

```typescript
// Get all families for dropdown
getFamilyOptions(): FamilyOption[]
// Returns: [{ id: 'kurd', name: 'Kurd' }, ...]

// Get keys for selected family
getKeyOptions(familyId: string): PitchClass[]
// Returns: ['D', 'E', 'F#', ...]

// Get note counts for selected family
getNoteCountOptions(familyId: string): number[]
// Returns: [9, 10, 13]

// Get defaults for a family
getDefaultSelection(familyId: string): { key, noteCount }
// Returns: { key: 'D', noteCount: 9 }

// Resolve final config (O(1) lookup)
resolveHandpanConfig({
  familyId: 'kurd',
  key: 'D',
  noteCount: 9
}): HandpanConfig | null

// Get initial UI state
getInitialSelection(): HandpanSelection
// Returns: { familyId: 'kurd', key: 'D', noteCount: 9 }
```

### State Management

```typescript
// Component state
const [familyId, setFamilyId] = useState('kurd');
const [selectedKey, setSelectedKey] = useState<PitchClass>('D');
const [selectedNoteCount, setSelectedNoteCount] = useState(9);

// When family changes
useEffect(() => {
  const defaults = getDefaultSelection(familyId);
  setSelectedKey(defaults.key);
  setSelectedNoteCount(defaults.noteCount);
  // Clear chord selection
  setSelectedChord(null);
  playback.clearPlayback();
}, [familyId]);

// Resolve to config
const selectedHandpan = useMemo(
  () => resolveHandpanConfig({ familyId, selectedKey, selectedNoteCount }),
  [familyId, selectedKey, selectedNoteCount]
);
```

### Styling

#### SCSS Modules

```scss
.selector {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-md);
  max-width: 800px;
  margin: 0 auto;

  @media (min-width: 640px) {
    grid-template-columns: 1fr 1fr 1fr;
  }
}

.select {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  min-height: 48px; // Mobile touch target

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
```

## Default Keys by Family

| Family         | Default Key | Rationale                     |
| -------------- | ----------- | ----------------------------- |
| Kurd           | D           | Most popular commercial key   |
| Celtic Minor   | D           | Common in commercial listings |
| Integral       | D           | PANArt tradition              |
| Mystic         | D           | Standard minor reference      |
| Pygmy          | F           | Common pentatonic key         |
| La Sirena      | E           | Dorian tradition              |
| Ursa Minor     | D           | Pantheon Steel default        |
| Aegean         | D           | Accessible major pentatonic   |
| Oxalis         | G           | Common in major keys          |
| Hijaz          | D           | Middle Eastern standard       |
| Harmonic Minor | C           | Classical music reference     |
| Onoleo         | D           | Modern app default            |
| Equinox        | G           | Mixolydian tradition          |
| Magic Voyage   | D           | Storytelling accessibility    |
| Ionian         | C           | Classical major reference     |
| Dorian         | D           | Modal music tradition         |
| Lydian         | F           | Natural lydian tonic          |
| Mixolydian     | G           | Folk/rock tradition           |
| Aeolian        | A           | Natural minor reference       |

## Testing

### 127 Tests Passing

- ✅ 14 tests for selector model
- ✅ Family options returned correctly
- ✅ Key options filtered by family
- ✅ Note count options filtered by family
- ✅ Default selections work for all families
- ✅ Config resolution O(1) performance
- ✅ Plan B transposition verified (D Kurd → E Kurd)
- ✅ All existing widget tests pass

## Migration Notes

### Backward Compatibility

- Existing chord/scale analysis unchanged
- Layout rendering unchanged
- Audio playback unchanged
- Only selector UI changed

### Breaking Changes

None - all changes are UI-only.

### Performance Impact

**Positive**: O(1) config lookup vs O(n) array scan before.

## Future Enhancements

### Optional: Search/Filter

For power users, could add:

- Search bar to filter families by name
- Filter by mood tags (minor, major, exotic)
- Filter by makers (Pantheon Steel, PANArt, etc.)

### Optional: Presets

- "Beginner Friendly" → D Kurd 9
- "Exotic Explorer" → D Hijaz 9
- "Bright & Cheerful" → D Aegean 9

### Optional: Recently Used

- Store last 5 selections in localStorage
- Quick-switch between recent configs

## Examples

### Example 1: Exploring Kurd Family

```
User selects:
  Family: Kurd → Keys: [D, E, F#, G, A, C, C#] (7 options)
  Key: D → Pads: [9, 10, 13] (3 options)
  Pads: 9

Result: D Kurd (9) → D3, A3, Bb3, C4, D4, E4, F4, G4, A4
```

### Example 2: Exploring Pygmy Family

```
User selects:
  Family: Pygmy → Keys: [F, F#, G, A, D, E] (6 options)
  Key: F → Pads: [9, 10] (2 options)
  Pads: 9

Result: F Pygmy (9) → F3, Bb3, C4, Eb4, F4, Bb4, C5, Eb5, F5
```

### Example 3: Single-Key Family

```
User selects:
  Family: Onoleo → Keys: [D] (1 option - KEY DISABLED)
  Pads: 9

Result: D Onoleo (9)
```

## Related Documentation

- [HANDPAN-SCALE-FAMILIES.md](./HANDPAN-SCALE-FAMILIES.md) - Scale families and Plan B
- [handpan-widget.md](./handpan-widget.md) - Widget overview
