# Handpan Scale Data Audit

**Retrieved:** 2026-09-10 · **Applies to:** `src/widgets/academy-handpan/config/handpanFamilies.ts`

Evidence review of the widget's 19 shipped scale families against maker-authored
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

## 3. Open questions — these need a product decision

Each changes what appears in the catalog, so none were applied unilaterally.

### 3.1 Three families are the same scale

Equinox, Integral and Mystic all reduce to `{0,2,3,7,8,10}`. They differ only in
which tone field sits lowest. Isthmus says so directly: _"Mystic is a hexatonic
minor scale, similar to the Integral, but its last note is different."_

As shipped, the widget offers three entries that sound identical. Options: merge
behind one set with a layout discriminator, or keep all three and explain the
difference in the UI.

### 3.2 Kurd, Aeolian and Annaziska are one scale

All `{0,2,3,5,7,8,10}`. Saraz says it in its own words: _"a full scale of C#
Minor, which is sometimes also referred to as a 'Kurd', 'Aeolian', or 'Natural
Minor' scale."_ The widget ships `kurd` and `aeolian` as separate families.

### 3.3 Magic Voyage is Pygmy

HaganeNote's four Magic Voyage variants all reduce to `{0,2,3,7,10}`, and the
maker's own text says _"very similar to the Low Pygmy scale."_ The widget ships
`[0,2,4,5,7,9,10]` for it — wrong by the same standard as Equinox. Correcting it
would create a second entry identical to Pygmy, which is why it is listed here
rather than fixed.

### 3.4 No maker ships a scale called "Lydian"

Absent from Saraz's 58-scale index, Isthmus's 55-scale list, HaganeNote and
Shaktipan. The Lydian collection reaches handpans as **Aegean**, **Golden Gate**
and **Sabye**. Recommend dropping or relabelling the `lydian` family.

### 3.5 Akebono is named by its ding, not its root

Every listing at two makers names the instrument by the ding while the akebono
pentatonic is rooted a **4th above** it. Storing the textbook `{0,2,3,7,8}` and
labelling by ding would put every displayed Akebono a 4th off.

---

## 4. Verification status of the 19 shipped families

| Family         | Set from ding              | Status                                                                          | Source                                      |
| -------------- | -------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------- |
| kurd           | `{0,2,3,5,7,8,10}`         | verified                                                                        | Saraz, Isthmus                              |
| celtic-minor   | `{0,2,3,5,7,10}`           | verified (Amara is an alias)                                                    | Saraz, Isthmus                              |
| integral       | `{0,2,3,7,8,10}`           | verified — same set as equinox/mystic                                           | Saraz, Isthmus                              |
| mystic         | `{0,2,3,7,8,10}`           | verified — same set as equinox/integral                                         | Isthmus, Pures                              |
| pygmy          | `{0,2,3,7,10}`             | **corrected**                                                                   | Saraz, Isthmus                              |
| la-sirena      | `{0,2,3,7,9,10}`           | verified — Dorian minus the 4th                                                 | Saraz                                       |
| ursa-minor     | `{0,2,3,5,7,8}`            | reported — no 7th at all                                                        | Pantheon Steel (fetch failed, snippet only) |
| aegean         | `{0,4,6,7,11}`             | verified — not full Lydian at 9 notes                                           | Isthmus                                     |
| oxalis         | `{0,2,4,7,9,11}` from root | verified — see §2.4                                                             | Saraz, HaganeNote                           |
| hijaz          | `{0,1,4,5,7,8,10}`         | verified, but most instruments sold as "Hijaz" are ding-on-tonic harmonic minor | Saraz                                       |
| harmonic-minor | `{0,2,3,5,7,8,11}`         | verified                                                                        | Saraz, Shaktipan                            |
| onoleo         | `{0,4,5,7,8}`              | reported, **conflicting** — one blog gives Celtic Minor instead                 | Shaktipan                                   |
| equinox        | `{0,2,3,7,8,10}`           | **corrected**                                                                   | Saraz, Isthmus                              |
| magic-voyage   | `{0,2,3,7,10}`             | **wrong as shipped** — see §3.3                                                 | HaganeNote                                  |
| ionian         | `{0,2,4,5,7,9,11}`         | verified, but rarely shipped complete                                           | Saraz                                       |
| dorian         | `{0,2,3,5,7,9,10}`         | verified (Jibuk is an alias)                                                    | Saraz, Isthmus                              |
| lydian         | —                          | **UNVERIFIED** — see §3.4                                                       | none                                        |
| mixolydian     | `{0,2,4,5,7,9,10}`         | verified; 8-note variants drop the 4th                                          | Saraz                                       |
| aeolian        | `{0,2,3,5,7,8,10}`         | verified — same set as kurd                                                     | Saraz                                       |

---

## 5. Expansion candidates

Ready to add, all `verified`: **Sabye** `{0,2,4,5,7,9,11}`, **Akebono**
`{0,1,5,7,8}` from ding (see §3.5), **Golden Gate** `{0,2,4,6,7,11}`.

Aliases rather than new families: **Annaziska** → kurd, **Amara** →
celtic-minor, **Ashakiran/Asha** → sabye (identical note lists), **Jibuk** →
dorian, **Romanian Hijaz** → harmonic-minor Hijaz, **Low Pygmy** → a Pygmy ding
variant.

`reported` only: **Raga Desh** `{0,4,5,7,10}`.

---

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
· [HaganeNote store](https://www.haganenote.com/store/) (oxalis, magic-voyage,
romanian-hijaz, sabye, hijaz, aeolian) · [Shaktipan scales](https://shaktipan.com/en/scales/)

**Specialist / retailer** (used for `reported` and corroboration):
[Pures Music](https://www.puresmusic.com/collections/handpan-mystic-scale) ·
[Peter Pan Handpans](https://peterpanhandpans.com/shop/scale/oxalis/oxalis-ceramica-handpan/) ·
[Miłość i Spokój](https://miloscispokoj.pl/en/aegean-scale-handpan/) ·
[Meridian Handpans](https://www.meridianhandpans.co.uk/product-page/c-raga-desh)

**Failed fetches:** pantheonsteel.com (TLS), aurahandpan.com/scales-and-pricing
(404), haganenote.com/handpan-scales/ (404). yataoshop.com/pages/handpan-scales
was fetched but contains prose only, no note lists.
