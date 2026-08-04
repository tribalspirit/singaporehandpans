# Events CMS punch list

Content and schema work arising from the `/events/` + `/events/archive/` design
critique. **None of this is code** — it all happens in Storyblok. The code-side
remediation shipped separately on `feat/events-critique-remediation`.

Every item below was verified against the live rendered pages on 2026-08-04
(draft content, 10 upcoming + 33 past events), not copied from the critique.
Where the critique was wrong, that is noted.

---

## 1 — Typos (highest visibility, lowest effort)

| Story slug                                                                | Field       | Current                                                                     | Should be                                   |
| ------------------------------------------------------------------------- | ----------- | --------------------------------------------------------------------------- | ------------------------------------------- |
| `handpan-masterclass-with-takao-minemoto-for-singapore-handpan-communtiy` | title       | Handpan Masterclass with Takao Minemoto for Singapore Handpan **Communtiy** | …Handpan **Community**                      |
| `handpan-masterclass-with-takao-minemoto-for-singapore-handpan-communtiy` | **slug**    | …handpan-**communtiy**                                                      | …handpan-**community**                      |
| `live-concert-by-marlia-coeur`                                            | description | **UITAR**+VOICE+HANDPAN+DRUM                                                | **GUITAR**+VOICE+HANDPAN+DRUM               |
| `live-concert-by-marlia-coeur`                                            | title       | `Live Concert by␣␣Marlia Coeur` (double space)                              | `Live Concert by Marlia Coeur`              |
| `advance-yoru-handpan-playing-skiils`                                     | **slug**    | advance-**yoru**-handpan-playing-**skiils**                                 | advance-**your**-handpan-playing-**skills** |

**Not reproducible — please confirm in the CMS:**

- `Do not miss teh opportunity` — the critique reports this, but "teh" does not
  appear anywhere in the rendered output. Descriptions are now clamped, so it
  may sit past the visible cut. Search the description fields directly.
- `Jungle Adventur` — **the critique is wrong here.** The live title and slug
  both read `Jungle Adventure Sound Journey For Kids`, spelled correctly. No
  action needed.

## 2 — The `/events/events/` slug

One archive story has the literal slug `events`, so its URL is
`/events/events/`. Give it a real slug describing the event.

## 3 — Data correctness (do this first)

`handpan-for-beginners-on-thursday-mornings` is the **first card on the page**
and contradicts itself: the title says _Thursday Mornings_, the card prints
**Wed, 5 Aug 2026**. 5 August 2026 is a Wednesday, so the `date` field and the
title disagree — a visitor sees the contradiction directly beside a Book Now
button.

Someone who knows the schedule has to decide which is wrong. The code cannot:
it renders whatever `date` holds.

Once resolved, adopt the convention in §4 so it cannot recur.

## 4 — Title conventions

Titles currently take at least five shapes. Live examples:

- `HANDPAN COURSE FOR BEGINNERS - 4 LESSONS JOURNEY` — shouting, hyphen
- `Vocal Alchemy — The Art of Shapeshifting Sound with Marlia Coeur` — em dash
- `Handpan For Beginners on Thursday Mornings` — weekday baked in
- `HANDPAN ESSENTIALS WITH PETER BOGNAR on Friday 20th  Evening` — both, plus a double space
- `Handpan & Frame Drum Seminar with Kirill Osherov from 5 -17  June` — dates baked in

**One rule:** sentence case · no weekday · no date · teacher after an em dash ·
target ~45 characters.

> `Handpan course for beginners — 4 lessons`

A title carrying a weekday or date will always drift out of sync with the date
field, which is exactly what §3 is. `formatRecurrenceLabel` already renders
"Every Thursday, 10:30 am" from the recurrence rule — let it.

**A second reason to keep names in titles:** the archive rows and the tab
context line currently derive the teacher by reading `with <Name>` out of the
title (`extractTeacherName` in `src/lib/eventMatching.ts`). It is a regex over
free text, and it is why some rows read `Workshop · beginner` with no name. A
real `teacher` field would replace it — see §5.

## 5 — Schema fields the code already reads through for

These can be added whenever convenient; the site degrades gracefully without
them and will pick each one up as soon as it exists.

| Field       | Type   | What it fixes                                                 | Current fallback                                                     |
| ----------- | ------ | ------------------------------------------------------------- | -------------------------------------------------------------------- |
| `excerpt`   | text   | One written sentence per card, instead of a machine trim      | Word-boundary trim of `description` at 160 chars, clamped to 3 lines |
| `teacher`   | text   | Reliable attribution on archive rows and the tab context line | `extractTeacherName` regex on the title                              |
| `price_max` | number | Ranges as data rather than `$38-$138` free text               | `formatPrice` parses the free text and normalises it                 |
| `series_id` | text   | Collapsing multi-day events — see §6                          | None; days render as separate entries                                |

Note `price` is still free text. `formatPrice` (`src/lib/eventFormat.ts`) now
normalises `$88`, a bare `88`, `S$120` and `$38-$138` to `S$88` / `S$120` /
`S$38–138`, and passes anything it cannot parse through unchanged. Making the
field numeric would remove the guesswork, but nothing is broken today.

## 6 — Multi-day events render twice (deferred by decision)

Two events are modelled as one story per day, so they appear as two entries
with identical titles, descriptions, prices and tags:

- `vocal-alchemy-the-art-of-shapeshifting-sound-with-marlia-coeur` and
  `…-marlia-coeur-day-2` — **both titled identically**, 12 and 13 Sep. The slug
  says "day 2"; the title does not, so nothing on the page distinguishes them.
- `konnakol-for-handpan-…-through-konnakol` and `…-day-2`, 16/17 May, plus a
  third story (`handpan-masterclass-2-days-immersive-journey`) describing the
  same series.

Fixing this properly needs `series_id` (§5) plus re-authoring those stories as
one entry with a span. `formatSeriesSpanLabel` already exists to render
`Sat 12 – Sun 13 Sep · 2 sessions` once the data supports it.

A code-only heuristic was considered and rejected: collapsing on title equality
alone would merge any genuinely repeated title.

## 7 — After changing any slug

Add a 301 to `_redirects` at the repo root for each old → new slug, so inbound
links and search equity survive:

```
/events/handpan-masterclass-with-takao-minemoto-for-singapore-handpan-communtiy/  /events/handpan-masterclass-with-takao-minemoto-for-singapore-handpan-community/  301
/events/advance-yoru-handpan-playing-skiils/  /events/advance-your-handpan-playing-skills/  301
```

Do **not** add trailing-slash rules there — that policy lives in
`src/middleware.ts` and the two would conflict. The file says so already.

---

## Also worth knowing

`data-acuity-appointment-type-id` is absent from **every** event in the space,
so `src/scripts/availability-hydration.ts` is currently a no-op — live
availability never resolves and the Book Now / Sold Out state is whatever
`availability_status` and `sold_out_override` say. This predates the critique
work and is unrelated to it, but if live availability is supposed to be
working, that is why it is not.
