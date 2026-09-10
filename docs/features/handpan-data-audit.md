# Handpan Scale Data Audit

**Retrieved:** 2026-09-10 · **Applies to:** `src/widgets/academy-handpan/config/handpanFamilies.ts`

Evidence review of the widget's shipped scale families against maker-authored
sources, plus expansion candidates. Written to support the correctness work on
branch `002-handpan-core-split`.

## How to read this document

Interval sets are **semitones above the ding** unless stated otherwise, and are
my analysis — maker pages publish note names, not intervals. Note lists are
quoted exactly as published so the two never get conflated.

| Confidence | Meaning                                             |
| ---------- | --------------------------------------------------- |
| `verified` | Maker-authored page with an explicit note list      |
| `reported` | Retailer/specialist page with an explicit note list |
| `inferred` | Derived by theory, no source states it              |

Community posts were used as leads only, never as sole evidence.

---

## 1. The structural finding: makers disagree on the reference note

An interval array is meaningless without declaring what it is measured from.
Three conventions are in active use, all documented:

| Convention                       | Example (verbatim)                                      |
| -------------------------------- | ------------------------------------------------------- |
| Ding **is** the root             | `F2/ F, G, Ab, C, Eb, F, G, C` (Saraz F2 Pygmy)         |
| Ding is the **5th** of the root  | `D/ G A Bb C D Eb F G` (HaganeNote Aeolian → G Aeolian) |
| Ding is a **4th below** the root | `G/ C D Eb G Ab C D Eb` (Saraz Akebono → C Akebono)     |

HaganeNote states it outright: _"The root note is the second lower note of the
scale, while the ding is its perfect fifth."_

This matters directly — it is why one of the three families originally suspected
of being wrong turned out not to be.

---

## 2. Corrections applied

### 2.1 Pygmy — was wrong, fixed

Shipped `[0,3,5,7,10]` (minor pentatonic). Correct set is **`[0,2,3,7,10]`** —
a major 2nd where the widget had a perfect 4th, and no 4th at all. A different
pitch-class set, not a rotation.

- Saraz: `"F2/ F, G, Ab, C, Eb, F, G, C"` — `verified`
- Isthmus: `"A2 Pygmy: A2 / E A B C E G A B"` — `verified`
- Corroborated by Shaktipan and HaganeNote. Four makers agree.

### 2.2 Equinox — was wrong, fixed

Shipped `[0,2,4,5,7,9,10]` (Mixolydian, **major** 3rd). The old description
conceded it was invented: _"Implemented as Mixolydian-like pitch set."_ Correct
set is **`[0,2,3,7,8,10]`** — minor hexatonic, natural minor without the 4th.

- Saraz: `"E/ G, B, C, D, E, F#, G, B"`, page titled _"E Equinox Minor"_ — `verified`
- Isthmus: `"E Equinox: E/ G B C D E F# G B"` — `verified`
- Seven variants across two makers.

### 2.3 Ding octave — was wrong, fixed

`DING_OCTAVE = 3` applied one octave to every key. Every A-ding and B-ding
instrument found is **A2 / B2** (eleven citations; none for A3/B3), while C–G
ding at octave 3. Now mapped per pitch class, giving a continuous G#2–G3 band.

Attested dings: F2, F#2, G2, A2, B2, C3, C#3, D3, E3, F#3, G3.

### 2.4 Oxalis — **not** wrong; deliberately left alone

Initially suspected, but the shipped `[0,2,4,7,9,11]` is the correct set for the
real instrument measured **from the tone-circle root**. From the ding the same
instrument is `{0,2,4,5,7,9}`. The two differ by a 5-semitone rotation.

This is a reference-frame mismatch, not bad data, and fixing it needs an explicit
`reference: 'ding' | 'root'` field rather than a new value. Left unchanged.

**Oxalis vs Oxalista:** one family, two published sizes. The 5-note form
(HaganeNote, Shaktipan, Pures) omits the 2nd degree; the 6-note form (Saraz,
Peter Pan) includes it. They should be a note-count variant, not two families.

---

## 3. Duplicate families — resolved by merging

The catalog listed 19 families but held only 16 distinct pitch-class sets, so
some entries were choices that sounded identical. All duplicates have now been
merged, keeping the best-established name and naming the others in the
description and aliases. **15 families remain.**

| Merged away        | Into         | Shared set         | Why that name won                                                                                           |
| ------------------ | ------------ | ------------------ | ----------------------------------------------------------------------------------------------------------- |
| Aeolian, Annaziska | **Kurd**     | `{0,2,3,5,7,8,10}` | Saraz calls all three one scale; Kurd is the most common handpan family                                     |
| Equinox, Mystic    | **Integral** | `{0,2,3,7,8,10}`   | Widest sourced key coverage (7 Saraz variants + Isthmus) and the PANArt heritage name                       |
| Magic Voyage       | **Pygmy**    | `{0,2,3,7,10}`     | Pygmy is far better established; HaganeNote itself calls Magic Voyage "very similar to the Low Pygmy scale" |

Two of these were only duplicates once their data was corrected:

- **Mystic** shipped `{0,1,3,5,7,10}`, which no maker publishes. Every real
  listing — Isthmus `"D/ A Bb D E F A C"`, corroborated by Pures and Shaktipan —
  is `{0,2,3,7,8,10}`, the Integral/Equinox set.
- **Magic Voyage** shipped `{0,2,4,5,7,9,10}`, duplicating Mixolydian. All four
  HaganeNote variants are the Pygmy set.

Isthmus explains why the Integral group carried three names: _"Mystic is a
hexatonic minor scale, similar to the Integral, but its last note is
different."_ The names encoded **layout**, not pitch content. Integral therefore
keeps the ring order sourced from Saraz's E Equinox listing — that is this
scale's published 9-note form and maps exactly onto the widget's 9-note shell,
whereas Saraz's Integral listings are 8-note instruments the widget does not
offer.

Each canonical family carries the **union** of the merged families' supported
keys, so no key disappeared from the selector, and every preset id the merged
families published still resolves via `MERGED_FAMILY_IDS`. A guard test asserts
no two families share a pitch-class set again.

## 3a. Unsourced families — removed

The widget does not present a tuning it cannot back with a source. Four families
shipped interval sets that no maker publishes and have been removed. **11
families remain.**

| Removed      | Shipped            | Sourced         | Why                                                                                   |
| ------------ | ------------------ | --------------- | ------------------------------------------------------------------------------------- |
| `lydian`     | `{0,2,4,6,7,9,11}` | —               | No maker ships a scale under this name                                                |
| `ursa-minor` | `{0,2,5,7,8,10}`   | `{0,2,3,5,7,8}` | Sourced set is a minor hexatonic with no 7th; only `reported`, maker page unreachable |
| `aegean`     | `{0,2,4,7,9}`      | `{0,4,6,7,11}`  | Two sources agree on a set the widget does not ship                                   |
| `onoleo`     | `{0,2,3,6,7,10}`   | `{0,4,5,7,8}`   | Sourced set is itself contested; one blog gives Celtic Minor                          |

None of these is a reference-note rotation of a real scale the way Oxalis turned
out to be — their step patterns do not match under any rotation, so the shipped
values were invented rather than mismeasured.

**Ursa Minor was not flagged in the first pass** of this document: the table
below originally listed its _sourced_ set rather than its _shipped_ one, which
hid the mismatch. The comparison is now done mechanically against the shipped
data rather than by reading the table.

Unlike a merged family, an excluded one gets no canonical replacement —
`getHandpanConfig('lydian-d-9')` returns undefined. Not offering a scale is
better than silently substituting a different one. `EXCLUDED_FAMILY_IDS` in
`handpanFamilies.ts` records the reason for each, so any can return once sourced.

**Aegean is the nearest to recoverable:** Isthmus publishes an explicit note
list (`"C Aegean: C / E G B C E F# G B"`) and Miłość i Spokój agrees, so
correcting it to `{0,4,6,7,11}` would make it verified rather than dropped. Note
that at 9 notes it is a five-note set — root, maj3, #4, 5, maj7 — and only
larger builds add the 2nd and 6th to reach full Lydian.

## 4. Verification status of the shipped families

Twelve families: 19 originally, minus four merged as duplicates (§3), minus
four removed as unsourced (§3a), plus Akebono (§5).

| Family         | Set from ding              | Status                                                                          | Source                     |
| -------------- | -------------------------- | ------------------------------------------------------------------------------- | -------------------------- |
| kurd           | `{0,2,3,5,7,8,10}`         | verified — absorbed Aeolian and Annaziska                                       | Saraz, Isthmus             |
| celtic-minor   | `{0,2,3,5,7,10}`           | verified (Amara is an alias)                                                    | Saraz, Isthmus             |
| integral       | `{0,2,3,7,8,10}`           | verified — absorbed Equinox and Mystic                                          | Saraz, Isthmus             |
| pygmy          | `{0,2,3,7,10}`             | verified — corrected, absorbed Magic Voyage                                     | Saraz, Isthmus             |
| la-sirena      | `{0,2,3,7,9,10}`           | verified — Dorian minus the 4th                                                 | Saraz                      |
| oxalis         | `{0,2,4,7,9,11}` from root | verified — see §2.4                                                             | Saraz, HaganeNote          |
| hijaz          | `{0,1,4,5,7,8,10}`         | verified, but most instruments sold as "Hijaz" are ding-on-tonic harmonic minor | Saraz                      |
| harmonic-minor | `{0,2,3,5,7,8,11}`         | verified                                                                        | Saraz, Shaktipan           |
| ionian         | `{0,2,4,5,7,9,11}`         | verified, but rarely shipped complete                                           | Saraz                      |
| dorian         | `{0,2,3,5,7,9,10}`         | verified (Jibuk is an alias)                                                    | Saraz, Isthmus             |
| akebono        | `{0,1,5,7,8}`              | verified — 9 notes only, see §5                                                 | Saraz, Isthmus, HaganeNote |
| mixolydian     | `{0,2,4,5,7,9,10}`         | verified; 8-note variants drop the 4th                                          | Saraz                      |

Every shipped family's interval set now matches a maker-published note list. A
test compares the two mechanically rather than relying on this table.

## 5. Akebono — added, and the naming trap it did not fall into

Added 2026-09-10 as `{0,1,5,7,8}` from the ding, at 9 notes, in C#, D, E, F, F#
and G. Eighteen listings across Saraz, Isthmus, HaganeNote, Vibe and Chirp agree
on that set.

**An earlier draft of this document got Akebono wrong.** It warned that makers
name the instrument by its ding while the pentatonic is rooted a 4th above, so a
ding-rooted model would render every Akebono a fourth off. Deeper research
refuted the part that mattered: handpan makers name by the ding **and state the
ding is the root**.

> "The 'ding' is the root note of the scale, followed by the fourth and fifth
> degrees." — Isthmus / MAG

What is true is subtler. The 4th above the ding is where the scale _resolves_:

> "can also be thought about as a minor scale based on the 4th scale degree of
> the center note. For example, F# Akebono plays flawlessly in B Minor."
> — Isthmus

Saraz goes further and declines to pick a tonic at all — _"The scale has no
tonic or 'root' note so any note in the scale can be used at the root"_ — filing
the instrument under the page title **"B Minor / F# Akebono"**.

So the P4 is a **tonal centre, not a name**. It is recorded in the family's
description rather than encoded as the tonic, because rooting the family a
fourth up would list the instrument under a name no handpan maker sells.

### Where the disagreement actually is

Not between handpan makers — they are unanimous — but between handpans and other
instruments:

| Source               | Same notes published as | Set from that root                                        |
| -------------------- | ----------------------- | --------------------------------------------------------- |
| HaganeNote (handpan) | "E Akebono"             | `{0,1,5,7,8}`                                             |
| Guda (tongue drum)   | "Akebono, key of A"     | `{0,2,3,7,8}` (Hirajōshi)                                 |
| Piano dictionaries   | "Akebono II"            | `{0,1,5,7,8}` — matches handpans                          |
| Piano dictionaries   | "Akebono I"             | `{0,2,3,7,9}` (Kumoi) — appears in **no** handpan listing |

Worth knowing when cross-referencing a piano scale chart, but handpan naming is
consistent and the catalog follows it.

### Why 9 notes only

Makers do build 8-, 10- and 11-note Akebonos, but the larger ones reach their
count with **bottom notes**, which the widget cannot yet represent. Counting
top-shell notes only, every listing lands on 8 or 9, and 9 is the count four
makers publish as an all-top layout (Isthmus, HaganeNote ×2, Vibe). No all-top
10-note Akebono appears in any listing found, so offering one would have meant
extrapolating a layout — exactly what §3a removed other families for.

Saraz's documented bottom notes for Akebono are consistently a semitone above
the ding: F#/`(G)`, G/`(Ab)`, D/`(Eb)`, E/`(F)`.

## 5a. Remaining expansion candidates

Ready to add, all `verified`: **Sabye** `{0,2,4,5,7,9,11}`, **Golden Gate**
`{0,2,4,6,7,11}`.

Aliases rather than new families: **Annaziska** → kurd, **Amara** →
celtic-minor, **Ashakiran/Asha** → sabye (identical note lists), **Jibuk** →
dorian, **Romanian Hijaz** → harmonic-minor Hijaz, **Low Pygmy** → a Pygmy ding
variant.

`reported` only, so out under the current rule: **Raga Desh** `{0,4,5,7,10}`.

## 6. Gaps — could not verify

| Name                    | What was tried                            | Outcome                                                         |
| ----------------------- | ----------------------------------------- | --------------------------------------------------------------- |
| Voyager                 | Searched; checked all four maker indexes  | Marketing prose only, no note list. Do not ship.                |
| Caesar                  | Searched twice                            | No source at all. Do not ship.                                  |
| Astronaut               | Searched twice                            | No source at all. Do not ship.                                  |
| Athena                  | Searched; cross-checked against Aegean    | One snippet, identical to Aegean. Alias at best; no maker page. |
| Low Mystic              | Searched; fetched Pures Mystic collection | Not found. Plausibly a low-ding Mystic, but not inferring it.   |
| Tarznauyn               | Searched alongside Romanian Hijaz         | Secondary claim only, no note list.                             |
| Ursa Minor (maker page) | Fetch to pantheonsteel.com                | TLS handshake failure; snippet only, so capped at `reported`.   |

**Discarded source:** cosmoshandpan.com's notes chart self-declares its lists
_"illustrative"_ and its `"D Kurd: D — A — B — C — D — F# — A"` matches no maker
anywhere. Flagged because it ranks well in search and will mislead future work.

---

## 7. Bottom notes — not yet modelled

Bottom notes are a documented, first-class feature. Saraz's convention, stated on
its Sabye page: _"parentheses indicate optional bottom note choices available
when ordering."_

Two consequences the widget will hit when it models them:

1. **A bottom note can sound lower than the ding.** Shaktipan's D Mystic 20 is
   `"(Bb2) D3/ …"`. Any renderer assuming the ding is the lowest pitch is wrong
   on extended instruments.
2. **Bottom notes change the pitch-class set.** Isthmus's E Amara 20 reaches full
   Aeolian only because its bottom notes restore the ♭6 that Celtic Minor omits.
   So intervals should split into tone-circle and bottom-note sets.

---

## 8. Sources

**Maker-authored** (used for `verified`): [Saraz scale index](https://www.sarazhandpans.com/handpan-scales/)
and its per-scale pages (pygmy, equinox, oxalista, sabye, kurd, celtic-minor,
integral, la-sirena, hijaz, akebono, aeolian, annaziska, d-dorian, e-mixolydian,
c-major) · [Isthmus Instruments — What is a handpan scale](https://www.isthmusinstruments.com/isthmus-handpan-blog/what-is-a-handpan-scale)
(55 scales with note lists) · [Isthmus C Golden Gate](https://www.isthmusinstruments.com/buy-handpan/c-golden-gate-handpan)
· [Isthmus Akebono](https://www.isthmusinstruments.com/buy-handpan/akebono-handpan)
· [Saraz Akebono](https://www.sarazhandpans.com/handpan-scales/akebono/)
· [Saraz B Minor / F# Akebono](https://www.sarazhandpans.com/handpan-scales/b-minor-f-sharp-akebono/)
· [HaganeNote store](https://www.haganenote.com/store/) (oxalis, magic-voyage,
romanian-hijaz, sabye, hijaz, aeolian, akebono, f-akebono) · [Shaktipan scales](https://shaktipan.com/en/scales/)

**Specialist / retailer** (used for `reported` and corroboration):
[Pures Music](https://www.puresmusic.com/collections/handpan-mystic-scale) ·
[Peter Pan Handpans](https://peterpanhandpans.com/shop/scale/oxalis/oxalis-ceramica-handpan/) ·
[Miłość i Spokój](https://miloscispokoj.pl/en/aegean-scale-handpan/) ·
[Meridian Handpans](https://www.meridianhandpans.co.uk/product-page/c-raga-desh)

**Failed fetches:** pantheonsteel.com (TLS), aurahandpan.com/scales-and-pricing
(404), haganenote.com/handpan-scales/ (404). yataoshop.com/pages/handpan-scales
was fetched but contains prose only, no note lists.
