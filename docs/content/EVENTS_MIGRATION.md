# Events content migration — multi-day and repeating classes

One-off cleanup after `end_date` / `recurrence` / `recurrence_until` were added
to the Event schema. Until it is done the site is correct but the CMS still
holds the hand-built workarounds those fields replace.

Done in the Storyblok UI — this is roughly ten stories, so a Management API
script carries more risk than it saves. Field reference:
[../setup/STORYBLOK.md](../setup/STORYBLOK.md#events).

Snapshot taken 2026-08-03: 43 events, 10 upcoming, 33 archived.

## Before you start

**Any slug you change or delete needs a redirect**, or an indexed page 404s.
Add an exact-path rule to `LEGACY_REDIRECTS` in
[`src/lib/legacyRedirects.ts`](../../src/lib/legacyRedirects.ts) (already wired
into `src/middleware.ts`, and covered by tests) before unpublishing anything:

```ts
{ pattern: /^\/events\/konnakol-for-handpan-.*-day-2\/?$/i,
  target: '/events/konnakol-for-handpan-learn-with-us-how-to-see-feel-and-structure-rhythm-through-konnakol/' },
```

Prefer keeping the slug and just filling in fields. Only delete where a story
is a genuine duplicate.

## 1. Duplicate "day 2" stories → one story with an End date

Both pairs are the same event published twice, with identical bodies.

| Keep (set End date on this one)                                                                           | Delete + redirect to it                                                                        |
| --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `konnakol-for-handpan-learn-with-us-how-to-see-feel-and-structure-rhythm-through-konnakol` (16 May 15:00) | `konnakol-for-handpan-learn-with-us-how-to-see-feel-and-structure-rhythm-day-2` (17 May 10:00) |
| `vocal-alchemy-the-art-of-shapeshifting-sound-with-marlia-coeur` (12 Sep 10:00)                           | `vocal-alchemy-the-art-of-shapeshifting-sound-with-marlia-coeur-day-2` (13 Sep 10:00)          |

Set **End date** on the kept story to the second day's finish time.

⚠️ Both of these run at **different times on each day** (Konnakol is Sat
15:00–18:00 then Sun 10:00–13:00). `End date` models one continuous span, so
the per-day times still belong in the description, as they are today. This is
a known limitation of the chosen model.

## 2. Multi-day events → set End date, keep the slug

These are already single stories; they just encode the span in the title, slug
or description. Set **End date**; leave the slug alone (they are past and
indexed). Optionally tidy the title once the dates render themselves.

- `handpan-masterclass-with-peter-bognar-level-1-sat-14-sun-15-from-1-4-pm` → ends 15 Mar 16:00
- `handpan-masterclass-with-peter-bognar-level-2-sat-14-sun-15-from-6-9-pm` → ends 15 Mar 21:00
- `handpan-masterclass-with-peter-bognar-level-1-sat-21-sun-22-from-10am-1pm` → ends 22 Mar 13:00
- `handpan-masterclass-2-days-immersive-journey` → 16 May 15:00 to 17 May 13:00
- `handpan-frame-drum-seminar-with-kirill-osherov` → 5 Jun 19:00 to 17 Jun (whole programme is in the description)

## 3. Repeating classes → one story with a Recurrence

The clearest case is Yana's Saturday workshop, currently three near-identical
stories. Keep the newest as the series, set `Recurrence = Every week` and a
`Repeat until`, then redirect the other two:

| Keep as the series                                                                                                      | Redirect away                                                                             |
| ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `handpan-first-touch-workshop-start-learning-handpan-with-yana-an` (1 Aug, title already says "Every Saturday Morning") | `handpan-first-touch-workshop-with-yana-start-your-your-handpan-journey-with-us` (14 May) |
|                                                                                                                         | `handpan-first-touch-workshop-start-learning-with-singapore-handpans` (8 Aug)             |

Also convert to a recurrence, in place:

- `handpan-for-beginners-on-thursday-mornings` — weekly, Thursdays
- `handpan-essentials-lessons-with-dany-rud-multiple-dates-available` — the "multiple dates available" is the giveaway; confirm the cadence with Dany
- `weekend-handpan-workshops-with-dany-rud` (Sat 14:00) — weekly
- `weekend-handpan-workshops-with-dany-rud-on-sunday-morning` (Sun 11:00) — weekly

**Keep the Dany Rud Saturday and Sunday stories separate.** They are two
different weekly classes at two different times, not one series — a single
story cannot express both.

The three "HANDPAN COURSE FOR BEGINNERS - 4 LESSONS JOURNEY" stories
(`handpan-course-for-beginner-4-lessons-journey`,
`handpan-essential-for-beginner-4-lessons-journey`, `handpan-beginner-course`)
are separate **cohorts** of a fixed 4-week course, not an open-ended series.
Either leave them as three stories, or give each one a `Repeat until` four
weeks after its start so the four lessons show as a short series. Your call —
both render correctly.

## 4. Data quality fixes

- **One story's slug is literally `events`** (full slug `events/events`), titled
  "HANDPAN ESSENTIALS WITH PETER BOGNAR on Friday 20th Evening". Rename it to a
  real slug and add a redirect.
- **Confirm no event uses the slug `archive`.** `/events/archive/` is now a real
  page and would shadow it.
- Several events have **Duration** set to `0` or left empty. Both are treated as
  "not set" and fall back to a 2 hour assumption for the schema.org end time —
  worth filling in where you know the real length.

## After migrating

1. Publish each changed story.
2. Check `/events/` and `/events/archive/` — the totals should still add up to
   every event in the space, minus any genuine duplicates you deleted.
3. Spot-check a redirected old URL returns a 301 to the new one.
4. Run one multi-day and one recurring event through
   [Google's Rich Results Test](https://search.google.com/test/rich-results) to
   confirm `startDate`, `endDate` and `eventSchedule` look right.
