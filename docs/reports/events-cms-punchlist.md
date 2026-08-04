# Events CMS punch list

Content and schema work arising from the `/events/` + `/events/archive/` design
critique. **None of this is code** — it all happens in Storyblok. The code-side
remediation shipped separately on `feat/events-critique-remediation`.

Every item below was verified against the live rendered pages on 2026-08-04
(draft content, 10 upcoming + 33 past events), not copied from the critique.
Where the critique was wrong, that is noted.

---

## Status

| §   | Item                                                           | State                                          |
| --- | -------------------------------------------------------------- | ---------------------------------------------- |
| 1   | Typos                                                          | **Done** — applied to Storyblok 2026-08-04     |
| 2   | `/events/events/` slug                                         | **Done** — applied 2026-08-04                  |
| 3   | Thursday/Wednesday date contradiction                          | **Done** — owner confirmed, applied 2026-08-04 |
| 4   | Title conventions                                              | Open — editorial, needs a pass over 43 entries |
| 5   | Schema fields (`excerpt`, `teacher`, `price_max`, `series_id`) | Open                                           |
| 6   | Multi-day duplicates                                           | Open — blocked on `series_id` (§5)             |
| 7   | Redirects for changed slugs                                    | **Done** — in `_redirects`                     |
| —   | Two remaining recurring classes (Tue, Sat)                     | **Blocked** — see §8                           |

---

## 1 — Typos (highest visibility, lowest effort) — DONE

| Story slug                                                                | Field       | Current                                                                     | Should be                                   |
| ------------------------------------------------------------------------- | ----------- | --------------------------------------------------------------------------- | ------------------------------------------- |
| `handpan-masterclass-with-takao-minemoto-for-singapore-handpan-communtiy` | title       | Handpan Masterclass with Takao Minemoto for Singapore Handpan **Communtiy** | …Handpan **Community**                      |
| `handpan-masterclass-with-takao-minemoto-for-singapore-handpan-communtiy` | **slug**    | …handpan-**communtiy**                                                      | …handpan-**community**                      |
| `live-concert-by-marlia-coeur`                                            | description | **UITAR**+VOICE+HANDPAN+DRUM                                                | **GUITAR**+VOICE+HANDPAN+DRUM               |
| `live-concert-by-marlia-coeur`                                            | title       | `Live Concert by␣␣Marlia Coeur` (double space)                              | `Live Concert by Marlia Coeur`              |
| `advance-yoru-handpan-playing-skiils`                                     | **slug**    | advance-**yoru**-handpan-playing-**skiils**                                 | advance-**your**-handpan-playing-**skills** |

A full-content scan (all 43 stories, every text field) corrected two of the
critique's claims and found one instance it missed:

- **`Jungle Adventur` — the critique located it wrongly.** The title and slug
  are spelled correctly; the typo was in the **description**. Fixed there.
- **`Communtiy` was also in the description**, not only the title and slug.
  Fixed in all three.
- **`Do not miss teh opportunity` does not exist.** No occurrence of "teh" in
  any field of any story. The critique is wrong; nothing to do.

Deliberately **not** changed: ~30 double spaces across descriptions and
`seo_title`s. Most sit inside bullet lists built from `•⁠` plus U+2060 word
joiners, where a blind whitespace collapse would break the formatting. Only the
visible one in the concert title was fixed. Worth a careful manual pass, not a
regex.

## 2 — The `/events/events/` slug — DONE

The cause was structural rather than a typo: the story was flagged
`is_startpage: true` for the `events` folder, so Storyblok forced its slug to
match the folder and it resolved at `/events/events/`. A plain slug update
returns `200` and silently does nothing while that flag is set.

Fixed by clearing `is_startpage` and setting
`handpan-essentials-with-peter-bognar`. Nothing depended on the folder having a
start page — `/events/` is an Astro route, and every CMS query selects on
`starts_with: 'events/'` + `content_type: 'event'`, which still matches.

## 3 — Data correctness — DONE

`handpan-for-beginners-on-thursday-mornings` said _Thursday Mornings_ while
printing **Wed, 5 Aug 2026**.

Owner confirmed: the **date** was wrong, and the class is a **weekly Thursday**
series. Set to `2026-08-06 10:30` with `recurrence: weekly` (open-ended). The
duration was already 1.5h, matching the stated 10:30–12:00.

The title needs no change — now that the class genuinely recurs on Thursdays,
`formatRecurrenceLabel` renders "Every Thursday, 10:30 am" and the title agrees
with it.

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

## 7 — After changing any slug — DONE

All three 301s are in `_redirects` at the repo root, so inbound links and
search equity survive the renames.

Do **not** add trailing-slash rules there — that policy lives in
`src/middleware.ts` and the two would conflict. The file says so already.

## 8 — The other two recurring classes — BLOCKED, needs a decision

The owner states there are **three** weekly classes:

| Slot            | Story                                                   |
| --------------- | ------------------------------------------------------- |
| Thu 10:30–12:00 | `handpan-for-beginners-on-thursday-mornings` — **done** |
| Tue 19:00–20:30 | **no story exists**                                     |
| Sat 10:30–12:00 | **ambiguous — three candidates**                        |

**Tuesday.** No event in the space starts at 19:00 on a Tuesday. The only 19:00
starts are Fri, Sat, Sun and Mon, all one-off past events. This class needs a
story creating from scratch — title, description, price, image, booking URL —
which is authoring, not a data fix.

**Saturday.** Three stories sit at Sat 10:30 and any of them could be the
weekly class:

| Story                       | Date  | Duration | Title                                                                  |
| --------------------------- | ----- | -------- | ---------------------------------------------------------------------- |
| `…-handpan-with-yana-an`    | 1 Aug | 2h       | Handpan First Touch Workshop with Yana An — **Every Saturday Morning** |
| `…-with-singapore-handpans` | 8 Aug | 1.5h     | Handpan First Touch Workshop with Yana An                              |
| `handpan-beginner-course`   | 8 Aug | 1.5h     | HANDPAN COURSE FOR BEGINNERS — 4 LESSONS JOURNEY                       |

The first says "Every Saturday Morning" in its title, which points at it — but
its duration is 2h, not the 1.5h implied by 10:30–12:00, and the second matches
the duration while the third is a fixed four-lesson course rather than an
open weekly drop-in.

Marking the wrong one recurring would put a permanent weekly class on the site
that does not run, so this was left alone. Naming the story (or confirming the
first, and whether its duration should become 1.5h) is all that is needed.

---

## Also worth knowing

`data-acuity-appointment-type-id` is absent from **every** event in the space,
so `src/scripts/availability-hydration.ts` is currently a no-op — live
availability never resolves and the Book Now / Sold Out state is whatever
`availability_status` and `sold_out_override` say. This predates the critique
work and is unrelated to it, but if live availability is supposed to be
working, that is why it is not.
