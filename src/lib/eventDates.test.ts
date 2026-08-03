import { describe, it, expect } from 'vitest';
import {
  parseSingaporeDate,
  toSingaporeIso,
  getSingaporeParts,
  getEventTiming,
  expandOccurrences,
  getNextOccurrence,
  getLastOccurrence,
  isUpcomingEvent,
  groupByYearMonth,
  MAX_OCCURRENCES,
} from './eventDates';

/**
 * Every assertion here must hold under both `TZ=UTC` (what Cloudflare Workers
 * run in) and `TZ=Asia/Singapore` (what a developer's laptop runs in). The
 * pre-existing bug this module replaces was exactly that divergence, so the
 * suite is run twice in CI — see the `test` script in package.json.
 */

const sgt = (iso: string) => new Date(iso);

describe('parseSingaporeDate', () => {
  it('reads the naive Storyblok format as Singapore time', () => {
    // Storyblok stores datetimes as 'YYYY-MM-DD HH:mm' with no zone at all.
    expect(parseSingaporeDate('2026-03-14 13:00')?.toISOString()).toBe(
      '2026-03-14T05:00:00.000Z'
    );
  });

  it('accepts the T separator and explicit seconds', () => {
    const expected = '2026-03-14T05:00:00.000Z';
    expect(parseSingaporeDate('2026-03-14T13:00')?.toISOString()).toBe(
      expected
    );
    expect(parseSingaporeDate('2026-03-14 13:00:00')?.toISOString()).toBe(
      expected
    );
  });

  it('respects an offset when one is already present', () => {
    expect(parseSingaporeDate('2026-03-14T13:00:00Z')?.toISOString()).toBe(
      '2026-03-14T13:00:00.000Z'
    );
    expect(parseSingaporeDate('2026-03-14T13:00:00+08:00')?.toISOString()).toBe(
      '2026-03-14T05:00:00.000Z'
    );
  });

  it('returns null for missing or unparseable input', () => {
    expect(parseSingaporeDate(undefined)).toBeNull();
    expect(parseSingaporeDate(null)).toBeNull();
    expect(parseSingaporeDate('')).toBeNull();
    expect(parseSingaporeDate('   ')).toBeNull();
    expect(parseSingaporeDate('not a date')).toBeNull();
    expect(parseSingaporeDate('2026-13-45 99:99')).toBeNull();
  });
});

describe('toSingaporeIso', () => {
  it('emits schema.org-valid ISO-8601 with the Singapore offset', () => {
    const parsed = parseSingaporeDate('2026-03-14 13:00');
    expect(toSingaporeIso(parsed as Date)).toBe('2026-03-14T13:00:00+08:00');
  });

  it('shifts a UTC instant into Singapore local time', () => {
    expect(toSingaporeIso(sgt('2026-03-14T18:30:00Z'))).toBe(
      '2026-03-15T02:30:00+08:00'
    );
  });
});

describe('getSingaporeParts', () => {
  it('reports calendar parts in Singapore, not the runtime zone', () => {
    // 23:30 SGT on 30 June is 15:30 UTC — the calendar day must stay the 30th.
    const d = parseSingaporeDate('2026-06-30 23:30') as Date;
    expect(getSingaporeParts(d)).toEqual({
      year: 2026,
      month: 6,
      day: 30,
      weekday: 2,
    });
  });

  it('does not roll a late-evening event into the next month', () => {
    const d = parseSingaporeDate('2026-06-30 23:30') as Date;
    expect(getSingaporeParts(d).month).toBe(6);
  });
});

describe('getEventTiming', () => {
  it('returns null when the start date is missing or invalid', () => {
    expect(getEventTiming({})).toBeNull();
    expect(getEventTiming({ date: '' })).toBeNull();
    expect(getEventTiming({ date: 'nonsense' })).toBeNull();
  });

  it('falls back to a 2 hour default when nothing else is given', () => {
    const t = getEventTiming({ date: '2026-03-14 13:00' });
    expect(t?.durationMs).toBe(2 * 60 * 60 * 1000);
    expect(toSingaporeIso(t?.end as Date)).toBe('2026-03-14T15:00:00+08:00');
  });

  it('treats empty, zero and null durations as unset', () => {
    const twoHours = 2 * 60 * 60 * 1000;
    // Real archive rows carry all three of these.
    expect(
      getEventTiming({ date: '2026-03-14 13:00', duration: null })?.durationMs
    ).toBe(twoHours);
    expect(
      getEventTiming({ date: '2026-03-14 13:00', duration: '' })?.durationMs
    ).toBe(twoHours);
    expect(
      getEventTiming({ date: '2026-03-14 13:00', duration: 0 })?.durationMs
    ).toBe(twoHours);
  });

  it('accepts a fractional duration, as a number or a string', () => {
    const ninetyMin = 90 * 60 * 1000;
    expect(
      getEventTiming({ date: '2026-03-14 13:00', duration: 1.5 })?.durationMs
    ).toBe(ninetyMin);
    expect(
      getEventTiming({ date: '2026-03-14 13:00', duration: '1.5' })?.durationMs
    ).toBe(ninetyMin);
  });

  it('prefers end_date over duration', () => {
    const t = getEventTiming({
      date: '2026-03-14 13:00',
      end_date: '2026-03-15 16:00',
      duration: 1,
    });
    expect(toSingaporeIso(t?.end as Date)).toBe('2026-03-15T16:00:00+08:00');
    expect(t?.isMultiDay).toBe(true);
  });

  it('ignores an end_date that is not after the start', () => {
    const t = getEventTiming({
      date: '2026-03-14 13:00',
      end_date: '2026-03-14 09:00',
      duration: 3,
    });
    expect(t?.durationMs).toBe(3 * 60 * 60 * 1000);
    expect(t?.isMultiDay).toBe(false);
  });

  it('flags multi-day by calendar day, not by elapsed hours', () => {
    // 22:00 → 01:00 is only 3 hours but crosses midnight in Singapore.
    const overnight = getEventTiming({
      date: '2026-03-14 22:00',
      end_date: '2026-03-15 01:00',
    });
    expect(overnight?.isMultiDay).toBe(true);

    // A 6 hour daytime session stays single-day.
    const long = getEventTiming({ date: '2026-03-14 10:00', duration: 6 });
    expect(long?.isMultiDay).toBe(false);
  });

  it('normalises an unknown or absent recurrence to none', () => {
    expect(getEventTiming({ date: '2026-03-14 13:00' })?.recurrence).toBe(
      'none'
    );
    expect(
      getEventTiming({ date: '2026-03-14 13:00', recurrence: 'fortnightly' })
        ?.recurrence
    ).toBe('none');
  });
});

describe('expandOccurrences', () => {
  it('returns a single occurrence for a non-recurring event', () => {
    const t = getEventTiming({ date: '2026-03-14 13:00' });
    expect(expandOccurrences(t!)).toHaveLength(1);
  });

  it('expands a weekly series and stops at recurrence_until', () => {
    // Yana's Saturday class: 1 Aug 2026 (a Saturday) through 27 Dec.
    const t = getEventTiming({
      date: '2026-08-01 10:30',
      duration: 1.5,
      recurrence: 'weekly',
      recurrence_until: '2026-12-27 23:59',
    });
    const occ = expandOccurrences(t!);
    expect(occ).toHaveLength(22);
    expect(occ.every((o) => getSingaporeParts(o.start).weekday === 6)).toBe(
      true
    );
    expect(toSingaporeIso(occ[0].start)).toBe('2026-08-01T10:30:00+08:00');
    expect(toSingaporeIso(occ[occ.length - 1].start)).toBe(
      '2026-12-26T10:30:00+08:00'
    );
  });

  it('carries the first occurrence length onto every repeat', () => {
    const t = getEventTiming({
      date: '2026-08-01 10:30',
      duration: 1.5,
      recurrence: 'weekly',
      recurrence_until: '2026-08-22 23:59',
    });
    for (const o of expandOccurrences(t!)) {
      expect(o.end.getTime() - o.start.getTime()).toBe(90 * 60 * 1000);
    }
  });

  it('skips a week for biweekly', () => {
    const t = getEventTiming({
      date: '2026-08-01 10:30',
      recurrence: 'biweekly',
      recurrence_until: '2026-08-31 23:59',
    });
    expect(expandOccurrences(t!).map((o) => toSingaporeIso(o.start))).toEqual([
      '2026-08-01T10:30:00+08:00',
      '2026-08-15T10:30:00+08:00',
      '2026-08-29T10:30:00+08:00',
    ]);
  });

  it('clamps a monthly repeat to the last day of a short month', () => {
    const t = getEventTiming({
      date: '2026-01-31 19:00',
      recurrence: 'monthly',
      recurrence_until: '2026-04-30 23:59',
    });
    // 2026 is not a leap year, so 31 Jan → 28 Feb.
    expect(expandOccurrences(t!).map((o) => toSingaporeIso(o.start))).toEqual([
      '2026-01-31T19:00:00+08:00',
      '2026-02-28T19:00:00+08:00',
      '2026-03-31T19:00:00+08:00',
      '2026-04-30T19:00:00+08:00',
    ]);
  });

  it('clamps to 29 February in a leap year', () => {
    const t = getEventTiming({
      date: '2028-01-31 19:00',
      recurrence: 'monthly',
      recurrence_until: '2028-02-29 23:59',
    });
    expect(expandOccurrences(t!).map((o) => toSingaporeIso(o.start))).toEqual([
      '2028-01-31T19:00:00+08:00',
      '2028-02-29T19:00:00+08:00',
    ]);
  });

  it('caps an open-ended series at a 12 month horizon', () => {
    const t = getEventTiming({
      date: '2026-08-01 10:30',
      recurrence: 'weekly',
    });
    const occ = expandOccurrences(t!);
    expect(occ.length).toBeGreaterThan(50);
    expect(occ.length).toBeLessThanOrEqual(53);
    expect(occ[occ.length - 1].start.getTime()).toBeLessThanOrEqual(
      sgt('2027-08-01T02:30:00Z').getTime()
    );
  });

  it('never exceeds the hard occurrence limit', () => {
    const t = getEventTiming({
      date: '2020-01-01 10:00',
      recurrence: 'weekly',
      recurrence_until: '2060-01-01 10:00',
    });
    expect(expandOccurrences(t!).length).toBeLessThanOrEqual(MAX_OCCURRENCES);
  });

  it('includes the final session when recurrence_until is a bare date', () => {
    // Storyblok's datetime picker defaults the time to 00:00, so an editor who
    // means "runs until 27 Dec" sets exactly this. Comparing instants dropped
    // that day's 10:30 session, retiring the series a week early.
    const t = getEventTiming({
      date: '2026-08-01 10:30',
      duration: 1.5,
      recurrence: 'weekly',
      recurrence_until: '2026-12-27 00:00',
    });
    const occ = expandOccurrences(t!);
    expect(toSingaporeIso(occ[occ.length - 1].start)).toBe(
      '2026-12-26T10:30:00+08:00'
    );
    // 26 Dec is the last Saturday on/before 27 Dec, so the series is intact.
    expect(occ).toHaveLength(22);
  });

  it('treats recurrence_until as inclusive of its whole Singapore day', () => {
    // A Sunday series ending on its own final session date.
    const t = getEventTiming({
      date: '2026-08-02 10:30',
      duration: 1.5,
      recurrence: 'weekly',
      recurrence_until: '2026-08-23 00:00',
    });
    expect(expandOccurrences(t!).map((o) => toSingaporeIso(o.start))).toEqual([
      '2026-08-02T10:30:00+08:00',
      '2026-08-09T10:30:00+08:00',
      '2026-08-16T10:30:00+08:00',
      '2026-08-23T10:30:00+08:00',
    ]);
  });

  it('keeps a series upcoming through the whole of its final day', () => {
    const t = getEventTiming({
      date: '2026-08-02 10:30',
      duration: 1.5,
      recurrence: 'weekly',
      recurrence_until: '2026-08-23 00:00',
    })!;
    // 09:00 SGT on the final day — the last session has not run yet.
    expect(isUpcomingEvent(t, new Date('2026-08-23T01:00:00Z'))).toBe(true);
  });

  it('yields the first occurrence even when recurrence_until precedes it', () => {
    const t = getEventTiming({
      date: '2026-08-01 10:30',
      recurrence: 'weekly',
      recurrence_until: '2026-07-01 10:30',
    });
    expect(expandOccurrences(t!)).toHaveLength(1);
  });
});

describe('getNextOccurrence / isUpcomingEvent', () => {
  const twoHourClass = { date: '2026-08-01 10:00' };

  it('keeps an event upcoming while it is still running', () => {
    // The old code compared against the START, so a 10:00 class vanished at 10:01.
    const t = getEventTiming(twoHourClass)!;
    const midSession = sgt('2026-08-01T02:30:00Z'); // 10:30 SGT
    expect(isUpcomingEvent(t, midSession)).toBe(true);
    expect(toSingaporeIso(getNextOccurrence(t, midSession)!.start)).toBe(
      '2026-08-01T10:00:00+08:00'
    );
  });

  it('moves an event to past one millisecond after it ends', () => {
    const t = getEventTiming(twoHourClass)!;
    const end = sgt('2026-08-01T04:00:00Z'); // 12:00 SGT
    expect(isUpcomingEvent(t, end)).toBe(true);
    expect(isUpcomingEvent(t, new Date(end.getTime() + 1))).toBe(false);
    expect(getNextOccurrence(t, new Date(end.getTime() + 1))).toBeNull();
  });

  it('keeps a multi-day event upcoming on its middle day', () => {
    const t = getEventTiming({
      date: '2026-06-05 19:00',
      end_date: '2026-06-17 21:00',
    })!;
    // Kirill Osherov's 5–17 June seminar, seen on the 10th.
    expect(isUpcomingEvent(t, sgt('2026-06-10T04:00:00Z'))).toBe(true);
  });

  it('keeps a running series upcoming and points at the next session', () => {
    // First session six months ago, series runs to the end of the year.
    const t = getEventTiming({
      date: '2026-02-07 10:30',
      duration: 1.5,
      recurrence: 'weekly',
      recurrence_until: '2026-12-26 12:00',
    })!;
    const now = sgt('2026-08-03T02:00:00Z'); // Mon 3 Aug, 10:00 SGT
    expect(isUpcomingEvent(t, now)).toBe(true);
    expect(toSingaporeIso(getNextOccurrence(t, now)!.start)).toBe(
      '2026-08-08T10:30:00+08:00'
    );
  });

  it('moves a series to past only after its final session ends', () => {
    const t = getEventTiming({
      date: '2026-08-01 10:30',
      duration: 1.5,
      recurrence: 'weekly',
      recurrence_until: '2026-08-15 23:59',
    })!;
    const beforeLast = sgt('2026-08-15T02:00:00Z'); // 10:00 SGT on the last day
    expect(isUpcomingEvent(t, beforeLast)).toBe(true);
    const afterLast = sgt('2026-08-15T04:01:00Z'); // 12:01 SGT, session ended
    expect(isUpcomingEvent(t, afterLast)).toBe(false);
  });
});

describe('getLastOccurrence', () => {
  it('returns the single occurrence of a finished one-off', () => {
    const t = getEventTiming({ date: '2026-03-14 13:00' })!;
    expect(
      toSingaporeIso(getLastOccurrence(t, sgt('2026-08-03T00:00:00Z'))!.start)
    ).toBe('2026-03-14T13:00:00+08:00');
  });

  it('returns the final past session of a finished series', () => {
    const t = getEventTiming({
      date: '2026-08-01 10:30',
      duration: 1.5,
      recurrence: 'weekly',
      recurrence_until: '2026-08-15 23:59',
    })!;
    expect(
      toSingaporeIso(getLastOccurrence(t, sgt('2026-09-01T00:00:00Z'))!.start)
    ).toBe('2026-08-15T10:30:00+08:00');
  });

  it('returns null for an event that has not started yet', () => {
    const t = getEventTiming({ date: '2026-12-25 13:00' })!;
    expect(getLastOccurrence(t, sgt('2026-08-03T00:00:00Z'))).toBeNull();
  });
});

describe('groupByYearMonth', () => {
  const item = (iso: string) => ({
    id: iso,
    at: parseSingaporeDate(iso) as Date,
  });

  it('groups newest first, by Singapore calendar month', () => {
    const groups = groupByYearMonth(
      [
        item('2026-06-30 23:30'),
        item('2026-07-02 10:00'),
        item('2025-12-01 09:00'),
        item('2026-06-05 19:00'),
      ],
      (i) => i.at
    );

    expect(groups.map((g) => g.year)).toEqual([2026, 2025]);
    expect(groups[0].months.map((m) => m.month)).toEqual([7, 6]);
    // 30 June 23:30 SGT is 15:30 UTC — it must not leak into July.
    expect(groups[0].months[1].items.map((i) => i.id)).toEqual([
      '2026-06-30 23:30',
      '2026-06-05 19:00',
    ]);
  });

  it('sorts items newest first inside a month and counts the year', () => {
    const groups = groupByYearMonth(
      [
        item('2026-06-05 19:00'),
        item('2026-06-30 23:30'),
        item('2026-01-02 10:00'),
      ],
      (i) => i.at
    );
    expect(groups[0].total).toBe(3);
    expect(groups[0].months[0].items[0].id).toBe('2026-06-30 23:30');
  });

  it('emits stable anchors and human labels', () => {
    const groups = groupByYearMonth([item('2026-06-05 19:00')], (i) => i.at);
    expect(groups[0].anchor).toBe('y2026');
    expect(groups[0].months[0].anchor).toBe('m2026-06');
    expect(groups[0].months[0].label).toBe('June');
  });

  it('returns an empty array for no items', () => {
    expect(groupByYearMonth([], (i: { at: Date }) => i.at)).toEqual([]);
  });
});
