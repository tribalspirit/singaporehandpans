import { describe, it, expect } from 'vitest';
import { getEventTiming, parseSingaporeDate } from './eventDates';
import {
  formatEventDateRange,
  formatEventTimeRange,
  formatRecurrenceLabel,
  formatOccurrenceLabel,
  formatDurationLabel,
  formatSeriesSpanLabel,
  formatShortDate,
  formatDateBadge,
  resolveDurationLabel,
} from './eventFormat';

/**
 * Like `eventDates.test.ts`, every expectation here must hold under any runtime
 * timezone — the suite is run under several in CI. Formatting is hand-rolled
 * rather than delegated to `Intl` so output cannot drift with the host's ICU
 * build (Workers ship a trimmed one).
 */

const timing = (input: Parameters<typeof getEventTiming>[0]) =>
  getEventTiming(input)!;

describe('formatEventDateRange', () => {
  it('renders a single-day event with its weekday', () => {
    expect(formatEventDateRange(timing({ date: '2026-03-14 13:00' }))).toBe(
      'Sat, 14 Mar 2026'
    );
  });

  it('collapses a two-day event within one month', () => {
    expect(
      formatEventDateRange(
        timing({ date: '2026-03-14 13:00', end_date: '2026-03-15 16:00' })
      )
    ).toBe('14–15 Mar 2026');
  });

  it('keeps both months when the span crosses one', () => {
    expect(
      formatEventDateRange(
        timing({ date: '2026-04-30 10:00', end_date: '2026-05-02 16:00' })
      )
    ).toBe('30 Apr – 2 May 2026');
  });

  it('keeps both years when the span crosses one', () => {
    expect(
      formatEventDateRange(
        timing({ date: '2026-12-28 10:00', end_date: '2027-01-03 16:00' })
      )
    ).toBe('28 Dec 2026 – 3 Jan 2027');
  });

  it('treats an overnight session as multi-day', () => {
    expect(
      formatEventDateRange(
        timing({ date: '2026-03-14 22:00', end_date: '2026-03-15 01:00' })
      )
    ).toBe('14–15 Mar 2026');
  });
});

describe('formatEventTimeRange', () => {
  it('renders a 12-hour range in Singapore time', () => {
    expect(
      formatEventTimeRange(timing({ date: '2026-03-14 13:00', duration: 3 }))
    ).toBe('1:00 pm – 4:00 pm');
  });

  it('handles morning times and half hours', () => {
    expect(
      formatEventTimeRange(timing({ date: '2026-08-01 10:30', duration: 1.5 }))
    ).toBe('10:30 am – 12:00 pm');
  });

  it('renders midnight and noon without a zero hour', () => {
    expect(
      formatEventTimeRange(timing({ date: '2026-08-01 00:00', duration: 1 }))
    ).toBe('12:00 am – 1:00 am');
    expect(
      formatEventTimeRange(timing({ date: '2026-08-01 12:00', duration: 1 }))
    ).toBe('12:00 pm – 1:00 pm');
  });
});

describe('formatRecurrenceLabel', () => {
  it('returns null for a one-off event', () => {
    expect(
      formatRecurrenceLabel(timing({ date: '2026-03-14 13:00' }))
    ).toBeNull();
  });

  it('describes a weekly class by weekday and time', () => {
    // Yana's Saturday morning class, the case that drove this feature.
    expect(
      formatRecurrenceLabel(
        timing({
          date: '2026-08-01 10:30',
          duration: 1.5,
          recurrence: 'weekly',
          recurrence_until: '2026-12-27 23:59',
        })
      )
    ).toBe('Every Saturday, 10:30 am — until 27 Dec 2026');
  });

  it('omits the end when the series is open-ended', () => {
    expect(
      formatRecurrenceLabel(
        timing({ date: '2026-08-01 10:30', recurrence: 'weekly' })
      )
    ).toBe('Every Saturday, 10:30 am');
  });

  it('describes a fortnightly class', () => {
    expect(
      formatRecurrenceLabel(
        timing({ date: '2026-08-01 10:30', recurrence: 'biweekly' })
      )
    ).toBe('Every 2 weeks on Saturday, 10:30 am');
  });

  it('describes a monthly class by ordinal day', () => {
    expect(
      formatRecurrenceLabel(
        timing({ date: '2026-08-01 19:00', recurrence: 'monthly' })
      )
    ).toBe('Every month on the 1st, 7:00 pm');
    expect(
      formatRecurrenceLabel(
        timing({ date: '2026-08-22 19:00', recurrence: 'monthly' })
      )
    ).toBe('Every month on the 22nd, 7:00 pm');
    expect(
      formatRecurrenceLabel(
        timing({ date: '2026-08-03 19:00', recurrence: 'monthly' })
      )
    ).toBe('Every month on the 3rd, 7:00 pm');
    expect(
      formatRecurrenceLabel(
        timing({ date: '2026-08-11 19:00', recurrence: 'monthly' })
      )
    ).toBe('Every month on the 11th, 7:00 pm');
  });
});

describe('formatOccurrenceLabel', () => {
  it('renders a compact next-session line', () => {
    const start = parseSingaporeDate('2026-08-08 10:30') as Date;
    expect(
      formatOccurrenceLabel({
        start,
        end: new Date(start.getTime() + 90 * 60 * 1000),
      })
    ).toBe('Sat, 8 Aug, 10:30 am');
  });
});

describe('formatDurationLabel', () => {
  it('singularises one hour', () => {
    expect(formatDurationLabel(1)).toBe('1 hour');
  });

  it('keeps fractional hours readable', () => {
    expect(formatDurationLabel(1.5)).toBe('1.5 hours');
    expect(formatDurationLabel('2')).toBe('2 hours');
  });

  it('returns null for the unset values the CMS actually holds', () => {
    expect(formatDurationLabel(null)).toBeNull();
    expect(formatDurationLabel(undefined)).toBeNull();
    expect(formatDurationLabel('')).toBeNull();
    expect(formatDurationLabel(0)).toBeNull();
    expect(formatDurationLabel('abc')).toBeNull();
  });
});

describe('resolveDurationLabel', () => {
  it('shows the duration when it is what defines the end', () => {
    const t = timing({ date: '2026-03-14 13:00', duration: 1.5 });
    expect(resolveDurationLabel(t, 1.5)).toBe('1.5 hours');
  });

  it('suppresses a stale duration once end_date takes over', () => {
    // The migration sets end_date on events that already carry a duration.
    // getEventTiming ignores it, so displaying it would contradict the dates:
    // "14–15 Mar 2026" beside "~3 hours".
    const t = timing({
      date: '2026-03-14 13:00',
      end_date: '2026-03-15 16:00',
      duration: 3,
    });
    expect(t.hasExplicitEnd).toBe(true);
    expect(resolveDurationLabel(t, 3)).toBeNull();
  });

  it('still shows the duration when end_date was rejected as invalid', () => {
    const t = timing({
      date: '2026-03-14 13:00',
      end_date: '2026-03-14 09:00',
      duration: 3,
    });
    expect(t.hasExplicitEnd).toBe(false);
    expect(resolveDurationLabel(t, 3)).toBe('3 hours');
  });

  it('returns null for unset durations regardless of timing', () => {
    const t = timing({ date: '2026-03-14 13:00' });
    expect(resolveDurationLabel(t, 0)).toBeNull();
    expect(resolveDurationLabel(null, 2)).toBe('2 hours');
  });
});

describe('formatSeriesSpanLabel', () => {
  it('summarises a finished weekly series for the archive', () => {
    const t = timing({
      date: '2026-03-07 10:30',
      recurrence: 'weekly',
      recurrence_until: '2026-12-26 12:00',
    });
    expect(formatSeriesSpanLabel(t)).toBe('Weekly series · Mar – Dec 2026');
  });

  it('spans years when the series crosses new year', () => {
    const t = timing({
      date: '2025-11-01 10:30',
      recurrence: 'monthly',
      recurrence_until: '2026-04-01 12:00',
    });
    expect(formatSeriesSpanLabel(t)).toBe(
      'Monthly series · Nov 2025 – Apr 2026'
    );
  });

  it('returns null for a non-recurring event', () => {
    expect(
      formatSeriesSpanLabel(timing({ date: '2026-03-14 13:00' }))
    ).toBeNull();
  });
});

describe('formatDateBadge', () => {
  it('gives month and day for a single-day event', () => {
    expect(formatDateBadge(timing({ date: '2026-08-08 10:30' }))).toEqual({
      month: 'AUG',
      day: '8',
    });
  });

  it('combines days for a multi-day event inside one month', () => {
    expect(
      formatDateBadge(
        timing({ date: '2026-03-14 13:00', end_date: '2026-03-15 16:00' })
      )
    ).toEqual({ month: 'MAR', day: '14–15' });
  });

  it('does not render a bare day range across a month boundary', () => {
    // 'APR' + '30–2' reads as 30-2 April, which is nonsense. The badge is a
    // single-date marker, so it falls back to the start date and the full span
    // is carried by the date line beneath it.
    expect(
      formatDateBadge(
        timing({ date: '2026-04-30 10:00', end_date: '2026-05-02 16:00' })
      )
    ).toEqual({ month: 'APR', day: '30' });
  });

  it('does not render a bare day range across a year boundary', () => {
    expect(
      formatDateBadge(
        timing({ date: '2026-12-28 10:00', end_date: '2027-01-03 16:00' })
      )
    ).toEqual({ month: 'DEC', day: '28' });
  });

  it('uses the given occurrence for a series rather than the first session', () => {
    const t = timing({
      date: '2026-02-07 10:30',
      recurrence: 'weekly',
      recurrence_until: '2026-12-26 12:00',
    });
    const start = parseSingaporeDate('2026-08-08 10:30') as Date;
    expect(
      formatDateBadge(t, { start, end: new Date(start.getTime() + 3600000) })
    ).toEqual({ month: 'AUG', day: '8' });
  });
});

describe('formatShortDate', () => {
  it('renders a compact date without the weekday', () => {
    expect(
      formatShortDate(parseSingaporeDate('2026-03-14 13:00') as Date)
    ).toBe('14 Mar 2026');
  });
});
