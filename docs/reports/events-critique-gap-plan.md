# Events critique — full audit of all 21 findings, and the plan for the gaps

Three independent audits were run against merged `dev` (6a9ab7b), one per group
of findings, each told to verify the code rather than trust code comments. This
records every verdict and the work still outstanding.

## Verdicts

| #   | Finding                                | Verdict             |
| --- | -------------------------------------- | ------------------- |
| 1   | Archive entry point buried             | Done                |
| 2   | Entry point does not look clickable    | Done (see G9)       |
| 3   | Four names for two pages               | Done (see G8)       |
| 4   | Entry point hides its own value        | **Partial → G5**    |
| 5   | Past events reuse the booking card     | Done                |
| 6   | No way to filter                       | **Bug → G1, fixed** |
| 7   | Originals served raw                   | Done                |
| 8   | Jump nav reads as dates, not counts    | Done (see G4, G10)  |
| 9   | Dimming reads as "disabled"            | Done                |
| 10  | Archive is a dead end                  | Done (see G7)       |
| 11  | Every card looks the same              | Done                |
| 12  | Tags mix two taxonomies                | Done (see G6)       |
| 13  | Hard truncation mid-word               | Partial — CMS       |
| 14  | Six weeks in one undivided grid        | Done                |
| 15  | Portrait photos face-cropped           | Done                |
| 16a | Duration redundant beside a time range | Done (see G3)       |
| 16b | Title link's 44px pocket               | **Partial → G2**    |
| 16c | Equal-width CTAs                       | Done                |
| 16d | First row lazy-loaded                  | Done                |
| 17  | Title contradicts its own date         | Done (content)      |
| 18  | Typos shipping live                    | **Partial → G11**   |
| 19  | Titles formatted five ways             | Not done — CMS      |
| 20  | Multi-day events duplicate             | Not done — CMS      |
| 21  | Prices entered inconsistently          | **Partial → G12**   |

## Gaps, in priority order

### G1 — Archive filter did not hide anything · P1 · **FIXED**

`.past-row { display: grid }` is an author rule and outranks the user agent's
`[hidden] { display: none }`, so setting `row.hidden` left every non-matching
row painted while the heading above it recounted correctly. Filtering to
Concerts showed "6 events" over 24 visible rows.

This shipped. It was missed because the verification counted
`[data-past-row]:not([hidden])` — the _attribute_ — instead of asking whether
anything was still painted. Fixed with an `&[hidden] { display: none }` reset
and re-verified by measuring `getBoundingClientRect().height` and
`getComputedStyle().display`: 6 visible, 26 `display:none`.

The other JS-hidden elements (`.archive-month`, `.archive-year`,
`.archive-empty`, the jump-nav `li`) set no `display` and were never affected.

### G2 — Card has no click target, so the title's tap area regressed · P1

Finding 16b removed `min-height: 44px` / `inline-flex` from the title anchor,
justified in a comment by "the card being clickable". **The card is not
clickable** — there is no stretched-link `::after`, no card-level anchor, no
handler. The odd pocket is gone but the title is now a bare ~24px text line.

Fix: give `.event-card` a stretched link — `position: relative` on the card and
`.event-header h3 a::after { content: ''; position: absolute; inset: 0 }` — so
the whole card is the target and the buttons still sit above it via
`position: relative; z-index: 1`. Verify the hit box measures ≥44px and that
Learn More / Book Now remain independently clickable.

### G3 — Detail page still contradicts the card · P1

`EventDetail.astro:309` prints `~{durationLabel}` beside a full date+time
block, and `:169`/`:299` render `event.content.price` raw — so `/events/<slug>/`
still shows `$88`, bare `88`, `$38-$138`. That file was never in scope of the
original change, so findings 16a and 21 were only half-applied.

Worse, `src/pages/events/[slug].astro:155-156` sanitises price for schema.org
with `/[^0-9.]/g`, which turns `$38-$138` into `38.138` — an invalid
`Offer.price` that Google will reject.

Fix: route both through `formatPrice`, drop the tilde, and emit a valid
`priceSpecification` (or omit the offer) for ranges rather than a mangled
number. Add a test for the range case.

### G4 — Jump-nav active state is invisible on pointer devices · P2

The `aria-current="true"` style is byte-identical to `:hover` — same
`border-color` and `color`. The critique's point was that the bar should tell
you _where you are_; hovering any chip currently impersonates that.

Fix: give the active chip a distinct treatment (filled ink like the active
filter chip, or a left rule), leaving hover as the lighter bronze.

### G5 — The archive's value proposition is on the wrong page · P2

The context line ("Mar–Aug 2026 · masterclasses with …") renders on
`/events/archive/`, i.e. _after_ the click. `/events/` passes the studio-address
line into the same slot, so the only cue before clicking is the bare number.
Finding 4 asked for the scale to be stated at the entry point.

Fix: show both on `/events/` — the studio line and a short archive teaser — or
move the teaser onto the Past tab itself.

### G6 — Category is whichever tag the author listed first · P2

`getEventCategory` returns the first match in author order, so an event tagged
both `workshop` and `masterclass` renders either. Fix: define an explicit
precedence and pick the highest-ranked tag present. Extend `tags.test.ts`.

### G7 — "Runs again" prints the year · P3

Renders "Runs again 8 Aug 2026"; the spec asked for "Runs again → 8 Aug". Use a
year-less short format for near dates.

### G8 — Residual naming drift · P3

`CollectionPage.name` is "Past Classes & Events" and `seoTitle` is "Past Handpan
Classes & Events" (`archive.astro`). Not user-visible on the page but they are
the names search engines index.

### G9 — Tab hit box and focus ring · P3

Tabs measure ~43px against the 44px used elsewhere, and focus shows only a
border change with no `:focus-visible` outline.

### G10 — Observer never clears above the first section · P3

The `IntersectionObserver` callback only acts on `isIntersecting`, so scrolling
above the first target leaves the previous chip marked current.

### G11 — Slug redirects are in a file that will not fire · P1

The three 301s were added to `_redirects`, but `/events/[slug]` is
`prerender = false`, so those URLs are served by the Worker and never reach the
Pages asset server. A request to the old `…-communtiy/` slug will hit Astro,
miss in Storyblok and 404 — the redirect never gets a chance.

This repo already has the right mechanism for SSR paths:
`src/lib/legacyRedirects.ts` + `src/middleware.ts`. Move the three rules there,
keep them unit-tested alongside the existing gallery rule, and drop the
`_redirects` entries so there is one source of truth.

### G12 — Price is still free text · CMS

Tracked in the punch list. `formatPrice` normalises what it can, but a numeric
field with an optional max removes the guesswork.

## Still CMS-only, unchanged

- **13** — authored `excerpt` field (code falls back to a word-boundary trim).
- **19** — title conventions across 42 entries.
- **20** — `series_id` to collapse multi-day duplicates.

## Verification

Every fix above must be verified by **observed behaviour, not attributes** —
G1 is the cautionary case. For anything involving visibility, measure
`getBoundingClientRect()` or `getComputedStyle().display`; for anything
involving hit targets, measure the rendered box; for anything involving images,
measure what the browser actually fetched.
