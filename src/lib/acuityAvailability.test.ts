import { describe, expect, test } from 'vitest';
import {
  resolveSlotAvailability,
  computeAvailabilityStatus,
} from './acuity-client';
import type { AcuityClassSlot } from './acuity-client';

const slot = (
  id: number,
  time: string,
  slotsAvailable: number
): AcuityClassSlot => ({ id, time, slotsAvailable }) as AcuityClassSlot;

// Two sessions of the same appointment type in one month — the case that makes
// monthly aggregation wrong.
const slots = [
  slot(1, '2026-08-08T10:30:00+0800', 0),
  slot(2, '2026-08-15T10:30:00+0800', 6),
];

describe('resolveSlotAvailability', () => {
  test('matches a one-off by its class id', () => {
    expect(resolveSlotAvailability(slots, { classId: '2' })).toBe(6);
  });

  test('matches a series session by its exact start time', () => {
    expect(
      resolveSlotAvailability(slots, { time: '2026-08-08T10:30:00+08:00' })
    ).toBe(0);
  });

  test('never sums the month, so a sold-out next session stays sold out', () => {
    // Aggregating would report 6 seats against the 8 Aug session that has none,
    // and could show a count larger than one class holds.
    const resolved = resolveSlotAvailability(slots, {
      time: '2026-08-08T10:30:00+08:00',
    });
    expect(resolved).toBe(0);
    expect(computeAvailabilityStatus(resolved as number)).toBe('sold_out');
  });

  test('compares instants, not strings, across offset formats', () => {
    expect(
      resolveSlotAvailability(slots, { time: '2026-08-08T02:30:00Z' })
    ).toBe(0);
  });

  test('returns null — unknown, not zero — when nothing matches', () => {
    // Conflating unknown with sold out is what stripped a live series' booking
    // link the moment its first instance left the current month.
    expect(
      resolveSlotAvailability(slots, { time: '2026-09-05T10:30:00+08:00' })
    ).toBeNull();
    expect(resolveSlotAvailability(slots, { classId: '999' })).toBeNull();
    expect(resolveSlotAvailability([], { classId: '1' })).toBeNull();
  });

  test('returns null for an unusable time and for no target at all', () => {
    expect(resolveSlotAvailability(slots, { time: 'not a date' })).toBeNull();
    expect(resolveSlotAvailability(slots, {})).toBeNull();
  });

  test('a resolved zero is still reported as sold out', () => {
    expect(computeAvailabilityStatus(0)).toBe('sold_out');
    expect(computeAvailabilityStatus(3)).toBe('few_spots');
    expect(computeAvailabilityStatus(4)).toBe('available');
  });
});
