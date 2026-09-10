# Handpan Widget — Interaction & Highlighting Contract

Behavioural contract for the Academy handpan widget
(`src/widgets/academy-handpan/`). Rewritten 2026-09-10 to match the shipped
code; the previous version described state fields that never existed and an
arpeggio rule the code contradicted.

## Playback state model

Defined in [`ui/types.ts`](../../src/widgets/academy-handpan/ui/types.ts) and
owned by `PlaybackContext`:

| Field                | Meaning                                                                                |
| -------------------- | -------------------------------------------------------------------------------------- |
| `intent`             | Which interaction owns the highlight: `none`, `note`, `scalePlayback`, `chordPlayback` |
| `activeNote`         | Exact note with octave. Single-note interactions                                       |
| `activePitchClasses` | Pitch classes without octave. Chord selection                                          |
| `activeNotes`        | Exact notes with octave. Chord playback                                                |
| `isPlaying`          | Transport state                                                                        |

`intent` is the discriminator. Read the field that matches the current intent
rather than inferring from which fields are populated.

## Highlight resolution

`HandpanWidget` derives the highlighted pad set centrally, so no component
duplicates the logic:

- `note` and `scalePlayback` — match the **exact** note. When the scale note has
  no pad at that octave, `pickBestPadNoteForPc` maps it to the nearest pad.
- `chordPlayback` — match `activeNotes` exactly when present, otherwise fall
  back to pitch-class matching.
- Chord _selection_ (not playback) highlights by exact note string.

## Arpeggio playback highlights exact notes

`ChordsSection` calls `setChordNotesActive([step.note])` on each step, so an
arpeggio highlights **one pad per step**, not every octave of that pitch class.

This is the opposite of what the previous version of this document claimed. The
code is the contract; the old text was never backed by an executable test.

## Notation

Pads are labelled by pitch (`D3`) or by sequence index (`1`), selected in the
widget header. Sequence index is derived from data, not render order: the ding
is 1, remaining fields ascend by pitch.

The numeric label is a **sequence index, not a scale degree**. A scale-degree
mode would be a distinct third notation rather than an overload of this one.

**The accessible name never varies with notation.** `padAccessibleName` takes no
notation argument, so a pad always reads as `"Pad 1, D3, top shell, ding"`
whichever label is on screen. Asserted in `ui/HandpanRenderer.test.tsx`.

## Layout provenance

Tone-field positions are **computed, not sourced**. No maker drawing or
photograph backs them. The renderer therefore shows a visible caption saying so,
linked by `aria-describedby`.

Any future layout taken from a real maker source must be marked as such and must
not silently inherit this schematic treatment. See
[handpan-data-audit.md](handpan-data-audit.md).

## Audio

Tone.js loads on first user gesture, not with the page, keeping it out of the
initial bundle. Consequences for callers:

- `playNote` / `playChord` / `playArpeggio` require `initializeAudio()` first
  and throw otherwise.
- `stopArpeggio` and `isArpeggioPlaying` are safe before initialisation — they
  read the module through `peekTone()` and no-op when nothing is loaded.
  `ScaleInfoPanel` relies on this, calling `stopArpeggio()` from a mount effect.

## Styling

The widget paints only through its own token layer, defined on the widget root
in `styles/_widget-tokens.scss`, in two tiers: `--shp-*` is the public surface a
host sets, and `--_shp-*` is what the stylesheets read, resolved from the public
name, then the site token, then a literal.

The split is load-bearing. A single tier declaring `--shp-*` on the root would
beat the same property inherited from a host's wrapper — a locally specified
custom property always wins over an inherited one — so an override placed on an
ancestor was silently ignored. Set `--shp-*`; never `--_shp-*`. Every token falls back to a literal,
so the widget renders correctly on a page with no design tokens of its own —
verified by stripping all 129 site custom properties at runtime, which collapses
the surrounding page while leaving the widget intact.

To restyle it, override the tokens on the widget root. This is the supported
surface; do not target the hashed CSS-module class names.

```css
.handpan-host {
  --shp-color-primary: #b46f3c;
  --shp-color-surface: #fffaf3;
  --shp-spacing-md: 1.25rem;
  --shp-font-family-heading: 'Your Serif', Georgia, serif;
}
```

`styles/tokens.test.ts` enforces the layer: stylesheets may read only the
private tier, every consumed token must be defined, every definition must carry
a literal fallback rather than only a site token, and every private token must
resolve from its public counterpart first — that last one is what keeps a host
override working.

## Layering

`config/`, `theory/` and `core/` must stay free of React, Tone.js and the `ui/`,
`audio/` and `styles/` directories. Dependencies point one way — `ui` uses
`theory`/`config`, never the reverse. An ESLint `no-restricted-imports` override
enforces this; test files are excluded, since they legitimately render
components.

## Test coverage

| Level                         | Location                              |
| ----------------------------- | ------------------------------------- |
| Catalog golden contract       | `core/catalog/presetId.test.ts`       |
| Sourced scale fixtures        | `config/sourcedScales.test.ts`        |
| Family interval invariants    | `config/handpanFamilies.test.ts`      |
| Pitch spelling                | `core/spelling/keySpelling.test.ts`   |
| Pad labelling & accessibility | `core/notation/padLabel.test.ts`      |
| DOM & keyboard behaviour      | `ui/HandpanRenderer.test.tsx` (jsdom) |
| Chord theory                  | `theory/chords*.test.ts`              |

Component tests set `// @vitest-environment jsdom` per file; the project default
stays `node`.

## Regression guards

These are the failures the current tests exist to prevent:

- An extended chord template becoming unreachable through interval ordering.
- `isSubset` rejecting a chord whose pitch classes span the whole tuning.
- Pitch spelling drifting from the selected key (C# minor must not show `Ab`).
- A family's ring order sounding a pitch class it does not declare.
- A ding falling outside the F2–G3 range makers actually build.
- A pad's accessible name losing pitch when numeric notation is shown.
- Roman numerals or a "relative major" claim appearing on a pentatonic or
  hexatonic tuning, where no diatonic degrees exist for them to describe.
- Chord names contradicting the pads — a C# tuning showing `G#3` and `Abm7`.
- A pitch class canonicalising two ways, which silently drops chords in some
  keys but not others.
- A stylesheet re-coupling the widget to the host page's design tokens.
