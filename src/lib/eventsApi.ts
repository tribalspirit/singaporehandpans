/**
 * Fetching and upcoming/past partitioning for events.
 *
 * Deliberately does **not** use a Storyblok `filter_query` on the date. The CDN
 * can only compare the stored first-occurrence date, which would hide two whole
 * classes of event now that multi-day and recurring classes exist:
 *
 *  - a multi-day event that started yesterday and ends tomorrow, and
 *  - any recurring series whose first session is in the past — which is every
 *    series after its opening week.
 *
 * So every event is fetched once and split in JS. At ~43 stories that is a
 * single request; `fetchAllStories` pages at 100, so it stays one request until
 * the space grows past that.
 */

import { fetchAllStories, type StoryblokListClient } from './storiesApi';
import {
  getEventTiming,
  getLastOccurrence,
  getNextOccurrence,
  type EventOccurrence,
  type EventTiming,
} from './eventDates';
import type { EventStory } from '../types/event';

export interface EventListItem {
  story: EventStory;
  timing: EventTiming;
  /** The session to advertise: the first that has not finished. Null once past. */
  next: EventOccurrence | null;
  /** The most recent finished session. Null until the event has started. */
  last: EventOccurrence | null;
}

export interface PartitionedEvents {
  upcoming: EventListItem[];
  past: EventListItem[];
}

const EVENT_QUERY = {
  starts_with: 'events/',
  content_type: 'event',
  sort_by: 'content.date:desc',
  resolve_assets: 1,
} as const;

/**
 * Every event in the space, across all pages. Replaces the bare `cdn/stories`
 * call that omitted `per_page` and silently stopped at Storyblok's default 25.
 */
export async function fetchEventStories(
  client: StoryblokListClient,
  version: 'draft' | 'published'
): Promise<EventStory[]> {
  return fetchAllStories<EventStory>(client, { ...EVENT_QUERY, version });
}

/**
 * Resolve a story's timeline position. Returns `null` when the date is missing
 * or unparseable — such a story cannot be placed on a timeline, and dropping it
 * is better than rendering an Invalid Date to a visitor.
 */
export function toEventListItem(
  story: EventStory,
  now: Date
): EventListItem | null {
  const timing = getEventTiming(story.content);
  if (!timing) return null;
  return {
    story,
    timing,
    next: getNextOccurrence(timing, now),
    last: getLastOccurrence(timing, now),
  };
}

/**
 * Split events into what is still to come and what is finished.
 *
 * An event counts as upcoming while any of its occurrences has yet to end, so a
 * class in progress, a multi-day event mid-span, and a weekly series with
 * sessions left all stay on `/events/`. Upcoming is sorted soonest-first by the
 * next session; past is sorted most-recent-first by the last session, which is
 * what the archive groups on.
 */
export function partitionEvents(
  stories: readonly EventStory[],
  now: Date
): PartitionedEvents {
  const upcoming: EventListItem[] = [];
  const past: EventListItem[] = [];

  for (const story of stories) {
    const item = toEventListItem(story, now);
    if (!item) continue;
    if (item.next) upcoming.push(item);
    else if (item.last) past.push(item);
  }

  return {
    upcoming: [...upcoming].sort(
      (a, b) =>
        (a.next as EventOccurrence).start.getTime() -
        (b.next as EventOccurrence).start.getTime()
    ),
    past: [...past].sort(
      (a, b) =>
        (b.last as EventOccurrence).start.getTime() -
        (a.last as EventOccurrence).start.getTime()
    ),
  };
}
