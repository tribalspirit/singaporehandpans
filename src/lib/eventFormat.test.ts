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
  formatPrice,
  formatRowDate,
  parsePrice,
  formatDayMonth,
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

  it('says so when a month-end series will clamp in shorter months', () => {
    // expandOccurrences schedules 31 Jan -> 28 Feb, so a bare "on the 31st"
    // would describe a schedule the site does not run.
    expect(
      formatRecurrenceLabel(
        timing({ date: '2026-01-31 19:00', recurrence: 'monthly' })
      )
    ).toBe(
      'Every month on the 31st, or the last day of shorter months, 7:00 pm'
    );
    expect(
      formatRecurrenceLabel(
        timing({ date: '2026-01-29 19:00', recurrence: 'monthly' })
      )
    ).toContain('or the last day of shorter months');
  });

  it('keeps the plain wording for days that exist in every month', () => {
    expect(
      formatRecurrenceLabel(
        timing({ date: '2026-01-28 19:00', recurrence: 'monthly' })
      )
    ).toBe('Every month on the 28th, 7:00 pm');
  });
});

describe('formatOccurrenceLabel', () => {
  it('states when the session ends, not just when it starts', () => {
    // resolveDurationLabel hides the duration once end_date exists, so without
    // the end here a series session showed no finish time anywhere.
    const start = parseSingaporeDate('2026-08-08 10:30') as Date;
    expect(
      formatOccurrenceLabel({
        start,
        end: new Date(start.getTime() + 90 * 60 * 1000),
      })
    ).toBe('Sat, 8 Aug, 10:30 am – 12:00 pm');
  });

  it('includes the end date when a session runs past midnight', () => {
    const start = parseSingaporeDate('2026-08-08 22:00') as Date;
    const end = parseSingaporeDate('2026-08-09 01:00') as Date;
    expect(formatOccurrenceLabel({ start, end })).toBe(
      'Sat, 8 Aug, 10:00 pm – 9 Aug, 1:00 am'
    );
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

describe('formatPrice', () => {
  it('normalises the dollar-prefixed form the CMS mostly holds', () => {
    expect(formatPrice('$88')).toBe('S$88');
  });

  it('normalises a bare number', () => {
    expect(formatPrice('88')).toBe('S$88');
  });

  it('leaves an already-correct value alone', () => {
    expect(formatPrice('S$120')).toBe('S$120');
  });

  it('renders a range with an en dash and one currency mark', () => {
    expect(formatPrice('$38-$138')).toBe('S$38–138');
    expect(formatPrice('38 - 138')).toBe('S$38–138');
  });

  it('title-cases free', () => {
    expect(formatPrice('Free')).toBe('Free');
    expect(formatPrice('free')).toBe('Free');
    expect(formatPrice('FREE')).toBe('Free');
  });

  it('keeps decimals when they carry cents', () => {
    expect(formatPrice('$88.50')).toBe('S$88.50');
  });

  it('drops a trailing .00 that adds nothing', () => {
    expect(formatPrice('$88.00')).toBe('S$88');
  });

  it('returns unparseable text unchanged rather than losing information', () => {
    expect(formatPrice('Pay what you feel')).toBe('Pay what you feel');
    expect(formatPrice('$88 per person')).toBe('$88 per person');
  });

  it('returns null for an unset price', () => {
    expect(formatPrice(undefined)).toBeNull();
    expect(formatPrice('')).toBeNull();
    expect(formatPrice('   ')).toBeNull();
  });
});

describe('formatRowDate', () => {
  it('renders the archive row date column in caps with a 24-hour time', () => {
    expect(
      formatRowDate(parseSingaporeDate('2026-08-01 10:30') as Date)
    ).toEqual({ date: 'SAT 1 AUG', time: '10:30' });
  });

  it('pads the hour so the mono column stays aligned', () => {
    expect(
      formatRowDate(parseSingaporeDate('2026-07-31 09:05') as Date)
    ).toEqual({ date: 'FRI 31 JUL', time: '09:05' });
  });

  it('reads calendar parts in Singapore time, not the runtime zone', () => {
    // 2026-01-01 00:30 SGT is still 2025-12-31 in UTC.
    expect(
      formatRowDate(parseSingaporeDate('2026-01-01 00:30') as Date)
    ).toEqual({ date: 'THU 1 JAN', time: '00:30' });
  });
});

describe('parsePrice', () => {
  it('reads a single amount', () => {
    expect(parsePrice('$88')).toEqual({ min: 88, max: null });
    expect(parsePrice('88')).toEqual({ min: 88, max: null });
    expect(parsePrice('S$120')).toEqual({ min: 120, max: null });
    expect(parsePrice('$88.50')).toEqual({ min: 88.5, max: null });
  });

  it('reads both ends of a range', () => {
    // The old schema sanitiser stripped non-digits and emitted "38138".
    expect(parsePrice('$38-$138')).toEqual({ min: 38, max: 138 });
    expect(parsePrice('38 - 138')).toEqual({ min: 38, max: 138 });
  });

  it('reads free as zero', () => {
    expect(parsePrice('Free')).toEqual({ min: 0, max: null });
    expect(parsePrice('FREE')).toEqual({ min: 0, max: null });
  });

  it('returns null when there is no price to state', () => {
    expect(parsePrice('Pay what you feel')).toBeNull();
    expect(parsePrice('$88 per person')).toBeNull();
    expect(parsePrice(undefined)).toBeNull();
    expect(parsePrice('')).toBeNull();
  });
});

describe('formatDayMonth', () => {
  it('drops the year, for a near date that does not need one', () => {
    expect(formatDayMonth(parseSingaporeDate('2026-08-08 10:30') as Date)).toBe(
      '8 Aug'
    );
    expect(formatDayMonth(parseSingaporeDate('2026-12-01 09:00') as Date)).toBe(
      '1 Dec'
    );
  });

  it('reads the calendar date in Singapore time', () => {
    expect(formatDayMonth(parseSingaporeDate('2026-01-01 00:30') as Date)).toBe(
      '1 Jan'
    );
  });
});
