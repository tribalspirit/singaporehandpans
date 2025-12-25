# Handpan Layout Reference Materials

This directory contains reference materials used for calculating accurate pad coordinates for each handpan tuning.

## Layout Principles

1. **Orientation Rule**: Lower notes (hand-facing) must be at the **bottom** of the rendered handpan (higher `y` values in normalized coordinates).

2. **Coordinate System**:
   - Center ding is always at `(0.5, 0.5)`
   - Ring notes are arranged around the ding in a circular pattern
   - `y` increases downward (standard screen coordinates)
   - Lower notes should have `y > 0.5` (bottom half)

3. **Layout Pattern**:
   - D Kurd: Notes arranged clockwise starting from bottom (A4 at bottom)
   - Celtic: Similar pattern with Celtic minor scale notes
   - Ring notes typically at radius ~0.32 from center

## Reference Sources

### D Kurd Layouts
- Standard 9-note D Kurd: A4 (lowest ring note) at bottom, arranged clockwise
- 10-note variant: Additional Bb5 note in outer ring
- 13-note variant: Extended ring with higher octave notes

### Celtic Minor Layout
- Based on Celtic minor scale (D E F# G A B C# D E)
- E4 (lowest ring note) at bottom
- Similar circular arrangement to Kurd family

## Validation

Run `validateLayout.ts` to check:
- All pads have valid coordinates (0 < x, y < 1)
- No pad overlaps
- Ding is near center
- Radius values are valid

## Debug Mode

Enable debug grid in `HandpanRenderer` by passing `showDebugGrid={true}`:
- Shows center point (red dot)
- Shows concentric circles at 30%, 50%, 70% radius
- Shows crosshairs for center alignment
- Shows pad IDs for easy identification

