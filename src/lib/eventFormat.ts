/**
 * Display strings for events. Pure and side-effect free, like `eventDates.ts`.
 *
 * Formatting is hand-rolled rather than delegated to `toLocaleDateString('en-SG')`
 * for two reasons: the runtime timezone would leak into the output (the bug
 * `eventDates.ts` exists to fix), and Cloudflare Workers ship a trimmed ICU
 * build, so locale output is not guaranteed to match a developer's machine.
 * Everything here reads Singapore calendar parts explicitly.
 */

import {
  getSingaporeParts,
  getMonthLabel,
  type EventOccurrence,
  type EventTiming,
} from './eventDates';

const WEEKDAYS_SHORT = [
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
] as const;
const WEEKDAYS_LONG = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

/** En dash for a same-unit range, spaced en dash when the units differ. */
const TIGHT_RANGE = '–';
const SPACED_RANGE = ' – ';

const SERIES_NOUN: Record<string, string> = {
  weekly: 'Weekly series',
  biweekly: 'Fortnightly series',
  monthly: 'Monthly series',
};

/** Singapore-local hour/minute of an instant. */
function singaporeTimeParts(date: Date): { hour: number; minute: number } {
  const sg = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  return { hour: sg.getUTCHours(), minute: sg.getUTCMinutes() };
}

const shortMonth = (month: number) => getMonthLabel(month).slice(0, 3);

/** `10:30 am`, `1:00 pm`, `12:00 am` — never a zero or 24-hour clock. */
export function formatTime(date: Date): string {
  const { hour, minute } = singaporeTimeParts(date);
  const suffix = hour < 12 ? 'am' : 'pm';
  const twelve = hour % 12 === 0 ? 12 : hour % 12;
  return `${twelve}:${String(minute).padStart(2, '0')} ${suffix}`;
}

/** `14 Mar 2026`. */
export function formatShortDate(date: Date): string {
  const { year, month, day } = getSingaporeParts(date);
  return `${day} ${shortMonth(month)} ${year}`;
}

/** `Sat, 14 Mar 2026`. */
export function formatLongDate(date: Date): string {
  const { weekday } = getSingaporeParts(date);
  return `${WEEKDAYS_SHORT[weekday]}, ${formatShortDate(date)}`;
}

/**
 * The date line for a card or detail page:
 * `Sat, 14 Mar 2026` · `14–15 Mar 2026` · `30 Apr – 2 May 2026` ·
 * `28 Dec 2026 – 3 Jan 2027`.
 */
export function formatEventDateRange(timing: EventTiming): string {
  if (!timing.isMultiDay) return formatLongDate(timing.start);

  const from = getSingaporeParts(timing.start);
  const to = getSingaporeParts(timing.end);

  if (from.year !== to.year) {
    return `${formatShortDate(timing.start)}${SPACED_RANGE}${formatShortDate(timing.end)}`;
  }
  if (from.month !== to.month) {
    return `${from.day} ${shortMonth(from.month)}${SPACED_RANGE}${to.day} ${shortMonth(to.month)} ${to.year}`;
  }
  return `${from.day}${TIGHT_RANGE}${to.day} ${shortMonth(to.month)} ${to.year}`;
}

/** `1:00 pm – 4:00 pm`. */
export function formatEventTimeRange(timing: EventTiming): string {
  return `${formatTime(timing.start)}${SPACED_RANGE}${formatTime(timing.end)}`;
}

/** `Sat, 8 Aug, 10:30 am` — the compact "next session" line on a card. */
export function formatOccurrenceLabel(occurrence: EventOccurrence): string {
  const { weekday, day, month } = getSingaporeParts(occurrence.start);
  return `${WEEKDAYS_SHORT[weekday]}, ${day} ${shortMonth(month)}, ${formatTime(occurrence.start)}`;
}

/** `1st`, `2nd`, `3rd`, `11th`, `22nd` — for monthly recurrence copy. */
function ordinal(day: number): string {
  const teen = day % 100;
  if (teen >= 11 && teen <= 13) return `${day}th`;
  const suffix = { 1: 'st', 2: 'nd', 3: 'rd' }[day % 10] ?? 'th';
  return `${day}${suffix}`;
}

function recurrenceCadence(timing: EventTiming): string | null {
  const { weekday, day } = getSingaporeParts(timing.start);
  switch (timing.recurrence) {
    case 'weekly':
      return `Every ${WEEKDAYS_LONG[weekday]}`;
    case 'biweekly':
      return `Every 2 weeks on ${WEEKDAYS_LONG[weekday]}`;
    case 'monthly':
      return `Every month on the ${ordinal(day)}`;
    default:
      return null;
  }
}

/**
 * `Every Saturday, 10:30 am — until 27 Dec 2026`, or `null` for a one-off.
 * The end clause is dropped when the series has no configured end date.
 */
export function formatRecurrenceLabel(timing: EventTiming): string | null {
  const cadence = recurrenceCadence(timing);
  if (!cadence) return null;

  const base = `${cadence}, ${formatTime(timing.start)}`;
  return timing.recurrenceUntil
    ? `${base} — until ${formatShortDate(timing.recurrenceUntil)}`
    : base;
}

/**
 * `Weekly series · Mar – Dec 2026` — how a recurring class is summarised in the
 * archive, where it appears once rather than once per session.
 */
export function formatSeriesSpanLabel(timing: EventTiming): string | null {
  const noun = SERIES_NOUN[timing.recurrence];
  if (!noun) return null;

  const from = getSingaporeParts(timing.start);
  if (!timing.recurrenceUntil)
    return `${noun} · from ${formatShortDate(timing.start)}`;

  const to = getSingaporeParts(timing.recurrenceUntil);
  const span =
    from.year === to.year
      ? `${shortMonth(from.month)}${SPACED_RANGE}${shortMonth(to.month)} ${to.year}`
      : `${shortMonth(from.month)} ${from.year}${SPACED_RANGE}${shortMonth(to.month)} ${to.year}`;
  return `${noun} · ${span}`;
}

/** `1 hour` / `1.5 hours`, or `null` for the unset values the CMS holds. */
export function formatDurationLabel(
  duration: number | string | null | undefined
): string | null {
  if (duration === null || duration === undefined || duration === '')
    return null;
  const hours = typeof duration === 'number' ? duration : Number(duration);
  if (!Number.isFinite(hours) || hours <= 0) return null;
  return hours === 1 ? '1 hour' : `${hours} hours`;
}
