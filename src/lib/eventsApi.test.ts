import { describe, expect, test } from 'vitest';
import {
  fetchEventStories,
  partitionEvents,
  toEventListItem,
} from './eventsApi';
import type { StoryblokListClient } from './storiesApi';
import type { EventStory } from '../types/event';

const event = (
  content: Partial<EventStory['content']> & { date: string },
  top: Partial<EventStory> = {}
): EventStory => ({
  id: 10,
  name: content.title ?? 'A class',
  slug: 'a-class',
  content: {
    title: 'A class',
    description: 'Come and play.',
    location: 'Singapore Handpan Studio',
    ...content,
  },
  ...top,
});

/** Stubs the paging contract `fetchAllStories` relies on. */
const client = (
  pages: EventStory[][]
): StoryblokListClient & { calls: Record<string, unknown>[] } => {
  const total = pages.reduce((sum, page) => sum + page.length, 0);
  const calls: Record<string, unknown>[] = [];
  return {
    calls,
    async get(_path: string, params: Record<string, unknown>) {
      calls.push(params);
      const page = Number(params.page ?? 1);
      return { data: { stories: pages[page - 1] ?? [] }, total };
    },
  };
};

const now = new Date('2026-08-03T02:00:00Z'); // Mon 3 Aug 2026, 10:00 SGT

describe('fetchEventStories', () => {
  test('pages through every event so the list never truncates', async () => {
    // The bug this replaces: /events/ queried without per_page and silently
    // stopped at Storyblok's default of 25, hiding 18 of 43 events.
    const first = Array.from({ length: 100 }, () =>
      event({ date: '2026-01-01 10:00' })
    );
    const second = Array.from({ length: 12 }, () =>
      event({ date: '2026-02-01 10:00' })
    );
    const api = client([first, second]);

    const stories = await fetchEventStories(api, 'published');

    expect(stories).toHaveLength(112);
    expect(api.calls).toHaveLength(2);
    expect(api.calls[0]).toMatchObject({
      starts_with: 'events/',
      content_type: 'event',
      version: 'published',
      per_page: 100,
      page: 1,
    });
    expect(api.calls[1]).toMatchObject({ page: 2 });
  });

  test('never sends a server-side date filter', async () => {
    // Storyblok can only compare the stored first-occurrence date, so a
    // filter_query would hide a running multi-day event and every series whose
    // first session is past. Partitioning has to happen in JS.
    const api = client([[event({ date: '2026-01-01 10:00' })]]);
    await fetchEventStories(api, 'draft');
    expect(api.calls[0]).not.toHaveProperty('filter_query');
  });

  test('requests draft content when asked', async () => {
    const api = client([[]]);
    await fetchEventStories(api, 'draft');
    expect(api.calls[0]).toMatchObject({ version: 'draft' });
  });
});

describe('toEventListItem', () => {
  test('returns null for a story with an unusable date', () => {
    expect(toEventListItem(event({ date: '' }), now)).toBeNull();
    expect(
      toEventListItem(event({ date: 'sometime in June' }), now)
    ).toBeNull();
  });

  test('carries the timing and the resolved occurrences', () => {
    const item = toEventListItem(
      event({ date: '2026-08-08 10:30', duration: 1.5 }),
      now
    );
    expect(item?.next?.start.toISOString()).toBe('2026-08-08T02:30:00.000Z');
    expect(item?.last).toBeNull();
    expect(item?.timing.durationMs).toBe(90 * 60 * 1000);
  });
});

describe('partitionEvents', () => {
  test('splits on the end of the occurrence, not its start', () => {
    const running = event(
      { date: '2026-08-03 09:00', duration: 3 },
      { slug: 'running' }
    );
    const finished = event(
      { date: '2026-08-03 07:00', duration: 1 },
      { slug: 'finished' }
    );

    const { upcoming, past } = partitionEvents([running, finished], now);

    expect(upcoming.map((i) => i.story.slug)).toEqual(['running']);
    expect(past.map((i) => i.story.slug)).toEqual(['finished']);
  });

  test('keeps a multi-day event upcoming while it is mid-span', () => {
    // Kirill Osherov's 5-17 June seminar, seen on the 10th.
    const seminar = event(
      { date: '2026-06-05 19:00', end_date: '2026-06-17 21:00' },
      { slug: 'seminar' }
    );
    const { upcoming } = partitionEvents(
      [seminar],
      new Date('2026-06-10T04:00:00Z')
    );
    expect(upcoming.map((i) => i.story.slug)).toEqual(['seminar']);
  });

  test('keeps a running series upcoming and points at its next session', () => {
    // Yana's Saturday class: started in February, runs to the end of the year.
    const series = event({
      date: '2026-02-07 10:30',
      duration: 1.5,
      recurrence: 'weekly',
      recurrence_until: '2026-12-26 12:00',
    });
    const { upcoming, past } = partitionEvents([series], now);

    expect(past).toHaveLength(0);
    expect(upcoming[0].next?.start.toISOString()).toBe(
      '2026-08-08T02:30:00.000Z'
    );
  });

  test('archives a series only once its final session has ended', () => {
    const series = event({
      date: '2026-01-03 10:30',
      duration: 1.5,
      recurrence: 'weekly',
      recurrence_until: '2026-06-27 12:00',
    });
    const { upcoming, past } = partitionEvents([series], now);

    expect(upcoming).toHaveLength(0);
    // Filed under its LAST session, not its first — 27 June, not 3 January.
    expect(past[0].last?.start.toISOString()).toBe('2026-06-27T02:30:00.000Z');
  });

  test('sorts upcoming soonest first and past most-recent first', () => {
    const stories = [
      event({ date: '2026-09-12 10:00' }, { slug: 'later' }),
      event({ date: '2026-08-08 10:30' }, { slug: 'sooner' }),
      event({ date: '2026-03-14 13:00' }, { slug: 'older' }),
      event({ date: '2026-07-26 18:30' }, { slug: 'recent' }),
    ];
    const { upcoming, past } = partitionEvents(stories, now);

    expect(upcoming.map((i) => i.story.slug)).toEqual(['sooner', 'later']);
    expect(past.map((i) => i.story.slug)).toEqual(['recent', 'older']);
  });

  test('drops stories whose date cannot be parsed rather than crashing', () => {
    const stories = [
      event({ date: '2026-08-08 10:30' }, { slug: 'good' }),
      event({ date: '' }, { slug: 'broken' }),
    ];
    const { upcoming, past } = partitionEvents(stories, now);

    expect(upcoming.map((i) => i.story.slug)).toEqual(['good']);
    expect(past).toHaveLength(0);
  });

  test('handles an empty list', () => {
    expect(partitionEvents([], now)).toEqual({ upcoming: [], past: [] });
  });
});
