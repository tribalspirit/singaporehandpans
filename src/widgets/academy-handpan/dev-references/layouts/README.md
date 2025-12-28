# Handpan Layout References

This directory contains reference diagrams and documentation for handpan note layouts used to calibrate the virtual handpan widget.

## Layout Pattern

All handpans follow a **zig-zag (left-right alternating)** ascending pattern:
- Lowest ring notes are at the bottom (player-facing)
- Notes alternate left-right as they ascend in pitch
- Highest notes are at the top
- Ding (central note) is always at the center

## Reference Sources

### D Kurd 9/10/13
- **Source**: D Kurd layout diagrams from handpan community resources
- **Pattern**: Zig-zag alternating left-right ascending
- **Notes**: Lowest at bottom-left/bottom-right, ascending to top

### Celtic Minor
- **Source**: Zenko Celtic Minor Tutorial & Songbook PDF
- **Pattern**: Explicitly describes left-right alternating pattern with highest note at top
- **Notes**: Follows standard zig-zag ascending pattern

### Other Scales
- **Pattern**: Standard zig-zag pattern unless otherwise documented
- **Notes**: Each scale follows the same left-right alternating principle

## Slot Templates

The layout system uses predefined slot templates:
- **7 ring notes**: For 8-note handpans (1 ding + 7 ring)
- **8 ring notes**: For 9-note handpans (1 ding + 8 ring)
- **9 ring notes**: For 10-note handpans (1 ding + 9 ring)
- **12 ring notes**: For 13-note handpans (1 ding + 12 ring)

Each template provides normalized coordinates (0-1 range) for realistic handpan layouts.

## Calibration

When calibrating layouts:
1. Compare rendered layout with reference diagram
2. Use `showDebugGrid` prop in `HandpanRenderer` to see slot positions
3. Adjust slot coordinates in `layoutHelpers.ts` if needed
4. Use `slotOrderOverride` parameter for handpan-specific adjustments


