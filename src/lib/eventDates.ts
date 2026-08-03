/**
 * Date logic for events/classes. Kept pure (no Astro or runtime imports) so it
 * is unit-testable, mirroring `trailingSlash.ts` and `legacyRedirects.ts`.
 *
 * Two things this module exists to get right:
 *
 * 1. **Timezone.** Storyblok stores event datetimes as a naive `'YYYY-MM-DD HH:mm'`
 *    string with no zone. `new Date(...)` resolves that in the *runtime's* zone —
 *    UTC on Cloudflare Workers, +08 on a developer laptop — so the same event
 *    rendered in two places disagreed, and the `startDate` we emitted in the
 *    Event JSON-LD was not valid ISO-8601 at all. Every value here is anchored to
 *    Singapore time explicitly. Singapore has been a fixed +08:00 with no DST
 *    since 1982, so plain offset arithmetic is correct and an IANA lookup would
 *    be over-engineering.
 *
 * 2. **The upcoming/past boundary.** It is the *end* of the relevant occurrence,
 *    never the start, so a class does not disappear from the site half way
 *    through its own session.
 */

/** Singapore is a fixed +08:00 with no daylight saving. */
export const SINGAPORE_OFFSET = '+08:00';
const SG_OFFSET_MS = 8 * 60 * 60 * 1000;

/** Used when an event specifies neither an end date nor a usable duration. */
export const DEFAULT_DURATION_HOURS = 2;

/** How far ahead an open-ended series is expanded when no end date is set. */
export const OPEN_ENDED_HORIZON_MONTHS = 12;

/** Backstop so a misconfigured series can never generate unbounded work. */
export const MAX_OCCURRENCES = 400;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export type RecurrenceRule = 'none' | 'weekly' | 'biweekly' | 'monthly';

const RECURRENCE_RULES: readonly RecurrenceRule[] = [
  'none',
  'weekly',
  'biweekly',
  'monthly',
];

/** The subset of `EventContent` this module reads. */
export interface EventTimingInput {
  date?: string | null;
  end_date?: string | null;
  duration?: number | string | null;
  recurrence?: string | null;
  recurrence_until?: string | null;
}

export interface EventOccurrence {
  start: Date;
  end: Date;
}

export interface EventTiming {
  /** Start of the first (or only) occurrence. */
  start: Date;
  /** End of the first (or only) occurrence. */
  end: Date;
  /**
   * True when `end_date` supplied the end. `duration` is then ignored, and UI
   * must not display it — a migrated two-day event can still carry a stale
   * `duration: 3` that would read "~3 hours" beside "14–15 Mar 2026".
   */
  hasExplicitEnd: boolean;
  /** True when the first occurrence spans more than one Singapore calendar day. */
  isMultiDay: boolean;
  recurrence: RecurrenceRule;
  recurrenceUntil: Date | null;
  /** Length of a single occurrence, reused for every repeat. */
  durationMs: number;
}

export interface SingaporeParts {
  year: number;
  /** 1-12, unlike `Date.getMonth()`. */
  month: number;
  day: number;
  /** 0 = Sunday … 6 = Saturday. */
  weekday: number;
}

const NAIVE_DATETIME =
  /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/;

/** Build a `Date` from Singapore wall-clock components. */
function fromSingaporeParts(
  year: number,
  monthIndex: number,
  day: number,
  hour: number,
  minute: number,
  second: number
): Date {
  return new Date(
    Date.UTC(year, monthIndex, day, hour, minute, second) - SG_OFFSET_MS
  );
}

/** Days in a given month, used to clamp monthly repeats. */
function daysInMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

/**
 * Parse a Storyblok datetime as Singapore time.
 *
 * Accepts the naive `'YYYY-MM-DD HH:mm'` form Storyblok actually stores (with or
 * without seconds, with a space or a `T`), and passes anything already carrying
 * an offset straight through. Returns `null` rather than an Invalid Date so
 * callers are forced to handle bad content.
 */
export function parseSingaporeDate(value?: string | null): Date | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const naive = NAIVE_DATETIME.exec(trimmed);
  if (naive) {
    const [, y, mo, d, h, mi, s] = naive;
    const year = Number(y);
    const monthIndex = Number(mo) - 1;
    const day = Number(d);
    const hour = Number(h);
    const minute = Number(mi);
    const second = s ? Number(s) : 0;

    // Reject impossible components rather than letting Date roll them over
    // (e.g. '2026-13-45 99:99' must not silently become 2027-02-14).
    if (monthIndex < 0 || monthIndex > 11) return null;
    if (day < 1 || day > daysInMonth(year, monthIndex)) return null;
    if (hour > 23 || minute > 59 || second > 59) return null;

    return fromSingaporeParts(year, monthIndex, day, hour, minute, second);
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

const pad = (n: number, width = 2) => String(n).padStart(width, '0');

/**
 * Format an instant as ISO-8601 in Singapore local time — the form schema.org
 * and Google's Rich Results parser require.
 */
export function toSingaporeIso(date: Date): string {
  const sg = new Date(date.getTime() + SG_OFFSET_MS);
  const datePart = `${pad(sg.getUTCFullYear(), 4)}-${pad(sg.getUTCMonth() + 1)}-${pad(sg.getUTCDate())}`;
  const timePart = `${pad(sg.getUTCHours())}:${pad(sg.getUTCMinutes())}:${pad(sg.getUTCSeconds())}`;
  return `${datePart}T${timePart}${SINGAPORE_OFFSET}`;
}

/** Calendar-day parts as seen in Singapore, regardless of the runtime zone. */
export function getSingaporeParts(date: Date): SingaporeParts {
  const sg = new Date(date.getTime() + SG_OFFSET_MS);
  return {
    year: sg.getUTCFullYear(),
    month: sg.getUTCMonth() + 1,
    day: sg.getUTCDate(),
    weekday: sg.getUTCDay(),
  };
}

/** Singapore midnight of the day containing `date`, as an epoch value. */
function singaporeDayStart(date: Date): number {
  const sg = date.getTime() + SG_OFFSET_MS;
  return Math.floor(sg / MS_PER_DAY) * MS_PER_DAY - SG_OFFSET_MS;
}

/**
 * The last instant of the Singapore day containing `date`.
 *
 * "Repeat until" is a *date* in the editor's head, but Storyblok's picker
 * defaults the time to 00:00. Comparing raw instants therefore dropped any
 * session falling on that very day — a 10:30 class set to run until
 * `2026-08-23 00:00` lost its 23 August session and retired a week early.
 */
function endOfSingaporeDay(date: Date): Date {
  return new Date(singaporeDayStart(date) + MS_PER_DAY - 1);
}

/**
 * A duration in hours, if the CMS holds a usable one. Real archive rows carry
 * `null`, `''` and `0` for "not set", so all three fall through to the default.
 */
function parseDurationHours(
  value: number | string | null | undefined
): number | null {
  if (value === null || value === undefined || value === '') return null;
  const hours = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(hours) || hours <= 0) return null;
  return hours;
}

function normalizeRecurrence(value: string | null | undefined): RecurrenceRule {
  return RECURRENCE_RULES.includes(value as RecurrenceRule)
    ? (value as RecurrenceRule)
    : 'none';
}

/**
 * Resolve an event's start, end and repeat rule. Returns `null` when the start
 * date is missing or unparseable — such a story cannot be placed on a timeline
 * and callers should drop it.
 */
export function getEventTiming(input: EventTimingInput): EventTiming | null {
  const start = parseSingaporeDate(input.date);
  if (!start) return null;

  const explicitEnd = parseSingaporeDate(input.end_date);
  const hours = parseDurationHours(input.duration);
  // Only an end_date that actually beats the start wins; anything else is bad
  // content and falls through to the duration.
  const hasExplicitEnd = Boolean(
    explicitEnd && explicitEnd.getTime() > start.getTime()
  );
  const recurrenceUntil = parseSingaporeDate(input.recurrence_until);

  // An end_date that is not after the start is bad content, not a zero-length
  // event — fall back to the duration rather than rendering a negative span.
  const end =
    hasExplicitEnd && explicitEnd
      ? explicitEnd
      : new Date(
          start.getTime() + (hours ?? DEFAULT_DURATION_HOURS) * 60 * 60 * 1000
        );

  return {
    start,
    end,
    hasExplicitEnd,
    // Compared by calendar day, not elapsed hours: a 22:00–01:00 session spans
    // two days, while a 10:00–16:00 one does not.
    isMultiDay: singaporeDayStart(start) !== singaporeDayStart(end),
    recurrence: normalizeRecurrence(input.recurrence),
    // Inclusive of the whole configured day — see `endOfSingaporeDay`.
    recurrenceUntil: recurrenceUntil
      ? endOfSingaporeDay(recurrenceUntil)
      : null,
    durationMs: end.getTime() - start.getTime(),
  };
}

/** Shift a Singapore wall-clock date by whole months, clamping short months. */
function addSingaporeMonths(base: Date, months: number): Date {
  const sg = new Date(base.getTime() + SG_OFFSET_MS);
  const target = sg.getUTCMonth() + months;
  const year = sg.getUTCFullYear() + Math.floor(target / 12);
  const monthIndex = ((target % 12) + 12) % 12;
  return fromSingaporeParts(
    year,
    monthIndex,
    Math.min(sg.getUTCDate(), daysInMonth(year, monthIndex)),
    sg.getUTCHours(),
    sg.getUTCMinutes(),
    sg.getUTCSeconds()
  );
}

/** Start of the nth repeat, counting the first occurrence as n = 0. */
function occurrenceStart(timing: EventTiming, index: number): Date {
  switch (timing.recurrence) {
    case 'weekly':
      return new Date(timing.start.getTime() + index * 7 * MS_PER_DAY);
    case 'biweekly':
      return new Date(timing.start.getTime() + index * 14 * MS_PER_DAY);
    case 'monthly':
      // Always measured from the original start, so 31 Jan → 28 Feb → 31 Mar
      // rather than collapsing onto the 28th for good.
      return addSingaporeMonths(timing.start, index);
    default:
      return timing.start;
  }
}

/**
 * The last instant an open-ended series is expanded to. Anchored to whichever
 * is later of the series start and "now", so a class that has been running for
 * two years still resolves a next session.
 */
function defaultHorizon(timing: EventTiming, now?: Date): Date {
  const anchor =
    now && now.getTime() > timing.start.getTime() ? now : timing.start;
  return addSingaporeMonths(anchor, OPEN_ENDED_HORIZON_MONTHS);
}

/**
 * Index of the last occurrence at or before `now`, so enumeration can start in
 * the window that matters instead of at the series' first-ever session. Kept
 * one step back so `getLastOccurrence` still sees a finished occurrence.
 */
function firstRelevantIndex(timing: EventTiming, now: Date): number {
  const elapsed = now.getTime() - timing.start.getTime();
  if (elapsed <= 0) return 0;

  let index: number;
  if (timing.recurrence === 'monthly') {
    const from = getSingaporeParts(timing.start);
    const to = getSingaporeParts(now);
    index = (to.year - from.year) * 12 + (to.month - from.month);
  } else {
    const step = timing.recurrence === 'biweekly' ? 14 : 7;
    index = Math.floor(elapsed / (step * MS_PER_DAY));
  }

  return Math.max(0, index - 1);
}

export interface ExpandOptions {
  /** Last start date to include. Defaults to `recurrence_until`, else 12 months. */
  horizon?: Date;
  /** Reference point used to extend the horizon of an open-ended series. */
  now?: Date;
  limit?: number;
}

/**
 * Expand a timing into concrete occurrences, newest last. A non-recurring event
 * yields exactly one. The first occurrence is always included, even when
 * `recurrence_until` predates it (bad content should still render something).
 */
export function expandOccurrences(
  timing: EventTiming,
  options: ExpandOptions = {}
): EventOccurrence[] {
  const first: EventOccurrence = { start: timing.start, end: timing.end };
  if (timing.recurrence === 'none') return [first];

  const horizon =
    options.horizon ??
    timing.recurrenceUntil ??
    defaultHorizon(timing, options.now);
  const limit = Math.min(options.limit ?? MAX_OCCURRENCES, MAX_OCCURRENCES);

  // The cap bounds the *window we care about*, not the series' lifetime. An
  // open-ended weekly class running longer than MAX_OCCURRENCES (~7.7 years)
  // would otherwise enumerate indices 0-399 from its original start, stop years
  // short of today, and report no next session — archiving a series that is
  // still running. So enumeration begins just before `now` for open-ended
  // series, keeping the cap over the relevant window.
  // Clamped to the horizon as well as to `now`: a series that finished months
  // ago must still enumerate its closing sessions, not start past its own end
  // and come back empty.
  const from = options.now
    ? Math.max(
        0,
        Math.min(
          firstRelevantIndex(timing, options.now),
          firstRelevantIndex(timing, horizon)
        )
      )
    : 0;

  const occurrences: EventOccurrence[] = from === 0 ? [first] : [];
  for (let step = from === 0 ? 1 : from; step < from + limit; step += 1) {
    const start = occurrenceStart(timing, step);
    if (start.getTime() > horizon.getTime()) break;
    occurrences.push({
      start,
      end: new Date(start.getTime() + timing.durationMs),
    });
  }
  // Always keep the opening session reachable, so a finished series still
  // resolves a last occurrence and formatting has something to describe.
  return occurrences.length ? occurrences : [first];
}

/**
 * The occurrence an upcoming event should advertise: the first one that has not
 * finished yet. An in-progress session counts as upcoming, which is the whole
 * point — the previous implementation compared against the start time, so a
 * 10:00 class dropped off the site at 10:01.
 */
export function getNextOccurrence(
  timing: EventTiming,
  now: Date
): EventOccurrence | null {
  const occurrences = expandOccurrences(timing, { now });
  return (
    occurrences.find(
      (occurrence) => occurrence.end.getTime() >= now.getTime()
    ) ?? null
  );
}

/** The most recent occurrence that has already finished, if any. */
export function getLastOccurrence(
  timing: EventTiming,
  now: Date
): EventOccurrence | null {
  const occurrences = expandOccurrences(timing, { now });
  for (let index = occurrences.length - 1; index >= 0; index -= 1) {
    if (occurrences[index].end.getTime() < now.getTime()) {
      return occurrences[index];
    }
  }
  return null;
}

/** True while any occurrence is still to come or in progress. */
export function isUpcomingEvent(timing: EventTiming, now: Date): boolean {
  return getNextOccurrence(timing, now) !== null;
}

export interface ArchiveMonth<T> {
  /** 1-12. */
  month: number;
  label: string;
  /** Stable in-page anchor, e.g. `m2026-06`. */
  anchor: string;
  items: readonly T[];
}

export interface ArchiveYear<T> {
  year: number;
  /** Stable in-page anchor, e.g. `y2026`. */
  anchor: string;
  total: number;
  months: readonly ArchiveMonth<T>[];
}

/** Human month name, without depending on the runtime's `Intl` locale data. */
export function getMonthLabel(month: number): string {
  return MONTH_NAMES[month - 1] ?? '';
}

/**
 * Group items into Year → Month buckets for the archive, newest first at every
 * level. Grouping uses Singapore calendar parts, so a 23:30 event on 30 June
 * files under June rather than leaking into July via UTC.
 */
export function groupByYearMonth<T>(
  items: readonly T[],
  getDate: (item: T) => Date
): ArchiveYear<T>[] {
  const byYear = new Map<number, Map<number, T[]>>();

  for (const item of items) {
    const { year, month } = getSingaporeParts(getDate(item));
    const months = byYear.get(year) ?? new Map<number, T[]>();
    months.set(month, [...(months.get(month) ?? []), item]);
    byYear.set(year, months);
  }

  const newestFirst = (a: T, b: T) =>
    getDate(b).getTime() - getDate(a).getTime();

  return [...byYear.entries()]
    .sort(([a], [b]) => b - a)
    .map(([year, months]) => ({
      year,
      anchor: `y${year}`,
      total: [...months.values()].reduce((sum, list) => sum + list.length, 0),
      months: [...months.entries()]
        .sort(([a], [b]) => b - a)
        .map(([month, list]) => ({
          month,
          label: getMonthLabel(month),
          anchor: `m${year}-${pad(month)}`,
          items: [...list].sort(newestFirst),
        })),
    }));
}
